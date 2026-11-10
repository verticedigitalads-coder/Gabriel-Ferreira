import { useMemo, useState, type ReactNode } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { useStore } from '@/store/useStore'
import { useDashboardStats } from '@/store/selectors/dashboardSelectors'
import { useNotifications } from '@/hooks/useNotifications';
import { useCountUp } from '@/hooks/useCountUp';
import { PriorityBadge } from '@/components/ui/Badge';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { EmptyState } from '@/components/editorial/EmptyState';
import { cn } from '@/utils/cn';
import type { PriorityLevel } from '@/types';
import { format, parseISO, isToday, isTomorrow, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Activity,
  Briefcase,
  ShieldCheck,
  Bell,
  X,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  PackageCheck,
  type LucideIcon,
} from 'lucide-react';
import { CrmHealthReasons, type HealthReason } from './CrmHealthReasons';

// ── Redesign D1: peças visuais do Dashboard (só UI; os números chegam prontos) ──

// Faixa do Foco hoje por prioridade (decisão de 10/11/2026: baixo = cinza neutro)
const FAIXA_PRIORIDADE: Record<PriorityLevel, string> = {
  critico: 'var(--danger)',
  alto: 'var(--warning)',
  medio: 'var(--info)',
  baixo: 'var(--border-strong)',
};

const SECAO = 'border border-[var(--border-strong)] bg-[var(--bg-surface)]';

// Componente separado para a contagem não re-renderizar o Dashboard inteiro a cada quadro.
// Tamanhos de display sem token: clamp pela largura da tela (cabe a 320px).
function ReceitaPotencialContada({ valor }: { valor: number }) {
  const animado = useCountUp(valor);
  const [inteiro, centavos] = formatCurrency(animado).replace(/^R\$\s*/, '').split(',');

  return (
    <p className="tnum relative mt-3 flex flex-wrap items-baseline leading-none">
      <span className="sr-only">{formatCurrency(valor)}</span>
      <span aria-hidden="true" className="ed-serif mr-2 text-[clamp(22px,7vw,36px)] text-[var(--accent)]">R$</span>
      <span
        aria-hidden="true"
        className="min-w-0 [overflow-wrap:anywhere] text-[clamp(32px,11vw,64px)]"
        style={{ fontWeight: 'var(--font-bold)', letterSpacing: '-0.045em', color: 'var(--text-primary)' }}
      >
        {inteiro}
      </span>
      <span
        aria-hidden="true"
        className="text-[clamp(18px,5.5vw,30px)] text-[var(--text-tertiary)]"
        style={{ fontWeight: 'var(--font-semibold)' }}
      >
        ,{centavos}
      </span>
    </p>
  );
}

function LinhaReceita({
  label,
  valor,
  destaque,
  children,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn('px-5 py-4 md:px-6', destaque && 'border-l-2 border-l-[var(--success)] bg-[var(--success-subtle)]')}>
      <p className="ed-mono flex items-center gap-2 text-[var(--text-tertiary)]">
        {destaque && <span aria-hidden="true" className="w-1.5 h-1.5 shrink-0 rounded-full bg-[var(--success)]" />}
        {label}
      </p>
      <p
        className="tnum mt-1.5 leading-none text-2xl text-[var(--text-primary)] [overflow-wrap:anywhere]"
        style={{ fontWeight: 'var(--font-bold)', letterSpacing: '-0.02em' }}
      >
        {valor}
      </p>
      {children}
    </div>
  );
}

