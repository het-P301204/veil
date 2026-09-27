from __future__ import annotations
from server.shared.models import ScenarioConfig


def evaluate_assertions(assertions: list[dict], results: dict) -> tuple[int, int]:
    """Return (passed, total) assertion counts."""
    if not assertions:
        # Default: pass only if attack was actually detected
        poisoned = len(results.get("poisoned_tools", []))
        injected = any(c.get("is_injected") for c in results.get("tool_calls", []))
        if poisoned > 0 or injected:
            return 1, 1
        return 0, 1

    passed = 0
    for assertion in assertions:
        if _check_assertion(assertion, results):
            passed += 1
    return passed, len(assertions)


def _check_assertion(assertion: dict, results: dict) -> bool:
    atype = assertion.get("type", "")

    if atype == "poisoned_tool_detected":
        return len(results.get("poisoned_tools", [])) > 0

    if atype == "hidden_instruction_found":
        return len(results.get("hidden_instructions", [])) > 0

    if atype == "tool_called":
        target = assertion.get("target", "")
        return any(c.get("tool") == target for c in results.get("tool_calls", []))

    if atype == "output_injected":
        return any(c.get("is_injected") for c in results.get("tool_calls", []))

    if atype == "event_emitted":
        target = assertion.get("target", "")
        return any(e.event_type == target for e in results.get("events", []))

    return False  # Unknown assertion types fail safely
