import { hero } from './landingContent';
import { HeroMockup } from './HeroMockup';

export function LandingHero() {
  return (
    <section className="lp-hero">
      <div className="lp-container">
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
          <span className="lp-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,106,0,0.12)', color: '#ff6a00', fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,106,0,0.25)', marginBottom: 24 }}>
            {hero.badge}
          </span>
          <h1 className="lp-fade lp-d1" style={{ fontSize: 'clamp(34px,5.5vw,64px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20 }}>
            {hero.titleLine1}<br /><span className="lp-grad">{hero.titleHighlight}</span>
          </h1>
          <p className="lp-fade lp-d2" style={{ fontSize: 'clamp(16px,1.6vw,19px)', color: '#b8bcc7', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.6 }}>
            {hero.subtitle}
          </p>
          <div className="lp-fade lp-d3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={hero.ctaPrimary.href} className="lp-btn lp-btn-primary lp-btn-lg">{hero.ctaPrimary.label}</a>
            <a href={hero.ctaSecondary.href} className="lp-btn lp-btn-ghost lp-btn-lg">{hero.ctaSecondary.label}</a>
          </div>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}
