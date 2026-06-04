import { useStore } from '@/store/useStore';
import { useDefaultSettings } from '@/hooks/useDefaultSettings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Building2 } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';

export function HeaderGlobal() {
  const activeModule = useStore(state => state.activeModule);
  const { empresaNome } = useDefaultSettings();

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
        <h1 className="text-base md:text-lg font-semibold text-[var(--text-primary)] tracking-tight truncate">
          {moduleNames[activeModule] ?? 'CRM'}
        </h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
          {today}
        </p>
      </div>

      {/* DIREITA */}
      <div className="flex items-center" style={{ gap: 10 }}>

        {/* Empresa (workspace selector) */}
        <div className="hidden md:flex items-center gap-2 bg-[var(--bg-surface-2)] border border-[var(--border)] px-3 py-1.5 rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)]">
          <Building2 className="w-4 h-4" />
          {empresaNome || 'Empresa'}
        </div>

        {/* Notificações */}
        <NotificationsDropdown />

      </div>
    </header>
  );
}