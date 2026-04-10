import { useStore } from '@/store/useStore';
import { useDashboardStats } from '@/store/selectors/dashboardSelectors';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Building2, AlertCircle, Calendar } from 'lucide-react';

export function HeaderGlobal() {
  const activeModule = useStore(state => state.activeModule);
  const stats = useDashboardStats();

  const moduleNames: Record<string, string> = {
    dashboard: 'Dashboard Executivo',
    leads: 'Gestão de Leads',
    kanban: 'Pipeline Comercial',
    orcamentos: 'Orçamentos',
    financeiro: 'Financeiro',
    notas: 'Notas Fiscais',
    ia: 'IA Assistente',
    settings: 'Configurações',
    operacional: 'Painel Operacional',
    central: 'Modo Execução',
    'contas-receber': 'Contas a Receber',
    fornecedores: 'Fornecedores',
    comparador: 'Comparador de Preços',
    estoque: 'Estoque',
  };

  const today = format(new Date(), "dd 'de' MMMM yyyy", { locale: ptBR });

  return (
    <header className="flex-1 min-w-0 h-16 bg-[var(--bg-sidebar)] flex items-center justify-between px-2 md:px-6">

      {/* ESQUERDA */}
      <div className="min-w-0">
        <h1 className="text-sm md:text-lg font-semibold text-[var(--text-primary)] tracking-tight">
          {moduleNames[activeModule] ?? 'CRM'}
        </h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5 hidden sm:block">
          {today}
        </p>
      </div>

      {/* DIREITA */}
      <div className="flex items-center gap-6">

        {/* Indicadores rápidos */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--danger-subtle)] text-[var(--danger)]">
            <AlertCircle className="w-3 h-3" /> {stats.tarefasAtrasadas} atrasadas
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--accent-subtle)] text-[var(--accent)]">
            <Calendar className="w-3 h-3" /> {stats.tarefasHoje} hoje
          </span>
        </div>

        {/* Empresa (Multiempresa futuro) */}
        <div className="hidden md:flex items-center gap-2 bg-[var(--bg-surface-2)] border border-[var(--border)] px-3 py-1.5 rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)]">
          <Building2 className="w-4 h-4" />
          FL Art Metal
        </div>

        {/* Notificações */}
        <button className="relative text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors hidden md:block">
          <Bell className="w-5 h-5" />
          {stats.tarefasAtrasadas > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--danger)] rounded-full" />
          )}
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-white text-sm font-semibold">
          G
        </div>

      </div>
    </header>
  );
}