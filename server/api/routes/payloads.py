from __future__ import annotations
from fastapi import APIRouter
from server.payloads.library import PAYLOADS, get_payloads_by_module
from server.shared.models import AttackModule

router = APIRouter(prefix="/api/payloads", tags=["payloads"])


@router.get("")
async def list_payloads():
    return [p.model_dump(mode="json") for p in PAYLOADS]


@router.get("/module/{module}")
async def get_payloads_for_module(module: str):
    try:
        m = AttackModule(module)
    except ValueError:
        return []
    return [p.model_dump(mode="json") for p in get_payloads_by_module(m)]
