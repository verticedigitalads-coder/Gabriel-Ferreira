import { useState } from 'react';
import { segmentos } from './landingContent';

// Segmentos (visual da lista grande da ds2). No celular é uma lista estática: sem
// foto e sem estado (o destaque da linha ativa só existe a partir de 1024px, no
// CSS). No desktop, o painel ao lado mostra a foto do segmento sob o mouse, ou só
// o nome quando o segmento não tem `foto`. O painel é aria-hidden porque repete o
// nome da lista e a foto é decorativa. As imagens são lazy dentro de um painel com
// display:none no celular, então nem baixam lá. O .lp-reveal fica na lista, que é
// visível em todas as larguras, e nunca no painel.
export function LandingSegmentos() {
  const [ativo, setAtivo] = useState(0);

  return (
    <section id="segmentos" className="lp-v2 lp-seg">
      <div className="lp-wrap">
        <span className="lp-mono lp-eyebrow">{segmentos.eyebrow}</span>
        <h2 className="lp-seg-titulo">
          {segmentos.titulo}{' '}<span className="lp-serif">{segmentos.destaque}</span>
        </h2>
        <div className="lp-seg-grid">
          <div className="lp-reveal">
            <ul className="lp-seg-lista">
              {segmentos.items.map((s, i) => (
                <li
                  key={s.nome}
                  className={`lp-seg-item${i === ativo ? ' is-ativo' : ''}`}
                  onMouseEnter={() => setAtivo(i)}
                >
                  <span className="lp-mono lp-seg-n">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="lp-seg-nome">{s.nome}</h3>
                    <p className="lp-seg-frase">{s.frase}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="lp-mono lp-seg-nota">{segmentos.nota}</p>
          </div>
          <div className="lp-seg-painel" aria-hidden="true">
            {segmentos.items.map((s, i) =>
              s.foto ? (
                <img
                  key={s.nome}
                  className={`lp-seg-foto${i === ativo ? ' is-ativo' : ''}`}
                  src={s.foto}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : null,
            )}
            <div className="lp-seg-legenda">
              <span className="lp-mono">{String(ativo + 1).padStart(2, '0')}</span>
              <span className="lp-seg-legenda-nome">{segmentos.items[ativo].nome}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
