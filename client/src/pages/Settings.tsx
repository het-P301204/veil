import { useThemeStore } from '../store';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

export function Settings() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Configure the VEIL platform</p>
      </div>

      <div className="rounded-[22px] p-5 border mb-4" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}>
        <div className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Appearance</div>
        <div className="flex items-center gap-3">
          {(['dark', 'light'] as const).map(t => (
            <motion.button
              key={t}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { if (theme !== t) toggleTheme(); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm border transition-all ${
                theme === t ? 'bg-blue-500/15 border-blue-500/40 text-blue-400' : 'hover:bg-white/5'
              }`}
              style={{ borderColor: theme === t ? undefined : 'var(--surface-border)', color: theme === t ? undefined : 'var(--text-secondary)' }}
            >
              {t === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              {t.charAt(0).toUpperCase() + t.slice(1)} mode
            </motion.button>
          ))}
        </div>
      </div>

      <div className="rounded-[22px] p-5 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}>
        <div className="font-display font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Platform</div>
        <div className="space-y-2 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>Version</span><span>0.1.0</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>Backend</span><span>http://localhost:8000</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>WebSocket</span><span>ws://localhost:8000/ws</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>Scope</span><span>local · authorized research</span></div>
        </div>
      </div>
    </div>
  );
}
