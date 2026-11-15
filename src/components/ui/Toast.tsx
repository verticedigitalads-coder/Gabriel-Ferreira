import { useStore } from '@/store/useStore';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ToastMessage } from '@/types';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styleMap = {
  success: 'bg-[var(--success-subtle)] border-[var(--success)] text-[var(--success)]',
  error: 'bg-[var(--danger-subtle)] border-[var(--danger)] text-[var(--danger)]',
  warning: 'bg-[var(--warning-subtle)] border-[var(--warning)] text-[var(--warning)]',
  info: 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)]',
};

export function ToastContainer() {
  const toasts = useStore(state => state.toasts);
  const removeToast = useStore(state => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    // No topo, em todas as larguras: não cobre o menu de baixo nem barras de ação no rodapé
    <div className="fixed top-[var(--space-4)] inset-x-[var(--space-4)] md:left-auto md:right-[var(--space-4)] z-50 flex flex-col gap-2">
      {toasts.map((toast: ToastMessage) => {
        const Icon = iconMap[toast.type];
        return (
          // Base opaca: no topo o toast fica sobre o cabeçalho, e o fundo
          // *-subtle (10% de opacidade) deixava o texto de trás aparecer
          <div
            key={toast.id}
            className="rounded shadow-lg min-w-[280px] animate-slide-in bg-[var(--bg-surface)]"
          >
            <div
              className={cn(
                'flex items-center gap-3 px-4 py-3 border rounded',
                styleMap[toast.type]
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[var(--bg-surface-2)] rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
