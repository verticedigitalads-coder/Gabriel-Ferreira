import { automacoes } from './landingContent';

// Automações reais (visual do stepper do Process da v4.1, em versão estática):
// cabeçalho à esquerda e as 4 num trilho vertical numerado. São gatilhos
// independentes, não etapas em sequência: sem barra de progresso nem "etapa X de
// 4". Só layout: a copy e a lista (somente o que está ATIVO e validado) moram em
// landingContent.ts.
export function LandingAutomacoes() {
  return (
    <section id="automacoes" className="lp-v2 lp-auto">
      <div className="lp-wrap lp-auto-grid">
        <div className="lp-auto-head">
          <span className="lp-mono lp-eyebrow">{automacoes.eyebrow}</span>
          <h2 className="lp-auto-titulo">
            {automacoes.title}{' '}<span className="lp-serif">{automacoes.titleDestaque}</span>
          </h2>
          <p className="lp-auto-sub">{automacoes.subtitle}</p>
        </div>
        <ol className="lp-auto-trilho">
          {automacoes.items.map((a, i) => (
            <li key={a.quando} className="lp-auto-item lp-reveal">
              <span className="lp-mono lp-auto-n">{String(i + 1).padStart(2, '0')}</span>
              <div className="lp-auto-corpo">
                <span className="lp-mono lp-auto-rotulo">{automacoes.quandoLabel}</span>
                <h3 className="lp-auto-gatilho">{a.quando}</h3>
                <span className="lp-mono lp-auto-rotulo lp-auto-rotulo-vrtx">{automacoes.vrtxLabel}</span>
                <p className="lp-auto-acao">{a.vrtx}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
