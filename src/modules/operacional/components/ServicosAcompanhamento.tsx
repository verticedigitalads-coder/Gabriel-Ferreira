import type { Ref } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/utils/formatters';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { EmptyState } from '@/components/editorial/EmptyState';
import { statusConfig } from '../statusConfig';
import { StatusPills } from './StatusPills';
import { FAIXA_PRIORIDADE, ROTULO_PRIORIDADE } from './faixaPrioridade';

type Props = {
  ref?: Ref<HTMLElement>;
  index: string;
  servicos: any[];
  etapa: string | null;
  onLimpar: () => void;
};

const ETAPAS = Object.keys(statusConfig);

// Barra de 4 segmentos: laranja até a etapa atual (só visual)
function BarraEtapas({ status }: { status?: string | null }) {
  const atual = ETAPAS.indexOf(status || 'pendente');
  return (
    <div className="mt-2 flex gap-[3px]" aria-hidden="true">
      {ETAPAS.map((e, j) => (
        <span key={e} className="h-[3px] w-8" style={{ background: j <= atual ? 'var(--accent)' : 'var(--border-strong)' }} />
      ))}
    </div>
  );
}

// 07 Serviços em acompanhamento (redesign D2): as tarefas "Executar serviço" abertas,
// filtradas pela etapa escolhida na Linha de produção. Tabela a partir de 1024px,
// cards abaixo. As pills chamam o mesmo updateTask(id, { status }) dos cards.
export function ServicosAcompanhamento({ ref, index, servicos, etapa, onLimpar }: Props) {
  const leads = useStore((state) => state.leads);
  const updateTask = useStore((state: any) => state.updateOperacionalTask);

  const visiveis = etapa ? servicos.filter((s) => (s.status || 'pendente') === etapa) : servicos;
  // Só a ordem de exibição, numa cópia: mais antiga primeiro (regra das Atrasadas); sem data no fim.
  const ordenados = [...visiveis].sort((a, b) => {
    if (!a.data || !b.data) return a.data ? -1 : b.data ? 1 : 0;
    return a.data.localeCompare(b.data);
  });

  const dadosDe = (s: any) => {
    const lead = s.leadId ? leads.find((l) => l.id === s.leadId) : null;
    return {
      lead,
      valor: lead?.valorOrcado > 0 ? formatCurrency(lead.valorOrcado) : '—',
      data: s.data ? format(parseISO(s.data), 'dd/MM') : '—',
      faixa: FAIXA_PRIORIDADE[s.prioridade] ?? FAIXA_PRIORIDADE.media,
      prioridade: ROTULO_PRIORIDADE[s.prioridade] ?? s.prioridade,
    };
  };

  return (
    <section ref={ref} className="scroll-mt-4 border border-[var(--border-strong)] bg-[var(--bg-surface)]">
      <div className="px-5 pt-5 md:px-6">
        <SectionHeading
          index={index}
          label="Serviços em acompanhamento"
          right={<span className="ed-mono text-[var(--text-tertiary)]">{ordenados.length}</span>}
        />
        {etapa && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3">
            <span className="ed-mono text-[var(--text-secondary)]">
              Etapa: <span className="ed-mono text-[var(--accent)]">{statusConfig[etapa]?.label}</span>
            </span>
            <button onClick={onLimpar} className="ed-mono min-h-[44px] text-[var(--accent)] transition-opacity hover:opacity-70">
              Limpar filtro ×
            </button>
          </div>
        )}
      </div>

      {servicos.length === 0 ? (
        <div className="px-5 pt-4 pb-5 md:px-6">
          <EmptyState title="Nenhum serviço em acompanhamento" note="Quando você fechar um negócio, o serviço aparece aqui." />
        </div>
      ) : ordenados.length === 0 ? (
        <div className="px-5 pt-4 pb-5 md:px-6">
          <EmptyState title="Nenhum serviço nesta etapa" note="Toque na etapa de novo para ver todos." />
        </div>
      ) : (
        <>
          {/* Tabela: a partir de 1024px */}
          <table className="mt-4 hidden w-full border-collapse text-left lg:table">
            <thead>
              <tr className="border-y border-[var(--border)] bg-[var(--bg-surface-2)]">
                {['Cliente / Serviço', 'Etapa', 'Prioridade', 'Valor orçado', 'Data'].map((h) => (
                  <th key={h} className="ed-mono px-3 py-2.5 font-normal text-[var(--text-tertiary)] first:pl-6 last:pr-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenados.map((s) => {
                const d = dadosDe(s);
                return (
                  <tr key={s.id} className="border-b border-[var(--border)] align-top last:border-0">
                    <td className="py-3.5 pr-3 pl-6">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{d.lead?.nome ?? s.titulo}</p>
                      {d.lead && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{s.titulo}</p>}
                      <BarraEtapas status={s.status} />
                    </td>
                    <td className="w-[220px] px-3 py-3.5 xl:w-[340px]">
                      <StatusPills status={s.status} onChange={(st) => updateTask(s.id, { status: st })} />
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="ed-mono" style={{ color: d.faixa }}>{d.prioridade}</span>
                    </td>
                    <td className="tnum px-3 py-3.5 text-sm font-semibold whitespace-nowrap text-[var(--text-primary)]">{d.valor}</td>
                    <td className="ed-mono py-3.5 pr-6 pl-3 text-[var(--text-secondary)]">{d.data}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Cards: abaixo de 1024px */}
          <ul className="mt-4 divide-y divide-[var(--border)] border-t border-[var(--border)] lg:hidden">
            {ordenados.map((s) => {
              const d = dadosDe(s);
              return (
                <li key={s.id} className="relative px-5 py-4 md:px-6">
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px]" style={{ background: d.faixa }} />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{d.lead?.nome ?? s.titulo}</p>
                  {d.lead && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{s.titulo}</p>}
                  <BarraEtapas status={s.status} />
                  <StatusPills className="mt-3" status={s.status} onChange={(st) => updateTask(s.id, { status: st })} />
                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    <div>
                      <dt className="ed-mono text-[var(--text-tertiary)]">Prioridade</dt>
                      <dd className="ed-mono mt-0.5" style={{ color: d.faixa }}>{d.prioridade}</dd>
                    </div>
                    <div>
                      <dt className="ed-mono text-[var(--text-tertiary)]">Valor orçado</dt>
                      <dd className="tnum mt-0.5 text-sm font-semibold whitespace-nowrap text-[var(--text-primary)]">{d.valor}</dd>
                    </div>
                    <div>
                      <dt className="ed-mono text-[var(--text-tertiary)]">Data</dt>
                      <dd className="ed-mono mt-0.5 text-[var(--text-secondary)]">{d.data}</dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
