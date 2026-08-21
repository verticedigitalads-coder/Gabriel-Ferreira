import { features } from './landingContent';

export function LandingFeatures() {
  return (
    <section id="features" style={{ padding: '96px 0' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 56px' }}>
          <span style={{ color: '#ff6a00', fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, display: 'inline-block' }}>{features.eyebrow}</span>
          <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 14 }}>{features.title}</h2>
          <p style={{ fontSize: 17, color: '#b8bcc7', lineHeight: 1.6 }}>{features.subtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
          {features.items.map(f => (
            <div key={f.title} className={`lp-feat lp-reveal ${f.hi ? 'highlight' : ''}`}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: f.iconBg, color: f.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, fontSize: 20 }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#b8bcc7', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              <span style={{ display: 'inline-block', marginTop: 14, padding: '3px 10px', borderRadius: 99, background: '#222633', color: '#7a7f8c', fontSize: 11, fontWeight: 600 }}>{f.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
