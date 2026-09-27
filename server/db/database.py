from __future__ import annotations
import aiosqlite
import os
from pathlib import Path

DB_PATH = os.getenv("VEIL_DB_PATH", "./veil.db")

async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS findings (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                severity TEXT NOT NULL,
                attack_module TEXT NOT NULL,
                scenario_name TEXT NOT NULL,
                evidence TEXT NOT NULL,
                observed_behavior TEXT NOT NULL,
                impact TEXT NOT NULL,
                owasp_categories TEXT NOT NULL,
                remediation TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'verified',
                tool_name TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS scenario_runs (
                id TEXT PRIMARY KEY,
                scenario_name TEXT NOT NULL,
                module TEXT NOT NULL,
                success INTEGER NOT NULL,
                assertions_passed INTEGER NOT NULL,
                assertions_total INTEGER NOT NULL,
                duration_ms REAL NOT NULL,
                finding_id TEXT,
                timestamp TEXT NOT NULL,
                error TEXT
            )
        """)
        await db.commit()
