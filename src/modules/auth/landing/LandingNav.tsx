import { ArrowUpRight } from 'lucide-react';
import { CTA_WHATSAPP_LABEL, nav, whatsappUrl } from './landingContent';

// Nav da v4.1. Links só a partir de 1024px; o botão de WhatsApp só a partir de
// 640px (no celular o CTA do hero e a LandingDock fazem esse papel). "Entrar"
// aparece em todas as larguras.
export function LandingNav() {
  return (
    <nav className="lp-nav lp-v2" aria-label="Navegação principal">
      <div className="lp-wrap lp-nav-inner">
        <a href="#" className="lp-logo">
          <span className="lp-logo-mark" aria-hidden="true">{nav.brandInitial}</span>
          <span>
            {nav.brand}{' '}<span className="lp-logo-suffix">{nav.brandSuffix}</span>
          </span>
        </a>
        <div className="lp-nav-links">
          {nav.links.map(link => (
            <a key={link.href} href={link.href} className="lp-nav-link">{link.label}</a>
          ))}
        </div>
        <div className="lp-nav-actions">
          <a href={nav.ctaLogin.href} className="lp-nav-link">{nav.ctaLogin.label}</a>
          <a href={whatsappUrl('nav')} target="_blank" rel="noopener noreferrer" className="lp-cta lp-nav-cta">
            <span>{CTA_WHATSAPP_LABEL}</span>
            <span className="lp-cta-seta" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={1.75} /></span>
          </a>
        </div>
      </div>
    </nav>
  );
}
