import { forwardRef, useCallback, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ForwardedRef } from 'react';
import { cn } from '@/utils/cn';
import { useMaiusculaAuto } from '@/hooks/useMaiusculaAuto';
import type { ModoMaiuscula } from '@/utils/maiusculaAuto';

// Com a prop maiuscula, junta a ref de quem usa o componente com a da maiúscula automática.
function useRefComMaiuscula<T extends HTMLInputElement | HTMLTextAreaElement>(ref: ForwardedRef<T>, maiuscula?: ModoMaiuscula) {
  const refMaiuscula = useMaiusculaAuto(maiuscula);
  const juntas = useCallback(
    (el: T) => {
      const limpar = refMaiuscula(el);
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
      return () => {
        limpar?.();
        if (typeof ref === 'function') ref(null);
        else if (ref) ref.current = null;
      };
    },
    [ref, refMaiuscula],
  );
  return maiuscula ? juntas : ref;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  maiuscula?: ModoMaiuscula;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, maiuscula, ...props }, ref) => {
    const refFinal = useRefComMaiuscula(ref, maiuscula);
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={refFinal}
          autoCapitalize={maiuscula === 'palavras' ? 'words' : maiuscula ? 'sentences' : undefined}
          className={cn(
            // Dark surface input style
            'w-full px-3 py-2 border border-[var(--border-strong)] rounded-md text-sm',
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
  maiuscula?: ModoMaiuscula;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, maiuscula, ...props }, ref) => {
    const refFinal = useRefComMaiuscula(ref, maiuscula);
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={refFinal}
          autoCapitalize={maiuscula === 'palavras' ? 'words' : maiuscula ? 'sentences' : undefined}
          className={cn(
            // Dark surface textarea style
            'w-full px-3 py-2 border border-[var(--border-strong)] rounded-md text-sm',
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
            'w-full px-3 py-2 border border-[var(--border-strong)] rounded-md text-sm',
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
