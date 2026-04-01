import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { supabase } from '@/lib/supabase';

import { createLeadSlice } from './slices/leadSlice';
import { createOrcamentoSlice } from './slices/orcamentoSlice';
import { createFinanceiroSlice } from './slices/financeiroSlice';
import { createNotaSlice } from './slices/notaSlice';
import { createOperacionalSlice } from './slices/operacionalSlice';
import { createUISlice } from './slices/uiSlice';

import { createFornecedorSlice } from './slices/fornecedorSlice';
import { createCotacaoMaterialSlice } from './slices/cotacaoMaterialSlice';
import { createMaterialSlice } from './slices/materialSlice';
import { createConsumoMaterialSlice } from './slices/consumoMaterialSlice';
import { createFormSlice } from './slices/formSlice';
let realtimeStarted = false;

type StoreState = {
  startRealtime: () => void;
  setWorkspaceId: (id: string) => void;
  workspaceId: string | null;

  leads: any[];
  addLead: (data: any) => Promise<any>;
  updateLead: (id: string, data: any) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;

  orcamentos: any[];
  addOrcamento: (data: any) => Promise<any>;
  updateOrcamento: (id: string, data: any) => Promise<void>;
  deleteOrcamento: (id: string) => Promise<void>;

  transactions: any[];
  fetchTransactions: () => Promise<void>;
  addTransaction: (data: any) => Promise<any>;
  updateTransaction: (id: string, data: any) => Promise<any>;
  deleteTransaction: (id: string) => Promise<void>;

  notas: any[];
  operacionalTasks: any[];

  selectedLeadId: string | null;
  activeModule: string;

  addToast: (data: any) => void;
  addOperacionalTask: (data: any) => Promise<void>;

  filters: any;
  setFilter: (filter: any) => void;
  clearFilters: () => void;

  initialize: (workspaceId: string) => Promise<void>;
  logout: () => Promise<void>;

  isLoading: boolean;
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // ================= CORE STATE =================

      workspaceId: null,

      metaMensal: 100000,

      filters: {
        status: 'all',
        temperatura: 'all',
        prioridadeLevel: 'all',
        search: '',
        analysisStatus: 'all',
      },

      isLoading: true,

      // ================= SLICES =================

      ...(createLeadSlice as any)(set, get),
      ...(createOrcamentoSlice as any)(set, get),
      ...(createFinanceiroSlice as any)(set, get),
      ...(createNotaSlice as any)(set, get),
      ...(createOperacionalSlice as any)(set, get),
      ...(createUISlice as any)(set, get),

      ...(createFornecedorSlice as any)(set, get),
      ...(createCotacaoMaterialSlice as any)(set, get),
      ...(createMaterialSlice as any)(set, get),
      ...(createConsumoMaterialSlice as any)(set, get),

      ...(createFormSlice as any)(set, get),

      // ================= INITIALIZE =================

      initialize: async (workspaceId: string) => {
        try {
          set({ isLoading: true });

          if (!workspaceId) {
            set({ isLoading: false });
            return;
          }

          const [leadsRes, orcamentosRes, tasksRes, transactionsRes] =
            await Promise.all([
              supabase
                .from('leads')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false }),

              supabase
                .from('orcamentos')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false }),

              supabase
                .from('operacional_tasks')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false }),

              supabase
                .from('transactions')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false }),
            ]);

          const formattedOrcamentos = (orcamentosRes.data || []).map(
            (o: any) => ({
              id: o.id,
              workspaceId: o.workspace_id,
              leadId: o.lead_id,
              numero: o.numero,
              itens: o.itens,
              subtotal: o.subtotal,
              desconto: o.desconto,
              total: o.total,
              multiplicador: o.multiplicador ?? 1,
              status: o.status,
              observacoes: o.observacoes,
              validadeEmDias: o.validade_em_dias,
              historico: o.historico,
              createdAt: o.created_at,
              updatedAt: o.updated_at,
            }),
          );

          set({
            workspaceId,
            leads: leadsRes.data || [],
            orcamentos: formattedOrcamentos,
            operacionalTasks: tasksRes.data || [],
            transactions: transactionsRes.data || [],
            isLoading: false,
          });
        } catch (error) {
          console.error('INIT ERROR:', error);
          set({ isLoading: false });
        }
      },

      // ================= REALTIME =================

      startRealtime: () => {
        if (realtimeStarted) {
          console.log('⛔ Realtime já iniciado');
          return;
        }

        const workspaceId = get().workspaceId;
        if (!workspaceId) return;

        realtimeStarted = true;

        console.log('🚀 Iniciando realtime...');

        // ================= LEADS =================
        supabase
          .channel('realtime-leads')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'leads',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            (payload: any) => {
              set((state: any) => {
                const leads = state.leads || [];

                if (payload.eventType === 'INSERT') {
                  if (leads.find((l: any) => l.id === payload.new.id)) {
                    return state;
                  }

                  return {
                    leads: [payload.new, ...leads],
                  };
                }

                if (payload.eventType === 'UPDATE') {
                  return {
                    leads: leads.map((l: any) =>
                      l.id === payload.new.id ? payload.new : l,
                    ),
                  };
                }

                if (payload.eventType === 'DELETE') {
                  return {
                    leads: leads.filter((l: any) => l.id !== payload.old.id),
                  };
                }

                return state;
              });
            },
          )
          .subscribe();

        // ================= ORÇAMENTOS =================
        supabase
          .channel('realtime-orcamentos')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orcamentos',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            (payload: any) => {
              const format = (o: any) => ({
                id: o.id,
                workspaceId: o.workspace_id,
                leadId: o.lead_id,
                numero: o.numero,
                itens: o.itens,
                subtotal: o.subtotal,
                desconto: o.desconto,
                total: o.total,
                multiplicador: o.multiplicador ?? 1,
                status: o.status,
                observacoes: o.observacoes,
                validadeEmDias: o.validade_em_dias,
                historico: o.historico,
                createdAt: o.created_at,
                updatedAt: o.updated_at,
              });

              set((state: any) => {
                const orcamentos = state.orcamentos || [];

                // ================= INSERT =================
                if (payload.eventType === 'INSERT') {
                  const exists = orcamentos.find(
                    (o: any) => o.id === payload.new.id,
                  );

                  if (exists) return state;

                  return {
                    orcamentos: [format(payload.new), ...orcamentos],
                  };
                }

                // ================= UPDATE =================
                if (payload.eventType === 'UPDATE') {
                  return {
                    orcamentos: orcamentos.map((o: any) =>
                      o.id === payload.new.id ? format(payload.new) : o,
                    ),
                  };
                }

                // ================= DELETE =================
                if (payload.eventType === 'DELETE') {
                  return {
                    orcamentos: orcamentos.filter(
                      (o: any) => o.id !== payload.old.id,
                    ),
                  };
                }

                return state;
              });
            },
          )
          .subscribe();

        // ================= OPERACIONAL TASKS =================
        supabase
          .channel('realtime-operacional')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'operacional_tasks',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            (payload: any) => {
              set((state: any) => {
                const tasks = state.operacionalTasks || [];

                if (payload.eventType === 'INSERT') {
                  const exists = tasks.find(
                    (t: any) => t.id === payload.new.id,
                  );
                  if (exists) return state;

                  return {
                    operacionalTasks: [payload.new, ...tasks],
                  };
                }

                if (payload.eventType === 'UPDATE') {
                  return {
                    operacionalTasks: tasks.map((t: any) =>
                      t.id === payload.new.id ? payload.new : t,
                    ),
                  };
                }

                if (payload.eventType === 'DELETE') {
                  return {
                    operacionalTasks: tasks.filter(
                      (t: any) => t.id !== payload.old.id,
                    ),
                  };
                }

                return state;
              });
            },
          )
          .subscribe();

        // ================= FINANCEIRO =================
        supabase
          .channel('realtime-transactions')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'transactions',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            (payload: any) => {
              console.log('🔥 TRANSACTION REALTIME:', payload);

              set((state: any) => {
                const transactions = state.transactions || [];

                const format = (t: any) => ({
                  id: t.id,
                  workspaceId: t.workspace_id,
                  leadId: t.lead_id,
                  tipo: t.tipo,
                  descricao: t.descricao,
                  valor: t.valor,
                  data: t.data,
                  categoria: t.categoria,
                  observacoes: t.observacoes,
                  createdAt: t.created_at,
                  updatedAt: t.updated_at,
                });

                // proteção
                if (!payload?.new && payload.eventType !== 'DELETE')
                  return state;

                if (payload.eventType === 'INSERT') {
                  const exists = transactions.find(
                    (t: any) => t.id === payload.new.id,
                  );
                  if (exists) return state;

                  return {
                    transactions: [format(payload.new), ...transactions].sort(
                      (a: any, b: any) =>
                        new Date(b.data).getTime() - new Date(a.data).getTime(),
                    ),
                  };
                }

                if (payload.eventType === 'UPDATE') {
                  return {
                    transactions: transactions.map((t: any) =>
                      t.id === payload.new.id ? format(payload.new) : t,
                    ),
                  };
                }

                if (payload.eventType === 'DELETE') {
                  return {
                    transactions: transactions.filter(
                      (t: any) => t.id !== payload.old.id,
                    ),
                  };
                }

                return state;
              });
            },
          )
          .subscribe((status) => {
            console.log('📡 TRANSACTION STATUS:', status);
          });
      },

      // ================= WORKSPACE =================

      setWorkspaceId: (id: string) => {
        set({ workspaceId: id });
      },

      // ================= FILTERS =================

      setFilter: (filter: any) =>
        set((state: any) => ({
          filters: { ...state.filters, ...filter },
        })),

      clearFilters: () =>
        set({
          filters: {
            status: 'all',
            temperatura: 'all',
            prioridadeLevel: 'all',
            search: '',
            analysisStatus: 'all',
          },
        }),

      // ================= LOGOUT =================

      logout: async () => {
        set({
          leads: [],
          orcamentos: [],
          transactions: [],
          notas: [],
          operacionalTasks: [],
          selectedLeadId: null,
          activeModule: 'dashboard',
        });
      },
    }),
    {
      name: 'crm-storage',

      partialize: (state) => ({
        activeModule: state.activeModule,
        filters: state.filters,
        selectedLeadId: state.selectedLeadId,
      }),
    },
  ),
);
