from __future__ import annotations
import asyncio
import time
import uuid
from typing import Callable, Awaitable

from server.shared.models import (
    ScenarioConfig, ScenarioResult, TelemetryEvent, ProtocolEvent,
    AttackModule, EventStatus
)
from server.logging_client.client import LoggingMCPClient
from server.scenario_engine.assertions import evaluate_assertions
from server.findings.engine import FindingsEngine


class ScenarioRunner:
    def __init__(
        self,
        on_telemetry: Callable[[TelemetryEvent], Awaitable[None]] | None = None,
        on_protocol: Callable[[ProtocolEvent], Awaitable[None]] | None = None,
    ):
        self.on_telemetry = on_telemetry
        self.on_protocol = on_protocol
        self.findings_engine = FindingsEngine()

    async def run(self, scenario: ScenarioConfig) -> ScenarioResult:
        session_id = str(uuid.uuid4())
        start_time = time.time()

        client = LoggingMCPClient(
            session_id=session_id,
            on_telemetry=self.on_telemetry,
            on_protocol=self.on_protocol,
        )

        try:
            results = await client.run_scenario(scenario)

            # Evaluate assertions
            passed, total = evaluate_assertions(scenario.assertions, results)

            # Generate finding if assertions passed and attack detected
            finding_id = None
            if passed > 0 and (results.get("poisoned_tools") or results.get("tool_calls")):
                finding = await self.findings_engine.generate_finding(
                    scenario=scenario,
                    protocol_events=client.protocol_events,
                    results=results,
                )
                if finding:
                    finding_id = finding.id

            return ScenarioResult(
                scenario_name=scenario.name,
                module=scenario.module,
                success=passed == total,
                assertions_passed=passed,
                assertions_total=total,
                events=client.telemetry_events,
                protocol_events=client.protocol_events,
                finding_id=finding_id,
                duration_ms=(time.time() - start_time) * 1000,
            )

        except Exception as e:
            return ScenarioResult(
                scenario_name=scenario.name,
                module=scenario.module,
                success=False,
                assertions_passed=0,
                assertions_total=len(scenario.assertions),
                events=client.telemetry_events,
                protocol_events=client.protocol_events,
                error=str(e),
                duration_ms=(time.time() - start_time) * 1000,
            )
