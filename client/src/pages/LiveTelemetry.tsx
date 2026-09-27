import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetryStore } from '../store';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { TelemetryEvent } from '../types';

function EventRow({ event }: { event: TelemetryEvent }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = {
    ok: 'bg-green-400',
    warning: 'bg-yellow-400',
    critical: 'bg-red-400',
    detected: 'bg-orange-400',
  }[event.status] ?? 'bg-gray-400';

  const dirLabel = {
    client_to_server: 'C → S',
    server_to_client: 'S → C',
    veil: 'VEIL',
  }[event.direction];

  const dirColor = {
    client_to_server: 'text-blue-400',
    server_to_client: 'text-cyan-400',
    veil: 'text-violet-400',
  }[event.direction];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b"
      style={{ borderColor: 'var(--surface-border)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/3 text-left"
      >
        <span className="font-mono text-[10px] w-20 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
          {new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false })}
        </span>
        <span className={`font-mono text-[10px] w-10 flex-shrink-0 ${dirColor}`}>{dirLabel}</span>
        <span className="font-mono text-xs flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)' }}>{event.method}</span>
        <span className="text-xs w-24 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{event.event_type.replace(/_/g, ' ')}</span>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor}`} />
        {expanded ? <ChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />}
      </button>
      <AnimatePresence>
        {expanded && event.payload && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <pre className="px-6 py-3 text-[11px] font-mono overflow-x-auto" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function LiveTelemetry() {
  const { events, clearEvents } = useTelemetryStore();
  const [filterRunId, setFilterRunId] = useState('');

  // Get unique session IDs from events
  const sessionIds = [...new Set(events.map(e => e.session_id).filter(Boolean))];

  // Filter events
  const filteredEvents = filterRunId
    ? events.filter(e => e.session_id === filterRunId)
    : events;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-1)' }}>
        <div>
          <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Live Telemetry</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Real-time MCP protocol events</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {filteredEvents.length} events
          </div>
          <button
            onClick={clearEvents}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Session filter bar */}
      <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-secondary)' }}>Filter by session:</label>
          <select
            value={filterRunId}
            onChange={e => setFilterRunId(e.target.value)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: '8px', padding: '4px 8px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px' }}
          >
            <option value="">All sessions</option>
            {sessionIds.map(sid => (
              <option key={sid} value={sid}>{sid?.slice(0, 8)}...</option>
            ))}
          </select>
          {filterRunId && (
            <button onClick={() => setFilterRunId('')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b text-[10px] uppercase tracking-wide" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)', color: 'var(--text-tertiary)' }}>
        <span className="w-20">Timestamp</span>
        <span className="w-10">Dir</span>
        <span className="flex-1">Method</span>
        <span className="w-24">Event Type</span>
        <span className="w-4">St</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Waiting for events...</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Run a scenario in Attack Lab to see protocol traffic</div>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredEvents.map(e => <EventRow key={e.id} event={e} />)}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
