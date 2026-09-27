from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field
import uuid


class AttackModule(str, Enum):
    TOOL_POISONING = "tool_poisoning"
    RUG_PULL = "rug_pull"
    OUTPUT_INJECTION = "output_injection"
    SAMPLING_INJECTION = "sampling_injection"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class EventDirection(str, Enum):
    CLIENT_TO_SERVER = "client_to_server"
    SERVER_TO_CLIENT = "server_to_client"
    VEIL = "veil"


class EventStatus(str, Enum):
    OK = "ok"
    WARNING = "warning"
    CRITICAL = "critical"
    DETECTED = "detected"


class TelemetryEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    direction: EventDirection
    method: str
    source: str
    target: str
    event_type: str
    status: EventStatus = EventStatus.OK
    payload: Optional[dict[str, Any]] = None
    session_id: str = ""
    scenario_name: str = ""


class ProtocolEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    direction: EventDirection
    method: str
    message: dict[str, Any]
    session_id: str = ""
    is_malicious: bool = False
    malicious_field: Optional[str] = None
    malicious_content: Optional[str] = None


class ToolDefinition(BaseModel):
    name: str
    description: str
    hidden_instruction: Optional[str] = None
    parameters: list[dict[str, Any]] = []
    is_poisoned: bool = False


class ScenarioTrigger(BaseModel):
    type: str = "immediate"  # immediate | connection_count | elapsed_time | manual
    value: Optional[int] = None


class ScenarioPayload(BaseModel):
    name: str
    content: str


class ScenarioExpected(BaseModel):
    type: str
    field: Optional[str] = None
    pattern: Optional[str] = None


class ScenarioConfig(BaseModel):
    name: str
    description: str
    module: AttackModule
    severity: Severity
    owasp: list[str]
    tools: list[ToolDefinition] = []
    trigger: ScenarioTrigger = ScenarioTrigger()
    payload: Optional[ScenarioPayload] = None
    expected: list[ScenarioExpected] = []
    assertions: list[dict[str, Any]] = []


class Finding(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    severity: Severity
    attack_module: AttackModule
    scenario_name: str
    evidence: list[ProtocolEvent] = []
    observed_behavior: str
    impact: str
    owasp_categories: list[str]
    remediation: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "verified"
    tool_name: Optional[str] = None


class ScenarioResult(BaseModel):
    scenario_name: str
    module: AttackModule
    success: bool
    assertions_passed: int
    assertions_total: int
    events: list[TelemetryEvent] = []
    protocol_events: list[ProtocolEvent] = []
    finding_id: Optional[str] = None
    error: Optional[str] = None
    duration_ms: float = 0.0


class PayloadDefinition(BaseModel):
    id: str
    name: str
    module: AttackModule
    description: str
    purpose: str
    owasp: list[str]
    severity: Severity
    content: str
    expected_behavior: str


class WSMessage(BaseModel):
    type: str  # telemetry | protocol | finding | scenario_update | system
    data: Any
