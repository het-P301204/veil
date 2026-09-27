# VEIL — Design Specification
**Expose what the agent cannot see.**
*Date: 2026-09-27*

---

## 1. Purpose

VEIL is a professional AI-agent security research platform focused on MCP (Model Context Protocol) attack surfaces. It provides a controlled, local environment for studying how adversarial MCP servers can compromise AI agents through four documented attack vectors: Tool Poisoning, Rug Pull, Tool Output Injection, and Sampling Injection.

Target audience: AI security researchers, red teamers, and AI developers who need to understand MCP protocol vulnerabilities in a reproducible, evidence-generating environment.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VEIL Platform                            │
│                                                                 │
│  ┌──────────────┐    WebSocket/REST    ┌───────────────────┐   │
│  │  React/TS    │◄────────────────────►│   FastAPI Server  │   │
│  │  Frontend    │                      │   (uvicorn)       │   │
│  └──────────────┘                      └────────┬──────────┘   │
│                                                 │              │
│                                    ┌────────────▼───────────┐  │
│                                    │   Scenario Engine      │  │
│                                    │   (YAML-driven)        │  │
│                                    └────────────┬───────────┘  │
│                                                 │              │
│                          ┌──────────────────────┼───────────┐  │
│                          │                      │           │  │
│                   ┌──────▼──────┐    ┌──────────▼────────┐  │  │
│                   │  Logging    │    │  Adversarial MCP  │  │  │
│                   │  MCP Client │◄──►│  Server           │  │  │
│                   │  (capture)  │    │  (attack modules) │  │  │
│                   └──────┬──────┘    └───────────────────┘  │  │
│                          │  JSON-RPC 2.0 over stdio          │  │
│                          └──────────────────────────────────┘  │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ SQLite   │  │  YAML    │  │ Payload  │  │  Reports     │   │
│  │ findings │  │scenarios │  │ library  │  │  (JSON/HTML) │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Communication layers

| Layer | Protocol | Purpose |
|-------|----------|---------|
| Frontend ↔ API | WebSocket | Real-time telemetry, protocol events |
| Frontend ↔ API | HTTP REST | CRUD for scenarios, findings, reports |
| Logging Client ↔ MCP Server | JSON-RPC 2.0 / stdio | Real MCP protocol exchange |
| Scenario Engine ↔ API | In-process | Orchestration, event emission |

---

## 3. Backend — Python Server

### 3.1 Tech Stack
- Python 3.11+
- FastAPI + uvicorn (async HTTP + WebSocket)
- `mcp` Python SDK (official, for real protocol implementation)
- aiosqlite (findings persistence)
- PyYAML (scenario loading)
- pytest + pytest-asyncio (scenario test runner)

### 3.2 Directory Structure

```
server/
├── api/
│   ├── main.py               # FastAPI app entry point
│   ├── websocket.py          # WebSocket connection manager
│   └── routes/
│       ├── scenarios.py      # GET/POST /scenarios
│       ├── findings.py       # GET /findings, GET /findings/{id}
│       ├── reports.py        # POST /reports/generate
│       └── telemetry.py      # GET /telemetry (REST fallback)
├── mcp_server/
│   ├── server.py             # Main adversarial MCP server
│   ├── transport.py          # stdio transport orchestration
│   └── attacks/
│       ├── tool_poisoning.py
│       ├── rug_pull.py
│       ├── output_injection.py
│       └── sampling_injection.py
├── logging_client/
│   ├── client.py             # Real MCP client (mcp SDK)
│   └── capture.py            # Protocol event capture + structured logging
├── scenario_engine/
│   ├── loader.py             # YAML scenario loading + validation
│   ├── runner.py             # Scenario execution orchestration
│   ├── assertions.py         # Assertion evaluation
│   └── evidence.py           # Evidence packaging
├── findings/
│   ├── engine.py             # Finding generation from verified observations
│   ├── models.py             # Pydantic finding models
│   └── owasp.py              # OWASP LLM Top 10 mapping
├── payloads/
│   └── library.py            # 15+ payload definitions
├── db/
│   ├── database.py           # aiosqlite connection
│   └── migrations.py         # Schema setup
└── shared/
    ├── models.py             # Shared Pydantic models (TelemetryEvent, etc.)
    └── events.py             # Event bus (asyncio)
```

### 3.3 Adversarial MCP Server

The server implements all four attack modules and runs as a real MCP server using the official Python SDK. It listens on stdio transport. The scenario engine configures which attack module is active before spawning the server subprocess.

**Attack module interface (all modules implement):**
```python
class AttackModule:
    async def get_tools(self, scenario: ScenarioConfig) -> list[Tool]
    async def handle_tool_call(self, name: str, args: dict) -> CallToolResult
    async def get_sampling_response(self, request: SamplingRequest) -> SamplingResult
```

### 3.4 Logging MCP Client

