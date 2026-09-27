import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FlaskConical, FileText, Wrench,
  Network, Activity, AlertTriangle, Shield, BarChart3, Settings
} from 'lucide-react';
import { useThemeStore } from '../../store';

const navItems = [
  { path: '/', label: 'Command Center', icon: LayoutDashboard, color: 'text-blue-400' },
  { path: '/attack-lab', label: 'Attack Lab', icon: FlaskConical, color: 'text-orange-400' },
  { path: '/scenarios', label: 'Scenarios', icon: FileText, color: 'text-violet-400' },
  { path: '/tools', label: 'Tool Definitions', icon: Wrench, color: 'text-cyan-400' },
  { path: '/protocol', label: 'Protocol Inspector', icon: Network, color: 'text-cyan-400' },
  { path: '/telemetry', label: 'Live Telemetry', icon: Activity, color: 'text-green-400' },
  { path: '/findings', label: 'Findings', icon: AlertTriangle, color: 'text-red-400' },
  { path: '/runs', label: 'Run History', icon: Activity, color: 'text-green-400' },
  { path: '/owasp', label: 'OWASP Map', icon: Shield, color: 'text-blue-400' },
  { path: '/reports', label: 'Reports', icon: BarChart3, color: 'text-violet-400' },
  { path: '/settings', label: 'Settings', icon: Settings, color: 'text-gray-400' },
];

export function Sidebar() {
  const location = useLocation();
  const { theme } = useThemeStore();

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-screen border-r sticky top-0"
      style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--surface-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-display font-bold text-xs">V</span>
          </div>
          <div>
            <div className="font-display font-bold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>VEIL</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>MCP Security Research</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          return (
            <NavLink key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm transition-colors ${
                  active
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'hover:bg-white/5'
                }`}
                style={{ color: active ? undefined : 'var(--text-secondary)' }}
              >
                <item.icon size={15} className={active ? 'text-blue-400' : item.color} />
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-xs" style={{ borderColor: 'var(--surface-border)', color: 'var(--text-tertiary)' }}>
        <div className="font-mono">v0.1.0 — local</div>
        <div className="mt-0.5">Authorized research only</div>
      </div>
    </aside>
  );
}
