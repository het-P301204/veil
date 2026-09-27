export type AttackModule = 'tool_poisoning' | 'rug_pull' | 'output_injection' | 'sampling_injection';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type EventDirection = 'client_to_server' | 'server_to_client' | 'veil';
export type EventStatus = 'ok' | 'warning' | 'critical' | 'detected';

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  direction: EventDirection;
  method: string;
  source: string;
  target: string;
  event_type: string;
  status: EventStatus;
  payload?: Record<string, unknown>;
  session_id: string;
  scenario_name: string;
}

export interface ProtocolEvent {
  id: string;
  timestamp: string;
  direction: EventDirection;
  method: string;
  message: Record<string, unknown>;
  session_id: string;
  is_malicious: boolean;
  malicious_field?: string;
  malicious_content?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  hidden_instruction?: string;
  parameters: Array<{ name: string; type: string; description: string }>;
  is_poisoned: boolean;
}

export interface ScenarioConfig {
  name: string;
  description: string;
  module: AttackModule;
  severity: Severity;
  owasp: string[];
  tools: ToolDefinition[];
  tool_count?: number;
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  attack_module: AttackModule;
  scenario_name: string;
  evidence: ProtocolEvent[];
  observed_behavior: string;
  impact: string;
  owasp_categories: string[];
  remediation: string;
  timestamp: string;
  status: string;
  tool_name?: string;
}

export interface PayloadDefinition {
  id: string;
  name: string;
  module: AttackModule;
  description: string;
  purpose: string;
  owasp: string[];
  severity: Severity;
  content: string;
  expected_behavior: string;
}

export interface ScenarioResult {
  scenario_name: string;
  module: AttackModule;
  success: boolean;
  assertions_passed: number;
  assertions_total: number;
  events: TelemetryEvent[];
  protocol_events: ProtocolEvent[];
  finding_id?: string;
  error?: string;
  duration_ms: number;
}

export type RunStage =
  | 'idle'
  | 'initializing'
  | 'tools_list'
  | 'analyzing'
  | 'tool_call'
  | 'detecting'
  | 'verified'
  | 'failed';
