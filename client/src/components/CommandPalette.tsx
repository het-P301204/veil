import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, FlaskConical, Network, Activity, AlertTriangle, Shield, BarChart3, Settings, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store';

const commands = [
  { id: 'attack-lab', label: 'Open Attack Lab', icon: FlaskConical, action: (nav: (path: string) => void) => nav('/attack-lab') },
  { id: 'protocol', label: 'Open Protocol Inspector', icon: Network, action: (nav: (path: string) => void) => nav('/protocol') },
  { id: 'telemetry', label: 'Live Telemetry', icon: Activity, action: (nav: (path: string) => void) => nav('/telemetry') },
  { id: 'findings', label: 'View Findings', icon: AlertTriangle, action: (nav: (path: string) => void) => nav('/findings') },
  { id: 'owasp', label: 'OWASP Map', icon: Shield, action: (nav: (path: string) => void) => nav('/owasp') },
  { id: 'reports', label: 'Generate Report', icon: BarChart3, action: (nav: (path: string) => void) => nav('/reports') },
  { id: 'settings', label: 'Settings', icon: Settings, action: (nav: (path: string) => void) => nav('/settings') },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const { toggleTheme, theme } = useThemeStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands = [
    ...commands,
    { id: 'theme', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`, icon: theme === 'dark' ? Sun : Moon, action: (_nav: unknown) => toggleTheme() },
  ];

  const filtered = query
    ? allCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : allCommands;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setQuery('');
        setSelected(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter') { filtered[selected]?.action(navigate); setOpen(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="w-full max-w-lg rounded-[22px] overflow-hidden shadow-2xl"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--surface-border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--surface-border)' }}>
              <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search commands..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
              />
              <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--surface-3)', color: 'var(--text-tertiary)' }}>Esc</kbd>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {filtered.map((cmd, i) => (
                <motion.button
                  key={cmd.id}
                  whileHover={{ x: 2 }}
                  onClick={() => { cmd.action(navigate); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm text-left transition-colors ${i === selected ? 'bg-blue-500/15' : 'hover:bg-white/5'}`}
                  style={{ color: i === selected ? '#60a5fa' : 'var(--text-secondary)' }}
                >
                  <cmd.icon size={15} />
                  {cmd.label}
                </motion.button>
              ))}
            </div>
            <div className="px-4 py-2 border-t flex gap-4 text-xs" style={{ borderColor: 'var(--surface-border)', color: 'var(--text-tertiary)' }}>
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>Esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
