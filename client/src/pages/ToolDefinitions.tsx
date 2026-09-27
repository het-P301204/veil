import { useScenarios, usePayloads } from '../hooks/useApi';
import { RevealHiddenContent } from '../components/RevealHiddenContent';
import { ModuleBadge, OWASPBadge, SeverityBadge } from '../components/ui/Badge';
import { motion } from 'framer-motion';
import type { AttackModule } from '../types';

export function ToolDefinitions() {
  const { data: scenarios } = useScenarios();
  const { data: payloads } = usePayloads();

  const allTools = scenarios?.flatMap(s =>
    (s.tools ?? []).map(t => ({ ...t, scenario: s.name, module: s.module as AttackModule }))
  ) ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Tool Definitions</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Inspect adversarial tool definitions and their hidden payloads</p>
      </div>

      <div className="space-y-4 mb-8">
        {allTools.map((tool, i) => (
          <motion.div key={`${tool.scenario}-${tool.name}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>from</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{tool.scenario}</span>
              <ModuleBadge module={tool.module} />
            </div>
            {tool.hidden_instruction ? (
              <RevealHiddenContent
                toolName={tool.name}
                visibleContent={tool.description}
                hiddenContent={tool.hidden_instruction}
              />
            ) : (
              <div className="rounded-[16px] p-4 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}>
                <div className="font-mono text-sm text-cyan-400 mb-1">{tool.name}</div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tool.description}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {payloads && payloads.length > 0 && (
        <div className="mb-4">
          <h2 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Payload Library</h2>
          <div className="space-y-2">
            {payloads.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="rounded-[14px] p-4 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-orange-400">{p.id}</span>
                  <SeverityBadge severity={p.severity} />
                  <ModuleBadge module={p.module} />
                  {p.owasp.map(o => <OWASPBadge key={o} category={o} />)}
                </div>
                <div className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                <div className="rounded-[8px] p-2 font-mono text-[11px] text-orange-300" style={{ background: 'rgba(249,115,22,0.08)' }}>
                  {p.content}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
