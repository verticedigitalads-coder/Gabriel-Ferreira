import { Asterisk } from 'lucide-react';
import { TESTIMONIALS_VISIVEIS, clientes } from './landingContent';

// Depoimentos reais (visual da citação grande do Proof da v4.1). A frase sai
// literal, sem trecho destacado, sem número, sem logo e sem avatar; a legenda
// mostra só dados reais do TESTIMONIALS. Mesma guarda do bloco anterior: sem
// depoimento com frase preenchida, a seção não aparece.
export function LandingDepoimentos() {
  if (!TESTIMONIALS_VISIVEIS.length) return null;

  return (
    <section id="clientes" className="lp-v2 lp-dep">
      <div className="lp-wrap">
        <span className="lp-mono lp-eyebrow">{clientes.eyebrow}</span>
        <h2 className="lp-dep-titulo">{clientes.title}</h2>
        <div className="lp-dep-grid">
          {TESTIMONIALS_VISIVEIS.map(t => (
            <figure key={t.empresa} className="lp-dep-item lp-reveal">
              <Asterisk size={28} strokeWidth={1.75} aria-hidden="true" />
              <blockquote className="lp-serif lp-dep-frase">“{t.frase}”</blockquote>
              <figcaption className="lp-dep-legenda">
                <span className="lp-dep-autor">
                  {t.autor && <>{t.autor} · </>}
                  <span className="lp-dep-empresa">{t.empresa}</span>
                </span>
                <span className="lp-mono">
                  {t.nicho} · {t.cidade} ·{' '}
                  <span className="lp-dep-desde">{clientes.desdeLabel} {t.desde}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
