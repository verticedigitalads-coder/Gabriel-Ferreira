import { ArrowUpRight, Asterisk } from 'lucide-react';
import { CTA_WHATSAPP_LABEL, footer, hero, whatsappUrl } from './landingContent';
import { HeroCards } from './HeroCards';
import { abrirContato } from './LandingContato';

// Hero: tipografia da v4.1 + cards e bloco CTA lateral da ds2. O layout mora em
// landingStyles.tsx (.lp-hero-*): a partir de 1024px fica título | cards com a barra
// de 3 colunas embaixo; no celular é uma coluna, com o CTA antes dos fatos e dos
// cards. Os {' '} entre as linhas do <h1> mantêm o texto corrido para leitor de tela.
export function LandingHero() {
  return (
    <section className="lp-hero lp-v2">
      <div className="lp-wrap lp-hero-grid">
        <div className="lp-hero-meta">
          <span className="lp-mono lp-hero-meta-tag">
            <Asterisk size={12} strokeWidth={2} aria-hidden="true" />
            {hero.meta}
          </span>
          <span className="lp-mono lp-hero-meta-local">{footer.local}</span>
        </div>

        <h1 className="lp-hero-title">
          <span className="lp-hero-l1 lp-fade">{hero.title1}</span>{' '}
          <span className="lp-hero-rule lp-fade lp-d1" aria-hidden="true" />
          <span className="lp-hero-word lp-serif lp-fade lp-d1">{hero.titleWord}</span>{' '}
          <span className="lp-hero-l3 lp-fade lp-d2">{hero.title2}</span>{' '}
          <span className="lp-hero-l4 lp-fade lp-d3">
            {hero.title3}{' '}<span className="lp-hero-end lp-serif">{hero.titleEnd}</span>
          </span>
        </h1>

        <div className="lp-hero-bar lp-fade lp-d4">
          <div className="lp-hero-sub">
            <p>{hero.subtitle}</p>
            <a href={hero.ctaSecondary.href} className="lp-textlink">
              <span>{hero.ctaSecondary.label}</span>
              <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
            </a>
          </div>
          <ul className="lp-hero-fatos">
            {hero.fatos.map(f => <li key={f}>{f}</li>)}
          </ul>
          <div className="lp-hero-cta">
            <a href={whatsappUrl('hero')} target="_blank" rel="noopener noreferrer" className="lp-cta-big" onClick={abrirContato}>
              {CTA_WHATSAPP_LABEL}
              <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden="true" />
            </a>
            <span className="lp-mono">{hero.ctaNota} {footer.whatsappLabel}</span>
          </div>
        </div>

        <HeroCards />
      </div>
    </section>
  );
}
