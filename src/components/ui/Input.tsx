import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            // Dark surface input style
            'w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm',
            'bg-[var(--bg-surface-2)] text-[var(--text-primary)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--border-strong)]',
            'placeholder:text-[var(--text-tertiary)]',
            'disabled:bg-[var(--bg-surface)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed',
            'transition-all duration-150',
            error && 'border-[var(--danger)] focus:ring-[var(--danger)] focus:border-[var(--danger)]',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-[var(--danger)]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            // Dark surface textarea style
            'w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm',
            'bg-[var(--bg-surface-2)] text-[var(--text-primary)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--border-strong)]',
            'placeholder:text-[var(--text-tertiary)] resize-none',
            'transition-all duration-150',
            error && 'border-[var(--danger)] focus:ring-[var(--danger)] focus:border-[var(--danger)]',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-[var(--danger)]">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm',
            'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--border-strong)]',
            'bg-[var(--bg-surface-2)] text-[var(--text-primary)] cursor-pointer',
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
