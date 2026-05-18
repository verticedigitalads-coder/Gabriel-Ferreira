import { useRef } from 'react';
import Fornecedores from '@/modules/suprimentos/Fornecedores';
import ComparadorPrecos from '@/modules/suprimentos/ComparadorPrecos';
import Estoque from '@/modules/suprimentos/Estoque';
import { supabase } from '@/lib/supabase';
import { ensureWorkspaceForUser } from '@/lib/supabaseWorkspace';
import { ensureBackendWarm } from '@/lib/backendWarmup';
import { Central } from '@/modules/central/Central';
import { useEffect, Suspense, lazy, useState } from 'react';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/layout/MainLayout';
import { AuthPage } from '@/modules/auth/AuthPage';

// Lazy load modules for code splitting
const Dashboard = lazy(() =>
  import('@/modules/dashboard/Dashboard').then((m) => ({
    default: m.Dashboard,
  })),
);
const LeadsList = lazy(() =>
  import('@/modules/leads/LeadsList').then((m) => ({ default: m.LeadsList })),
);
const Kanban = lazy(() =>
  import('@/modules/kanban/Kanban').then((m) => ({ default: m.Kanban })),
);
const Orcamentos = lazy(() =>
  import('@/modules/orcamentos/Orcamentos').then((m) => ({
    default: m.Orcamentos,
  })),
);
const Financeiro = lazy(() =>
  import('@/modules/financeiro/Financeiro').then((m) => ({
    default: m.Financeiro,
  })),
);
const Notas = lazy(() =>
  import('@/modules/notas/Notas').then((m) => ({ default: m.Notas })),
);
const IAAssistente = lazy(() =>
  import('@/modules/ia/IAAssistente').then((m) => ({
    default: m.IAAssistente,
  })),
);
const Settings = lazy(() =>
  import('@/modules/settings/Settings').then((m) => ({ default: m.Settings })),
);
const Operacional = lazy(() =>
  import('@/modules/operacional/Operacional').then((m) => ({
    default: m.Operacional,
  })),
);
const ContasReceber = lazy(() =>
  import('@/modules/contasReceber/ContasReceber').then((m) => ({
    default: m.ContasReceber,
  })),
);
const Recibos = lazy(() =>
  import('@/modules/recibos/Recibos').then((m) => ({ default: m.Recibos })),
);
const AdminEmpresas = lazy(() =>
  import('@/modules/admin/AdminEmpresas').then((m) => ({
    default: m.AdminEmpresas,
  })),
);
const WhatsApp = lazy(() =>
  import('@/modules/whatsapp/WhatsApp').then((m) => ({
    default: m.WhatsApp,
  })),
);

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full" style={{ background: '#0f1117' }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: '2px solid rgba(255,106,0,0.2)', borderTopColor: '#ff6a00' }}
        />
        <p className="text-sm" style={{ color: '#a0a0b0' }}>Carregando...</p>
      </div>
    </div>
  );
}

function ModuleRouter() {
  const activeModule = useStore((state) => state.activeModule);

  return (
    <Suspense fallback={<LoadingFallback />}>
      {activeModule === 'dashboard' && <Dashboard />}
      {activeModule === 'leads' && <LeadsList />}
      {activeModule === 'kanban' && <Kanban />}
      {activeModule === 'orcamentos' && <Orcamentos />}
      {activeModule === 'financeiro' && <Financeiro />}
      {activeModule === 'notas' && <Notas />}
      {activeModule === 'ia' && <IAAssistente />}
      {activeModule === 'settings' && <Settings />}
      {activeModule === 'operacional' && <Operacional />}
      {activeModule === 'central' && <Central />}
      {activeModule === 'contas-receber' && <ContasReceber />}
      {activeModule === 'recibos' && <Recibos />}

      {activeModule === 'fornecedores' && <Fornecedores />}
      {activeModule === 'comparador' && <ComparadorPrecos />}
      {activeModule === 'estoque' && <Estoque />}
      {activeModule === 'whatsapp' && <WhatsApp />}
      {activeModule === 'admin' && <AdminEmpresas />}
    </Suspense>
  );
}

export function App() {
  const initialize = useStore((state) => state.initialize);
  const setWorkspaceId = useStore((state) => state.setWorkspaceId);
  const workspaceId = useStore((state) => state.workspaceId);
  const isLoading = useStore((state) => state.isLoading);
  const realtimeStarted = useRef(false);

  const [session, setSession] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // 🔐 Verifica sessão Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔥 Acorda o backend no Render antes de qualquer request
  useEffect(() => {
    ensureBackendWarm();
  }, []);

  // 🚀 Inicializa store apenas se estiver autenticado
  useEffect(() => {
    const init = async () => {
      if (!session) return;

      // 🔒 Evita iniciar 2x
      if (realtimeStarted.current) return;

      try {
        const workspaceId = await ensureWorkspaceForUser();

        if (!workspaceId) {
          console.warn('Usuário sem workspace — fazendo logout');
          await supabase.auth.signOut();
          return;
        }

        setWorkspaceId(workspaceId);
        await initialize(workspaceId);

        useStore.getState().startRealtime();

        realtimeStarted.current = true; // ✅ trava aqui
      } catch (error) {
        console.error('Erro na inicialização:', error);
        await supabase.auth.signOut();
      }
    };

    init();
  }, [session]);

  // Ao trocar workspace, permite que startRealtime reinicialize
  useEffect(() => {
    realtimeStarted.current = false;
  }, [workspaceId]);

  if (!authChecked) {
    return null;
  }

  // 🔒 Se não estiver logado → Tela de Login
  if (!session) {
    return <AuthPage />;
  }

  // ⏳ Loading interno do CRM
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0f1117' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full animate-spin"
            style={{ border: '4px solid rgba(255,106,0,0.2)', borderTopColor: '#ff6a00' }}
          />
          <div className="text-center">
            <h1 className="text-xl font-semibold" style={{ color: '#e0e0e8' }}>
              Vértice Digital
            </h1>
            <p className="text-sm mt-1" style={{ color: '#a0a0b0' }}>Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Sistema carregado
  return (
    <MainLayout>
      <ModuleRouter />
    </MainLayout>
  );
}
