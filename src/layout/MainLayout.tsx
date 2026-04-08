import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '@/components/ui/Toast';
import { HeaderGlobal } from './HeaderGlobal';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logout = useStore(state => state.logout);

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
        <div className="flex items-center justify-between px-6 py-3 bg-[var(--bg-sidebar)] border-b border-[var(--border)]">

  <button
    className="md:hidden mr-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
    onClick={() => setSidebarOpen(true)}
  >
    <Menu className="w-5 h-5" />
  </button>

  <HeaderGlobal />

          <div className="flex items-center gap-4">

            <div className="text-right">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {userName || 'Usuário'}
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

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>

      <ToastContainer />
    </div>
  );
}