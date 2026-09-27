import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface Props {
  visibleContent: string;
  hiddenContent: string;
  toolName: string;
}

export function RevealHiddenContent({ visibleContent, hiddenContent, toolName }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-[16px] overflow-hidden" style={{ border: `1px solid ${revealed ? '#f97316' : 'var(--surface-border)'}`, transition: 'border-color 0.4s ease', background: 'var(--surface-2)' }}>
      {/* Tool name header */}
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--surface-border)' }}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-cyan-400">{toolName}</span>
          {revealed && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-2 py-0.5 rounded-[6px] text-xs bg-orange-500/15 text-orange-400"
            >
              POISONED
            </motion.span>
          )}
        </div>
        <button
          onClick={() => setRevealed(!revealed)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all ${
            revealed
              ? 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25'
              : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
          }`}
        >
          {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
          {revealed ? 'Hide' : 'Reveal Hidden Content'}
        </button>
      </div>

      {/* Visible content */}
      <div className="px-4 py-3">
        <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
          WHAT THE HUMAN SEES
        </div>
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{visibleContent}</p>
      </div>

      {/* Hidden content */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-4 rounded-[12px] p-3" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={12} className="text-orange-400" />
                <span className="text-xs font-medium text-orange-400">WHAT THE AGENT RECEIVES</span>
              </div>
              <motion.p
                initial={{ filter: 'blur(8px)', opacity: 0 }}
                animate={{ filter: 'blur(0px)', opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-sm font-mono text-orange-300 leading-relaxed"
              >
                {hiddenContent}
              </motion.p>
            </div>
            <div className="mx-4 mb-4 flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <div className="flex-1 h-px" style={{ background: 'var(--surface-border)' }} />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                TRUST BOUNDARY VIOLATION
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--surface-border)' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
