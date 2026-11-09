import { ArrowUpRight, Plus } from 'lucide-react';
import { duvidas, whatsappUrl } from './landingContent';
import { abrirContato } from './LandingContato';

// Dúvidas (visual do FAQ da v4.1), seção clara (.lp-claro). Acordeão com
// <details>/<summary> nativos: teclado e leitor de tela sem JS, e o `name` em
// comum faz abrir uma pergunta por vez. O número é aria-hidden para o nome
// acessível ficar só a pergunta. O .lp-reveal fica no bloco da lista, nunca dentro
// de um <details>: fechado, o useScrollReveal nunca dispararia e a resposta abriria
// com opacity 0. O link do CTA tem classe própria porque o .lp-textlink pinta com
// --text-primary, que some no fundo claro.
export function LandingDuvidas() {
  return (
    <section id="duvidas" className="lp-v2 lp-claro lp-faq">
      <div className="lp-wrap lp-faq-grid">
        <div className="lp-faq-head">
          <span className="lp-mono lp-eyebrow">{duvidas.eyebrow}</span>
          <h2 className="lp-faq-titulo">
            {duvidas.titulo}{' '}<span className="lp-serif">{duvidas.destaque}</span>
          </h2>
          <div className="lp-faq-cta">
            <span className="lp-mono">{duvidas.ctaTexto}</span>
            <a href={whatsappUrl('faq')} target="_blank" rel="noopener noreferrer" className="lp-faq-link" onClick={abrirContato}>
              <span>{duvidas.ctaLabel}</span>
              <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="lp-faq-lista lp-reveal">
          {duvidas.items.map((d, i) => (
            <details key={d.pergunta} name="duvidas" open={i === 0} className="lp-faq-item">
              <summary>
                <span className="lp-mono lp-faq-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="lp-faq-pergunta">{d.pergunta}</span>
                <span className="lp-faq-mais" aria-hidden="true"><Plus size={14} strokeWidth={1.75} /></span>
              </summary>
              <p className="lp-faq-resposta">{d.resposta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
