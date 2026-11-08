import {
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { features, type FeatureIconKey } from './landingContent';

const FEATURE_ICONS: Record<FeatureIconKey, LucideIcon> = {
  leads: Target,
  orcamentos: FileText,
  dashboard: LayoutDashboard,
  operacional: CalendarDays,
  financeiro: Wallet,
  workspace: Building2,
};

export function LandingFeatures() {
  return (
    <section id="features" style={{ padding: '96px 0' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 56px' }}>
          <span style={{ color: '#ff6a00', fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, display: 'inline-block' }}>{features.eyebrow}</span>
          <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 14 }}>{features.title}</h2>
          <p style={{ fontSize: 17, color: '#b8bcc7', lineHeight: 1.6 }}>{features.subtitle}</p>
        </div>
        <div className="lp-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
          {features.items.map(f => {
            const Icon = FEATURE_ICONS[f.icon];
            return (
              <div key={f.title} className={`lp-feat lp-reveal ${f.hi ? 'highlight' : ''}`}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, flexShrink: 0 }}>
                  <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: '#b8bcc7', fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>{f.desc}</p>
                <span style={{ display: 'inline-block', alignSelf: 'flex-start', marginTop: 'auto', padding: '3px 10px', borderRadius: 99, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>{f.tag}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