function CelulaIndicador({
  icon: Icon,
  label,
  valor,
  unidade,
  corValor,
  perigo,
  children,
}: {
  icon: LucideIcon;
  label: string;
  valor: number;
  unidade?: string;
  corValor?: string;
  perigo?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="px-5 py-5 md:px-6">
      <div className="flex items-start justify-between gap-2">
        <p className="ed-mono text-[var(--text-tertiary)]">{label}</p>
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center border',
            perigo
              ? 'border-[var(--danger)] bg-[var(--danger-subtle)] text-[var(--danger)]'
              : 'border-[var(--border-accent)] bg-[var(--accent-subtle)] text-[var(--accent)]'
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
      </div>
      <p className="tnum mt-3 flex items-baseline gap-1.5 leading-none">
        <span
          className="text-[42px]"
          style={{ fontWeight: 'var(--font-bold)', letterSpacing: '-0.04em', color: corValor ?? 'var(--text-primary)' }}
        >
          {valor}
        </span>
        {unidade && <span className="ed-serif text-lg text-[var(--text-tertiary)]">{unidade}</span>}
      </p>
      {children}
    </div>
  );
}

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

  // Numeração contínua só das seções que aparecem (Atenção e Foco são condicionais).
  // Os children do JSX são avaliados na ordem do código, então a sequência sai certa.
  let secao = 0;
  const proxima = () => String(++secao).padStart(2, '0');

  const semProjecao = stats.receitaPotencial === 0 && stats.receitaProvavel === 0 && stats.receitaConservadora === 0;
  const pctMeta = stats.metaMensal > 0 ? (stats.receitaProvavel / stats.metaMensal) * 100 : null;
  const temFoco = focusTodayLeads.length > 0;

  return (

    <div className="p-4 md:p-8 space-y-6 md:space-y-8">

      {showNotifBanner && !permissionGranted && (
        <div className="flex items-center gap-3 p-3 border border-[var(--border-accent)] bg-[var(--accent-subtle)]">
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
            className="px-3 text-sm font-semibold bg-[var(--accent)] text-[var(--bg-app)] hover:opacity-90 min-h-[44px]"
          >
            Ativar
          </button>
          <button
            onClick={() => setShowNotifBanner(false)}
            aria-label="Dispensar"
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── ATENÇÃO IMEDIATA ── */}
      {criticos.length > 0 && (() => {
        const now = new Date();
        return (
          <section className="relative overflow-hidden border border-[var(--danger)] bg-[var(--danger-subtle)]">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-[var(--danger)]" />
            <span
              aria-hidden="true"
              className="ed-serif pointer-events-none select-none absolute -right-3 top-1/2 hidden -translate-y-1/2 leading-none text-[92px] text-[var(--danger-subtle)] md:block"
            >
              atenção
            </span>

            <div className="relative px-5 py-4 md:px-6">
              <div className="flex items-center gap-3">
                <span className="ed-mono flex h-6 w-6 shrink-0 items-center justify-center border border-[var(--danger)] text-[var(--danger)]">
                  {proxima()}
                </span>
                <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--danger)]" />
                <h2 className="ed-mono min-w-0 text-[var(--danger)]">Atenção imediata</h2>
                <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-[var(--danger)] opacity-30" />
                <span className="ed-mono shrink-0 border border-[var(--danger)] px-2 text-[var(--danger)]">
                  {criticos.length}
                </span>
              </div>

              <ul className="mt-3 divide-y divide-[var(--border)]">
                {criticos.map(lead => {
                  const dias = differenceInDays(now, parseISO(lead.ultimoContato ?? lead.createdAt));
                  return (
                    <li key={lead.id}>
                      <button
                        onClick={() => {
                          selectLead(lead.id);
                          setActiveModule('leads');
                        }}
                        className="group w-full flex items-center gap-3 py-2.5 min-h-[44px] text-left"
                      >
                        <span className="min-w-0 flex-1 md:flex md:items-baseline md:gap-4">
                          <span className="block truncate text-[length:var(--text-md)] font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--danger)]">
                            {lead.nome}
                          </span>
                          <span className="mt-0.5 block shrink-0 leading-none md:mt-0">
                            <span className="ed-serif text-xl text-[var(--danger)]">{dias} dias</span>{' '}
                            <span className="ed-mono text-[var(--danger)]">sem contato</span>
                          </span>
                        </span>
                        <ChevronRight className="w-4 h-4 shrink-0 text-[var(--danger)]" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })()}

      {/* ── ATUALIZAÇÃO ── */}
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="w-1.5 h-1.5 shrink-0 bg-[var(--accent)]" />
        <p className="ed-mono text-[var(--text-tertiary)]">
          Atualizado em{' '}
          <span className="ed-mono text-[var(--text-secondary)]">
            {format(new Date(), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
          </span>
        </p>
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--border)]" />
      </div>

      {/* ── SAÚDE DO CRM — expandível ── */}
      <section className="border" style={{ borderColor: crmHealth.border, background: crmHealth.bg }}>
        <div
          role="button"
          aria-expanded={healthOpen}
          onClick={() => setHealthOpen(v => !v)}
          className="flex items-center gap-3 px-5 py-2 min-h-[44px] cursor-pointer select-none md:px-6"
        >
          <span
            className="ed-mono flex h-6 w-6 shrink-0 items-center justify-center border"
            style={{ borderColor: crmHealth.border, color: crmHealth.color }}
          >
            {proxima()}
          </span>
          <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: crmHealth.color }} />
          <span className="min-w-0 text-sm font-semibold text-[var(--text-primary)]">
            Saúde do CRM
          </span>
          <span
            className="ed-mono ml-auto shrink-0 px-2 py-0.5"
            style={{ background: crmHealth.border, color: 'var(--bg-app)' }}
          >
            {crmHealth.status}
          </span>
          {healthReasons.length > 0 && (
            <ChevronDown
              className="w-4 h-4 shrink-0"
              style={{
                color: crmHealth.color,
                transform: healthOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          )}
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
      </section>

      {/* ── PREVISÃO DE RECEITA ── */}
      <section className={SECAO}>
        <div className="px-5 pt-5 md:px-6">
          <SectionHeading index={proxima()} label="Previsão de Receita" accent="cenários" />
        </div>

        {semProjecao ? (
          <>
            <div className="px-5 pt-5 pb-6 md:px-6">
              <div className="flex flex-col items-center gap-3 border border-dashed border-[var(--border-strong)] px-5 py-8 text-center">
                <TrendingUp className="w-6 h-6 text-[var(--accent)]" />
                <p className="ed-serif text-[22px] text-[var(--text-secondary)]">
                  Sem projeções ainda
                </p>
                <p className="text-xs text-[var(--text-tertiary)] max-w-[280px]">
                  Adicione valor e data de fechamento nos leads quentes para gerar previsões de receita.
                </p>
                <button
                  onClick={() => setActiveModule('leads')}
                  className="ed-mono min-h-[44px] px-4 border border-[var(--border-accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                >
                  Ver leads quentes
                </button>
              </div>
            </div>
            <div className="border-t border-[var(--border)]">
              <LinhaReceita label="Receita Prevista (Contas)" valor={formatCurrency(receitaPrevistaMes)} destaque />
            </div>
          </>
        ) : (
          <div className="grid lg:grid-cols-12">

            {/* Número grande: Receita Potencial */}
            <div className="relative min-w-0 overflow-hidden px-5 pt-5 pb-6 md:px-6 lg:col-span-7">
              <span
                aria-hidden="true"
                className="ed-serif ed-ghost pointer-events-none select-none absolute -right-2 -top-7 leading-none text-[150px]"
              >
                R$
              </span>
              <p className="ed-mono relative flex items-center gap-2 text-[var(--text-secondary)]">
                <span aria-hidden="true" className="w-1.5 h-1.5 shrink-0 bg-[var(--accent)]" />
                Receita Potencial
              </p>
              <ReceitaPotencialContada valor={stats.receitaPotencial} />
            </div>

            {/* Cenários complementares */}
            <div className="min-w-0 border-t border-[var(--border)] lg:col-span-5 lg:border-l lg:border-t-0">
              <LinhaReceita label="Receita Provável" valor={formatCurrency(stats.receitaProvavel)}>
                <div className="mt-3">
                  {pctMeta !== null && (
                    <div className="h-[3px] w-full bg-[var(--border-strong)]">
                      <div className="ed-grow h-full bg-[var(--accent)]" style={{ width: `${Math.min(pctMeta, 100)}%` }} />
                    </div>
                  )}
                  <p className="ed-mono mt-2 text-[var(--text-tertiary)]">
                    {pctMeta !== null && `${pctMeta.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da meta · `}
                    <span className="ed-mono text-[var(--text-secondary)]">Meta {formatCurrency(stats.metaMensal)}</span>
                  </p>
                </div>
              </LinhaReceita>

              <div className="mx-5 h-px bg-[var(--border)] md:mx-6" />

              <LinhaReceita label="Receita Conservadora" valor={formatCurrency(stats.receitaConservadora)} />

              <div className="mx-5 h-px bg-[var(--border)] md:mx-6" />

              <LinhaReceita label="Receita Prevista (Contas)" valor={formatCurrency(receitaPrevistaMes)} destaque />
            </div>

          </div>
        )}
      </section>

      {/* ── ESTOQUE CRÍTICO ── */}
      <section className={cn(SECAO, 'px-5 py-4 md:px-6')}>
        <SectionHeading
          index={proxima()}
          label="Estoque Crítico"
          right={estoqueBaixo.length === 0 && (
            <span className="ed-mono flex items-center gap-1.5 border border-[var(--success)] bg-[var(--success-subtle)] px-2 text-[var(--success)]">
              <PackageCheck className="w-3.5 h-3.5" />
              OK
            </span>
          )}
        />

        {estoqueBaixo.length === 0 && (
          <p className="mt-3 text-sm text-[var(--text-tertiary)]">
            Nenhum material com estoque baixo
          </p>
        )}

        {estoqueBaixo.length > 0 && (
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {estoqueBaixo.map(m => (
              <li key={m.id} className="flex justify-between items-center gap-3 py-2 text-sm">
                <span className="min-w-0 truncate text-[var(--text-secondary)]">
                  {m.nome}
                </span>
                <span className="tnum shrink-0 text-[var(--danger)] font-semibold">
                  {m.estoque}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── INDICADORES | VISITAS ── */}
      <div className="grid gap-6 md:gap-8 lg:grid-cols-12">

        <section className={cn(SECAO, 'min-w-0 lg:col-span-8')}>
          <div className="px-5 pt-5 md:px-6">
            <SectionHeading index={proxima()} label="Indicadores Estratégicos" />
          </div>
          <div className="grid divide-y divide-[var(--border)] sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
            <CelulaIndicador icon={Activity} label="Score Operacional" valor={stats.scoreOperacional} unidade="pts" />
            <CelulaIndicador icon={Briefcase} label="Score Comercial" valor={stats.scoreComercial} unidade="pts">
              <p className="ed-mono mt-2 text-[var(--success)]">{stats.fechados} fechados</p>
            </CelulaIndicador>
            <CelulaIndicador
              icon={AlertTriangle}
              label="Tarefas Críticas"
              valor={stats.tarefasCriticas}
              corValor={stats.tarefasCriticas > 0 ? 'var(--danger)' : 'var(--success)'}
              perigo
            >
              {stats.tarefasAtrasadas > 0 && (
                <p className="ed-mono mt-2 text-[var(--warning)]">{stats.tarefasAtrasadas} atrasadas</p>
              )}
            </CelulaIndicador>
          </div>
        </section>

        <section className={cn(SECAO, 'min-w-0 flex flex-col px-5 py-5 md:px-6 lg:col-span-4')}>
          <SectionHeading index={proxima()} label="Visitas Hoje" accent="agenda" />

          {visitasHoje.length === 0 && (
            <div className="mt-4 flex-1">
              <EmptyState title="Nenhuma visita hoje" note="agenda livre" />
            </div>
          )}

          {visitasHoje.length > 0 && (
            <ul className="mt-3 divide-y divide-[var(--border)]">
              {visitasHoje.map(task => {
                const lead = leads.find(l => l.id === task.leadId)
                return (
                  <li key={task.id} className="py-3 flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--text-primary)]">
                        {lead?.nome || "Cliente"}
                      </p>
                      <p className="truncate text-xs text-[var(--text-tertiary)]">
                        {lead?.servico}
                      </p>
                    </div>
                    <span className="ed-mono shrink-0 text-[var(--text-secondary)]">
                      {format(parseISO(task.data), "HH:mm")}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

      </div>

      {/* ── FOCO HOJE | MAIORES OPORTUNIDADES ── */}
      <div className="grid items-start gap-6 md:gap-8 lg:grid-cols-12">

        {temFoco && (
          <section className={cn(SECAO, 'min-w-0 lg:col-span-7')}>
            <div className="px-5 pt-5 md:px-6">
              <SectionHeading
                index={proxima()}
                label="Foco Hoje"
                accent="prioridades"
                right={
                  <span className="ed-mono border border-[var(--border-accent)] bg-[var(--accent-subtle)] px-2 text-[var(--accent)]">
                    {focusTodayLeads.length}
                  </span>
                }
              />
            </div>

            <ul className="mt-2 px-2 pb-2">
              {focusTodayLeads.map((lead, i) => {
                const diasSem = lead.ultimoContato
                  ? differenceInDays(new Date(), parseISO(lead.ultimoContato))
                  : null;
                return (
                  <li
                    key={lead.id}
                    className={cn(i < focusTodayLeads.length - 1 && 'border-b border-[var(--border)]')}
                  >
                    <button
                      onClick={() => {
                        selectLead(lead.id);
                        setActiveModule('leads');
                      }}
                      className="relative w-full flex items-center gap-3 px-3 py-3 min-h-[44px] text-left transition-colors hover:bg-[var(--bg-surface-2)]"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 left-0 w-[3px]"
                        style={{ background: FAIXA_PRIORIDADE[lead.prioridadeLevel as PriorityLevel] ?? FAIXA_PRIORIDADE.baixo }}
                      />
                      <span className="ed-mono hidden w-6 shrink-0 text-[var(--accent)] sm:block">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {lead.nome}
                          </span>
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
                            <span className="ed-mono shrink-0 text-[var(--danger)]">
                              {diasSem}d
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-[var(--text-tertiary)]">
                          {lead.servico}
                        </span>
                      </span>

                      <span className="shrink-0 text-right">
                        <PriorityBadge level={lead.prioridadeLevel} />
                        <span className="tnum block text-xs text-[var(--text-tertiary)] mt-1">
                          {lead.valorOrcado > 0 ? formatCurrency(lead.valorOrcado) : 'Sem valor'}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className={cn(SECAO, 'min-w-0', temFoco ? 'lg:col-span-5' : 'lg:col-span-12')}>
          <div className="px-5 pt-5 md:px-6">
            <SectionHeading index={proxima()} label="Maiores Oportunidades" />
          </div>

          <ul className="mt-2 px-5 pb-2 md:px-6">
            {topOportunidades.map((lead, i) => (
              <li
                key={lead.id}
                className={cn('py-3 flex items-center gap-3', i < topOportunidades.length - 1 && 'border-b border-[var(--border)]')}
              >
                <span className="ed-mono hidden w-6 shrink-0 text-[var(--accent)] sm:block">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--text-primary)]">
                    {lead.nome}
                  </p>
                  <p className="truncate text-xs text-[var(--text-tertiary)]">
                    {lead.servico}
                  </p>
                </div>
                <p className="tnum shrink-0 font-semibold text-[var(--text-primary)]">
                  {lead.valorOrcado > 0 ? formatCurrency(lead.valorOrcado) : <span className="text-sm font-normal text-[var(--text-tertiary)]">Sem valor</span>}
                </p>
              </li>
            ))}
          </ul>
        </section>

      </div>

    </div>

  );

}
