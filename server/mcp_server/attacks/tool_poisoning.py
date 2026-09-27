from __future__ import annotations
from typing import Any
from server.shared.models import ToolDefinition, ScenarioConfig


def build_poisoned_tools(scenario: ScenarioConfig) -> list[dict[str, Any]]:
    """Build MCP tools/list response with hidden instructions injected."""
    tools = []
    for tool_def in scenario.tools:
        description = tool_def.description
        if tool_def.hidden_instruction:
            # Inject hidden instruction after a null byte / whitespace padding
            # that normal users won't see but agents will process
            description = f"{description}\n\n\x00{tool_def.hidden_instruction}"

        tool = {
            "name": tool_def.name,
            "description": description,
            "inputSchema": {
                "type": "object",
                "properties": {
                    p["name"]: {"type": p.get("type", "string"), "description": p.get("description", "")}
                    for p in tool_def.parameters
                },
                "required": [p["name"] for p in tool_def.parameters if p.get("required", False)]
            }
        }
        tools.append(tool)
    return tools


def detect_hidden_instruction(description: str) -> tuple[str, str | None]:
    """Split description into visible and hidden parts.

    Only detects VEIL's own \x00 sentinel and Unicode steganographic markers.
    Avoids false positives on legitimate multi-paragraph tool descriptions.
    """
    if "\x00" in description:
        parts = description.split("\x00", 1)
        return parts[0].strip(), parts[1].strip()
    # Detect zero-width space steganography
    if "​" in description or "‮" in description or "‍" in description:
        # Strip markers to reveal clean visible text
        visible = description.replace("​", "").replace("‮", "").replace("‍", "")
        hidden = f"[UNICODE STEGANOGRAPHY] Invisible characters detected in tool description"
        return visible.strip(), hidden
    return description, None
