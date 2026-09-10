import { CTA_WHATSAPP_LABEL, LEGAL_PATHS, loginCta, whatsappUrl } from './landingContent';

export function LandingLoginCta({ onLogin }: { onLogin: () => void }) {
  return (
    <section id="login" style={{ padding: '96px 0', background: 'radial-gradient(50% 80% at 50% 0%,rgba(255,106,0,0.18) 0%,transparent 60%),#0f1117', position: 'relative', overflow: 'hidden' }}>
      <div className="lp-container">
        <div id="acesso" className="lp-cta-card lp-reveal" style={{ maxWidth: 560, margin: '0 auto', background: '#1a1d27', border: '1px solid #363b4a', borderRadius: 20, padding: '48px 40px', textAlign: 'center', boxShadow: '0 40px 100px -30px rgba(0,0,0,0.6)' }}>
          <h2 style={{ fontSize: 'clamp(26px,3vw,34px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 14 }}>{loginCta.title}</h2>
          <p style={{ color: '#b8bcc7', fontSize: 16, marginBottom: 32, lineHeight: 1.55 }}>{loginCta.subtitle}</p>

          <a href={whatsappUrl('cta-final')} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-primary lp-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
            {CTA_WHATSAPP_LABEL}
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0', color: '#7a7f8c', fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#262a36' }} />
            {loginCta.dividerLabel}
            <div style={{ flex: 1, height: 1, background: '#262a36' }} />
          </div>

          <button onClick={onLogin} className="lp-google">
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.2-.1-2.3-.1-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.1 4.1-3.9 5.5l6.2 5.2C41.8 35.4 44 30 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
            {loginCta.googleLabel}
          </button>

          <p style={{ color: '#7a7f8c', fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
            {loginCta.legalPrefix}{' '}
            <a href={LEGAL_PATHS.termos} target="_blank" rel="noopener noreferrer" style={{ color: '#ff6a00', textDecoration: 'underline' }}>{loginCta.termsLabel}</a>{' '}
            {loginCta.legalAnd}{' '}
            <a href={LEGAL_PATHS.privacidade} target="_blank" rel="noopener noreferrer" style={{ color: '#ff6a00', textDecoration: 'underline' }}>{loginCta.privacyLabel}</a>.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 24, marginTop: 36, color: '#7a7f8c', fontSize: 13 }}>
            {loginCta.trust.map(item => (
              <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
