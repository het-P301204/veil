from __future__ import annotations
from fastapi import APIRouter, HTTPException
from server.findings.engine import get_all_findings, get_finding_by_id
from server.findings.owasp import OWASP_CATEGORIES

router = APIRouter(prefix="/api/findings", tags=["findings"])


@router.get("")
async def list_findings():
    findings = await get_all_findings()
    return [f.model_dump(mode="json") for f in findings]


@router.get("/owasp")
async def get_owasp_categories():
    return OWASP_CATEGORIES


@router.get("/{finding_id}")
async def get_finding(finding_id: str):
    finding = await get_finding_by_id(finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding.model_dump(mode="json")
