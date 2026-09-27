# Security Policy

## Scope

VEIL is a **local security research platform**. It is designed to operate exclusively on `localhost` in a controlled research environment.

### In scope

- Vulnerabilities in VEIL's own code (the FastAPI server, MCP server implementation, scenario engine, frontend)
- Issues that could cause VEIL to send traffic outside localhost
- Issues that could expose the findings database to unintended parties
- Logic errors in attack module implementations that produce incorrect research results

### Out of scope

- The attack vectors VEIL *demonstrates* — Tool Poisoning, Rug Pull, Output Injection, Sampling Injection — are intentional features, not bugs
- Vulnerabilities in third-party dependencies (report these upstream)
- Issues requiring physical access to the machine

## Boundaries

VEIL enforces these constraints by design:

- **No external network calls.** All traffic stays on `localhost:8000` (backend) and `localhost:5173` (frontend).
- **No credential collection.** VEIL never requests, stores, or transmits user credentials.
- **Synthetic data only.** Attack payloads operate only within the controlled VEIL environment.
- **Local persistence only.** The only storage is a SQLite database at `server/veil_findings.db` on the local machine.
- **The adversarial MCP server** only accepts connections from the VEIL logging client subprocess.

## Reporting

If you discover a security issue in VEIL itself, please report it via GitHub Issues with the `security` label. Include:

1. A description of the vulnerability
2. Steps to reproduce
3. The potential impact
4. Any suggested mitigations

Do not include actual exploit code targeting systems outside the VEIL research environment.

## Responsible Use

VEIL is built for:

- AI security researchers studying MCP attack surfaces
- Red teamers assessing AI agent deployments
- AI developers understanding MCP protocol vulnerabilities
- Academic research on LLM security

VEIL must not be used to:

- Attack production MCP servers or AI deployments without explicit written authorization
- Build weaponized tools targeting systems you do not own
- Evade detection in real attacks

The attack payloads in VEIL's payload library demonstrate documented attack classes. Using them against systems outside VEIL's controlled environment without authorization is illegal and unethical.
