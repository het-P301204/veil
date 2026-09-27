import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '../CommandPalette';
import { useWebSocket } from '../../hooks/useWebSocket';

export function AppShell({ children }: { children: ReactNode }) {
  useWebSocket();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-screen" style={{ background: 'var(--surface-base)' }}>
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
