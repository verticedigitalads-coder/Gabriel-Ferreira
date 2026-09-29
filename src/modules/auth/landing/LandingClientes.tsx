import { TESTIMONIALS_VISIVEIS, clientes } from './landingContent';

// Prova social entre o hero e as funcionalidades. Guarda: sem depoimento com
// frase preenchida, devolve null — a página nunca vai ao ar com card em branco.
// O link "Clientes" do nav segue a mesma guarda (landingContent.ts).
export function LandingClientes() {
  if (!TESTIMONIALS_VISIVEIS.length) return null;

  return (
    <section id="clientes" style={{ padding: 'calc(var(--space-12) * 2) 0 0' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto var(--space-12)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--text-sm)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--space-3)', display: 'inline-block' }}>{clientes.eyebrow}</span>
          <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{clientes.title}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 'var(--space-5)' }}>
          {TESTIMONIALS_VISIVEIS.map(t => (
            <figure key={t.empresa} className="lp-reveal" style={{ margin: 0, background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: 'var(--space-8) var(--space-6)' }}>
              <blockquote style={{ margin: 0, color: 'var(--text-primary)', fontSize: 'var(--text-lg)', lineHeight: 1.6 }}>“{t.frase}”</blockquote>
              <figcaption style={{ marginTop: 'var(--space-5)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--text-md)' }}>{t.empresa}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                  {t.nicho} · {t.cidade} · cliente desde {t.desde}
                </div>
                {t.metrica && (
                  <span style={{ display: 'inline-block', marginTop: 'var(--space-3)', padding: '3px 10px', borderRadius: 99, background: 'var(--accent-subtle)', color: 'var(--accent)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>{t.metrica}</span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
