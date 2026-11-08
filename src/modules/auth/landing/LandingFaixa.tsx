import { Asterisk } from 'lucide-react';
import { faixa } from './landingContent';

// Faixa laranja logo abaixo do hero. Dois grupos iguais + translateX(-50%) no CSS
// fecham o loop sem salto; cada grupo repete a lista 3x para cobrir telas largas.
// Decorativa: aria-hidden no bloco todo.
const LINHA = [...faixa.itens, ...faixa.itens, ...faixa.itens];

export function LandingFaixa() {
  return (
    <div className="lp-faixa lp-v2" aria-hidden="true">
      <div className="lp-faixa-track">
        {[0, 1].map(grupo => (
          <div key={grupo} className="lp-faixa-grupo">
            {LINHA.map((item, i) => (
              <span key={i} className="lp-faixa-item">
                <Asterisk size={12} strokeWidth={2} />
                <span className="lp-mono">{item}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
