import { automacoes } from './landingContent';

// Automações reais do app, em cartões "Quando você X → o VRTX Y". Só layout:
// a copy e a lista (somente o que está ATIVO e validado) moram em landingContent.ts.
export function LandingAutomacoes() {
  return (
    <section id="automacoes" style={{ padding: 'calc(var(--space-12) * 2) 0', background: 'var(--bg-sidebar)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto var(--space-12)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--text-sm)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--space-3)', display: 'inline-block' }}>{automacoes.eyebrow}</span>
          <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 'var(--space-3)' }}>{automacoes.title}</h2>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{automacoes.subtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 'var(--space-5)' }}>
          {automacoes.items.map(a => (
            <article key={a.quando} className="lp-reveal" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{automacoes.quandoLabel}</div>
                <div className="lp-auto-quando" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)', fontWeight: 700, lineHeight: 1.35, marginTop: 'var(--space-1)' }}>{a.quando}</div>
              </div>
              <div aria-hidden="true" style={{ color: 'var(--accent)', fontSize: 'var(--text-xl)', lineHeight: 1 }}>↓</div>
              <div>
                <div style={{ color: 'var(--accent)', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{automacoes.vrtxLabel}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: 1.6, margin: 'var(--space-1) 0 0' }}>{a.vrtx}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
