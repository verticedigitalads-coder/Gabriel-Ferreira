import { useStore, useDashboardStats } from '@/store/useStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Building2 } from 'lucide-react';

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
  };

  const today = format(new Date(), "dd 'de' MMMM yyyy", { locale: ptBR });

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      
      {/* ESQUERDA */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          {moduleNames[activeModule] ?? 'CRM'}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {today}
        </p>
      </div>

      {/* DIREITA */}
      <div className="flex items-center gap-6">

        {/* Indicadores rápidos */}
        <div className="hidden md:flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            🔴 {stats.tarefasAtrasadas} atrasadas
          </span>
          <span className="text-gray-600">
            📅 {stats.tarefasHoje} hoje
          </span>
        </div>

        {/* Empresa (Multiempresa futuro) */}
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md text-sm text-gray-700">
          <Building2 className="w-4 h-4" />
          FL Art Metal
        </div>

        {/* Notificações */}
        <button className="relative">
          <Bell className="w-5 h-5 text-gray-600" />
          {stats.tarefasAtrasadas > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          G
        </div>

      </div>
    </header>
  );
}