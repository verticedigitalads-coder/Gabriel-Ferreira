import { ArrowUpRight, Check } from 'lucide-react';
import { CTA_WHATSAPP_LABEL, PRICING, precos, whatsappUrl } from './landingContent';
import { abrirContato } from './LandingContato';

// Preço (visual do Offer da v4.1, um card só). Só layout: o valor vem de
// PRICING.basico.precoMensal e o resto da copy de `precos` (landingContent.ts).
// O plano Completo não é exibido e não há card "sob medida". A base do card é um
// <div>, não <footer>: a LandingDock trata o primeiro <footer> da página como o
// rodapé.
export function LandingPrecos() {
  return (
    <section id="precos" className="lp-v2 lp-preco">
      <div className="lp-wrap lp-preco-grid">
        <div>
          <span className="lp-mono lp-eyebrow">{precos.eyebrow}</span>
          <h2 className="lp-preco-titulo">
            {precos.title}{' '}<span className="lp-serif">{precos.titleDestaque}</span>
          </h2>
        </div>
        <div className="lp-preco-card lp-reveal">
          <div className="lp-preco-corpo">
            <div className="lp-preco-valor">
              <span className="lp-preco-moeda">{precos.moeda}</span>
              <span className="lp-preco-num">{PRICING.basico.precoMensal}</span>
              <span className="lp-preco-periodo">{precos.periodo}</span>
            </div>
            <div className="lp-preco-inclui">
              <h3 className="lp-mono lp-preco-rotulo">{precos.incluiTitulo}</h3>
              <ul className="lp-preco-lista">
                {precos.inclui.map(item => (
                  <li key={item}>
                    <Check size={14} strokeWidth={2} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="lp-preco-base">
            <a href={whatsappUrl('precos')} target="_blank" rel="noopener noreferrer" className="lp-cta lp-preco-cta" onClick={abrirContato}>
              <span>{CTA_WHATSAPP_LABEL}</span>
              <span className="lp-cta-seta" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={1.75} /></span>
            </a>
            <ul className="lp-preco-selos">
              {precos.selos.map(selo => (
                <li key={selo}>
                  <Check size={14} strokeWidth={2} aria-hidden="true" />
                  <span className="lp-mono">{selo}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
