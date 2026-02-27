import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className, onClick, hoverable }: CardProps) {
  return (
    <div
      className={cn(
        // Corporate card style - clean and professional
        'bg-white border border-gray-200 rounded-md shadow-sm',
        'transition-all duration-150',
        hoverable && 'cursor-pointer hover:border-gray-300 hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: 'default' | 'red' | 'yellow' | 'green' | 'blue';
  onClick?: () => void;
  active?: boolean;
}

export function StatCard({ label, value, icon, trend, color = 'default', onClick, active }: StatCardProps) {
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
        // Corporate stat card - dense and professional
        'bg-white border border-gray-200 rounded-md p-4',
        'transition-all duration-150',
        colorStyles[color],
        onClick && 'cursor-pointer hover:shadow-md hover:border-gray-300',
        active && 'ring-2 ring-blue-600 border-blue-600'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={cn('mt-1 text-xs font-semibold', trend.isPositive ? 'text-green-600' : 'text-red-600')}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-gray-50 rounded-md">{icon}</div>
        )}
      </div>
    </div>
  );
}
