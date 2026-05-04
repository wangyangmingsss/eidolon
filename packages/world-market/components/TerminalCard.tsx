import { ReactNode } from 'react';
import clsx from 'clsx';
export function TerminalCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('bg-steel/60 border border-neon p-6 shadow-neon backdrop-blur', className)}>
      {children}
    </div>
  );
}