A real MCP client that:
1. Connects to the adversarial server via stdio
2. Performs `initialize` handshake
3. Calls `tools/list`
4. Makes tool calls per scenario instructions
5. Captures every JSON-RPC message (both directions) with timestamps
6. Emits structured `TelemetryEvent` objects to the event bus

### 3.5 Scenario Engine

YAML schema (all fields required unless marked optional):
```yaml
scenario:
  name: string
  description: string
  module: tool_poisoning | rug_pull | output_injection | sampling_injection
  severity: critical | high | medium | low
  owasp: [LLM01, LLM02, ...]

tools:
  - name: string
    description: string         # visible description
    hidden_instruction: string  # injected content (optional)
    parameters:
      - name: string
        type: string
        description: string

trigger:
  type: immediate | connection_count | elapsed_time | manual
  value: number (optional)

payload:
  name: string
  content: string

expected:
  - type: tool_poisoning_detected | instruction_in_description | ...
    field: string (optional)
    pattern: string (optional)

assertions:
  - type: event_emitted | field_contains | tool_called
    target: string
    value: string
```

Runner executes:
1. Load + validate YAML
2. Configure attack module with scenario parameters
3. Spawn MCP server subprocess
4. Connect logging client
5. Execute scenario sequence (tool list, tool call, etc.)
6. Evaluate assertions against captured events
7. Package evidence (raw protocol messages, structured events)
8. Submit to findings engine if assertions pass
9. Terminate subprocess, return results

### 3.6 Findings Engine

Findings are generated **only** from verified assertion passes — not from scenario execution alone.

**Finding model:**
```python
class Finding(BaseModel):
    id: str                    # UUID
    title: str
    severity: Literal["critical", "high", "medium", "low"]
    attack_module: AttackModule
    scenario_name: str
    evidence: list[ProtocolEvent]
    observed_behavior: str
    impact: str
    owasp_categories: list[str]
    remediation: str
    timestamp: datetime
    status: Literal["verified", "investigating", "false_positive"]
```

### 3.7 OWASP Mapping

Maps to OWASP Top 10 for LLMs (2025 edition):
- LLM01: Prompt Injection → Tool Poisoning, Output Injection, Sampling Injection
- LLM02: Sensitive Information Disclosure → Output Injection
- LLM07: System Prompt Leakage → Sampling Injection
- LLM08: Excessive Agency → Rug Pull, Tool Poisoning
- LLM09: Misinformation → Output Injection

---

## 4. Frontend — React/TypeScript

### 4.1 Tech Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion (animations)
- Zustand (state management)
- Monaco Editor (Protocol Inspector JSON viewer)
- react-router-dom v6
- @tanstack/react-query (server state)
- date-fns (timestamps)

### 4.2 Design System

**Typography:**
- `Space Grotesk` — headings, product identity, VEIL wordmark
- `Inter` — body text, UI labels, navigation
- `IBM Plex Mono` — all technical values: JSON, timestamps, identifiers, protocol data

**Color system (CSS custom properties):**
```css
--color-primary:     #3B82F6  /* Blue — interaction */
--color-protocol:    #06B6D4  /* Cyan — MCP/protocol */
--color-agent:       #8B5CF6  /* Violet — AI/agent */
--color-adversarial: #F97316  /* Orange — attack/mutation */
--color-warning:     #F59E0B  /* Amber — warning */
--color-critical:    #EF4444  /* Red — critical */
--color-verified:    #10B981  /* Green — verified/safe */
```

**Dark theme surfaces (layered, not flat black):**
```
--surface-base:    #0F1117   (page background)
--surface-1:       #161B27   (primary panels)
--surface-2:       #1E2435   (cards)
--surface-3:       #252D42   (elevated elements)
--surface-border:  #2E3855   (borders)
```

**Light theme:** off-white base (`#F8F9FB`), white surfaces, cool gray borders (`#E2E6EF`), charcoal text (`#1A1F2E`).

**Border radius:**
- Buttons/inputs: `10px`
- Cards: `16px`
- Panels: `22px`
- Large workspaces: `26px`

### 4.3 Application Sections

| Route | Section | Primary interaction model |
|-------|---------|--------------------------|
| `/` | Command Center | Live status overview |
| `/attack-lab` | Attack Lab | 3-panel security workspace |
| `/scenarios` | Scenarios | YAML scenario browser |
| `/tools` | Tool Definitions | Tool definition inspector |
| `/protocol` | Protocol Inspector | JSON-RPC message explorer |
| `/telemetry` | Live Telemetry | Real-time event stream |
| `/findings` | Findings | Investigation interface |
| `/owasp` | OWASP Map | Interactive security map |
| `/reports` | Reports | Report generation |
| `/settings` | Settings | Configuration |

### 4.4 Attack Lab — Core Layout

Three-panel layout (desktop):
- **Left panel (280px):** Scenario selector, attack module configuration, payload selection
- **Center panel (flex):** Attack lifecycle visualization — staged flow with states: WAITING → RUNNING → CAPTURED → VERIFIED → FAILED
- **Right panel (360px):** Evidence inspector, protocol trace, finding preview

