import { cn } from '@/utils/cn';
import type { LeadStatus, LeadTemperature, PriorityLevel } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const styles = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
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
    novo: { label: 'Novo', className: 'bg-blue-100 text-blue-700' },
    atendimento: { label: 'Em Atendimento', className: 'bg-purple-100 text-purple-700' },
    orcado: { label: 'Orçado', className: 'bg-yellow-100 text-yellow-700' },
    fechado: { label: 'Fechado', className: 'bg-green-100 text-green-700' },
    perdido: { label: 'Perdido', className: 'bg-gray-100 text-gray-700' },
  };

  const { label, className } = config[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold', className)}>
      {label}
    </span>
  );
}

export function TemperatureBadge({ temperatura }: { temperatura: LeadTemperature }) {
  const config: Record<LeadTemperature, { label: string; className: string }> = {
    quente: { label: '🔥 Quente', className: 'bg-red-100 text-red-700' },
    morno: { label: '☀️ Morno', className: 'bg-yellow-100 text-yellow-700' },
    frio: { label: '❄️ Frio', className: 'bg-blue-100 text-blue-700' },
  };

  const { label, className } = config[temperatura];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold', className)}>
      {label}
    </span>
  );
}

export function PriorityBadge({ level, score }: { level?: PriorityLevel; score?: number }) {
  const config: Record<PriorityLevel, { label: string; className: string }> = {
    critico: { label: 'CRÍTICO', className: 'bg-red-600 text-white' },
    alto: { label: 'ALTO', className: 'bg-orange-600 text-white' },
    medio: { label: 'MÉDIO', className: 'bg-yellow-600 text-white' },
    baixo: { label: 'BAIXO', className: 'bg-green-600 text-white' },
  };

  const safeLevel: PriorityLevel = config[level as PriorityLevel]
    ? (level as PriorityLevel)
    : 'baixo';

  const { label, className } = config[safeLevel];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wide',
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