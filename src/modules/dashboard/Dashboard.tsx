import { useMemo } from 'react';
import { useStore, useDashboardStats } from '@/store/useStore';
import { StatCard, Card } from '@/components/ui/Card';
import { PriorityBadge } from '@/components/ui/Badge';
import { format, parseISO, isToday, isTomorrow, differenceInDays } from 'date-fns';
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
  const setActiveModule = useStore(state => state.setActiveModule);
  const selectLead = useStore(state => state.selectLead);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // ==============================
  // 🧠 SAÚDE DO CRM
  // ==============================
  const getCRMHealth = () => {
    if (stats.tarefasCriticas > 5 || stats.scoreOperacional > 150) {
      return { status: 'CRÍTICO', color: 'text-red-600' };
    }

    if (
      stats.tarefasCriticas > 2 ||
      stats.receitaProvavel < stats.metaMensal * 0.5
    ) {
      return { status: 'ATENÇÃO', color: 'text-yellow-600' };
    }

    return { status: 'SAUDÁVEL', color: 'text-emerald-600' };
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
    <div className="p-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Dashboard Executivo
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Atualizado em {format(new Date(), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
        </p>
      </div>

      {/* Saúde do CRM */}
      <Card className="bg-white shadow-sm rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Saúde do CRM
            </h2>
            <p className={`text-sm font-medium ${crmHealth.color}`}>
              Status atual: {crmHealth.status}
            </p>
          </div>
        </div>
      </Card>

      {/* Receita */}
      <Card className="bg-white shadow-sm rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">
          Previsão de Receita
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Receita Potencial" value={formatCurrency(stats.receitaPotencial)} />
          <StatCard label="Receita Provável" value={formatCurrency(stats.receitaProvavel)} />
          <StatCard label="Receita Conservadora" value={formatCurrency(stats.receitaConservadora)} />
        </div>
      </Card>

      {/* Indicadores */}
      <Card className="bg-white shadow-sm rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">
          Indicadores Estratégicos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Score Operacional"
            value={stats.scoreOperacional}
            icon={<Activity className="w-5 h-5 text-blue-600" />}
          />
          <StatCard
            label="Score Comercial"
            value={stats.scoreComercial}
            icon={<Briefcase className="w-5 h-5 text-blue-600" />}
          />
          <StatCard
            label="Tarefas Críticas"
            value={stats.tarefasCriticas}
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          />
        </div>
      </Card>

      {/* Foco Hoje */}
      {focusTodayLeads.length > 0 && (
        <Card className="bg-white shadow-sm rounded-2xl">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Foco Hoje
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {focusTodayLeads.map(lead => (
              <div
                key={lead.id}
                onClick={() => {
                  selectLead(lead.id);
                  setActiveModule('leads');
                }}
                className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">{lead.nome}</p>
                  <p className="text-xs text-slate-500">{lead.servico}</p>
                </div>

                <div className="text-right">
                  <PriorityBadge level={lead.prioridadeLevel} />
                  {lead.valorOrcado > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {formatCurrency(lead.valorOrcado)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}