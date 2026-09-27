import { useScenarios, useFindings } from '../hooks/useApi';
import { useTelemetryStore } from '../store';
import { SeverityBadge, ModuleBadge } from '../components/ui/Badge';
import { Panel } from '../components/ui/Panel';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, FlaskConical, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[16px] p-4 border"
      style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}
    >
      <div className="text-xs mb-2 font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
      <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{sub}</div>}
    </motion.div>
  );
}

export function CommandCenter() {
  const { data: scenarios } = useScenarios();
  const { data: findings } = useFindings();
  const { events } = useTelemetryStore();
  const navigate = useNavigate();

  const critical = findings?.filter(f => f.severity === 'critical').length ?? 0;
  const verified = findings?.filter(f => f.status === 'verified').length ?? 0;
  const recentFindings = findings?.slice(0, 5) ?? [];
  const recentEvents = events.slice(0, 8);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Command Center</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Expose what the agent cannot see.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Scenarios" value={scenarios?.length ?? 0} sub="loaded" color="text-blue-400" />
        <StatCard label="Findings" value={findings?.length ?? 0} sub="total" color="text-orange-400" />
        <StatCard label="Critical" value={critical} sub="severity" color="text-red-400" />
        <StatCard label="Verified" value={verified} sub="confirmed" color="text-green-400" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Recent findings */}
        <Panel title="Recent Findings" actions={
          <button onClick={() => navigate('/findings')} className="text-xs text-blue-400 hover:text-blue-300">View all</button>
        }>
          <div className="divide-y" style={{ borderColor: 'var(--surface-border)' }}>
            {recentFindings.length === 0 ? (
              <div className="px-5 py-8 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
                No findings yet. Run a scenario in Attack Lab.
              </div>
            ) : recentFindings.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/findings/${f.id}`)}
                className="px-5 py-3 hover:bg-white/3 cursor-pointer flex items-center gap-3"
              >
                <SeverityBadge severity={f.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{f.title}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{f.scenario_name}</div>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {formatDistanceToNow(new Date(f.timestamp), { addSuffix: true })}
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>

        {/* Live telemetry preview */}
        <Panel title="Live Activity" actions={
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Live</span>
          </div>
        }>
          <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <div className="py-6 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
                Waiting for activity...
              </div>
            ) : recentEvents.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-[8px] text-xs"
                style={{ background: 'var(--surface-2)' }}
              >
                <span className="font-mono w-16 flex-shrink-0 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(e.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={`flex-shrink-0 font-mono text-[10px] ${
                  e.direction === 'veil' ? 'text-violet-400' :
                  e.direction === 'client_to_server' ? 'text-blue-400' : 'text-cyan-400'
                }`}>
                  {e.direction === 'client_to_server' ? 'C→S' : e.direction === 'server_to_client' ? 'S→C' : 'VEIL'}
                </span>
                <span className="font-mono flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{e.method}</span>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  e.status === 'critical' ? 'bg-red-400' :
                  e.status === 'detected' ? 'bg-orange-400' :
                  e.status === 'warning' ? 'bg-yellow-400' : 'bg-green-400'
                }`} />
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Attack Lab', desc: 'Run a scenario', icon: FlaskConical, color: 'text-orange-400', bg: 'bg-orange-500/10', path: '/attack-lab' },
          { label: 'Protocol Inspector', desc: 'Inspect MCP traffic', icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10', path: '/protocol' },
          { label: 'OWASP Map', desc: 'Browse categories', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', path: '/owasp' },
        ].map(item => (
          <motion.button
            key={item.path}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(item.path)}
            className="rounded-[16px] p-4 border text-left"
            style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}
          >
            <div className={`w-8 h-8 rounded-[8px] ${item.bg} flex items-center justify-center mb-3`}>
              <item.icon size={16} className={item.color} />
            </div>
            <div className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
