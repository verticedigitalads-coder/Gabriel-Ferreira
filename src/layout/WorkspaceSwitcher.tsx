import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { BottomSheet } from '@/components/ui/Modal';
import { Building2, ChevronDown, Check } from 'lucide-react';

const ACTIVE_WORKSPACE_KEY = 'vrtx_active_workspace_id';

interface WorkspaceOption {
  id: string;
  nome: string;
}

interface WorkspaceSwitcherProps {
  /** 'desktop' = popover atual (inalterado). 'mobile' = gatilho compacto + bottom sheet. */
  variant?: 'desktop' | 'mobile';
}

export function WorkspaceSwitcher({ variant = 'desktop' }: WorkspaceSwitcherProps) {
  const workspaceId = useStore((s) => s.workspaceId);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadWorkspaces() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userData.user.id);

      const ids = (memberships || []).map((m: any) => m.workspace_id);
      if (ids.length === 0) return;

      const [{ data: settingsRows }, { data: workspacesRows }] = await Promise.all([
        supabase.from('workspace_settings').select('workspace_id, value').eq('key', 'empresa_nome').in('workspace_id', ids),
        supabase.from('workspaces').select('id, nome').in('id', ids),
      ]);

      const nomeMap: Record<string, string> = {};
      (workspacesRows || []).forEach((w: any) => { nomeMap[w.id] = w.nome; });
      (settingsRows || []).forEach((s: any) => { if (s.value) nomeMap[s.workspace_id] = s.value; });

      setWorkspaces(ids.map((id: string) => ({ id, nome: nomeMap[id] || 'Empresa' })));
    }

    loadWorkspaces();
  }, []);

  // Só o popover desktop fecha por clique-fora; no mobile quem fecha é o backdrop/X/Esc do sheet.
  useEffect(() => {
    if (!open || variant !== 'desktop') return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, variant]);

  function handleSelect(id: string) {
    if (id === workspaceId) {
      setOpen(false);
      return;
    }
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    window.location.reload();
  }

  const activeNome = workspaces.find((w) => w.id === workspaceId)?.nome || 'Empresa';
  const multi = workspaces.length >= 2;

  // Mobile: empresa ativa como info secundária no header + bottom sheet ao tocar.
  // Mesma trava do desktop — só quem tem 2+ workspaces monta o seletor.
  if (variant === 'mobile') {
    if (!multi) return null;

    // Lista vem de uma const para que um filtro/busca futuro seja uma linha só.
    const visible = workspaces;

    return (
      <>
        <button
          onClick={() => setOpen(true)}
          aria-label="Trocar empresa"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex items-center gap-1 min-w-0 max-w-full min-h-[44px] px-1 rounded-md text-xs text-[var(--text-tertiary)] transition-colors"
        >
          <span className="truncate min-w-0">{activeNome}</span>
          <ChevronDown className="w-3 h-3 shrink-0" />
        </button>

        <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Trocar empresa">
          {visible.map((w) => {
            const isActive = w.id === workspaceId;
            return (
              <button
                key={w.id}
                onClick={() => handleSelect(w.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left min-h-[56px] border-b border-[var(--border)]"
              >
                <span className="flex-1 min-w-0">
                  <span
                    className="block text-sm truncate"
                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isActive ? 600 : 400 }}
                  >
                    {w.nome}
                  </span>
                  {isActive && (
                    <span className="block text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      Empresa atual
                    </span>
                  )}
                </span>
                {isActive && <Check className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />}
              </button>
            );
          })}
        </BottomSheet>
      </>
    );
  }

  if (!multi) {
    return (
      <div className="hidden md:flex items-center gap-2 bg-[var(--bg-surface-2)] border border-[var(--border)] px-3 py-1.5 rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)]">
        <Building2 className="w-4 h-4" />
        {activeNome}
      </div>
    );
  }

  return (
    <div className="relative block" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Trocar empresa"
        aria-expanded={open}
        className="flex items-center gap-2 bg-[var(--bg-surface-2)] border border-[var(--border)] px-3 py-1.5 rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)] transition-colors min-h-[44px] min-w-0 max-w-full"
      >
        <Building2 className="w-4 h-4 shrink-0" />
        <span className="truncate">{activeNome}</span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
      </button>

      {open && (
        <div
          className="absolute"
          style={{
            top: '100%',
            left: 0,
            zIndex: 200,
            marginTop: 8,
            minWidth: 'min(220px, calc(100vw - 32px))',
            maxWidth: 'calc(100vw - 32px)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            animation: 'fadeSlideDown 0.15s ease-out',
            overflow: 'hidden',
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Trocar empresa
            </p>
          </div>
          <div>
            {workspaces.map((w, i) => {
              const isActive = w.id === workspaceId;
              return (
                <button
                  key={w.id}
                  onClick={() => handleSelect(w.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors min-h-[44px]"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span
                    className="flex-1 text-sm truncate"
                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isActive ? 600 : 400 }}
                  >
                    {w.nome}
                  </span>
                  {isActive && <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
