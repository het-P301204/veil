from __future__ import annotations
import uuid
import asyncio
import aiosqlite
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from server.shared.models import ScenarioConfig, ScenarioResult, TelemetryEvent, ProtocolEvent, WSMessage
from server.scenario_engine.loader import load_all_scenarios, load_scenario
from server.scenario_engine.runner import ScenarioRunner
from server.api.websocket import manager
from server.db.database import DB_PATH

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])

# In-memory scenario run history (capped at 50)
_run_history: list[dict] = []

# Semaphore to cap concurrent scenario runs
_run_semaphore = asyncio.Semaphore(5)


class RunScenarioRequest(BaseModel):
    scenario_name: str


@router.get("")
async def list_scenarios():
    scenarios = load_all_scenarios()
    return [
        {
            "name": s.name,
            "description": s.description,
            "module": s.module.value,
            "severity": s.severity.value,
            "owasp": s.owasp,
            "tool_count": len(s.tools),
            "tools": [t.model_dump(mode="json") for t in s.tools],
        }
        for s in scenarios
    ]


@router.get("/{name}")
async def get_scenario(name: str):
    try:
        scenario = load_scenario(name)
        return scenario.model_dump(mode="json")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/run")
async def run_scenario(request: RunScenarioRequest, background_tasks: BackgroundTasks):
    try:
        scenario = load_scenario(request.scenario_name)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Scenario not found: {e}")

    run_id = str(uuid.uuid4())

    # Start in background, stream via WebSocket
    background_tasks.add_task(_execute_scenario, run_id, scenario)

    return {"run_id": run_id, "scenario": scenario.name, "status": "started"}


async def _persist_run(run_id: str, result: ScenarioResult) -> None:
    """Persist scenario run to database."""
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT INTO scenario_runs
                (id, scenario_name, module, success, assertions_passed, assertions_total,
                 duration_ms, finding_id, timestamp, error)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                run_id,
                result.scenario_name,
                result.module.value,
                1 if result.success else 0,
                result.assertions_passed,
                result.assertions_total,
                result.duration_ms,
                result.finding_id,
                datetime.now(timezone.utc).isoformat(),
                result.error,
            ))
            await db.commit()
    except Exception as e:
        print(f"Warning: failed to persist run: {e}")


async def _execute_scenario(run_id: str, scenario: ScenarioConfig):
    async with _run_semaphore:
        async def on_telemetry(event: TelemetryEvent):
            await manager.broadcast({
                "type": "telemetry",
                "run_id": run_id,
                "data": event.model_dump(mode="json")
            })

        async def on_protocol(event: ProtocolEvent):
            await manager.broadcast({
                "type": "protocol",
                "run_id": run_id,
                "data": event.model_dump(mode="json")
            })

        runner = ScenarioRunner(on_telemetry=on_telemetry, on_protocol=on_protocol)
        result = await runner.run(scenario)

        await _persist_run(run_id, result)
        # Keep last 50 in memory for fast access
        _run_history.append(result.model_dump(mode="json"))
        if len(_run_history) > 50:
            _run_history.pop(0)

        await manager.broadcast({
            "type": "scenario_complete",
            "run_id": run_id,
            "data": result.model_dump(mode="json")
        })


@router.get("/runs")
async def list_runs():
    """Get scenario run history from database."""
    runs = []
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT * FROM scenario_runs ORDER BY timestamp DESC LIMIT 100"
            ) as cursor:
                async for row in cursor:
                    runs.append(dict(row))
    except Exception:
        pass
    return runs
