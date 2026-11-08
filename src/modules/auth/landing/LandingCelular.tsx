import { celular } from './landingContent';

// Telas reais do app dentro de molduras de celular feitas em CSS. A copy e as
// imagens moram em landingContent.ts; o layout (carrossel no mobile, 3 colunas
// no desktop) mora em landingStyles.tsx (.lp-phones*), porque style inline não
// tem media query.
export function LandingCelular() {
  return (
    <section id="celular" style={{ padding: 'calc(var(--space-12) * 2) 0', background: 'var(--bg-app)' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto var(--space-12)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--text-sm)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--space-3)', display: 'inline-block' }}>{celular.eyebrow}</span>
          <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{celular.title}</h2>
        </div>
        <div className="lp-phones lp-reveal">
          {celular.items.map(i => (
            <figure key={i.id} className={`lp-phone lp-phone-${i.id}`}>
              <div className="lp-phone-frame">
                <img src={i.src} alt={i.alt} width={780} height={1691} loading="lazy" decoding="async" />
              </div>
              <figcaption>{i.legenda}</figcaption>
            </figure>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-md)', margin: 'var(--space-8) 0 0' }}>{celular.pwa}</p>
      </div>
    </section>
  );
}
