from __future__ import annotations
import yaml
from pathlib import Path
from server.shared.models import (
    ScenarioConfig, ToolDefinition, ScenarioTrigger, ScenarioPayload,
    ScenarioExpected, AttackModule, Severity
)


SCENARIOS_DIR = Path(__file__).parent.parent.parent / "scenarios"


def load_scenario(name_or_path: str) -> ScenarioConfig:
    """Load a scenario from YAML by name. Only loads from the scenarios directory."""
    # Reject path traversal attempts
    if ".." in name_or_path or name_or_path.startswith("/") or name_or_path.startswith("\\"):
        raise ValueError(f"Invalid scenario name: {name_or_path!r}")

    # Always resolve relative to SCENARIOS_DIR
    scenarios_root = SCENARIOS_DIR.resolve()
    for ext in (".yaml", ".yml", ""):
        candidate = (scenarios_root / f"{name_or_path}{ext}").resolve()
        if not candidate.is_relative_to(scenarios_root):
            raise ValueError(f"Scenario name escapes scenarios directory: {name_or_path!r}")
        if candidate.exists() and candidate.is_file():
            with open(candidate) as f:
                data = yaml.safe_load(f)
            return _parse_scenario(data)

    raise FileNotFoundError(f"Scenario not found: {name_or_path!r}")


def load_all_scenarios() -> list[ScenarioConfig]:
    """Load all YAML scenarios from the scenarios directory."""
    scenarios = []
    if not SCENARIOS_DIR.exists():
        return scenarios

    for path in sorted(SCENARIOS_DIR.glob("*.yaml")) + sorted(SCENARIOS_DIR.glob("*.yml")):
        try:
            scenarios.append(load_scenario(path.stem))
        except Exception as e:
            print(f"Warning: failed to load scenario {path}: {e}")
    return scenarios


def _parse_scenario(data: dict) -> ScenarioConfig:
    scenario_data = data.get("scenario", data)

    tools = []
    for t in data.get("tools", []):
        tools.append(ToolDefinition(
            name=t["name"],
            description=t["description"],
            hidden_instruction=t.get("hidden_instruction"),
            parameters=t.get("parameters", []),
            is_poisoned=bool(t.get("hidden_instruction")),
        ))

    trigger_data = data.get("trigger", {})
    trigger = ScenarioTrigger(
        type=trigger_data.get("type", "immediate"),
        value=trigger_data.get("value"),
    )

    payload_data = data.get("payload")
    payload = None
    if payload_data:
        payload = ScenarioPayload(
            name=payload_data.get("name", ""),
            content=payload_data.get("content", ""),
        )

    expected = [ScenarioExpected(**e) for e in data.get("expected", [])]

    return ScenarioConfig(
        name=scenario_data.get("name", "unnamed"),
        description=scenario_data.get("description", ""),
        module=AttackModule(scenario_data.get("module", "tool_poisoning")),
        severity=Severity(scenario_data.get("severity", "high")),
        owasp=scenario_data.get("owasp", ["LLM01"]),
        tools=tools,
        trigger=trigger,
        payload=payload,
        expected=expected,
        assertions=data.get("assertions", []),
    )
