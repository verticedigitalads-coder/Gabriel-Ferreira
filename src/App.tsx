import { useRef } from 'react';
import Fornecedores from '@/modules/suprimentos/Fornecedores';
import ComparadorPrecos from '@/modules/suprimentos/ComparadorPrecos';
import Estoque from '@/modules/suprimentos/Estoque';
import { supabase } from '@/lib/supabase';
import { ensureWorkspaceForUser } from '@/lib/supabaseWorkspace';
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

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Carregando...</p>
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

      {activeModule === 'fornecedores' && <Fornecedores />}
      {activeModule === 'comparador' && <ComparadorPrecos />}
      {activeModule === 'estoque' && <Estoque />}
    </Suspense>
  );
}

export function App() {
  const initialize = useStore((state) => state.initialize);
  const setWorkspaceId = useStore((state) => state.setWorkspaceId);
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
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Vértice Digital
            </h1>
            <p className="text-sm text-gray-500 mt-1">Carregando dados...</p>
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
