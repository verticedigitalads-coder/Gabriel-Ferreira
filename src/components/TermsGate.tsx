import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { recordTermsAcceptance } from '@/lib/termsAcceptance';

interface TermsGateProps {
  userId: string;
  /** Chamado SOMENTE após o INSERT do aceite ser confirmado no banco. */
  onAccepted: () => void;
}

/**
 * Gate de aceite dos documentos legais (LGPD). Modal bloqueante de tela cheia:
 * sem fechar por ESC, sem fechar por clique-fora, sem X. As únicas saídas são
 * aceitar (grava o aceite e libera) ou sair (signOut). É renderizado como um
 * return de tela cheia em App.tsx — o app nunca monta atrás dele (fail-closed).
 */
export function TermsGate({ userId, onAccepted }: TermsGateProps) {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!checked || saving) return;
    setSaving(true);
    setError(null);
    const { error: insertError } = await recordTermsAcceptance(userId);
    if (insertError) {
      setError('Não foi possível registrar seu aceite. Verifique sua conexão e tente novamente.');
      setSaving(false);
      return;
    }
    onAccepted(); // libera o app apenas com o INSERT confirmado
  };

  const handleExit = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-gate-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-modal)',
          padding: 28,
        }}
      >
        <h2
          id="terms-gate-title"
          style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}
        >
          Atualizamos nossos termos
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
          Para continuar usando o VRTX CRM, leia e aceite os documentos abaixo. Eles
          explicam como tratamos seus dados, em conformidade com a LGPD.
        </p>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <a
            href="/termos"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600, textDecoration: 'underline' }}
          >
            Termos de Uso ↗
          </a>
          <a
            href="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600, textDecoration: 'underline' }}
          >
            Política de Privacidade ↗
          </a>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            cursor: 'pointer',
            minHeight: 44,
            marginBottom: error ? 10 : 20,
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: 18, height: 18, marginTop: 2, cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-primary)' }}>
            Li e aceito os Termos de Uso e a Política de Privacidade.
          </span>
        </label>

        {error && (
          <p style={{ fontSize: 13, color: 'var(--danger)', margin: '0 0 16px' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={handleExit} disabled={saving}>
            Sair
          </Button>
          <Button variant="primary" onClick={handleAccept} disabled={!checked || saving}>
            {saving ? 'Registrando…' : 'Aceitar e continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
