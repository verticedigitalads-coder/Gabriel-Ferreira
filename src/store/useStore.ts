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
import { createContasReceberSlice } from './slices/contasReceberSlice';
import { createReciboSlice } from './slices/reciboSlice';
import { createSettingsSlice, type WorkspaceSettings } from './slices/settingsSlice';
import { createWhatsappSlice } from './slices/whatsappSlice';
import { formatLead, formatOperacionalTask, formatTransaction, formatContaReceber, formatFornecedor, formatOrcamento, formatWhatsappMessage } from './formatters';
let realtimeStarted = false;
let realtimeChannels: ReturnType<typeof supabase.channel>[] = [];

const cleanupRealtime = () => {
  realtimeChannels.forEach((ch) => {
    try { supabase.removeChannel(ch); } catch (_) { /* ignore */ }
  });
  realtimeChannels = [];
  realtimeStarted = false;
};

type StoreState = {
  startRealtime: () => void;
  setWorkspaceId: (id: string) => void;
  workspaceId: string | null;

  leads: any[];
  addLead: (data: any) => Promise<any>;
  updateLead: (id: string, data: any) => Promise<void>;
  updateLeadStatus: (leadId: string, status: any) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  handleMarkAsOrcado: (id: string, valor: number) => Promise<void>;
  markAsFechado: (id: string) => Promise<void>;

  orcamentos: any[];
  addOrcamento: (data: any) => Promise<any>;
  updateOrcamento: (id: string, data: any) => Promise<void>;
  deleteOrcamento: (id: string) => Promise<void>;

  transactions: any[];
  fetchTransactions: () => Promise<void>;
  addTransaction: (data: any) => Promise<any>;
  updateTransaction: (id: string, data: any) => Promise<any>;
  deleteTransaction: (id: string) => Promise<void>;
  marcarComoPago: (id: string, formaPagamento: string) => Promise<any>;

  notas: any[];
  operacionalTasks: any[];

  selectedLeadId: string | null;
  activeModule: string;

  addToast: (data: any) => void;
  toasts: any[];
  removeToast: (id: string) => void;
  setActiveModule: (module: string) => void;
  selectLead: (id: string | null) => void;
  leadForm: any;
  setLeadForm: (data: any) => void;
  resetLeadForm: () => void;
  addNota: (data: any) => Promise<void>;
  updateNota: (id: string, data: any) => Promise<void>;
  deleteNota: (id: string) => Promise<void>;
  salvarAssinaturaCliente: (orcamentoId: string, assinatura: string) => Promise<boolean>;
  metaMensal: number;
  addOperacionalTask: (data: any) => Promise<void>;

  filters: any;
  setFilter: (filter: any) => void;
  clearFilters: () => void;

  initialize: (workspaceId: string) => Promise<void>;
  logout: () => Promise<void>;

  isLoading: boolean;

  contasReceber: any[];
  fetchContasReceber: () => Promise<void>;
  addContaReceber: (data: any) => Promise<any>;
  updateContaReceber: (id: string, data: any) => Promise<any>;
  deleteContaReceber: (id: string) => Promise<void>;
  marcarComoRecebido: (id: string) => Promise<any>;

  fornecedores: any[];
  addFornecedor: (data: any) => Promise<any>;
  updateFornecedor: (id: string, data: any) => Promise<any>;
  deleteFornecedor: (id: string) => Promise<void>;

  materiais: any[];
  loadMateriais: () => Promise<void>;
  addMaterial: (data: any) => Promise<void>;
  updateMaterial: (id: string, data: any) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  movimentarEstoque: (id: string, tipo: 'entrada' | 'saida', quantidade: number, motivo: string) => Promise<void>;

  cotacoesMateriais: any[];
  fetchCotacoesMateriais: () => Promise<void>;
  addCotacaoMaterial: (data: any) => Promise<void>;
  deleteCotacaoMaterial: (id: string) => Promise<void>;
  loadFornecedores: () => Promise<void>;

  recibos: any[];
  fetchRecibos: (workspaceId: string) => Promise<void>;
  addRecibo: (data: any) => Promise<any>;
  updateRecibo: (id: string, data: any) => Promise<void>;
  deleteRecibo: (id: string) => Promise<void>;
  emitirRecibo: (id: string) => Promise<void>;

  settings: WorkspaceSettings;
  fetchSettings: (workspaceId: string) => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  updateSettings: (partial: Partial<WorkspaceSettings>) => Promise<void>;

  whatsappConversations: any[];
  whatsappMessages: any[];
  selectedConversation: string | null;
  whatsappInstanceName: string | null;
  connectionStatus: string | null;
  sendingMessage: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (remoteJid: string) => Promise<void>;
  setSelectedConversation: (remoteJid: string | null) => void;
  fetchWhatsappInstance: () => Promise<void>;
  fetchConnectionStatus: () => Promise<void>;
  sendMessage: (text: string, overrideNumber?: string) => Promise<void>;
  deleteConversation: (remoteJid: string) => Promise<void>;
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
      ...(createContasReceberSlice as any)(set, get),
      ...(createReciboSlice as any)(set, get),
      ...(createSettingsSlice as any)(set, get),
      ...(createWhatsappSlice as any)(set, get),

      // ================= INITIALIZE =================

      initialize: async (workspaceId: string) => {
        try {
          set({ isLoading: true });

          if (!workspaceId) {
            set({ isLoading: false });
            return;
          }

          const [leadsRes, orcamentosRes, tasksRes, transactionsRes, contasReceberRes] =
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

              supabase
                .from('contas_receber')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('data_vencimento', { ascending: true }),
            ]);

          set({
            workspaceId,
            leads: (leadsRes.data || []).map(formatLead),
            orcamentos: (orcamentosRes.data || []).map(formatOrcamento),
            operacionalTasks: (tasksRes.data || []).map(formatOperacionalTask),
            transactions: (transactionsRes.data || []).map(formatTransaction),
            contasReceber: (contasReceberRes.data || []).map(formatContaReceber),
            isLoading: false,
          });

          await get().fetchRecibos(workspaceId);
          await get().fetchSettings(workspaceId);
        } catch (error) {
          console.error('[UseStore] Erro de inicialização:', error);
          set({ isLoading: false });
        }
      },

      // ================= REALTIME =================

      startRealtime: () => {
        if (realtimeStarted) {
          return;
        }

        const workspaceId = get().workspaceId;
        if (!workspaceId) return;

        realtimeStarted = true;

        // ================= LEADS =================
        realtimeChannels.push(supabase
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
                    leads: [formatLead(payload.new), ...leads],
                  };
                }

                if (payload.eventType === 'UPDATE') {
                  return {
                    leads: leads.map((l: any) =>
                      l.id === payload.new.id ? formatLead(payload.new) : l,
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
          .subscribe());

        // ================= ORÇAMENTOS =================
        realtimeChannels.push(supabase
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
              set((state: any) => {
                const orcamentos = state.orcamentos || [];

                // ================= INSERT =================
                if (payload.eventType === 'INSERT') {
                  const exists = orcamentos.find(
                    (o: any) => o.id === payload.new.id,
                  );

                  if (exists) return state;

                  return {
                    orcamentos: [formatOrcamento(payload.new), ...orcamentos],
                  };
                }

                // ================= UPDATE =================
                if (payload.eventType === 'UPDATE') {
                  return {
                    orcamentos: orcamentos.map((o: any) =>
                      o.id === payload.new.id ? formatOrcamento(payload.new) : o,
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
          .subscribe());

        // ================= OPERACIONAL TASKS =================
        realtimeChannels.push(supabase
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
                    operacionalTasks: [formatOperacionalTask(payload.new), ...tasks],
                  };
                }

                if (payload.eventType === 'UPDATE') {
                  return {
                    operacionalTasks: tasks.map((t: any) =>
                      t.id === payload.new.id ? formatOperacionalTask(payload.new) : t,
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
          .subscribe());

        // ================= FINANCEIRO =================
        realtimeChannels.push(supabase
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
          .subscribe());

        // ================= CONTAS A RECEBER =================
        realtimeChannels.push(supabase
          .channel('realtime-contas-receber')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'contas_receber',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            (payload: any) => {
              set((state: any) => {
                const contas = state.contasReceber || [];

                if (payload.eventType === 'INSERT') {
                  if (contas.find((c: any) => c.id === payload.new.id)) return state;
                  return { contasReceber: [formatContaReceber(payload.new), ...contas] };
                }

                if (payload.eventType === 'UPDATE') {
                  return {
                    contasReceber: contas.map((c: any) =>
                      c.id === payload.new.id ? formatContaReceber(payload.new) : c,
                    ),
                  };
                }

                if (payload.eventType === 'DELETE') {
                  return { contasReceber: contas.filter((c: any) => c.id !== payload.old.id) };
                }

                return state;
              });
            },
          )
          .subscribe());

        // ================= FORNECEDORES =================
        realtimeChannels.push(supabase
          .channel('realtime-fornecedores')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'fornecedores',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            (payload: any) => {
              set((state: any) => {
                const fornecedores = state.fornecedores || [];

                if (payload.eventType === 'INSERT') {
                  if (fornecedores.find((f: any) => f.id === payload.new.id)) return state;
                  return { fornecedores: [formatFornecedor(payload.new), ...fornecedores] };
                }

                if (payload.eventType === 'UPDATE') {
                  return {
                    fornecedores: fornecedores.map((f: any) =>
                      f.id === payload.new.id ? formatFornecedor(payload.new) : f,
                    ),
                  };
                }

                if (payload.eventType === 'DELETE') {
                  return { fornecedores: fornecedores.filter((f: any) => f.id !== payload.old.id) };
                }

                return state;
              });
            },
          )
          .subscribe());

        // ================= WHATSAPP =================
        realtimeChannels.push(supabase
          .channel('realtime-whatsapp-messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'whatsapp_messages',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            (payload: any) => {
              if (!payload?.new) return;
              const msg = formatWhatsappMessage(payload.new);

              set((state: any) => {
                const messages = state.whatsappMessages || [];
                const conversations = state.whatsappConversations || [];

                const nextMessages =
                  state.selectedConversation === msg.remoteJid &&
                  !messages.some((m: any) => m.id === msg.id)
                    ? [...messages, msg]
                    : messages;

                const convEntry = {
                  remoteJid: msg.remoteJid,
                  contactName: msg.contactName,
                  lastContent: msg.content,
                  lastFromMe: msg.fromMe,
                  lastMessageType: msg.messageType,
                  lastTimestamp: msg.timestamp,
                };

                const rest = conversations.filter(
                  (c: any) => c.remoteJid !== msg.remoteJid,
                );

                return {
                  whatsappMessages: nextMessages,
                  whatsappConversations: [convEntry, ...rest],
                };
              });
            },
          )
          .subscribe());
      },

      // ================= WORKSPACE =================

      setWorkspaceId: (id: string) => {
        const currentId = get().workspaceId;
        if (id !== currentId) {
          cleanupRealtime();
        }
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
        cleanupRealtime();
        set({
          leads: [],
          orcamentos: [],
          transactions: [],
          notas: [],
          operacionalTasks: [],
          contasReceber: [],
          whatsappConversations: [],
          whatsappMessages: [],
          selectedConversation: null,
          whatsappInstanceName: null,
          connectionStatus: null,
          sendingMessage: false,
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
