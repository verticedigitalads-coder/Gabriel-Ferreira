import { celular } from './landingContent';

// Telas reais do app dentro de molduras de celular feitas em CSS. A copy e as
// imagens moram em landingContent.ts; o layout (carrossel no mobile, 3 colunas
// no desktop) mora em landingStyles.tsx (.lp-phones*), porque style inline não
// tem media query. A moldura do aparelho mantém o raio; o resto é reto (.lp-v2).
export function LandingCelular() {
  return (
    <section id="celular" className="lp-v2 lp-cel">
      <div className="lp-wrap">
        <span className="lp-mono lp-eyebrow">{celular.eyebrow}</span>
        <h2 className="lp-cel-titulo">
          {celular.title}{' '}<span className="lp-serif">{celular.titleDestaque}</span>
        </h2>
        <div className="lp-phones lp-reveal">
          {celular.items.map(i => (
            <figure key={i.id} className={`lp-phone lp-phone-${i.id}`}>
              <div className="lp-phone-frame">
                <img src={i.src} alt={i.alt} width={780} height={1691} loading="lazy" decoding="async" />
              </div>
              <figcaption>{i.legenda}</figcaption>
            </figure>
          ))}
        </div>
        <p className="lp-mono lp-cel-pwa">{celular.pwa}</p>
      </div>
    </section>
  );
}
