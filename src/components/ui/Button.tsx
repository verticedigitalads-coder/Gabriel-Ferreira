import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles - corporativo
          'inline-flex items-center justify-center font-semibold transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          'border border-transparent',
          
          // Variants - cores funcionais
          {
            // Primário - Accent Linear
            'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] focus:ring-[var(--accent)] shadow-sm': variant === 'primary',
            // Secundário - Surface escuro
            'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)] focus:ring-[var(--border-strong)] border-[var(--border)]': variant === 'secondary',
            // Danger - Vermelho crítico
            'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm': variant === 'danger',
            // Ghost - Minimal
            'bg-transparent text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-2)] focus:ring-[var(--border-strong)]': variant === 'ghost',
            // Success - Verde confirmação
            'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm': variant === 'success',
          },
          
          // Sizes - compacto
          {
            'text-xs px-2.5 py-1.5 rounded': size === 'sm',
            'text-sm px-4 py-2 rounded-md': size === 'md',
            'text-base px-6 py-2.5 rounded-md': size === 'lg',
          },
          
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
