from __future__ import annotations
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from server.findings.engine import get_all_findings, get_finding_by_id

router = APIRouter(prefix="/api/reports", tags=["reports"])


class GenerateReportRequest(BaseModel):
    finding_ids: list[str] | None = None
    format: str = "json"  # json | summary


@router.post("/generate")
async def generate_report(request: GenerateReportRequest):
    if request.finding_ids:
        findings = []
        for fid in request.finding_ids:
            f = await get_finding_by_id(fid)
            if f:
                findings.append(f)
    else:
        findings = await get_all_findings()

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "platform": "VEIL",
        "tagline": "Expose what the agent cannot see.",
        "summary": {
            "total_findings": len(findings),
            "critical": sum(1 for f in findings if f.severity.value == "critical"),
            "high": sum(1 for f in findings if f.severity.value == "high"),
            "medium": sum(1 for f in findings if f.severity.value == "medium"),
            "low": sum(1 for f in findings if f.severity.value == "low"),
        },
        "findings": [f.model_dump(mode="json") for f in findings],
    }

    return report


@router.get("/sarif")
async def generate_sarif_report():
    """Generate a SARIF 2.1.0 report for CI/CD integration."""
    findings = await get_all_findings()

    rules = {}
    for f in findings:
        for owasp_id in f.owasp_categories:
            if owasp_id not in rules:
                rules[owasp_id] = {
                    "id": owasp_id,
                    "name": owasp_id.replace("LLM", "LLM_").replace("0", ""),
                    "shortDescription": {"text": f"OWASP LLM Top 10: {owasp_id}"},
                    "helpUri": f"https://genai.owasp.org/llm-top-10/",
                    "properties": {"tags": ["security", "ai", "mcp"]},
                }

    results = []
    for f in findings:
        results.append({
            "ruleId": f.owasp_categories[0] if f.owasp_categories else "LLM01",
            "level": "error" if f.severity.value in ("critical", "high") else "warning",
            "message": {
                "text": f"{f.title}\n\nObserved: {f.observed_behavior}\n\nImpact: {f.impact}\n\nRemediation: {f.remediation}"
            },
            "locations": [{
                "physicalLocation": {
                    "artifactLocation": {"uri": f"mcp://veil/scenarios/{f.scenario_name}"},
                    "region": {"startLine": 1}
                },
                "logicalLocations": [{
                    "name": f.scenario_name,
                    "kind": "module"
                }]
            }],
            "properties": {
                "severity": f.severity.value,
                "attack_module": f.attack_module.value,
                "tool_name": f.tool_name,
                "owasp_categories": f.owasp_categories,
                "status": f.status,
                "timestamp": f.timestamp.isoformat() if f.timestamp else None,
            }
        })

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{
            "tool": {
                "driver": {
                    "name": "VEIL",
                    "version": "0.1.0",
                    "informationUri": "https://github.com/veil-security/veil",
                    "fullName": "VEIL — MCP Security Research Platform",
                    "rules": list(rules.values()),
                }
            },
            "results": results,
            "properties": {
                "generated": datetime.now(timezone.utc).isoformat(),
                "platform": "VEIL",
            }
        }]
    }

    return JSONResponse(
        content=sarif,
        headers={"Content-Disposition": "attachment; filename=veil-findings.sarif.json"}
    )
