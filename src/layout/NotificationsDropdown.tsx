import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useDashboardStats } from '@/store/selectors/dashboardSelectors';
import { useNotifications } from '@/hooks/useNotifications';
import { differenceInDays, parseISO } from 'date-fns';
import { Bell, AlertCircle, DollarSign, CheckSquare, Package } from 'lucide-react';

export function NotificationsDropdown() {
  const leads = useStore(state => state.leads);
  const materiais = useStore(state => state.materiais);
  const contasReceber = useStore(state => state.contasReceber);
  const setActiveModule = useStore(state => state.setActiveModule);
  const stats = useDashboardStats();
  const { permissionGranted } = useNotifications();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const now = new Date();
  const leadsCount = leads.filter(l =>
    l.prioridadeLevel === 'critico' &&
    l.status !== 'fechado' &&
    l.status !== 'perdido' &&
    l.ultimoContato != null &&
    differenceInDays(now, parseISO(l.ultimoContato)) >= 5
  ).length;
  const financeiroCount = contasReceber.filter(c => c.status === 'atrasado').length;
  const tarefasCount = stats.tarefasHoje + stats.tarefasAtrasadas;
  const estoqueCount = materiais.filter(m => m.estoque <= m.estoque_minimo).length;

  const categories = [
    { key: 'leads', icon: AlertCircle, color: 'var(--danger)', subtle: 'var(--danger-subtle)', label: 'Leads críticos', count: leadsCount, module: 'leads' },
    { key: 'financeiro', icon: DollarSign, color: 'var(--warning)', subtle: 'var(--warning-subtle)', label: 'Contas atrasadas', count: financeiroCount, module: 'contas-receber' },
    { key: 'tarefas', icon: CheckSquare, color: 'var(--accent)', subtle: 'var(--accent-subtle)', label: 'Tarefas pendentes', count: tarefasCount, module: 'operacional' },
    { key: 'estoque', icon: Package, color: 'var(--info)', subtle: 'var(--info-subtle)', label: 'Estoque baixo', count: estoqueCount, module: 'estoque' },
  ];

  const total = leadsCount + financeiroCount + tarefasCount + estoqueCount;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Notificações"
        aria-expanded={open}
        title={permissionGranted ? `${total} notificação(ões)` : 'Notificações desativadas'}
        className="relative text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
      >
        <Bell className="w-5 h-5" />
        {total > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold rounded-full px-1"
            style={{ background: 'var(--danger)', color: 'var(--accent-foreground)' }}
          >
            {total > 99 ? '99+' : total}
          </span>
        )}
        {!permissionGranted && total === 0 && (
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
            style={{ background: 'var(--warning)' }}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute"
          style={{
            top: '100%',
            right: 0,
            zIndex: 200,
            marginTop: 8,
            minWidth: 288,
            maxWidth: 'calc(100vw - 2rem)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            animation: 'fadeSlideDown 0.15s ease-out',
            overflow: 'hidden',
          }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Notificações
            </p>
          </div>

          {total === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Tudo em dia ✓
              </p>
            </div>
          ) : (
            <div>
              {categories.map((cat, i) => {
                const Icon = cat.icon;
                const empty = cat.count === 0;
                return (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setActiveModule(cat.module);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors min-h-[44px]"
                    style={{
                      borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                      opacity: empty ? 0.5 : 1,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      className="flex items-center justify-center rounded-md shrink-0"
                      style={{ width: 28, height: 28, background: cat.subtle }}
                    >
                      <Icon style={{ width: 14, height: 14, color: cat.color }} />
                    </div>
                    <span className="flex-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {cat.label}
                    </span>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: empty ? 'var(--text-tertiary)' : cat.color }}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
