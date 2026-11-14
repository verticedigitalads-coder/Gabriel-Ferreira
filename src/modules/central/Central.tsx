import { useMemo } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { useStore } from '@/store/useStore';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/utils/cn';
import { PageMasthead } from '@/components/editorial/PageMasthead';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { EmptyState } from '@/components/editorial/EmptyState';
import { Colophon } from '@/components/editorial/Colophon';
import { FAIXA_PRIORIDADE_LEAD, ROTULO_PRIORIDADE_LEAD, nivelPrioridade } from '@/modules/leads/visualLead';
import { parseISO, differenceInDays, isBefore } from 'date-fns';
import { ChevronRight } from 'lucide-react';

// Redesign D4: número grande do masthead com contagem. Componente próprio para a
// contagem não re-renderizar a tela inteira a cada quadro (padrão da D2/D3).
// Devolve só <span>: o PageMasthead já envolve o stat num <p>.
function ExecucaoContada({ valor }: { valor: number }) {
  const animado = useCountUp(valor);
  return (
    <>
      <span className="sr-only">{valor}%</span>
      <span aria-hidden="true">
        {Math.round(animado)}
        <span className="ed-serif ml-1 text-[0.5em] text-[var(--accent)]">%</span>
      </span>
    </>
  );
}

const SECAO = 'border border-[var(--border-strong)] bg-[var(--bg-surface)]';

export function Central() {
  const leads = useStore(state => state.leads);
  const setActiveModule = useStore(state => state.setActiveModule);
  const selectLead = useStore(state => state.selectLead);

  const now = new Date();

  const leadsAtivos = leads.filter(
    l => l.status !== 'fechado' && l.status !== 'perdido'
  );

  const leadsComScore = useMemo(() => {
    return leadsAtivos.map(lead => {
      let score = 0;

      const diasSemContato = lead.ultimoContato
        ? differenceInDays(now, parseISO(lead.ultimoContato))
        : 999;

      const followUpVencido =
        lead.proximoContato &&
        isBefore(parseISO(lead.proximoContato), now);

      if (followUpVencido) score += 5;
      if (lead.temperatura === 'quente') score += 4;
      if (lead.status === 'orcado') score += 4;
      if (lead.valorOrcado > 10000) score += 3;
      if (diasSemContato >= 7) score += 3;
      if (diasSemContato >= 14) score += 2;

      return { ...lead, executionScore: score };
    })
    .filter(l => l.executionScore > 0)
    .sort((a, b) => b.executionScore - a.executionScore);
  }, [leads]);

  const topLeads = leadsComScore.slice(0, 7);

  const receitaTravada = leadsComScore
    .filter(l => l.status === 'orcado')
    .reduce((acc, l) => acc + (l.valorOrcado ?? 0), 0);

  const executionScoreTotal = Math.min(
    100,
    leadsComScore.length * 10
  );

  return (
    <div className="space-y-5 md:space-y-6">

      {/* ================= 00 ABERTURA ================= */}
      <PageMasthead
        kicker="Gestão · Central"
        title="Modo"
        italic="Execução"
        description="O que você precisa fazer agora"
        ghost="CE"
        stat={<ExecucaoContada valor={executionScoreTotal} />}
        statLabel="Execução Hoje"
      />

      {/* Legenda do número do masthead (Execução Hoje); no desktop fica embaixo do número, à direita */}
      <p className="-mt-2 text-xs text-[var(--text-tertiary)] md:text-right">
        Baseado na quantidade de ações pendentes
      </p>

      {/* ================= RECEITA TRAVADA ================= */}
      <div className={cn(SECAO, 'px-5 py-4 md:px-6')}>
        <p className="ed-mono text-[var(--text-tertiary)]">Receita Travada</p>
        <p
          className="tnum mt-2 text-2xl leading-none [overflow-wrap:anywhere]"
          style={{ fontWeight: 'var(--font-bold)', letterSpacing: '-0.02em', color: 'var(--success)' }}
        >
          {formatCurrency(receitaTravada)}
        </p>
        <p className="mt-2 text-xs text-[var(--text-tertiary)]">
          Orçamentos aguardando decisão
        </p>
      </div>

      {/* ================= 01 PRIORIDADES DE HOJE ================= */}
      <section className={SECAO}>
        <div className="px-5 pt-5 pb-3 md:px-6">
          <SectionHeading index="01" label="Prioridades de Hoje" />
        </div>

        {topLeads.length === 0 ? (
          <div className="px-5 pb-5 md:px-6">
            <EmptyState
              title="Nenhuma ação crítica no momento."
              note="Aproveite para prospectar ou adiantar a produção"
            />
          </div>
        ) : (
          <ol>
            {topLeads.map((lead, index) => {
              const nivel = nivelPrioridade(lead.prioridadeLevel);
              const rotulo = ROTULO_PRIORIDADE_LEAD[nivel];
              return (
                <li key={lead.id} className="border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      selectLead(lead.id);
                      setActiveModule('leads');
                    }}
                    className="relative flex w-full min-h-[44px] items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--bg-surface-2)] md:px-6"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-2 left-0 w-[3px]"
                      style={{ background: FAIXA_PRIORIDADE_LEAD[nivel] }}
                    />
                    <span className="ed-mono w-6 shrink-0 text-[var(--accent)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block text-[length:var(--text-md)] leading-snug text-[var(--text-primary)] [overflow-wrap:anywhere]"
                        style={{ fontWeight: 'var(--font-semibold)' }}
                      >
                        {lead.nome}
                      </span>
                      <span className="block truncate text-xs text-[var(--text-tertiary)]">
                        {lead.servico}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1 text-right">
                      <span className="ed-mono" style={{ color: rotulo.cor }}>{rotulo.texto}</span>
                      {lead.valorOrcado > 0
                        ? <span className="tnum text-xs text-[var(--text-secondary)]">{formatCurrency(lead.valorOrcado)}</span>
                        : <span className="ed-serif text-sm text-[var(--text-tertiary)]">Sem valor</span>
                      }
                    </span>
                    {/* Seta só a partir de 640px: a 320 ela tirava 28px do nome do cliente */}
                    <ChevronRight aria-hidden="true" className="hidden h-4 w-4 shrink-0 text-[var(--text-tertiary)] sm:block" />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <Colophon label="VRTX CRM · Modo Execução" onBack={() => setActiveModule('dashboard')} />

    </div>
  );
}
