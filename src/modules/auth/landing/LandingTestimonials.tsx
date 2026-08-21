import { testimonials } from './landingContent';

export function LandingTestimonials() {
  return (
    <section id="testi" style={{ padding: '96px 0' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 56px' }}>
          <span style={{ color: '#ff6a00', fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, display: 'inline-block' }}>{testimonials.eyebrow}</span>
          <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{testimonials.title}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
          {testimonials.items.map(t => (
            <div key={t.n} className="lp-testi lp-reveal">
              <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                {[1,2,3,4,5].map(s => <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="#ff6a00"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
              </div>
              <blockquote style={{ fontSize: 15, color: '#f4f5f7', lineHeight: 1.65, flex: 1, marginBottom: 20 }}>{t.q}</blockquote>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.g, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14 }}>{t.i}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.n}</div>
                  <div style={{ color: '#7a7f8c', fontSize: 12 }}>{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
