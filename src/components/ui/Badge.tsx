import { cn } from '@/utils/cn';
import type { LeadStatus, LeadTemperature, PriorityLevel } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const styles = {
    default: 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)]',
    success: 'bg-[var(--success-subtle)] text-[var(--success)]',
    warning: 'bg-[var(--warning-subtle)] text-[var(--warning)]',
    danger: 'bg-[var(--danger-subtle)] text-[var(--danger)]',
    info: 'bg-[var(--accent-subtle)] text-[var(--accent)]',
  };

  return (
    <span
      className={cn(
        // Corporate badge - compact and clear
        'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const config: Record<LeadStatus, { label: string; className: string }> = {
    novo: { label: 'Novo', className: 'bg-[var(--accent-subtle)] text-[var(--accent)]' },
    atendimento: { label: 'Em Atendimento', className: 'bg-purple-100 text-purple-700' },
    orcado: { label: 'Orçado', className: 'bg-[var(--warning-subtle)] text-[var(--warning)]' },
    fechado: { label: 'Fechado', className: 'bg-[var(--success-subtle)] text-[var(--success)]' },
    perdido: { label: 'Perdido', className: 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)]' },
  };

  const { label, className } = config[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold', className)}>
      {label}
    </span>
  );
}

export function TemperatureBadge({ temperatura }: { temperatura: LeadTemperature }) {
  const colors: Record<LeadTemperature, string> = {
    quente: '#ef4444',
    morno: '#f59e0b',
    frio: '#60a5fa',
  };

  return (
    <span
      title={temperatura.charAt(0).toUpperCase() + temperatura.slice(1)}
      style={{ backgroundColor: colors[temperatura] }}
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
    />
  );
}

export function PriorityBadge({ level, score }: { level?: PriorityLevel; score?: number }) {
  const config: Record<PriorityLevel, { label: string; className: string }> = {
    critico: { label: 'CRÍTICO', className: 'text-[var(--danger)]' },
    alto: { label: 'ALTO', className: 'text-[var(--warning)]' },
    medio: { label: 'MÉDIO', className: 'text-[var(--text-secondary)]' },
    baixo: { label: 'BAIXO', className: 'text-[var(--text-tertiary)]' },
  };

  const safeLevel: PriorityLevel = config[level as PriorityLevel]
    ? (level as PriorityLevel)
    : 'baixo';

  const { label, className } = config[safeLevel];

  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] font-medium uppercase tracking-wide',
        className
      )}
    >
      {label}
      {score !== undefined && (
        <span className="ml-1 opacity-80">({score})</span>
      )}
    </span>
  );
}