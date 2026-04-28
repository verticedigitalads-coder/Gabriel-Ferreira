import { CSSProperties, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  style?: CSSProperties;
}

export function Card({ children, className, onClick, hoverable, style }: CardProps) {
  return (
    <div
      className={cn(
        // Corporate card style - dark surface
        'bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-sm',
        'transition-all duration-150',
        hoverable && 'cursor-pointer hover:border-[var(--border-strong)] hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: ReactNode;
  valueStyle?: CSSProperties;
  icon?: ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: 'default' | 'red' | 'yellow' | 'green' | 'blue';
  onClick?: () => void;
  active?: boolean;
}

export function StatCard({ label, value, suffix, valueStyle, icon, trend, color = 'default', onClick, active }: StatCardProps) {
  const colorStyles = {
    default: '',
    red: 'border-l-4 border-l-red-600',
    yellow: 'border-l-4 border-l-yellow-600',
    green: 'border-l-4 border-l-green-600',
    blue: 'border-l-4 border-l-blue-600',
  };

  return (
    <div
      className={cn(
        // Corporate stat card - dark surface
        'bg-[var(--bg-surface)] border border-[var(--border)] rounded-md p-4',
        'transition-all duration-150',
        colorStyles[color],
        onClick && 'cursor-pointer hover:shadow-md hover:border-[var(--border-strong)]',
        active && 'ring-2 ring-[var(--accent)] border-[var(--border-accent)]'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">{label}</p>
          <div className="mt-1 flex items-baseline gap-0.5">
            <p className="text-2xl font-bold text-[var(--text-primary)]" style={valueStyle}>{value}</p>
            {suffix && <span className="text-sm font-normal" style={{ color: 'var(--text-tertiary)' }}>{suffix}</span>}
          </div>
          {trend && (
            <p className={cn('mt-1 text-xs font-semibold', trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-[var(--bg-surface-2)] rounded-md">{icon}</div>
        )}
      </div>
    </div>
  );
}
