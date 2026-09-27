import { type ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  actions?: ReactNode;
}

export function Panel({ children, className = '', title, actions }: PanelProps) {
  return (
    <div
      className={`rounded-[22px] border ${className}`}
      style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-border)' }}
    >
      {(title || actions) && (
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--surface-border)' }}
        >
          {title && (
            <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h3>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
