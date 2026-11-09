import { useRef, useState, type KeyboardEvent } from 'react';
import { produto } from './landingContent';

// Produto em abas (abas + moldura de navegador da ds2) com prints reais do
// desktop. Abas no padrão WAI-ARIA: ←/→ trocam de aba (com volta) e levam o foco
// junto; sem rotação automática. Painéis inativos com `hidden`: a imagem lazy de
// cada um só baixa quando a aba abre. O .lp-reveal fica no palco, sempre visível:
// dentro de um painel escondido o useScrollReveal nunca dispararia e o painel
// ficaria com opacity 0 ao abrir.
export function LandingProduto() {
  const [ativa, setAtiva] = useState(0);
  const abasRef = useRef<(HTMLButtonElement | null)[]>([]);
  const total = produto.abas.length;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const prox = (ativa + (e.key === 'ArrowRight' ? 1 : -1) + total) % total;
    setAtiva(prox);
    abasRef.current[prox]?.focus();
  };

  return (
    <section id="produto" className="lp-v2 lp-prod" aria-labelledby="produto-titulo">
      <div className="lp-wrap">
        <span className="lp-mono lp-eyebrow">{produto.eyebrow}</span>
        <h2 id="produto-titulo" className="lp-prod-titulo">
          {produto.titulo}{' '}<span className="lp-serif">{produto.destaque}</span>
        </h2>
        <div role="tablist" aria-label={produto.abasLabel} className="lp-prod-abas" onKeyDown={onKeyDown}>
          {produto.abas.map((a, i) => (
            <button
              key={a.id}
              ref={el => { abasRef.current[i] = el; }}
              type="button"
              role="tab"
              id={`produto-aba-${a.id}`}
              aria-selected={i === ativa}
              aria-controls={`produto-painel-${a.id}`}
              tabIndex={i === ativa ? 0 : -1}
              onClick={() => setAtiva(i)}
              className="lp-mono lp-prod-aba"
            >
              <span className="lp-prod-aba-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              {a.label}
            </button>
          ))}
        </div>
        <div className="lp-prod-palco lp-reveal">
          {produto.abas.map((a, i) => (
            <div
              key={a.id}
              role="tabpanel"
              id={`produto-painel-${a.id}`}
              aria-labelledby={`produto-aba-${a.id}`}
              tabIndex={0}
              hidden={i !== ativa}
              className="lp-prod-painel"
            >
              <p className="lp-prod-frase">{a.frase}</p>
              <div className="lp-prod-moldura">
                <div className="lp-prod-barra">
                  <span className="lp-prod-bolinhas" aria-hidden="true"><span /><span /><span /></span>
                  <span className="lp-mono lp-prod-url">{produto.url}</span>
                  <span className="lp-mono lp-prod-nota">{produto.nota}</span>
                </div>
                <img src={a.src} alt={a.alt} width={produto.largura} height={produto.altura} loading="lazy" decoding="async" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
