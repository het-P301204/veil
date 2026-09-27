import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFinding } from '../hooks/useApi';
import { SeverityBadge, ModuleBadge, OWASPBadge, StatusBadge } from '../components/ui/Badge';
import { ChevronLeft, AlertTriangle, Shield, Activity, FileText } from 'lucide-react';
import { format } from 'date-fns';

export function FindingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: finding, isLoading } = useFinding(id!);

  if (isLoading) return <div className="p-6" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>;
  if (!finding) return <div className="p-6" style={{ color: 'var(--text-tertiary)' }}>Finding not found</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/findings')} className="flex items-center gap-1.5 text-sm mb-5 hover:text-blue-400 transition-colors" style={{ color: 'var(--text-secondary)' }}>
        <ChevronLeft size={14} /> Back to findings
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-xl mb-1" style={{ color: 'var(--text-primary)' }}>{finding.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={finding.severity} />
              <StatusBadge status={finding.status} />
              <ModuleBadge module={finding.attack_module} />
              {finding.owasp_categories.map(o => <OWASPBadge key={o} category={o} />)}
            </div>
          </div>
          <div className="text-xs font-mono text-right" style={{ color: 'var(--text-tertiary)' }}>
            <div>{finding.id.slice(0, 8)}</div>
            <div>{format(new Date(finding.timestamp), 'MMM d, yyyy HH:mm')}</div>
          </div>
        </div>

        {[
          { label: 'What Happened', icon: AlertTriangle, content: finding.observed_behavior, color: 'text-orange-400' },
          { label: 'Impact', icon: Shield, content: finding.impact, color: 'text-red-400' },
          { label: 'Remediation', icon: Activity, content: finding.remediation, color: 'text-green-400' },
        ].map(section => (
          <div key={section.label} className="rounded-[18px] p-5 border mb-3" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}>
            <div className={`flex items-center gap-2 mb-3 font-display font-semibold text-sm ${section.color}`}>
              <section.icon size={14} />
              {section.label}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{section.content}</p>
          </div>
        ))}

        {finding.evidence.length > 0 && (
          <div className="rounded-[18px] p-5 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}>
            <div className="font-display font-semibold text-sm mb-3 flex items-center gap-2 text-cyan-400">
              <FileText size={14} /> Protocol Evidence
            </div>
            <div className="space-y-2">
              {finding.evidence.slice(0, 5).map((e) => (
                <div key={e.id} className="rounded-[10px] p-3 text-xs" style={{ background: 'var(--surface-2)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-cyan-400">{e.method}</span>
                    {e.is_malicious && <span className="text-orange-400">malicious</span>}
                  </div>
                  {e.malicious_content && (
                    <div className="font-mono text-orange-300 text-[11px] truncate">{e.malicious_content.slice(0, 80)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
