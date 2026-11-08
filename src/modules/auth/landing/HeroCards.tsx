import { QrCode } from 'lucide-react';
import { heroCards, type PrioridadeIlustrativa } from './landingContent';

// Cartões ILUSTRATIVOS do hero (dados fictícios em landingContent.heroCards).
// As cores de prioridade são as da lista de Leads do app (LeadsList.tsx).
const BADGE: Record<PrioridadeIlustrativa, string> = {
  critico: 'lp-badge-critico',
  alto: 'lp-badge-alto',
  medio: 'lp-badge-medio',
};

// "Cliente A" -> "CA"
const iniciais = (nome: string) => nome.split(' ').map(p => p[0]).join('');

export function HeroCards() {
  const { leads, orcamento } = heroCards;

  return (
    <div className="lp-hero-cards lp-fade lp-d4">
      <div className="lp-card lp-card-leads">
        <div className="lp-card-head">
          <span className="lp-mono">{leads.titulo}</span>
          <span className="lp-mono lp-card-tag">{heroCards.selo}</span>
        </div>
        {leads.itens.map(l => (
          <div key={l.nome} className="lp-lead">
            <span className="lp-lead-ini lp-mono" aria-hidden="true">{iniciais(l.nome)}</span>
            <span className="lp-lead-txt">
              <span className="lp-lead-nome">{l.nome}</span>
              <span className="lp-lead-serv">{l.servico}</span>
            </span>
            <span className={`lp-badge ${BADGE[l.prioridade]}`}>{heroCards.prioridades[l.prioridade]}</span>
          </div>
        ))}
      </div>

      <div className="lp-card lp-card-orc">
        <div className="lp-orc-head">
          <div>
            <span className="lp-orc-titulo">{orcamento.titulo}</span>
            <span className="lp-mono">{orcamento.numero}</span>
          </div>
          <span className="lp-mono lp-orc-tag">{heroCards.selo}</span>
        </div>
        <span className="lp-orc-cliente">
          <span className="lp-mono">{orcamento.clienteLabel}</span> {orcamento.cliente}
        </span>
        <ul className="lp-orc-itens">
          {orcamento.itens.map(i => (
            <li key={i.desc}><span>{i.desc}</span><span>{i.valor}</span></li>
          ))}
        </ul>
        <div className="lp-orc-total">
          <span className="lp-mono">{orcamento.totalLabel}</span>
          <strong>{orcamento.total}</strong>
        </div>
        <div className="lp-orc-pix">
          <QrCode size={14} strokeWidth={1.75} aria-hidden="true" />
          {orcamento.pix}
        </div>
      </div>
    </div>
  );
}
