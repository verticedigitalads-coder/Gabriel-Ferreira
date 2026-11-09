import { ArrowRight } from 'lucide-react';
import { frentes } from './landingContent';

// Três frentes (visual dos cards da ds2, sem mini-tela): número, título, texto e
// rótulos reais do app. O card do meio é claro (.lp-claro). Herda o id="features"
// do bloco anterior: é o destino de "Ver funcionalidades" (hero) e
// "Funcionalidades" (rodapé). O "Produto" do nav aponta para #produto (R3).
export function LandingFrentes() {
  return (
    <section id="features" className="lp-v2 lp-frentes">
      <div className="lp-wrap">
        <div className="lp-frentes-head">
          <div>
            <span className="lp-mono lp-eyebrow">{frentes.eyebrow}</span>
            <h2 className="lp-frentes-titulo">
              {frentes.titulo}{' '}<span className="lp-serif">{frentes.tituloDestaque}</span>
            </h2>
          </div>
          <p className="lp-frentes-sub">{frentes.subtitulo}</p>
        </div>
        <div className="lp-frentes-grid">
          {frentes.items.map((f, i) => (
            <article key={f.n} className={`lp-frente lp-reveal${i === 1 ? ' lp-claro' : ''}`}>
              <div className="lp-frente-topo">
                <span className="lp-mono lp-frente-n">{f.n}</span>
                <span className="lp-frente-filete" aria-hidden="true" />
                <span className="lp-mono lp-frente-label">{f.label}</span>
              </div>
              <h3 className="lp-frente-titulo">
                {f.titulo}{' '}<span className="lp-serif">{f.destaque}</span>
              </h3>
              <p className="lp-frente-desc">{f.desc}</p>
              <ul className="lp-frente-chips">
                {f.chips.map((c, j) => (
                  <li key={c}>
                    {f.fluxo && j > 0 && <ArrowRight size={12} strokeWidth={1.75} aria-hidden="true" />}
                    <span className="lp-mono lp-chip">{c}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
