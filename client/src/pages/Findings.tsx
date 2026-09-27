import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFindings } from '../hooks/useApi';
import { SeverityBadge, ModuleBadge, OWASPBadge, StatusBadge } from '../components/ui/Badge';
import { AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Finding } from '../types';

function FindingCard({ finding, onClick }: { finding: Finding; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      className="w-full text-left rounded-[18px] p-5 border transition-all hover:border-blue-500/30"
      style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{finding.title}</div>
          <div className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{finding.scenario_name}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SeverityBadge severity={finding.severity} />
          <StatusBadge status={finding.status} />
        </div>
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
        {finding.observed_behavior.slice(0, 140)}...
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <ModuleBadge module={finding.attack_module} />
        {finding.owasp_categories.map(o => <OWASPBadge key={o} category={o} />)}
        <span className="ml-auto text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {formatDistanceToNow(new Date(finding.timestamp), { addSuffix: true })}
        </span>
      </div>
    </motion.button>
  );
}

export function Findings() {
  const { data: findings, isLoading } = useFindings();
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Findings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Verified security observations from scenario execution</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>Loading findings...</div>
      ) : !findings?.length ? (
        <div className="rounded-[22px] p-12 border text-center" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-1)' }}>
          <AlertTriangle size={32} className="mx-auto mb-3 text-orange-400 opacity-50" />
          <div className="font-display font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>No findings yet</div>
          <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Run scenarios in Attack Lab to generate findings</div>
        </div>
      ) : (
        <div className="space-y-3">
          {findings.map(f => (
            <FindingCard key={f.id} finding={f} onClick={() => navigate(`/findings/${f.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
