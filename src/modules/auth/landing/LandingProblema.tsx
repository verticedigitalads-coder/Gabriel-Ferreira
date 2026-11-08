import { Check } from 'lucide-react';
import { problema } from './landingContent';

// Seção clara "O problema real" (visual do Manifesto da v4.1, sem o card de custo).
// As cores moram em .lp-claro (landingStyles.tsx): fundo claro sem token próprio,
// tinta --bg-app e laranja de texto escurecido para passar contraste. Os {' '}
// entre os pedaços do <h2> mantêm o texto corrido para leitor de tela.
export function LandingProblema() {
  return (
    <section className="lp-v2 lp-claro lp-prob">
      <div className="lp-wrap">
        <span className="lp-mono lp-eyebrow">{problema.eyebrow}</span>
        <h2 className="lp-prob-titulo lp-reveal">
          {problema.titulo1}{' '}
          <span className="lp-serif lp-prob-destaque">{problema.tituloDestaque}</span>{' '}
          <span className="lp-prob-l2">
            <span className="lp-prob-apagado">{problema.tituloApagado}</span>{' '}
            {problema.tituloFim}
          </span>
        </h2>
        <div className="lp-prob-comp lp-reveal">
          <div className="lp-prob-col lp-prob-antes">
            <span className="lp-mono lp-prob-rotulo">{problema.antesLabel}</span>
            <ul className="lp-prob-lista">
              {problema.antes.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="lp-prob-col lp-prob-com">
            <span className="lp-mono lp-prob-rotulo lp-prob-selo">{problema.comLabel}</span>
            <ul className="lp-prob-lista">
              {problema.com.map(item => (
                <li key={item}>
                  <Check size={14} strokeWidth={2} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
