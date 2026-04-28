import { useStore } from '@/store/useStore';
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Início',     Icon: LayoutDashboard },
  { id: 'leads',       label: 'Leads',      Icon: Users },
  { id: 'orcamentos',  label: 'Orçamentos', Icon: FileText },
  { id: 'operacional', label: 'Agenda',     Icon: CalendarDays },
  { id: 'ia',          label: 'IA',         Icon: Sparkles },
] as const;

export function BottomNav() {
  const activeModule = useStore(state => state.activeModule);
  const setActiveModule = useStore((state: any) => state.setActiveModule);

  return (
    <nav
      className="md:hidden flex items-stretch border-t"
      style={{
        background: 'var(--bg-sidebar)',
        borderColor: 'var(--border)',
        height: 64,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        flexShrink: 0,
      }}
    >
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const isActive = activeModule === id;
        return (
          <button
            key={id}
            onClick={() => setActiveModule(id)}
            className="flex flex-col items-center justify-center gap-1 flex-1 transition-colors min-h-[44px] border-none bg-transparent cursor-pointer relative"
            style={{ color: isActive ? 'var(--accent)' : 'var(--text-disabled)' }}
          >
            <Icon size={20} />
            <span className="text-[9px] font-semibold tracking-tight leading-none">
              {label}
            </span>
            {isActive && (
              <div
                className="absolute bottom-1.5 rounded-full"
                style={{ width: 4, height: 4, background: 'var(--accent)' }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
