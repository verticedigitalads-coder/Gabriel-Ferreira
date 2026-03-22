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

type StoreState = {
  startRealtime: () => void;
  setWorkspaceId: (id: string) => void;
  workspaceId: string | null;

  leads: any[];
  addLead: (data: any) => Promise<any>;
  updateLead: (id: string, data: any) => Promise<void>;

  orcamentos: any[];
  addOrcamento: (data: any) => Promise<any>;
  updateOrcamento: (id: string, data: any) => Promise<void>;
  deleteOrcamento: (id: string) => Promise<void>;

  transactions: any[];
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

          const [leadsRes, orcamentosRes] = await Promise.all([
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
            isLoading: false,
          });
        } catch (error) {
          console.error('INIT ERROR:', error);
          set({ isLoading: false });
        }
      },

      // ================= REALTIME =================

      startRealtime: () => {
        const workspaceId = get().workspaceId;

        if (!workspaceId) return;

        console.log('🔌 Realtime conectado');

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
              const leads = get().leads;

              if (payload.eventType === 'INSERT') {
                if (leads.find((l) => l.id === payload.new.id)) return;
                set({ leads: [payload.new, ...leads] });
              }

              if (payload.eventType === 'UPDATE') {
                set({
                  leads: leads.map((l) =>
                    l.id === payload.new.id ? payload.new : l,
                  ),
                });
              }

              if (payload.eventType === 'DELETE') {
                set({
                  leads: leads.filter((l) => l.id !== payload.old.id),
                });
              }
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
              const orcamentos = get().orcamentos;

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

              if (payload.eventType === 'INSERT') {
                if (orcamentos.find((o) => o.id === payload.new.id)) return;
                set({ orcamentos: [format(payload.new), ...orcamentos] });
              }

              if (payload.eventType === 'UPDATE') {
                set({
                  orcamentos: orcamentos.map((o) =>
                    o.id === payload.new.id ? format(payload.new) : o,
                  ),
                });
              }

              if (payload.eventType === 'DELETE') {
                set({
                  orcamentos: orcamentos.filter((o) => o.id !== payload.old.id),
                });
              }
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
              console.log('Realtime tarefas:', payload);

              const tasks = get().operacionalTasks;

              if (payload.eventType === 'INSERT') {
                if (tasks.find((t) => t.id === payload.new.id)) return;

                set({
                  operacionalTasks: [payload.new, ...tasks],
                });
              }

              if (payload.eventType === 'UPDATE') {
                set({
                  operacionalTasks: tasks.map((t) =>
                    t.id === payload.new.id ? payload.new : t,
                  ),
                });
              }

              if (payload.eventType === 'DELETE') {
                set({
                  operacionalTasks: tasks.filter(
                    (t) => t.id !== payload.old.id,
                  ),
                });
              }
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
              console.log('Realtime financeiro:', payload);

              const transactions = get().transactions;

              if (payload.eventType === 'INSERT') {
                if (transactions.find((t: any) => t.id === payload.new.id))
                  return;

                set({
                  transactions: [payload.new, ...transactions],
                });
              }

              if (payload.eventType === 'UPDATE') {
                set({
                  transactions: transactions.map((t: any) =>
                    t.id === payload.new.id ? payload.new : t,
                  ),
                });
              }

              if (payload.eventType === 'DELETE') {
                set({
                  transactions: transactions.filter(
                    (t: any) => t.id !== payload.old.id,
                  ),
                });
              }
            },
          )
          .subscribe();
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
