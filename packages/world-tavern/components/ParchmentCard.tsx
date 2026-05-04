import { ReactNode } from 'react';
import clsx from 'clsx';
export function ParchmentCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('bg-parchment/95 p-8 rounded-lg shadow-2xl border border-ash/40', className)}>
      {children}
    </div>
  );
}