The lifecycle visualization shows every stage of the attack as a connected flow diagram with animated state transitions (Framer Motion `layout` animations + `AnimatePresence`).

### 4.5 Signature VEIL Interaction — "Reveal Hidden Content"

When inspecting a poisoned tool definition:
1. Show the normal visible description normally
2. Display a `REVEAL HIDDEN CONTENT` button
3. On activation: animate hidden content from `blur(8px) opacity-0 height-0` to `blur(0) opacity-1 height-auto`
4. Hidden content appears highlighted in adversarial orange
5. Two-section layout: "What the human sees" / "What the agent receives"
6. Subtle color transition on the card border: neutral → adversarial orange

### 4.6 Protocol Inspector

Built around Monaco Editor for JSON viewing:
- Request/response pairing with direction indicators
- Syntax highlighting for JSON-RPC structure
- Field-level annotation: hover over `description` field to see "contains hidden instruction" callout
- Pretty/raw mode toggle
- Copy, search, expand/collapse
- Event timeline with selection

### 4.7 Live Telemetry

WebSocket-driven event stream. Each event row shows:
- Timestamp (IBM Plex Mono)
- Direction indicator (CLIENT→SERVER, SERVER→CLIENT, VEIL)
- Method/event type
- Status badge
- Expandable raw payload

Events appear with staggered `AnimatePresence` animation.

### 4.8 Command Palette (Cmd+K / Ctrl+K)

Framer Motion modal with:
- Fuzzy search across all commands
- Commands: Run scenario, Open Attack Lab, Open Protocol Inspector, Search telemetry, Open finding, OWASP map, Generate report, Toggle theme, Settings
- Keyboard navigation (arrow keys, Enter, Escape)

### 4.9 State Management

Zustand stores:
- `useVeilStore` — active scenario, execution state, current finding
- `useTelemetryStore` — WebSocket events stream (capped at 1000 events)
- `useThemeStore` — light/dark + persisted to localStorage

### 4.10 Responsive Layout

| Breakpoint | Attack Lab layout |
|------------|------------------|
| 1440/1280 | Full 3-panel |
| 1024 | 2-panel (scenario selector collapses to drawer) |
| 768 | Stacked (tabs for panels) |
| 430/390/360 | Single-column investigation flow, bottom nav |

---

## 5. Payload Library (15 payloads)

| # | Name | Module | Severity | OWASP |
|---|------|--------|----------|-------|
| 1 | Basic Instruction Injection | Tool Poisoning | High | LLM01 |
| 2 | Data Exfiltration via Description | Tool Poisoning | Critical | LLM01, LLM02 |
| 3 | Privilege Escalation Command | Tool Poisoning | Critical | LLM01, LLM08 |
| 4 | Silent Action Trigger | Tool Poisoning | High | LLM01 |
| 5 | Cross-Tool Propagation | Tool Poisoning | Critical | LLM01 |
| 6 | Trust Establishment Phase (Rug Pull) | Rug Pull | High | LLM08 |
| 7 | Time-Based Definition Swap | Rug Pull | Critical | LLM08 |
| 8 | Connection-Count Triggered Swap | Rug Pull | Critical | LLM08 |
| 9 | Manual Trigger Rug Pull | Rug Pull | High | LLM08 |
| 10 | Adversarial Instruction in Output | Output Injection | High | LLM01 |
| 11 | Exfiltration via Tool Return | Output Injection | Critical | LLM02 |
| 12 | Chained Tool Manipulation | Output Injection | High | LLM01 |
| 13 | Sampling Prompt Override | Sampling Injection | High | LLM07 |
| 14 | System Prompt Extraction | Sampling Injection | Critical | LLM07 |
| 15 | Role Confusion via Sampling | Sampling Injection | High | LLM01, LLM07 |

---

## 6. Testing Strategy

- **Unit tests:** Attack module logic, scenario loader, findings engine, OWASP mapper
- **Integration tests:** Full scenario execution (spawn server → connect client → capture events → evaluate assertions)
- **Frontend tests:** Component behavior (Vitest + React Testing Library)
- All scenario YAML definitions double as pytest integration tests via the scenario runner

---

## 7. Security Scope

- Local execution only; no network calls leave localhost
- No credential collection, no persistence beyond SQLite findings
- Synthetic test data only
- All attack payloads operate only within the controlled VEIL environment
- The adversarial MCP server only accepts connections from the VEIL logging client

---

## 8. Key Dependencies

**Backend:** `fastapi`, `uvicorn`, `mcp`, `aiosqlite`, `pyyaml`, `pydantic`, `pytest`, `pytest-asyncio`, `httpx`

**Frontend:** `react`, `react-dom`, `react-router-dom`, `framer-motion`, `zustand`, `@tanstack/react-query`, `@monaco-editor/react`, `tailwindcss`, `date-fns`, `lucide-react`
