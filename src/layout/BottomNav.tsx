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
        height: 72,
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
            style={{ color: isActive ? 'var(--accent)' : '#52525b' }}
          >
            <Icon size={20} />
            <span className="text-[11px] font-semibold leading-none">
              {label}
            </span>
            {isActive && (
              <div
                className="absolute top-1 rounded-full"
                style={{ width: 16, height: 3, background: 'var(--accent)' }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
