import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '@/components/ui/Toast';
import { HeaderGlobal } from './HeaderGlobal';
import { HelpPanel } from './HelpPanel';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { Menu, LogOut } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { BottomNav } from './BottomNav';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const logout = useStore(state => state.logout);

  const { setupNotifications } = useNotifications();

  useEffect(() => {
    setupNotifications();
  }, []);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserEmail(data.user.email ?? null);
        setUserName(data.user.user_metadata?.full_name ?? null);
      }
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await logout();
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-[var(--bg-app)] overflow-hidden">

      <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} onOpenHelp={() => setHelpOpen(true)} />

      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Header Global */}
        <div className="flex flex-col bg-[var(--bg-sidebar)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between gap-2.5 px-3 py-2 md:px-6 md:py-3">

  <button
    className="md:hidden mr-1 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md"
    style={{ color: 'var(--text-tertiary)' }}
    onClick={() => setSidebarOpen(true)}
    title="Todos os módulos"
    aria-label="Todos os módulos"
    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
  >
    <Menu className="w-5 h-5" />
  </button>

  <HeaderGlobal onOpenHelp={() => setHelpOpen(true)} />

          {/* Avatar dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 min-h-[44px] px-2 rounded-md transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {(userName || userEmail || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {userName || userEmail?.split('@')[0] || 'Usuário'}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-1 w-56 rounded-lg shadow-lg border z-50 py-2"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {userName || userEmail?.split('@')[0] || 'Usuário'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {userEmail}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm min-h-[44px] flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--danger)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 pb-[calc(72px_+_env(safe-area-inset-bottom,0px))] md:p-6">
          {children}
        </main>

        <BottomNav />

      </div>

      <ToastContainer />
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}