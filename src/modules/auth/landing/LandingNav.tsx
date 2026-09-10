import { CTA_WHATSAPP_LABEL, nav, whatsappUrl } from './landingContent';

export function LandingNav() {
  return (
    <nav className="lp-nav">
      <div className="lp-nav-inner">
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 16, color: '#f4f5f7', textDecoration: 'none' }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#ff6a00,#ff8a3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px -4px rgba(255,106,0,0.35)', color: '#fff', fontSize: 14, fontWeight: 800 }}>{nav.brandInitial}</span>
          {nav.brand}{' '}<span style={{ color: '#7a7f8c', fontWeight: 500 }}>{nav.brandSuffix}</span>
        </a>
        <div className="lp-nav-links" style={{ display: 'flex', gap: 32, fontSize: 14, color: '#b8bcc7' }}>
          {nav.links.map(link => (
            <a key={link.href} href={link.href} style={{ color: 'inherit', textDecoration: 'none' }}>{link.label}</a>
          ))}
        </div>
        <div className="lp-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href={nav.ctaLogin.href} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 4px', color: '#b8bcc7', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>{nav.ctaLogin.label}</a>
          <a href={whatsappUrl('nav')} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-primary lp-nav-cta">{CTA_WHATSAPP_LABEL}</a>
        </div>
      </div>
    </nav>
  );
}
