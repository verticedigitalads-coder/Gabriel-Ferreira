import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '@/components/ui/Toast';
import { HeaderGlobal } from './HeaderGlobal';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Menu } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { BottomNav } from './BottomNav';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

      <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />

      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Header Global */}
        <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3 bg-[var(--bg-sidebar)] border-b border-[var(--border)]">

  <button
    className="md:hidden mr-1 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md"
    style={{ color: 'var(--text-tertiary)' }}
    onClick={() => setSidebarOpen(true)}
    title="Todos os módulos"
    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
  >
    <Menu className="w-5 h-5" />
  </button>

  <HeaderGlobal />

          <div className="flex items-center gap-2 md:gap-4">

            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {userName || userEmail?.split('@')[0] || 'Usuário'}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {userEmail}
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
            >
              Sair
            </Button>

          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>

        <BottomNav />

      </div>

      <ToastContainer />
    </div>
  );
}