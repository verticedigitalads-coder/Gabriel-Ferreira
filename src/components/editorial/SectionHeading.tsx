import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface SectionHeadingProps {
  index: string;
  label: string;
  accent?: string;
  right?: ReactNode;
  className?: string;
}

// Cabeçalho editorial de região dentro de um módulo (redesign D0). Só UI.
export function SectionHeading({ index, label, accent, right, className }: SectionHeadingProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="ed-mono flex h-6 w-6 shrink-0 items-center justify-center border border-[var(--border-accent)] text-[var(--accent)]">
        {index}
      </span>
      <h2 className="ed-mono whitespace-nowrap text-[var(--text-primary)]">
        {label}
        {accent && <span className="ed-serif ml-2 text-[var(--accent)]">{accent}</span>}
      </h2>
      <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-[var(--border)]" />
      {right}
    </div>
  );
}
