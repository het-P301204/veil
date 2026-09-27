# Contributing to VEIL

## Getting Started

1. Clone the repository
2. Follow the [Quick Start](README.md#quick-start) instructions to get the full stack running
3. Run `python -m pytest tests/ -v` to confirm all tests pass before making changes

## Development Setup

**Backend:**
```bash
pip install -r requirements.txt
python -m uvicorn server.api.main:app --reload --port 8000
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

## Adding a New Attack Module

1. Create `server/mcp_server/attacks/<module_name>.py`
2. Add the module value to `AttackModule` enum in `server/shared/models.py`
3. Wire it into `server/mcp_server/server.py` `_build_tool_list()`
4. Add scenario YAML files to `scenarios/`
5. Add OWASP mapping in `server/findings/owasp.py`
6. Add payloads to `server/payloads/library.py`
7. Write integration tests in `tests/`

## Adding Scenarios

Scenarios are YAML files in `scenarios/`. See [Writing Custom Scenarios](README.md#writing-custom-scenarios) for the schema.

Every scenario should have at least one assertion so it generates a finding when it passes.

## Adding Payloads

Add entries to `PAYLOAD_LIBRARY` in `server/payloads/library.py`. Follow the existing `PayloadDefinition` structure — include `id`, `name`, `module`, `severity`, `owasp`, `content`, and `description`.

## Code Style

- Python: follow PEP 8, use type annotations, no bare `except` clauses
- TypeScript: strict mode, no `any` unless unavoidable
- No `datetime.utcnow()` — use `datetime.now(timezone.utc)`
- Pydantic models: use `model_dump(mode="json")` not `.dict()`

## Tests

All new backend functionality needs a test. Integration tests that exercise the full scenario runner are preferred over unit tests where possible.

```bash
python -m pytest tests/ -v --tb=short
```

## Commit Messages

Use conventional commits:

```
feat: add rug pull elapsed-time trigger
fix: handle missing tool description in poison builder
refactor: extract scenario assertion runner
test: add output injection integration test
```

## Pull Requests

- One feature or fix per PR
- Include test coverage for new behavior
- Update `scenarios/` with example YAML for new attack modules
- Reference the OWASP LLM category your change relates to, if applicable
