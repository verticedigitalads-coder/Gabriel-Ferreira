import { useStore } from '@/store/useStore';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { cn } from '@/utils/cn';
import { AlertTriangle, X, Building2 } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Kanban,
  FileText,
  DollarSign,
  FileCheck,
  Sparkles,
  Settings as SettingsIcon,
  CalendarDays,
  Receipt,
  MessageCircle,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
}

const sections: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Gestão',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'operacional', label: 'Operacional', icon: CalendarDays },
      { id: 'kanban', label: 'Kanban', icon: Kanban },
      { id: 'central', label: 'Central', icon: AlertTriangle },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { id: 'leads', label: 'Leads', icon: Users },
      { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
      { id: 'orcamentos', label: 'Orçamentos', icon: FileText },
      { id: 'recibos', label: 'Recibos', icon: Receipt },
      { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
      { id: 'contas-receber', label: 'Contas a Receber', icon: Receipt },
      { id: 'notas', label: 'Notas', icon: FileCheck },
    ],
  },
  {
    title: 'Inteligência',
    items: [
      { id: 'ia', label: 'IA Assistente', icon: Sparkles },
    ],
  },
  
  {
  title: 'Suprimentos',
  items: [
    { id: 'fornecedores', label: 'Fornecedores', icon: Users },
    // OCULTO PRA LANÇAMENTO — reativar quando cliente pedir:
    // { id: 'comparador', label: 'Comparador de Preços', icon: DollarSign },
    { id: 'estoque', label: 'Estoque', icon: FileText },
  ],
},
  {
    title: 'Sistema',
    items: [
      { id: 'settings', label: 'Configurações', icon: SettingsIcon },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const activeModule = useStore(state => state.activeModule);
  const setActiveModule = useStore((state: any) => state.setActiveModule);
  const isAdmin = useIsAdmin();
  const leads = useStore(state => state.leads);
  const tarefasCriticas = leads.filter(l =>
    l.prioridadeLevel === 'critico' && l.status !== 'fechado' && l.status !== 'perdido'
  ).length;
  const leadsAtivos = leads.filter(l =>
    l.status !== 'fechado' && l.status !== 'perdido'
  ).length;

  return (
    <aside
  className={cn(
    "fixed md:relative top-0 left-0 z-40 w-64 bg-[var(--bg-sidebar)] text-white flex flex-col h-screen border-r border-[var(--border)] transition-transform",
    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
  )}
>
<button
  className="md:hidden absolute top-2 right-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
  onClick={() => setMobileOpen(false)}
>
  <X className="w-5 h-5" />
</button>

  {/* Logo */}
<div className="px-5 py-5 border-b border-[var(--border)] bg-[var(--bg-sidebar)]">
  <div className="flex items-center gap-4">

    <div className="w-10 h-10 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white font-semibold text-sm shadow-lg">
      VX
    </div>

    <div className="leading-tight">
      <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
        VRTX
      </h1>
      <p className="text-xs text-[var(--text-tertiary)] font-medium">
        Gestão Comercial Inteligente
      </p>
    </div>

  </div>
</div>

  {/* MENU */}
  <nav className="flex-1 overflow-y-auto py-6 space-y-8">
    {sections.map(section => (
      <div key={section.title}>
        <p
          className="px-6 font-semibold uppercase mb-3"
          style={{ fontSize: '10px', letterSpacing: '0.05em', color: 'var(--text-tertiary)', opacity: 0.7 }}
        >
          {section.title}
        </p>

        <ul className="space-y-0.5 px-3">
          {section.items.map(item => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveModule(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 h-[var(--sidebar-item-height)] min-h-[44px] md:min-h-0 rounded-[var(--radius-md)] text-sm transition-all duration-150',
                    !isActive && 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
                  )}
                  style={isActive ? {
                    background: 'var(--accent-subtle)',
                    borderLeft: '3px solid var(--accent)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                  } : {
                    borderLeft: '3px solid transparent',
                  }}
                >
                  <Icon className="w-[var(--sidebar-icon-size)] h-[var(--sidebar-icon-size)] opacity-80 shrink-0" />
                  <span className="tracking-tight">{item.label}</span>
                  {item.id === 'dashboard' && tarefasCriticas > 0 && (
                    <span
                      className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}
                    >
                      {tarefasCriticas}
                    </span>
                  )}
                  {item.id === 'leads' && leadsAtivos > 0 && (
                    <span
                      className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--bg-surface-3)', color: 'var(--text-tertiary)' }}
                    >
                      {leadsAtivos}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ))}

    {isAdmin && (
      <div>
        <p
          className="px-6 font-semibold uppercase mb-3"
          style={{ fontSize: '10px', letterSpacing: '0.05em', color: 'var(--text-tertiary)', opacity: 0.7 }}
        >
          Admin
        </p>
        <ul className="space-y-0.5 px-3">
          <li>
            <button
              onClick={() => setActiveModule('admin')}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 h-[var(--sidebar-item-height)] min-h-[44px] md:min-h-0 rounded-[var(--radius-md)] text-sm transition-all duration-150',
                activeModule !== 'admin' && 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
              )}
              style={activeModule === 'admin' ? {
                background: 'var(--accent-subtle)',
                borderLeft: '3px solid var(--accent)',
                color: 'var(--accent)',
                fontWeight: 600,
              } : {
                borderLeft: '3px solid transparent',
              }}
            >
              <Building2 className="w-[var(--sidebar-icon-size)] h-[var(--sidebar-icon-size)] opacity-80 shrink-0" />
              <span className="tracking-tight">Empresas</span>
            </button>
          </li>
        </ul>
      </div>
    )}
  </nav>

  {/* STATUS */}
  <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-sidebar)]">
    <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
      <div className="w-2 h-2 bg-[var(--success)] rounded-full animate-pulse" />
      Sistema Online
    </div>
  </div>
</aside>
  );
}