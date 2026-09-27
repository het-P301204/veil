import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFindings } from '../hooks/useApi';
import { SeverityBadge } from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

const OWASP_DATA = [
  { id: 'LLM01', name: 'Prompt Injection', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', desc: 'Crafted inputs manipulate LLM behavior by overriding instructions.' },
  { id: 'LLM02', name: 'Sensitive Information Disclosure', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', desc: 'LLMs inadvertently reveal confidential data.' },
  { id: 'LLM07', name: 'System Prompt Leakage', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', desc: 'System prompt contents exposed through tool interactions.' },
  { id: 'LLM08', name: 'Excessive Agency', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', desc: 'LLM-based systems take unintended high-impact actions.' },
  { id: 'LLM09', name: 'Misinformation', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', desc: 'LLMs produce false information presented as authoritative.' },
];

export function OWASPMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: findings } = useFindings();
  const navigate = useNavigate();

  const selectedData = OWASP_DATA.find(o => o.id === selected);
  const relatedFindings = findings?.filter(f => f.owasp_categories.includes(selected ?? '')) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>OWASP LLM Security Map</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>OWASP Top 10 for LLM Applications — mapped to VEIL findings</p>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {OWASP_DATA.map((item, i) => {
          const count = findings?.filter(f => f.owasp_categories.includes(item.id)).length ?? 0;
          const isSelected = selected === item.id;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -2 }}
              onClick={() => setSelected(isSelected ? null : item.id)}
              className={`rounded-[18px] p-4 border text-left transition-all ${item.bg} ${
                isSelected ? item.border : 'border-transparent hover:border-white/10'
              }`}
            >
              <div className={`font-mono font-bold text-lg mb-1 ${item.color}`}>{item.id}</div>
              <div className="text-xs font-medium mb-2 leading-tight" style={{ color: 'var(--text-primary)' }}>{item.name}</div>
              {count > 0 && (
                <div className={`text-xs font-mono ${item.color}`}>{count} finding{count !== 1 ? 's' : ''}</div>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && selectedData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="rounded-[22px] p-6 border"
            style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}
          >
            <div className="flex items-start gap-4 mb-5">
              <div className={`px-3 py-1.5 rounded-[10px] font-mono font-bold ${selectedData.bg} ${selectedData.color}`}>
                {selectedData.id}
              </div>
              <div>
                <div className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedData.name}</div>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{selectedData.desc}</p>
              </div>
            </div>

            {relatedFindings.length > 0 ? (
              <div>
                <div className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  Related Findings ({relatedFindings.length})
                </div>
                <div className="space-y-2">
                  {relatedFindings.map(f => (
                    <button
                      key={f.id}
                      onClick={() => navigate(`/findings/${f.id}`)}
                      className="w-full text-left rounded-[12px] p-3 border hover:bg-white/3 flex items-center gap-3"
                      style={{ borderColor: 'var(--surface-border)' }}
                    >
                      <SeverityBadge severity={f.severity} />
                      <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{f.title}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>{f.scenario_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No findings for this category yet. Run related scenarios to generate findings.</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
