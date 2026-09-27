from __future__ import annotations
import asyncio
import json
import subprocess
import sys
import os
from datetime import datetime
from typing import Any, Callable, Awaitable
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from server.shared.models import (
    TelemetryEvent, ProtocolEvent, EventDirection, EventStatus, ScenarioConfig
)
from server.mcp_server.attacks.tool_poisoning import detect_hidden_instruction


class LoggingMCPClient:
    """Real MCP client that captures all protocol events."""

    def __init__(
        self,
        session_id: str,
        on_telemetry: Callable[[TelemetryEvent], Awaitable[None]] | None = None,
        on_protocol: Callable[[ProtocolEvent], Awaitable[None]] | None = None,
    ):
        self.session_id = session_id
        self.on_telemetry = on_telemetry
        self.on_protocol = on_protocol
        self.telemetry_events: list[TelemetryEvent] = []
        self.protocol_events: list[ProtocolEvent] = []
        self.tools: list[dict[str, Any]] = []
        self.tool_results: list[dict[str, Any]] = []

    async def _emit_telemetry(self, event: TelemetryEvent) -> None:
        event.session_id = self.session_id
        self.telemetry_events.append(event)
        if self.on_telemetry:
            await self.on_telemetry(event)

    async def _emit_protocol(self, event: ProtocolEvent) -> None:
        event.session_id = self.session_id
        self.protocol_events.append(event)
        if self.on_protocol:
            await self.on_protocol(event)

    async def run_scenario(self, scenario: ScenarioConfig) -> dict[str, Any]:
        """Connect to adversarial server and execute scenario protocol exchange."""
        server_script = str(Path(__file__).parent.parent / "mcp_server" / "server.py")

        server_params = StdioServerParameters(
            command=sys.executable,
            args=[server_script, scenario.model_dump_json()],
            env={
                "PATH": os.environ.get("PATH", ""),
                "PYTHONPATH": os.environ.get("PYTHONPATH", ""),
                "SYSTEMROOT": os.environ.get("SYSTEMROOT", ""),  # Windows needs this
                "TEMP": os.environ.get("TEMP", ""),
                "TMP": os.environ.get("TMP", ""),
            }
        )

        results = {
            "tools": [],
            "tool_calls": [],
            "poisoned_tools": [],
            "hidden_instructions": [],
        }

        await self._emit_telemetry(TelemetryEvent(
            direction=EventDirection.VEIL,
            method="scenario.start",
            source="VEIL",
            target="MCP Server",
            event_type="scenario_start",
            status=EventStatus.OK,
            session_id=self.session_id,
            scenario_name=scenario.name,
            payload={"scenario": scenario.name, "module": scenario.module.value}
        ))

        try:
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    # Initialize
                    await self._emit_telemetry(TelemetryEvent(
                        direction=EventDirection.CLIENT_TO_SERVER,
                        method="initialize",
                        source="LoggingClient",
                        target="AdversarialServer",
                        event_type="handshake",
                        status=EventStatus.OK,
                        session_id=self.session_id,
                        scenario_name=scenario.name,
                    ))

                    init_result = await session.initialize()

                    await self._emit_protocol(ProtocolEvent(
                        direction=EventDirection.SERVER_TO_CLIENT,
                        method="initialize",
                        message={
                            "jsonrpc": "2.0",
                            "result": {
                                "protocolVersion": "2024-11-05",
                                "capabilities": {},
                                "serverInfo": {"name": "veil-adversarial-server", "version": "0.1.0"}
                            }
                        },
                        session_id=self.session_id,
                    ))

                    await self._emit_telemetry(TelemetryEvent(
                        direction=EventDirection.SERVER_TO_CLIENT,
                        method="initialize",
                        source="AdversarialServer",
                        target="LoggingClient",
                        event_type="handshake_complete",
                        status=EventStatus.OK,
                        session_id=self.session_id,
                        scenario_name=scenario.name,
                        payload={"server": "veil-adversarial-server"}
                    ))

                    # List tools
                    await self._emit_telemetry(TelemetryEvent(
                        direction=EventDirection.CLIENT_TO_SERVER,
                        method="tools/list",
                        source="LoggingClient",
                        target="AdversarialServer",
                        event_type="tools_request",
                        status=EventStatus.OK,
                        session_id=self.session_id,
                        scenario_name=scenario.name,
                    ))

                    await self._emit_protocol(ProtocolEvent(
                        direction=EventDirection.CLIENT_TO_SERVER,
                        method="tools/list",
                        message={"jsonrpc": "2.0", "id": 1, "method": "tools/list"},
                        session_id=self.session_id,
                    ))

                    tools_result = await session.list_tools()

                    # Analyze each tool for hidden instructions
                    tool_list = []
                    for tool in tools_result.tools:
                        visible_desc, hidden = detect_hidden_instruction(tool.description)
                        is_poisoned = hidden is not None

                        tool_data = {
                            "name": tool.name,
                            "description": tool.description,
                            "visible_description": visible_desc,
                            "hidden_instruction": hidden,
                            "is_poisoned": is_poisoned,
                        }
                        tool_list.append(tool_data)

                        if is_poisoned:
                            results["poisoned_tools"].append(tool_data)
                            results["hidden_instructions"].append(hidden)

                    results["tools"] = tool_list

                    protocol_msg = {
                        "jsonrpc": "2.0",
                        "id": 1,
                        "result": {
                            "tools": [
                                {"name": t.name, "description": t.description}
                                for t in tools_result.tools
                            ]
                        }
                    }

                    is_malicious = len(results["poisoned_tools"]) > 0

                    await self._emit_protocol(ProtocolEvent(
                        direction=EventDirection.SERVER_TO_CLIENT,
                        method="tools/list",
                        message=protocol_msg,
                        session_id=self.session_id,
                        is_malicious=is_malicious,
                        malicious_field="description" if is_malicious else None,
                        malicious_content=results["hidden_instructions"][0] if results["hidden_instructions"] else None,
                    ))

                    status = EventStatus.DETECTED if is_malicious else EventStatus.OK
                    event_type = "hidden_instruction_detected" if is_malicious else "tools_received"

                    await self._emit_telemetry(TelemetryEvent(
                        direction=EventDirection.SERVER_TO_CLIENT,
                        method="tools/list",
                        source="AdversarialServer",
                        target="LoggingClient",
                        event_type=event_type,
                        status=status,
                        session_id=self.session_id,
                        scenario_name=scenario.name,
                        payload={"tool_count": len(tool_list), "poisoned": len(results["poisoned_tools"])}
                    ))

                    if is_malicious:
                        await self._emit_telemetry(TelemetryEvent(
                            direction=EventDirection.VEIL,
                            method="analysis.hidden_instruction",
                            source="VEIL",
                            target="LoggingClient",
                            event_type="trust_boundary_violation",
                            status=EventStatus.CRITICAL,
                            session_id=self.session_id,
                            scenario_name=scenario.name,
                            payload={
                                "tool": results["poisoned_tools"][0]["name"] if results["poisoned_tools"] else "",
                                "hidden": results["hidden_instructions"][0] if results["hidden_instructions"] else ""
                            }
                        ))

                    # Call ALL tools in the scenario (not just the first)
                    for i, tool_entry in enumerate(tool_list):
                        tool_name = tool_entry["name"]
                        tool_args = {}
                        # Get parameters from scenario tool definition if available
                        scenario_tool = scenario.tools[i] if i < len(scenario.tools) else None
                        if scenario_tool and scenario_tool.parameters:
                            for p in scenario_tool.parameters:
                                # Use type-appropriate test values
                                p_type = p.get("type", "string")
                                if p_type == "integer" or p_type == "number":
                                    tool_args[p["name"]] = 0
                                elif p_type == "boolean":
                                    tool_args[p["name"]] = False
                                elif p_type == "array":
                                    tool_args[p["name"]] = []
                                else:
                                    tool_args[p["name"]] = f"test_{p['name']}"

                        await self._emit_telemetry(TelemetryEvent(
                            direction=EventDirection.CLIENT_TO_SERVER,
                            method="tools/call",
                            source="LoggingClient",
                            target="AdversarialServer",
                            event_type="tool_call",
                            status=EventStatus.WARNING if is_malicious else EventStatus.OK,
                            session_id=self.session_id,
                            scenario_name=scenario.name,
                            payload={"tool": tool_name, "args": tool_args}
                        ))

                        await self._emit_protocol(ProtocolEvent(
                            direction=EventDirection.CLIENT_TO_SERVER,
                            method="tools/call",
                            message={
                                "jsonrpc": "2.0",
                                "id": 2 + i,
                                "method": "tools/call",
                                "params": {"name": tool_name, "arguments": tool_args}
                            },
                            session_id=self.session_id,
                        ))

                        try:
                            call_result = await session.call_tool(tool_name, tool_args)
                            result_text = call_result.content[0].text if call_result.content else ""

                            # Check for output injection
                            is_output_injected = "[SYSTEM NOTE:" in result_text or "[SAMPLING INJECTION" in result_text

                            results["tool_calls"].append({
                                "tool": tool_name,
                                "args": tool_args,
                                "result": result_text,
                                "is_injected": is_output_injected
                            })

                            await self._emit_protocol(ProtocolEvent(
                                direction=EventDirection.SERVER_TO_CLIENT,
                                method="tools/call",
                                message={
                                    "jsonrpc": "2.0",
                                    "id": 2 + i,
                                    "result": {"content": [{"type": "text", "text": result_text}]}
                                },
                                session_id=self.session_id,
                                is_malicious=is_output_injected,
                                malicious_content=result_text if is_output_injected else None,
                            ))

                            await self._emit_telemetry(TelemetryEvent(
                                direction=EventDirection.SERVER_TO_CLIENT,
                                method="tools/call",
                                source="AdversarialServer",
                                target="LoggingClient",
                                event_type="output_injection_detected" if is_output_injected else "tool_result",
                                status=EventStatus.CRITICAL if is_output_injected else EventStatus.OK,
                                session_id=self.session_id,
                                scenario_name=scenario.name,
                                payload={"result_length": len(result_text), "injected": is_output_injected}
                            ))
                        except Exception as e:
                            results["tool_calls"].append({"tool": tool_name, "error": str(e)})

                    # Scenario complete
                    await self._emit_telemetry(TelemetryEvent(
                        direction=EventDirection.VEIL,
                        method="scenario.complete",
                        source="VEIL",
                        target="LoggingClient",
                        event_type="scenario_complete",
                        status=EventStatus.OK,
                        session_id=self.session_id,
                        scenario_name=scenario.name,
                        payload={"poisoned_tools": len(results["poisoned_tools"])}
                    ))

        except Exception as e:
            await self._emit_telemetry(TelemetryEvent(
                direction=EventDirection.VEIL,
                method="scenario.error",
                source="VEIL",
                target="LoggingClient",
                event_type="scenario_error",
                status=EventStatus.CRITICAL,
                session_id=self.session_id,
                scenario_name=scenario.name,
                payload={"error": str(e)}
            ))
            results["error"] = str(e)

        return results
