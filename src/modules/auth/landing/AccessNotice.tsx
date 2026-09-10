import {
  CTA_WHATSAPP_LABEL,
  accessNotice,
  whatsappUrl,
  type AccessNoticeKind,
} from './landingContent';

// Banner (não modal) no topo da landing, para quem autenticou mas não entrou.
// Antes disso o usuário era deslogado em silêncio (App.tsx: só um console.warn)
// e voltava para cá achando que o botão de login estava quebrado.
//
// Sem `notice` — o caso normal — devolve null e a landing fica idêntica.
export function AccessNotice({
  notice,
  onDismiss,
}: {
  notice?: string | null;
  onDismiss?: () => void;
}) {
  // Estreita a string vinda do App para uma chave conhecida. Chave desconhecida
  // não renderiza nada em vez de quebrar a tela de login.
  const kind =
    notice && notice in accessNotice ? (notice as AccessNoticeKind) : null;

  if (!kind) return null;

  return (
    <div
      role="status"
      style={{
        background: 'var(--warning-subtle)',
        borderBottom: '1px solid var(--border-strong)',
        padding: 'var(--space-3) var(--space-4)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <span
          aria-hidden="true"
          style={{ color: 'var(--warning)', fontSize: 18, lineHeight: 1 }}
        >
          ⚠
        </span>

        <p
          style={{
            margin: 0,
            flex: '1 1 280px',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.5,
          }}
        >
          {accessNotice[kind]}
        </p>

        <a
          href={whatsappUrl(kind)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
            padding: '0 var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--accent)',
            color: 'var(--accent-foreground)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {CTA_WHATSAPP_LABEL}
        </a>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dispensar aviso"
          style={{
            width: 44,
            height: 44,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 20,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
