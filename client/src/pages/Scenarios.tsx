import { useScenarios } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SeverityBadge, ModuleBadge, OWASPBadge } from '../components/ui/Badge';
import { Play } from 'lucide-react';
import { useVeilStore } from '../store';
import type { ScenarioConfig } from '../types';

export function Scenarios() {
  const { data: scenarios, isLoading } = useScenarios();
  const navigate = useNavigate();
  const { setActiveScenario } = useVeilStore();

  const handleRunInLab = (s: ScenarioConfig) => {
    setActiveScenario(s);
    navigate('/attack-lab');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Scenarios</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>YAML-defined attack scenarios for controlled MCP testing</p>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-tertiary)' }}>Loading scenarios...</div>
      ) : (
        <div className="space-y-3">
          {scenarios?.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-[18px] p-5 border"
              style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                    <SeverityBadge severity={s.severity} />
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{s.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ModuleBadge module={s.module} />
                    {s.owasp?.map((o: string) => <OWASPBadge key={o} category={o} />)}
                    {s.tool_count !== undefined && (
                      <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>{s.tool_count} tool{s.tool_count !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleRunInLab(s)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-medium text-white bg-blue-500 hover:bg-blue-600"
                >
                  <Play size={12} /> Run in Lab
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
