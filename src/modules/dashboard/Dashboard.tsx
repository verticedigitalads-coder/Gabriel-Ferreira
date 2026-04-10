import { useMemo } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { useStore } from '@/store/useStore'
import { useDashboardStats } from '@/store/selectors/dashboardSelectors'
import { StatCard, Card } from '@/components/ui/Card';
import { PriorityBadge } from '@/components/ui/Badge';
import { format, parseISO, isToday, isTomorrow, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Activity,
  Briefcase,
  ShieldCheck,
  Target,
} from 'lucide-react';

export function Dashboard() {

  const stats = useDashboardStats();

  const leads = useStore(state => state.leads);
  const tasks = useStore(state => state.operacionalTasks);
  const materiais = useStore(state => state.materiais);
  const contasReceber = useStore(state => state.contasReceber);

  const setActiveModule = useStore(state => state.setActiveModule);
  const selectLead = useStore(state => state.selectLead);


  // ==============================
  // 📦 ESTOQUE CRÍTICO
  // ==============================

  const receitaPrevistaMes = useMemo(() => {
    const now = new Date();
    const mStart = startOfMonth(now);
    const mEnd = endOfMonth(now);
    return contasReceber
      .filter(c => {
        if (c.status !== 'pendente') return false;
        return isWithinInterval(parseISO(c.dataVencimento), { start: mStart, end: mEnd });
      })
      .reduce((sum, c) => sum + c.valor, 0);
  }, [contasReceber]);

  const estoqueBaixo = materiais.filter(
    m => m.estoque <= m.estoque_minimo
  )

  // ==============================
  // 📅 VISITAS HOJE
  // ==============================

  const visitasHoje = tasks.filter(
    t =>
      t.tipo === "visita" &&
      isToday(parseISO(t.data))
  )

  // ==============================
  // 💰 MAIORES OPORTUNIDADES
  // ==============================

  const topOportunidades = useMemo(() => {

    return leads
      .filter(l => l.status !== "fechado")
      .sort((a, b) => (b.valorOrcado || 0) - (a.valorOrcado || 0))
      .slice(0, 5)

  }, [leads])

  // ==============================
  // 🧠 SAÚDE DO CRM
  // ==============================

  const getCRMHealth = () => {

    if (stats.tarefasCriticas > 5 || stats.scoreOperacional > 150) {
      return { status: 'CRÍTICO', color: 'text-[var(--danger)]' };
    }

    if (
      stats.tarefasCriticas > 2 ||
      stats.receitaProvavel < stats.metaMensal * 0.5
    ) {
      return { status: 'ATENÇÃO', color: 'text-[var(--warning)]' };
    }

    return { status: 'SAUDÁVEL', color: 'text-[var(--success)]' };

  };

  const crmHealth = getCRMHealth();

  // ==============================
  // 🎯 FOCO HOJE
  // ==============================

  const focusTodayLeads = useMemo(() => {

    const now = new Date();

    const calculateActionScore = (lead: any) => {

      let score = 0;

      if (lead.ultimoContato) {
        const dias = differenceInDays(now, parseISO(lead.ultimoContato));
        if (dias >= 7) score += 5;
        else if (dias >= 3) score += 3;
      } else score += 4;

      if (lead.proximoContato) {
        const dataFollow = parseISO(lead.proximoContato);
        if (isToday(dataFollow)) score += 6;
        if (isTomorrow(dataFollow)) score += 4;
      }

      if (lead.status === 'orcado') score += 3;
      if (lead.temperatura === 'quente') score += 4;
      if (lead.temperatura === 'morno') score += 2;

      if (lead.valorOrcado > 10000) score += 3;
      else if (lead.valorOrcado > 5000) score += 2;

      return score;

    };

    return leads
      .filter(l => l.status !== 'fechado' && l.status !== 'perdido')
      .map(l => ({ ...l, actionScore: calculateActionScore(l) }))
      .filter(l => l.actionScore > 0)
      .sort((a, b) => b.actionScore - a.actionScore)
      .slice(0, 5);

  }, [leads]);

  return (

    <div className="p-4 md:p-8 space-y-6 md:space-y-8">

      {/* Header */}

      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Dashboard Executivo
        </h1>

        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Atualizado em {format(new Date(), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
        </p>
      </div>

      {/* Saúde do CRM */}

      <Card className="shadow-sm rounded-2xl p-4 md:p-6">

        <div className="flex items-center gap-3">

          <ShieldCheck className="w-6 h-6 text-[var(--accent)]" />

          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Saúde do CRM
            </h2>

            <p className={`text-sm font-medium ${crmHealth.color}`}>
              Status atual: {crmHealth.status}
            </p>

          </div>
        </div>

      </Card>

      {/* Receita */}

      <Card className="shadow-sm rounded-2xl p-4 md:p-6">

        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
          Previsão de Receita
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-6">

          <StatCard
            label="Receita Potencial"
            value={formatCurrency(stats.receitaPotencial)}
          />

          <StatCard
            label="Receita Provável"
            value={formatCurrency(stats.receitaProvavel)}
          />

          <StatCard
            label="Receita Conservadora"
            value={formatCurrency(stats.receitaConservadora)}
          />

          <StatCard
            label="Receita Prevista (Contas)"
            value={formatCurrency(receitaPrevistaMes)}
            color="green"
          />

        </div>

      </Card>

      {/* Estoque crítico */}

      <Card className="shadow-sm rounded-2xl p-4 md:p-6">

        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Estoque Crítico
        </h2>

        {estoqueBaixo.length === 0 && (
          <p className="text-sm text-[var(--text-tertiary)]">
            Nenhum material com estoque baixo
          </p>
        )}

        <div className="space-y-2">

          {estoqueBaixo.map(m => (

            <div
              key={m.id}
              className="flex justify-between items-center text-sm"
            >

              <span className="text-[var(--text-secondary)]">
                {m.nome}
              </span>

              <span className="text-[var(--danger)] font-semibold">
                {m.estoque}
              </span>

            </div>

          ))}

        </div>

      </Card>

      {/* Indicadores */}

      <Card className="shadow-sm rounded-2xl p-4 md:p-6">

        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
          Indicadores Estratégicos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">

          <StatCard
            label="Score Operacional"
            value={stats.scoreOperacional}
            icon={<Activity className="w-5 h-5 text-[var(--accent)]" />}
          />

          <StatCard
            label="Score Comercial"
            value={stats.scoreComercial}
            icon={<Briefcase className="w-5 h-5 text-[var(--accent)]" />}
          />

          <StatCard
            label="Tarefas Críticas"
            value={stats.tarefasCriticas}
            icon={<AlertTriangle className="w-5 h-5 text-[var(--danger)]" />}
          />

        </div>

      </Card>

      {/* Visitas Hoje */}

      <Card className="shadow-sm rounded-2xl">

        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Visitas Hoje
          </h2>
        </div>

        <div className="divide-y divide-[var(--border)]">

          {visitasHoje.length === 0 && (
            <p className="p-4 text-sm text-[var(--text-tertiary)]">
              Nenhuma visita hoje
            </p>
          )}

          {visitasHoje.map(task => {

            const lead = leads.find(l => l.id === task.leadId)

            return (

              <div
                key={task.id}
                className="p-4 flex justify-between items-center"
              >

                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {lead?.nome || "Cliente"}
                  </p>

                  <p className="text-xs text-[var(--text-tertiary)]">
                    {lead?.servico}
                  </p>
                </div>

                <span className="text-xs text-[var(--text-tertiary)]">
                  {format(parseISO(task.data), "HH:mm")}
                </span>

              </div>

            )

          })}

        </div>

      </Card>

      {/* Foco Hoje */}

      {focusTodayLeads.length > 0 && (

        <Card className="shadow-sm rounded-2xl">

          <div className="p-5 border-b border-[var(--border)] flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--accent)]" />

            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Foco Hoje
            </h2>

          </div>

          <div className="divide-y divide-[var(--border)]">

            {focusTodayLeads.map(lead => (

              <div
                key={lead.id}
                onClick={() => {
                  selectLead(lead.id);
                  setActiveModule('leads');
                }}
                className="flex items-center justify-between p-4 hover:bg-[var(--bg-surface-2)] cursor-pointer transition-colors"
              >

                <div>

                  <p className="font-medium text-[var(--text-primary)]">
                    {lead.nome}
                  </p>

                  <p className="text-xs text-[var(--text-tertiary)]">
                    {lead.servico}
                  </p>

                </div>

                <div className="text-right">

                  <PriorityBadge level={lead.prioridadeLevel} />

                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {lead.valorOrcado > 0 ? formatCurrency(lead.valorOrcado) : 'Sem valor'}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </Card>

      )}

      {/* Maiores oportunidades */}

      <Card className="shadow-sm rounded-2xl">

        <div className="p-5 border-b border-[var(--border)]">

          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Maiores Oportunidades
          </h2>

        </div>

        <div className="divide-y divide-[var(--border)]">

          {topOportunidades.map(lead => (

            <div
              key={lead.id}
              className="p-4 flex justify-between"
            >

              <div>

                <p className="font-medium text-[var(--text-primary)]">
                  {lead.nome}
                </p>

                <p className="text-xs text-[var(--text-tertiary)]">
                  {lead.servico}
                </p>

              </div>

              <p className="font-semibold text-[var(--text-primary)]">
                {lead.valorOrcado > 0 ? formatCurrency(lead.valorOrcado) : <span className="text-sm font-normal text-[var(--text-tertiary)]">Sem valor</span>}
              </p>

            </div>

          ))}

        </div>

      </Card>

    </div>

  );

}
