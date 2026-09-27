OWASP_CATEGORIES = {
    "LLM01": {
        "id": "LLM01",
        "name": "Prompt Injection",
        "description": "Attackers manipulate LLMs via crafted inputs, causing the LLM to unknowingly execute the attacker's intentions.",
        "color": "critical",
    },
    "LLM02": {
        "id": "LLM02",
        "name": "Sensitive Information Disclosure",
        "description": "LLMs may inadvertently disclose confidential data in their responses, causing unauthorized data access.",
        "color": "high",
    },
    "LLM07": {
        "id": "LLM07",
        "name": "System Prompt Leakage",
        "description": "The risk of system prompts being exposed, leading to the revelation of confidential instructions.",
        "color": "high",
    },
    "LLM08": {
        "id": "LLM08",
        "name": "Excessive Agency",
        "description": "LLM-based systems may undertake actions leading to unintended consequences.",
        "color": "critical",
    },
    "LLM09": {
        "id": "LLM09",
        "name": "Misinformation",
        "description": "LLMs can produce factually incorrect information, presenting it as authoritative.",
        "color": "medium",
    },
}

OWASP_REMEDIATION = {
    "LLM01": "Implement strict input validation for all tool descriptions. Use allowlists for tool content. Treat all MCP server-provided content as untrusted. Apply content scanning for hidden characters and injection patterns.",
    "LLM02": "Limit data access scopes for tools. Implement output filtering. Audit tool return values for sensitive content patterns. Use data loss prevention scanning on tool outputs.",
    "LLM07": "Never expose system prompts through tool definitions or sampling responses. Implement prompt isolation. Use separate execution contexts for tool processing.",
    "LLM08": "Apply principle of least privilege to all tool definitions. Require human-in-the-loop for high-impact actions. Monitor and log all tool executions. Implement action allowlists.",
    "LLM09": "Validate tool output provenance. Cross-reference tool results against trusted sources. Implement confidence scoring for tool-provided information.",
}


def get_owasp_impact(category_id: str) -> str:
    impacts = {
        "LLM01": "AI agents may execute arbitrary instructions injected by malicious MCP servers, leading to unauthorized actions, data exfiltration, or complete agent compromise.",
        "LLM02": "Sensitive conversation data, user credentials, or system information may be transmitted to attacker-controlled infrastructure.",
        "LLM07": "System prompts containing operational instructions, security policies, or sensitive configuration may be extracted by adversarial tools.",
        "LLM08": "AI agents with access to external systems may take unauthorized actions including data deletion, configuration changes, or lateral movement.",
        "LLM09": "Agents may act on false information injected through tool outputs, leading to incorrect decisions or manipulated reasoning chains.",
    }
    return impacts.get(category_id, "Security boundary violation with potential for unauthorized agent behavior.")
