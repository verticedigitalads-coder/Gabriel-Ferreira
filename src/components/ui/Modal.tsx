import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          // Dark surface modal
          'relative bg-[var(--bg-surface)] rounded-lg shadow-xl w-full mx-4',
          'border border-[var(--border)]',
          'max-h-[90vh] flex flex-col',
          sizeStyles[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-surface-3)] rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function SlidePanel({ isOpen, onClose, title, children }: SlidePanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          // Dark surface slide panel
          'fixed top-0 right-0 h-full w-full max-w-xl bg-[var(--bg-surface)] shadow-2xl z-50',
          'border-l border-[var(--border)]',
          'transform transition-transform duration-200 ease-out',
          'flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-surface-3)] rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-surface)]">{children}</div>
      </div>
    </>
  );
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Painel que sobe da base da tela — padrão mobile.
 * Mesmo esqueleto do SlidePanel (sempre montado + transition-transform, para animar
 * entrada E saída), com o eixo trocado de X para Y.
 * z-index 200/201: acima dos dropdowns (200) e do BottomNav (item de fluxo sem z-index).
 */
export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!isOpen}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[201] bg-[var(--bg-surface)]',
          'border-t border-[var(--border)] rounded-t-[var(--radius-xl)]',
          'max-h-[85vh] flex flex-col',
          'transform transition-transform duration-200 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        {/* Grabber — aforância de arraste; tocar fecha (drag-to-dismiss não implementado) */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="w-full flex items-center justify-center min-h-[44px] shrink-0"
        >
          <span className="block w-9 h-1 rounded-full bg-[var(--border-strong)]" />
        </button>

        {title && (
          <div className="flex items-center justify-between gap-2 px-4 pb-3 border-b border-[var(--border)] shrink-0">
            <h2 className="text-base font-bold text-[var(--text-primary)] truncate">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 hover:bg-[var(--bg-surface-3)] rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
