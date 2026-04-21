import { useState } from 'react';
import { X } from 'lucide-react';
import { SignaturePad } from './SignaturePad';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (assinaturaCliente: string) => void;
  nomeCliente: string;
  codigoDocumento: string;
  valorTotal: string;
}

export function SignatureModal({
  isOpen,
  onClose,
  onConfirm,
  nomeCliente,
  codigoDocumento,
  valorTotal,
}: SignatureModalProps) {
  const [assinatura, setAssinatura] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setAssinatura('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-[var(--bg-surface)] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Assinatura do Cliente
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {codigoDocumento} — {nomeCliente}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="p-3 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border)]">
            <p className="text-sm text-[var(--text-primary)]">
              Ao assinar, <strong>{nomeCliente}</strong> declara estar de acordo com o documento{' '}
              <strong>{codigoDocumento}</strong> no valor de <strong>{valorTotal}</strong>.
            </p>
          </div>

          <SignaturePad
            onSave={(dataUrl) => setAssinatura(dataUrl)}
            height={180}
          />

          {assinatura && (
            <div className="text-center">
              <p className="text-xs text-[var(--success)] font-medium">✓ Assinatura capturada</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end p-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-surface-2)] rounded-md hover:text-[var(--text-primary)] min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (assinatura) {
                onConfirm(assinatura);
                handleClose();
              }
            }}
            disabled={!assinatura}
            className="px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50 min-h-[44px]"
          >
            Confirmar Assinatura
          </button>
        </div>
      </div>
    </div>
  );
}
