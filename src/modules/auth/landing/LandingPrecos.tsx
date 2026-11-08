import { CTA_WHATSAPP_LABEL, PRICING, precos, whatsappUrl } from './landingContent';

// Preço do plano Básico. Só layout: o valor vem de PRICING.basico.precoMensal e o
// resto da copy de `precos` (landingContent.ts). O plano Completo não é exibido.
export function LandingPrecos() {
  return (
    <section id="precos" style={{ padding: 'calc(var(--space-12) * 2) 0' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto var(--space-12)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--text-sm)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--space-3)', display: 'inline-block' }}>{precos.eyebrow}</span>
          <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{precos.title}</h2>
        </div>
        <div className="lp-reveal" style={{ maxWidth: 480, margin: '0 auto', background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: 14, padding: 'var(--space-8) var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xl)', fontWeight: 600 }}>{precos.moeda}</span>
            <span style={{ color: 'var(--text-primary)', fontSize: 'clamp(48px,8vw,64px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{PRICING.basico.precoMensal}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-md)' }}>{precos.periodo}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', margin: 'var(--space-6) 0' }} />
          <h3 style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 var(--space-4)' }}>{precos.incluiTitulo}</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--space-3)' }}>
            {precos.inclui.map(item => (
              <li key={item} style={{ display: 'flex', gap: 'var(--space-3)', color: 'var(--text-primary)', fontSize: 'var(--text-md)', lineHeight: 1.5 }}>
                <span aria-hidden="true" style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a href={whatsappUrl('precos')} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-primary lp-btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-8)' }}>
            {CTA_WHATSAPP_LABEL}
          </a>
        </div>
      </div>
    </section>
  );
}
