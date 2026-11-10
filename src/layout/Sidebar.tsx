import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { cn } from '@/utils/cn';
import featureFlags from '../../feature-flags.json';
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
  HelpCircle,
  HandCoins,
  Truck,
  Package,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
}

interface MenuSection {
  index: string;
  title: string;
  items: MenuItem[];
}

const sections: MenuSection[] = [
  {
    index: '01',
    title: 'Gestão',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'operacional', label: 'Operacional', icon: CalendarDays },
      { id: 'kanban', label: 'Kanban', icon: Kanban },
      { id: 'central', label: 'Central', icon: AlertTriangle },
    ],
  },
  {
    index: '02',
    title: 'Comercial',
    items: [
      { id: 'leads', label: 'Leads', icon: Users },
      // Ocultação temporária pré-lançamento p/ clientes novos — envio com bug de formato
      // LID pendente de correção. Reverter: MODULO_WHATSAPP_VISIVEL: true em feature-flags.json
      ...(featureFlags.MODULO_WHATSAPP_VISIVEL
        ? [{ id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle }]
        : []),
      { id: 'orcamentos', label: 'Orçamentos', icon: FileText },
      { id: 'recibos', label: 'Recibos', icon: Receipt },
      { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
      { id: 'contas-receber', label: 'Contas a Receber', icon: HandCoins },
      // Ocultação temporária pré-lançamento — funcionalidade não vai evoluir agora.
      // Reverter: MODULO_NOTAS_VISIVEL: true em feature-flags.json
      ...(featureFlags.MODULO_NOTAS_VISIVEL
        ? [{ id: 'notas', label: 'Notas', icon: FileCheck }]
        : []),
    ],
  },
  {
    index: '03',
    title: 'Inteligência',
    items: [
      { id: 'ia', label: 'IA Assistente', icon: Sparkles },
    ],
  },
  {
    index: '04',
    title: 'Suprimentos',
    items: [
      { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
      // OCULTO PRA LANÇAMENTO — reativar quando cliente pedir:
      // { id: 'comparador', label: 'Comparador de Preços', icon: DollarSign },
      { id: 'estoque', label: 'Estoque', icon: Package },
    ],
  },
  {
    index: '05',
    title: 'Sistema',
    items: [
      { id: 'settings', label: 'Configurações', icon: SettingsIcon },
      { id: 'ajuda', label: 'Central de Ajuda', icon: HelpCircle },
    ],
  },
];

// Só aparece para quem está na whitelist de admin (useIsAdmin).
const adminSection: MenuSection = {
  index: '06',
  title: 'Admin',
  items: [{ id: 'admin', label: 'Empresas', icon: Building2 }],
};

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenHelp: () => void;
}

export function Sidebar({ mobileOpen, setMobileOpen, onOpenHelp }: SidebarProps) {
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

  const visibleSections = isAdmin ? [...sections, adminSection] : sections;

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  return (
    <>
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed md:relative top-0 left-0 z-50 w-64 bg-[var(--bg-sidebar)] text-white flex flex-col h-screen border-r border-[var(--border)] transition-transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <button
          className="md:hidden absolute top-2 right-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Marca */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-[var(--accent)] text-[var(--bg-app)] text-sm font-bold tracking-tighter">
              VX
            </div>
            <p className="text-xl font-bold leading-none tracking-tight text-[var(--text-primary)]">
              VRTX <span className="text-[var(--accent)]">CRM</span>
            </p>
          </div>
          <div aria-hidden="true" className="mt-5 flex items-center gap-2">
            <span className="h-[2px] w-8 bg-[var(--accent)]" />
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
          {visibleSections.map(section => (
            <div key={section.index}>
              <div className="flex items-center gap-2 px-2 mb-1.5">
                <span className="ed-mono text-[var(--accent)]">{section.index}</span>
                <span className="ed-mono text-[var(--text-tertiary)]">{section.title}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <ul className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          if (item.id === 'ajuda') {
                            onOpenHelp();
                          } else {
                            setActiveModule(item.id);
                          }
                          setMobileOpen(false);
                        }}
                        className={cn(
                          'group relative w-full flex items-center gap-3 px-3 h-[var(--sidebar-item-height)] min-h-[44px] md:min-h-0 text-sm text-left transition-colors duration-150',
                          isActive
                            ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
                        )}
                      >
                        {isActive && <span aria-hidden="true" className="absolute left-0 top-0 h-full w-[3px] bg-[var(--accent)]" />}
                        <Icon
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={cn(
                            'w-[var(--sidebar-icon-size)] h-[var(--sidebar-icon-size)] shrink-0 transition-colors',
                            isActive ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'
                          )}
                        />
                        <span className="flex-1 tracking-tight">{item.label}</span>
                        {isActive && <span aria-hidden="true" className="w-1.5 h-1.5 shrink-0 bg-[var(--accent)]" />}
                        {item.id === 'dashboard' && tarefasCriticas > 0 && (
                          <span className="ed-mono min-w-[20px] px-1 text-center bg-[var(--danger-subtle)] text-[var(--danger)]">
                            {tarefasCriticas}
                          </span>
                        )}
                        {item.id === 'leads' && leadsAtivos > 0 && (
                          <span className="ed-mono min-w-[20px] px-1 text-center bg-[var(--bg-surface-3)] text-[var(--text-secondary)]">
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
        </nav>

        {/* STATUS */}
        <div className="px-5 py-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] motion-safe:animate-pulse" />
            <span className="ed-mono text-[var(--text-secondary)]">Sistema Online</span>
          </div>
        </div>
      </aside>
    </>
  );
}
