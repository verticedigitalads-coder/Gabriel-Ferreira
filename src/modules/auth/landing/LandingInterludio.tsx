import { ArrowUpRight } from 'lucide-react';
import { CTA_WHATSAPP_LABEL, footer, hero, interludio, whatsappUrl } from './landingContent';

// Interlúdio (visual do Manifesto da ds2): foto decorativa da forja sob véus de
// --bg-app (landingStyles.tsx, .lp-inter-*) e o título serif por cima. O botão
// abre o WhatsApp direto, sem formulário. A foto tem alt vazio porque não
// carrega informação; o sublinhado do destaque também é só enfeite.
// .lp-serif vai em cada span com texto, não no <h2>: o * do index.css reaplica
// a fonte sans em todo elemento filho.
export function LandingInterludio() {
  return (
    <section className="lp-v2 lp-inter">
      <img
        className="lp-inter-foto"
        src={interludio.foto}
        alt=""
        width={1248}
        height={832}
        loading="lazy"
        decoding="async"
      />
      <div className="lp-inter-linha" aria-hidden="true" />
      <div className="lp-wrap lp-inter-conteudo">
        <h2 className="lp-inter-titulo lp-reveal">
          <span className="lp-serif">{interludio.linha1}</span>{' '}
          <span className="lp-serif">
            {interludio.linha2}{' '}
            <span className="lp-serif lp-inter-destaque">
              {interludio.destaque}
              <svg viewBox="0 0 300 14" preserveAspectRatio="none" fill="none" aria-hidden="true">
                <path d="M2 9C70 3 150 2 298 7" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            </span>
            {interludio.fim}
          </span>
        </h2>
        <div className="lp-inter-cta lp-reveal">
          <a href={whatsappUrl('manifesto')} target="_blank" rel="noopener noreferrer" className="lp-cta-big">
            {CTA_WHATSAPP_LABEL}
            <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </a>
          <span className="lp-mono">{hero.ctaNota} {footer.whatsappLabel}</span>
        </div>
      </div>
    </section>
  );
}
