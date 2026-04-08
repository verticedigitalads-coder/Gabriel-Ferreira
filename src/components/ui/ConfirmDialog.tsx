import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title = 'Confirmar ação',
  description,
  confirmText = 'Excluir',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="p-6 space-y-6">
        <div className="flex items-start gap-3">
          <div className="text-[var(--danger)] text-xl">⚠️</div>
          <p className="text-[var(--text-secondary)]">{description}</p>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>

          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Processando...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
