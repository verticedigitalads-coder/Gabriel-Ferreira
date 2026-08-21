import { mockup } from './landingContent';

export function HeroMockup() {
  return (
    <div className="lp-fade lp-d4" style={{ marginTop: 64, perspective: 1400 }}>
      <div style={{ background: 'linear-gradient(180deg,#1a1d27,#13161e)', border: '1px solid #363b4a', borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6),0 60px 120px -30px rgba(255,106,0,0.35)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid #262a36', background: 'rgba(0,0,0,0.2)' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28ca42' }} />
          <span style={{ marginLeft: 16, fontSize: 12, color: '#7a7f8c', background: '#222633', padding: '5px 12px', borderRadius: 6 }}>{mockup.url}</span>
          <span style={{ fontSize: 11, color: '#7a7f8c', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}><span className="lp-live-dot" /> {mockup.liveLabel}</span>
        </div>
        <div className="lp-mockup-body" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 420 }}>
          <aside className="lp-mockup-side" style={{ background: '#13161e', borderRight: '1px solid #262a36', padding: '18px 12px', fontSize: 13 }}>
            {mockup.sidebarItems.map((item, i) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 6, color: i === 0 ? '#ff6a00' : '#7a7f8c', background: i === 0 ? 'rgba(255,106,0,0.12)' : 'transparent', fontWeight: i === 0 ? 600 : 400, marginBottom: 2 }}>{item}</div>
            ))}
          </aside>
          <div style={{ padding: 24, overflow: 'hidden' }}>
            <h3 style={{ fontSize: 18, marginBottom: 6, letterSpacing: '-0.02em' }}>{mockup.title}</h3>
            <div style={{ fontSize: 12, color: '#7a7f8c', marginBottom: 18 }}>{mockup.subtitle}</div>
            <div className="lp-stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
              {mockup.stats.map(s => (
                <div key={s.l} style={{ background: '#222633', padding: 12, borderRadius: 8, border: '1px solid #262a36' }}>
                  <div style={{ fontSize: 10, color: '#7a7f8c', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#7a7f8c', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>{mockup.focusLabel}</div>
            {mockup.leads.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: '#222633', border: '1px solid #262a36', borderTop: `3px solid ${l.c}`, marginBottom: 6, fontSize: 12 }}>
                <span style={{ flex: 1, fontWeight: 600 }}>{l.n}</span>
                <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: l.bc, color: l.c }}>{l.p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
