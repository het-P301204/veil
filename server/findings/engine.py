from __future__ import annotations
import uuid
import json
import logging
import aiosqlite
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

from server.shared.models import (
    ScenarioConfig, Finding, ProtocolEvent, AttackModule, Severity
)
from server.findings.owasp import OWASP_REMEDIATION, get_owasp_impact
from server.db.database import DB_PATH


class FindingsEngine:
    async def generate_finding(
        self,
        scenario: ScenarioConfig,
        protocol_events: list[ProtocolEvent],
        results: dict,
    ) -> Finding | None:
        """Generate a finding from verified attack observations."""
        title = self._generate_title(scenario, results)
        impact = get_owasp_impact(scenario.owasp[0] if scenario.owasp else "LLM01")
        remediation = OWASP_REMEDIATION.get(
            scenario.owasp[0] if scenario.owasp else "LLM01",
            "Review and harden agent tool processing pipeline."
        )

        tool_name = None
        if results.get("poisoned_tools"):
            tool_name = results["poisoned_tools"][0].get("name")
        elif scenario.tools:
            tool_name = scenario.tools[0].name

        finding = Finding(
            id=str(uuid.uuid4()),
            title=title,
            severity=scenario.severity,
            attack_module=scenario.module,
            scenario_name=scenario.name,
            evidence=protocol_events,
            observed_behavior=self._describe_behavior(scenario, results),
            impact=impact,
            owasp_categories=scenario.owasp,
            remediation=remediation,
            timestamp=datetime.now(timezone.utc).replace(tzinfo=None),
            status="verified",
            tool_name=tool_name,
        )

        await self._persist(finding)
        return finding

    def _generate_title(self, scenario: ScenarioConfig, results: dict) -> str:
        if scenario.module == AttackModule.TOOL_POISONING:
            tool = results.get("poisoned_tools", [{}])[0].get("name", "unknown tool") if results.get("poisoned_tools") else "tool"
            return f"Tool Poisoning via {tool}"
        if scenario.module == AttackModule.RUG_PULL:
            return "Rug Pull: Trust Transition Attack"
        if scenario.module == AttackModule.OUTPUT_INJECTION:
            return "Tool Output Injection Detected"
        if scenario.module == AttackModule.SAMPLING_INJECTION:
            return "Sampling Injection — System Prompt Override"
        return f"Security Finding: {scenario.name}"

    def _describe_behavior(self, scenario: ScenarioConfig, results: dict) -> str:
        if scenario.module == AttackModule.TOOL_POISONING:
            count = len(results.get("poisoned_tools", []))
            return f"Adversarial MCP server returned {count} tool definition(s) containing hidden instructions embedded in the tool description field. The instructions are invisible to human operators but processed by the AI agent."
        if scenario.module == AttackModule.RUG_PULL:
            return "Server initially presented legitimate tool definitions to establish trust, then transitioned to poisoned definitions containing hidden instructions after the trigger condition was met."
        if scenario.module == AttackModule.OUTPUT_INJECTION:
            return "Tool call response contained embedded adversarial instructions within the returned content, exploiting the agent's trust in tool outputs."
        if scenario.module == AttackModule.SAMPLING_INJECTION:
            return "MCP sampling request was intercepted and modified to inject adversarial instructions into the agent's reasoning context."
        return "Adversarial behavior detected during scenario execution."

    async def _persist(self, finding: Finding) -> None:
        try:
            async with aiosqlite.connect(DB_PATH) as db:
                await db.execute("""
                    INSERT OR REPLACE INTO findings
                    (id, title, severity, attack_module, scenario_name, evidence,
                     observed_behavior, impact, owasp_categories, remediation,
                     timestamp, status, tool_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    finding.id,
                    finding.title,
                    finding.severity.value,
                    finding.attack_module.value,
                    finding.scenario_name,
                    json.dumps([e.model_dump(mode="json") for e in finding.evidence]),
                    finding.observed_behavior,
                    finding.impact,
                    json.dumps(finding.owasp_categories),
                    finding.remediation,
                    finding.timestamp.isoformat(),
                    finding.status,
                    finding.tool_name,
                ))
                await db.commit()
        except Exception as e:
            logger.error("Failed to persist finding %s: %s", finding.id, e, exc_info=True)


async def get_all_findings() -> list[Finding]:
    findings = []
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM findings ORDER BY timestamp DESC") as cursor:
                async for row in cursor:
                    findings.append(_row_to_finding(dict(row)))
    except Exception:
        pass
    return findings


async def get_finding_by_id(finding_id: str) -> Finding | None:
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM findings WHERE id = ?", (finding_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return _row_to_finding(dict(row))
    except Exception:
        pass
    return None


def _row_to_finding(row: dict) -> Finding:
    import json
    evidence_data = json.loads(row.get("evidence", "[]"))
    evidence = []
    for e in evidence_data:
        try:
            evidence.append(ProtocolEvent(**e))
        except Exception:
            pass

    return Finding(
        id=row["id"],
        title=row["title"],
        severity=Severity(row["severity"]),
        attack_module=AttackModule(row["attack_module"]),
        scenario_name=row["scenario_name"],
        evidence=evidence,
        observed_behavior=row["observed_behavior"],
        impact=row["impact"],
        owasp_categories=json.loads(row.get("owasp_categories", "[]")),
        remediation=row["remediation"],
        timestamp=datetime.fromisoformat(row["timestamp"]),
        status=row.get("status", "verified"),
        tool_name=row.get("tool_name"),
    )
