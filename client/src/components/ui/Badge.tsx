import type { Severity, AttackModule } from '../../types';

const severityConfig: Record<Severity, { bg: string; text: string; dot: string }> = {
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  high:     { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  medium:   { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  low:      { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-400' },
};

const moduleConfig: Record<AttackModule, { bg: string; text: string }> = {
  tool_poisoning:    { bg: 'bg-violet-500/15', text: 'text-violet-400' },
  rug_pull:          { bg: 'bg-orange-500/15', text: 'text-orange-400' },
  output_injection:  { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  sampling_injection: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
};

const moduleLabel: Record<AttackModule, string> = {
  tool_poisoning: 'Tool Poisoning',
  rug_pull: 'Rug Pull',
  output_injection: 'Output Injection',
  sampling_injection: 'Sampling Injection',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = severityConfig[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[8px] text-xs font-medium font-display uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {severity}
    </span>
  );
}

export function ModuleBadge({ module }: { module: AttackModule }) {
  const cfg = moduleConfig[module];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[8px] text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {moduleLabel[module]}
    </span>
  );
}

export function OWASPBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[8px] text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
      {category}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    verified: 'bg-green-500/15 text-green-400',
    ok: 'bg-green-500/15 text-green-400',
    detected: 'bg-red-500/15 text-red-400',
    critical: 'bg-red-500/15 text-red-400',
    warning: 'bg-yellow-500/15 text-yellow-400',
    investigating: 'bg-yellow-500/15 text-yellow-400',
    false_positive: 'bg-gray-500/15 text-gray-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[8px] text-xs font-medium uppercase tracking-wide ${config[status] ?? 'bg-gray-500/15 text-gray-400'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
