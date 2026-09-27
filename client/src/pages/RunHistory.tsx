import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

interface RunRecord {
  id: string;
  scenario_name: string;
  module: string;
  success: number;
  assertions_passed: number;
  assertions_total: number;
  duration_ms: number;
  finding_id: string | null;
  timestamp: string;
  error: string | null;
}

const MODULE_COLORS: Record<string, string> = {
  tool_poisoning: 'var(--color-adversarial-400)',
  rug_pull: 'var(--color-warning-400)',
  output_injection: 'var(--color-protocol-400)',
  sampling_injection: 'var(--color-agent-400)',
};

export default function RunHistory() {
  const { data: runs = [], isLoading } = useQuery<RunRecord[]>({
    queryKey: ['runs'],
    queryFn: () => fetch('/api/scenarios/runs').then(r => r.json()),
    refetchInterval: 5000,
  });

  const successCount = runs.filter(r => r.success).length;
  const failCount = runs.filter(r => !r.success).length;
  const avgDuration = runs.length > 0
    ? Math.round(runs.reduce((s, r) => s + r.duration_ms, 0) / runs.length)
    : 0;

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Run History
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontFamily: 'Inter, sans-serif' }}>
          All scenario executions — {runs.length} total runs
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Runs', value: runs.length, color: 'var(--color-primary-400)', icon: Activity },
          { label: 'Passed', value: successCount, color: 'var(--color-verified-400)', icon: CheckCircle },
          { label: 'Failed', value: failCount, color: 'var(--color-critical-400)', icon: XCircle },
          { label: 'Avg Duration', value: `${avgDuration}ms`, color: 'var(--color-protocol-400)', icon: Clock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--surface-border)',
            borderRadius: '16px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Icon size={18} style={{ color }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '26px', fontWeight: 700, color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Runs table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '60px' }}>Loading run history...</div>
      ) : runs.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '60px' }}>
          <Activity size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>No runs yet. Execute a scenario from Attack Lab.</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--surface-border)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 80px 100px 80px',
            padding: '12px 20px',
            borderBottom: '1px solid var(--surface-border)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <span>Scenario</span>
            <span>Module</span>
            <span>Assertions</span>
            <span>Status</span>
            <span>Duration</span>
            <span>Finding</span>
          </div>
          {runs.map((run, idx) => (
            <motion.div
              key={run.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 80px 100px 80px',
                padding: '14px 20px',
                borderBottom: idx < runs.length - 1 ? '1px solid var(--surface-border)' : 'none',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: 'var(--text-primary)' }}>
                  {run.scenario_name}
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {new Date(run.timestamp).toLocaleString()}
                </div>
              </div>
              <div style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: `color-mix(in srgb, ${MODULE_COLORS[run.module] || 'var(--color-primary-400)'} 15%, transparent)`,
                color: MODULE_COLORS[run.module] || 'var(--color-primary-400)',
                display: 'inline-block',
              }}>
                {run.module.replace('_', ' ')}
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {run.assertions_passed}/{run.assertions_total}
              </div>
              <div>
                {run.success ? (
                  <CheckCircle size={16} style={{ color: 'var(--color-verified-400)' }} />
                ) : (
                  <XCircle size={16} style={{ color: 'var(--color-critical-400)' }} />
                )}
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {Math.round(run.duration_ms)}ms
              </div>
              <div>
                {run.finding_id ? (
                  <span style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'color-mix(in srgb, var(--color-verified-400) 15%, transparent)',
                    color: 'var(--color-verified-400)',
                  }}>
                    linked
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>—</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
