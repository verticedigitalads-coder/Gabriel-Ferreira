import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/ui/Card';
import { PriorityBadge } from '@/components/ui/Badge';
import { parseISO, differenceInDays, isBefore } from 'date-fns';
import { Target, DollarSign, AlertTriangle } from 'lucide-react';

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
    .reduce((acc, l) => acc + l.valorOrcado, 0);

  const executionScoreTotal = Math.min(
    100,
    leadsComScore.length * 10
  );

  return (
    <div className="p-8 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Modo Execução
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          O que você precisa fazer agora
        </p>
      </div>

      {/* SCORE E RECEITA */}
      <div className="grid md:grid-cols-2 gap-6">

        <Card className="shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-[var(--text-primary)]">
              Execução Hoje
            </h2>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {executionScoreTotal}%
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Baseado na quantidade de ações pendentes
          </p>
        </Card>

        <Card className="shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-[var(--text-primary)]">
              Receita Travada
            </h2>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            R$ {receitaTravada.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Orçamentos aguardando decisão
          </p>
        </Card>

      </div>

      {/* LISTA DE AÇÃO */}
      <Card className="shadow-sm rounded-2xl">
        <div className="p-5 border-b border-[var(--border)] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Prioridades de Hoje
          </h2>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {topLeads.length === 0 ? (
            <div className="p-6 text-sm text-[var(--text-secondary)]">
              Nenhuma ação crítica no momento.
            </div>
          ) : (
            topLeads.map((lead, index) => (
              <div
                key={lead.id}
                onClick={() => {
                  selectLead(lead.id);
                  setActiveModule('leads');
                }}
                className="flex justify-between items-center p-4 hover:bg-[var(--bg-surface-2)] cursor-pointer transition"
              >
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {index + 1}. {lead.nome}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {lead.servico}
                  </p>
                </div>

                <div className="text-right">
                  <PriorityBadge level={lead.prioridadeLevel} />
                  {lead.valorOrcado > 0 && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      R$ {lead.valorOrcado.toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

    </div>
  );
}
