import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTelemetryStore } from '../store';
import { Copy, AlertTriangle } from 'lucide-react';
import type { ProtocolEvent } from '../types';

function MessageViewer({ event }: { event: ProtocolEvent | null }) {
  const [copied, setCopied] = useState(false);

  if (!event) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
        <div className="text-sm">Select a message to inspect</div>
      </div>
    );
  }

  const json = JSON.stringify(event.message, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--surface-border)' }}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-2 py-1 rounded-[6px] ${
            event.direction === 'client_to_server' ? 'bg-blue-500/15 text-blue-400' :
            event.direction === 'server_to_client' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-violet-500/15 text-violet-400'
          }`}>
            {event.direction === 'client_to_server' ? 'CLIENT → SERVER' : event.direction === 'server_to_client' ? 'SERVER → CLIENT' : 'VEIL'}
          </span>
          <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{event.method}</span>
          {event.is_malicious && (
            <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-[6px]">
              <AlertTriangle size={10} /> MALICIOUS
            </span>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs hover:bg-white/5"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Copy size={11} /> {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {event.is_malicious && event.malicious_field && (
        <div className="px-5 py-2.5 border-b text-xs" style={{ background: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.2)' }}>
          <span className="text-orange-400">Warning: Malicious content in field: </span>
          <span className="font-mono text-orange-300">{event.malicious_field}</span>
          {event.malicious_content && (
            <div className="mt-1 font-mono text-orange-200 text-[11px]">{event.malicious_content.slice(0, 100)}...</div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-5">
        <pre className="text-[12px] font-mono leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {json}
        </pre>
      </div>
    </div>
  );
}

export function ProtocolInspector() {
  const { protocolEvents } = useTelemetryStore();
  const [selected, setSelected] = useState<ProtocolEvent | null>(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-1)' }}>
        <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Protocol Inspector</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Inspect raw MCP JSON-RPC 2.0 messages</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Message list */}
        <div className="w-80 border-r overflow-y-auto" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-1)' }}>
          {protocolEvents.length === 0 ? (
            <div className="p-6 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
              No protocol messages yet.<br />Run a scenario to capture traffic.
            </div>
          ) : protocolEvents.map((evt, i) => (
            <motion.button
              key={evt.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelected(evt)}
              className={`w-full text-left px-4 py-3 border-b transition-colors ${
                selected?.id === evt.id ? 'bg-blue-500/10' : 'hover:bg-white/3'
              }`}
              style={{ borderColor: 'var(--surface-border)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-mono ${
                  evt.direction === 'client_to_server' ? 'text-blue-400' :
                  evt.direction === 'server_to_client' ? 'text-cyan-400' : 'text-violet-400'
                }`}>
                  {evt.direction === 'client_to_server' ? 'C→S' : evt.direction === 'server_to_client' ? 'S→C' : 'VEIL'}
                </span>
                {evt.is_malicious && <span className="text-[9px] text-orange-400">MALICIOUS</span>}
                <span className="font-mono text-[10px] ml-auto" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(evt.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>
              <div className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{evt.method}</div>
            </motion.button>
          ))}
        </div>

        {/* Message viewer */}
        <div className="flex-1 overflow-hidden" style={{ background: 'var(--surface-base)' }}>
          <MessageViewer event={selected} />
        </div>
      </div>
    </div>
  );
}
