import { howItWorks } from './landingContent';

export function LandingHowItWorks() {
  return (
    <section id="how" style={{ padding: '96px 0', background: '#161922' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 56px' }}>
          <span style={{ color: '#ff6a00', fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, display: 'inline-block' }}>{howItWorks.eyebrow}</span>
          <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{howItWorks.title}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24 }}>
          {howItWorks.steps.map(s => (
            <div key={s.n} className="lp-step lp-reveal">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ff6a00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, boxShadow: '0 8px 24px -8px rgba(255,106,0,0.35)', marginBottom: 18 }}>{s.n}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{s.t}</h3>
              <p style={{ color: '#b8bcc7', fontSize: 14, lineHeight: 1.6 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
