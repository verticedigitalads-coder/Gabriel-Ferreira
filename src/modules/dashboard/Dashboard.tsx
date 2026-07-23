import { useMemo, useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { useStore } from '@/store/useStore'
import { useDashboardStats } from '@/store/selectors/dashboardSelectors'
import { useNotifications } from '@/hooks/useNotifications';
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
  Bell,
  X,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { CrmHealthReasons, type HealthReason } from './CrmHealthReasons';

export function Dashboard() {

  const stats = useDashboardStats();

  const { requestPermission, permissionGranted } = useNotifications();
  const [showNotifBanner, setShowNotifBanner] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default'
  );

  const leads = useStore(state => state.leads);
  const tasks = useStore(state => state.operacionalTasks);
  const materiais = useStore(state => state.materiais);
  const contasReceber = useStore(state => state.contasReceber);
  const orcamentos = useStore(state => state.orcamentos);

  const setActiveModule = useStore(state => state.setActiveModule);
  const selectLead = useStore(state => state.selectLead);

  const [healthOpen, setHealthOpen] = useState(false);


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
      .reduce((sum, c) => sum + (c.valor ?? 0), 0);
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
      return { status: 'CRÍTICO', color: 'var(--danger)', bg: 'var(--danger-subtle)', border: 'var(--danger)' };
    }

    if (
      stats.tarefasCriticas > 2 ||
      stats.receitaProvavel < stats.metaMensal * 0.5
    ) {
      return { status: 'ATENÇÃO', color: 'var(--warning)', bg: 'var(--warning-subtle)', border: 'var(--warning)' };
    }

    return { status: 'SAUDÁVEL', color: 'var(--success)', bg: 'var(--success-subtle)', border: 'var(--success)' };

  };

  const crmHealth = getCRMHealth();

  // ==============================
  // 🚨 LEADS CRÍTICOS (compartilhado: Emergência + Saúde)
  // ==============================

  const criticos = useMemo(() => {
    const now = new Date();
    return leads.filter(l => {
      if (l.prioridadeLevel !== 'critico') return false;
      if (l.status === 'fechado' || l.status === 'perdido') return false;
      const referencia = l.ultimoContato ?? l.createdAt;
      if (!referencia) return false;
      return differenceInDays(now, parseISO(referencia)) >= 5;
    });
  }, [leads]);

  // ==============================
  // 💊 REASONS DA SAÚDE DO CRM
  // ==============================

  const healthReasons = useMemo<HealthReason[]>(() => {
    const r: HealthReason[] = [];

    if (criticos.length > 0) {
      r.push({
        icon: 'leads',
        label: `${criticos.length} lead(s) crítico(s) sem contato há 5+ dias`,
        severity: criticos.length > 2 ? 'crit' : 'warn',
        actionLabel: 'Ver leads',
        onAction: () => setActiveModule('leads'),
      });
    }

    const contasAtrasadas = contasReceber.filter(c => c.status === 'atrasado');
    if (contasAtrasadas.length > 0) {
      r.push({
        icon: 'financeiro',
        label: `${contasAtrasadas.length} conta(s) a receber atrasada(s)`,
        severity: 'crit',
        actionLabel: 'Ver financeiro',
        onAction: () => setActiveModule('financeiro'),
      });
    }

    const now = new Date();
    const orcVencidos = orcamentos.filter(
      o =>
        o.status === 'enviado' &&
        o.validadeEmDias > 0 &&
        differenceInDays(now, parseISO(o.createdAt)) > o.validadeEmDias,
    );
    if (orcVencidos.length > 0) {
      r.push({
        icon: 'orcamentos',
        label: `${orcVencidos.length} orçamento(s) vencido(s) sem resposta`,
        severity: 'warn',
        actionLabel: 'Ver orçamentos',
        onAction: () => setActiveModule('orcamentos'),
      });
    }

    if (stats.receitaProvavel < stats.metaMensal * 0.5 && stats.metaMensal > 0) {
      r.push({
        icon: 'meta',
        label: 'Receita provável abaixo de 50% da meta',
        severity: 'warn',
        actionLabel: 'Ver dashboard',
        onAction: () => {},
      });
    }

    return r.slice(0, 4);
  }, [criticos, contasReceber, orcamentos, stats, setActiveModule]);

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

      {showNotifBanner && !permissionGranted && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--accent)] bg-[var(--accent-subtle)]">
          <Bell className="w-5 h-5 text-[var(--accent)] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Ative as notificações
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Receba lembretes de tarefas do dia e atividades atrasadas.
            </p>
          </div>
          <button
            onClick={async () => {
              await requestPermission();
              setShowNotifBanner(false);
            }}
            className="px-3 py-1.5 text-sm font-medium bg-[var(--accent)] text-white rounded-md hover:opacity-90 min-h-[44px]"
          >
            Ativar
          </button>
          <button
            onClick={() => setShowNotifBanner(false)}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── PAINEL DE EMERGÊNCIA ── */}
      {(() => {
        const now = new Date();
        if (criticos.length === 0) return null;
        return (
          <div
            className="rounded-xl p-4 border-2"
            style={{
              background: 'var(--danger-subtle)',
              borderColor: 'var(--danger)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--danger)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--danger)' }}>
                  ATENÇÃO IMEDIATA
                </span>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--danger)', color: '#fff' }}
              >
                {criticos.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {criticos.map(lead => {
                const dias = differenceInDays(now, parseISO(lead.ultimoContato ?? lead.createdAt));
                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      selectLead(lead.id);
                      setActiveModule('leads');
                    }}
                    className="flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors min-h-[44px]"
                    style={{ background: 'rgba(239,68,68,0.08)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.14)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  >
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {lead.nome}
                      </span>
                      <span
                        className="text-xs font-bold ml-2"
                        style={{ color: 'var(--danger)' }}
                      >
                        {dias}d sem contato
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--danger)' }}>›</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <p className="text-sm text-[var(--text-tertiary)]">
        Atualizado em {format(new Date(), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
      </p>

      {/* Saúde do CRM — expandível */}

      <div>
        <div
          role="button"
          aria-expanded={healthOpen}
          onClick={() => setHealthOpen(v => !v)}
          className="flex items-center justify-between rounded-lg px-4 py-2 cursor-pointer select-none"
          style={{ background: crmHealth.bg, border: `1px solid ${crmHealth.border}` }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: crmHealth.color }} />
            <span className="text-sm font-semibold" style={{ color: crmHealth.color }}>
              Saúde do CRM
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: crmHealth.border, color: 'var(--accent-foreground)' }}
            >
              {crmHealth.status}
            </span>
            {healthReasons.length > 0 && (
              <ChevronDown
                className="w-4 h-4"
                style={{
                  color: crmHealth.color,
                  transform: healthOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            )}
          </div>
        </div>

        {/* Expansão animada */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: healthOpen && healthReasons.length > 0 ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.25s ease',
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <CrmHealthReasons reasons={healthReasons} />
          </div>
        </div>
      </div>

      {/* Receita */}

      <Card className="shadow-sm rounded-xl p-4 md:p-6">

        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
          Previsão de Receita
        </h2>

        {stats.receitaPotencial === 0 && stats.receitaProvavel === 0 && stats.receitaConservadora === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 56, height: 56, background: 'var(--accent-subtle)' }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Sem projeções ainda
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)', maxWidth: 280 }}>
                Adicione valor e data de fechamento nos leads quentes para gerar previsões de receita.
              </p>
            </div>
            <button
              onClick={() => setActiveModule('leads')}
              className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                border: '1px dashed var(--border-hover)',
                minHeight: 36,
              }}
            >
              Ver leads quentes
            </button>
            <div className="w-full pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <StatCard
                label="Receita Prevista (Contas)"
                value={formatCurrency(receitaPrevistaMes)}
                color="green"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

            <StatCard
              label="Receita Potencial"
              value={formatCurrency(stats.receitaPotencial)}
            />

            <StatCard
              label="Receita Provável"
              value={formatCurrency(stats.receitaProvavel)}
              delta={<span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Meta: {formatCurrency(stats.metaMensal)}</span>}
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
        )}

      </Card>

      {/* Estoque crítico */}

      <Card className="shadow-sm rounded-xl p-4 md:p-6">

        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
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

      <Card className="shadow-sm rounded-xl p-4 md:p-6">

        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
          Indicadores Estratégicos
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">

          <StatCard
            label="Score Operacional"
            value={stats.scoreOperacional}
            suffix=" pts"
            icon={<Activity className="w-5 h-5 text-[var(--accent)]" />}
          />

          <StatCard
            label="Score Comercial"
            value={stats.scoreComercial}
            suffix=" pts"
            icon={<Briefcase className="w-5 h-5 text-[var(--accent)]" />}
            delta={<span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>{stats.fechados} fechados</span>}
          />

          <StatCard
            label="Tarefas Críticas"
            value={stats.tarefasCriticas}
            valueStyle={{ color: stats.tarefasCriticas > 0 ? 'var(--danger)' : 'var(--success)' }}
            icon={<AlertTriangle className="w-5 h-5 text-[var(--danger)]" />}
            delta={stats.tarefasAtrasadas > 0
              ? <span className="text-xs font-semibold" style={{ color: 'var(--warning)' }}>{stats.tarefasAtrasadas} atrasadas</span>
              : undefined}
          />

        </div>

      </Card>

      {/* Visitas Hoje */}

      <Card className="shadow-sm rounded-xl">

        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
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

        <Card className="shadow-sm rounded-xl">

          <div className="p-5 border-b border-[var(--border)] flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Foco Hoje
            </h2>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              {focusTodayLeads.length}
            </span>
          </div>

          <div className="divide-y divide-[var(--border)]">

            {focusTodayLeads.map(lead => {
              const diasSem = lead.ultimoContato
                ? differenceInDays(new Date(), parseISO(lead.ultimoContato))
                : null;
              return (
                <div
                  key={lead.id}
                  onClick={() => {
                    selectLead(lead.id);
                    setActiveModule('leads');
                  }}
                  className="flex items-center justify-between p-4 hover:bg-[var(--bg-surface-2)] cursor-pointer transition-colors min-h-[44px]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {lead.nome}
                      </p>
                      {lead.temperatura && (
                        <span
                          className="shrink-0"
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            display: 'inline-block',
                            background:
                              lead.temperatura === 'quente' ? 'var(--danger)'  :
                              lead.temperatura === 'morno'  ? 'var(--warning)' :
                              'var(--info)',
                          }}
                        />
                      )}
                      {diasSem !== null && diasSem >= 5 && (
                        <span className="text-[10px] font-bold shrink-0" style={{ color: 'var(--danger)' }}>
                          {diasSem}d
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                      {lead.servico}
                    </p>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <PriorityBadge level={lead.prioridadeLevel} />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {lead.valorOrcado > 0 ? formatCurrency(lead.valorOrcado) : 'Sem valor'}
                    </p>
                  </div>
                </div>
              );
            })}

          </div>

        </Card>

      )}

      {/* Maiores oportunidades */}

      <Card className="shadow-sm rounded-xl">

        <div className="p-5 border-b border-[var(--border)]">

          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
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
