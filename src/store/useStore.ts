import { createLeadSlice } from './slices/leadSlice'
import { supabase } from '@/lib/supabase';
import type { LeadAnalysisStatus } from '@/types';
import {
  criarHistoricoStatusChange,
  criarHistoricoLeadFechado,
  criarHistoricoOrcamentoCriado,
  criarHistoricoAlteracaoEstrategica
} from '../modules/leads/historicoService';
import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  Lead,
  Orcamento,
  Transaction,
  Nota,
  ToastMessage,
  LeadStatus,
  DashboardStats,
  OperacionalTask
} from '@/types';
import { calculatePriority } from '@/lib/priority';

export const useStore = create<any>((set, get) => ({

  ...createLeadSlice(set, get),

  workspaceId: null as string | null,

  leads: [],
  orcamentos: [],
  transactions: [],
  notas: [],
  operacionalTasks: [],

  metaMensal: 100000,

  filters: {
  status: 'all',
  temperatura: 'all',
  prioridadeLevel: 'all',
  search: '',
  analysisStatus: 'all',
  },

  isLoading: true,
  activeModule: 'dashboard',
  selectedLeadId: null,
  toasts: [],

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

    if (leadsRes.error) {
      console.error("Erro ao buscar leads:", leadsRes.error);
    }

    if (orcamentosRes.error) {
      console.error("Erro ao buscar orçamentos:", orcamentosRes.error);
    }

    const formattedOrcamentos = (orcamentosRes.data || []).map(o => ({
  id: o.id,
  workspaceId: o.workspace_id,
  leadId: o.lead_id,
  numero: o.numero,
  itens: o.itens,
  subtotal: o.subtotal,
  desconto: o.desconto,
  total: o.total,
  status: o.status,
  observacoes: o.observacoes,
  validadeEmDias: o.validade_em_dias,
  historico: o.historico,
  createdAt: o.created_at,
  updatedAt: o.updated_at,
}));

set({
  leads: leadsRes.data || [],
  orcamentos: formattedOrcamentos,
  isLoading: false,
});

  } catch (error) {
    console.error("INIT ERROR:", error);
    set({ isLoading: false });
  }
},

  // ================= UI =================

setActiveModule: (module: string) =>
  set({ activeModule: module }),

setWorkspaceId: (id: string) =>
  set({ workspaceId: id }),

selectLead: (id: string | null) =>
  set({ selectedLeadId: id }),

addToast: (toast: Omit<ToastMessage, 'id'>) => {
  const id = uuid();
  set((state: any) => ({
    toasts: [...state.toasts, { ...toast, id }],
  }));
},

removeToast: (id: string) =>
  set((state: any) => ({
    toasts: state.toasts.filter((t: ToastMessage) => t.id !== id),
  })),

// 🔐 LOGOUT
logout: async () => {
  set({
    leads: [],
    orcamentos: [],
    transactions: [],
    notas: [],
    operacionalTasks: [],
    workspaceId: null,
    selectedLeadId: null,
    activeModule: 'dashboard',
  });
},

  // ================= FILTERS =================

  setFilter: (filter: any) =>
    set((state: any) => ({
      filters: { ...state.filters, ...filter }
    })),

  clearFilters: () =>
  set({
    filters: {
      status: 'all',
      temperatura: 'all',
      prioridadeLevel: 'all',
      search: '',
      analysisStatus: 'all',
    }
  }),

  // ================= ORÇAMENTOS =================

addOrcamento: async (data: Partial<Orcamento>) => {
  const { workspaceId, orcamentos } = get();
  const now = new Date().toISOString();

  const novoOrcamento = {
    id: uuid(),
    workspace_id: workspaceId,
    lead_id: data.leadId!,
    numero: data.numero || `ORC-${Date.now()}`,
    itens: data.itens || [],
    subtotal: data.subtotal || 0,
    desconto: data.desconto || 0,
    total: data.total || 0,
    status: data.status || 'rascunho',
    observacoes: data.observacoes || '',
    validade_em_dias: data.validadeEmDias || 7,
    historico: [],
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase
    .from('orcamentos')
    .insert([novoOrcamento]);

  if (error) {
    console.error("Erro ao salvar orçamento:", error);
    return;
  }

  // Converter de volta para camelCase no state
  const orcamentoState = {
    ...data,
    id: novoOrcamento.id,
    workspaceId: workspaceId,
    leadId: data.leadId!,
    validadeEmDias: novoOrcamento.validade_em_dias,
    createdAt: now,
    updatedAt: now,
  } as Orcamento;

  set({ orcamentos: [...orcamentos, orcamentoState] });

  return orcamentoState;
},

updateOrcamento: async (id: string, updates: Partial<Orcamento>) => {

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status) updateData.status = updates.status;
  if (updates.total !== undefined) updateData.total = updates.total;
  if (updates.desconto !== undefined) updateData.desconto = updates.desconto;
  if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal;
  if (updates.itens) updateData.itens = updates.itens;
  if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;
  if (updates.validadeEmDias !== undefined)
    updateData.validade_em_dias = updates.validadeEmDias;

  const { error } = await supabase
    .from('orcamentos')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error("Erro ao atualizar orçamento:", error);
    return;
  }
},

deleteOrcamento: async (id: string) => {
  const { orcamentos } = get();

  const { error } = await supabase
    .from('orcamentos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao excluir orçamento:", error);
    return;
  }

  set({ orcamentos: orcamentos.filter(o => o.id !== id) });
},

  // ================= TRANSACTIONS =================

addTransaction: async (data: Partial<Transaction>) => {
  const { workspaceId, transactions } = get();
  const now = new Date().toISOString();

  const transaction = {
    id: uuid(),
    workspace_id: workspaceId,
    lead_id: data.leadId,
    tipo: data.tipo || 'receita',
    descricao: data.descricao || '',
    valor: data.valor || 0,
    data: data.data || now,
    categoria: data.categoria || '',
    observacoes: data.observacoes || '',
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase
    .from('transactions')
    .insert([transaction]);

  if (error) {
    console.error("Erro ao salvar transação:", error);
    return;
  }

  set({ transactions: [...transactions, transaction] });

  return transaction;
},

deleteTransaction: async (id: string) => {
  const { transactions } = get();

  await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  set({
    transactions: transactions.filter(t => t.id !== id),
  });
},

  // ================= NOTAS =================

addNota: async (data: Partial<Nota>) => {
  const { workspaceId, notas } = get();
  const now = new Date().toISOString();

  const nota = {
    id: uuid(),
    workspace_id: workspaceId,
    lead_id: data.leadId,
    numero: data.numero || `NF-${Date.now()}`,
    valor: data.valor || 0,
    data: data.data || now,
    status: data.status || 'pendente',
    observacoes: data.observacoes || '',
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase
    .from('notas')
    .insert([nota]);

  if (error) {
    console.error("Erro ao salvar nota:", error);
    return;
  }

  set({ notas: [...notas, nota] });

  return nota;
},

updateNota: async (id: string, updates: Partial<Nota>) => {

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.numero) updateData.numero = updates.numero;
  if (updates.valor !== undefined) updateData.valor = updates.valor;
  if (updates.status) updateData.status = updates.status;
  if (updates.observacoes !== undefined)
    updateData.observacoes = updates.observacoes;

  const { error } = await supabase
    .from('notas')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error("Erro ao atualizar nota:", error);
    return;
  }

},

deleteNota: async (id: string) => {
  const { notas } = get();

  await supabase
    .from('notas')
    .delete()
    .eq('id', id);

  set({
    notas: notas.filter(n => n.id !== id),
  });
},

  // ================= OPERACIONAL =================

addOperacionalTask: async (taskData: any) => {
  const { workspaceId, operacionalTasks } = get();
  const now = new Date().toISOString();

  const task: OperacionalTask = {
    ...taskData,
    id: uuid(),
    workspaceId,
    concluido: false,
    createdAt: now,
    updatedAt: now,
  };

  await supabase
.from('operacional_tasks')
.update({
  titulo: updatedTask.titulo,
  data: updatedTask.data,
  tipo: updatedTask.tipo,
  concluido: updatedTask.concluido,
  updated_at: new Date().toISOString()
})
.eq('id', id); // 🔥 SALVA NO BANCO

  set({ operacionalTasks: [...operacionalTasks, task] });
},

updateOperacionalTask: async (id: string, updates: Partial<OperacionalTask>) => {
  const { operacionalTasks, leads } = get();

  const index = operacionalTasks.findIndex(t => t.id === id);
  if (index === -1) return;

  const task = operacionalTasks[index];

  const updatedTask: OperacionalTask = {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // 🔥 SINCRONIZA COM LEAD SE NECESSÁRIO
  if (task.leadId && updates.data) {
    const leadIndex = leads.findIndex(l => l.id === task.leadId);

    if (leadIndex !== -1) {
      const updatedLead = {
        ...leads[leadIndex],
        dataOrcamento:
          task.tipo === 'orcamento'
            ? updates.data
            : leads[leadIndex].dataOrcamento,
        dataExecucao:
          task.tipo === 'execucao'
            ? updates.data
            : leads[leadIndex].dataExecucao,
        updatedAt: new Date().toISOString(),
      };

      await supabase
  	.from('leads')
  	.update(updatedLead)
  	.eq('id', updatedLead.id);

      const newLeads = [...leads];
      newLeads[leadIndex] = updatedLead;
      set({ leads: newLeads });
    }
  }

  await supabase
  .from('operacional_tasks')
  .update(updatedTask)
  .eq('id', id); // 🔥 SALVA NO BANCO

  const newTasks = [...operacionalTasks];
  newTasks[index] = updatedTask;

  set({ operacionalTasks: newTasks });
},

deleteOperacionalTask: async (id: string) => {
  const { operacionalTasks } = get();

  await supabase
  .from('operacional_tasks')
  .delete()
  .eq('id', id); // 🔥 REMOVE DO BANCO

  set({
    operacionalTasks: operacionalTasks.filter(t => t.id !== id),
  });
},

}));

// ================= DASHBOARD STATS =================

export const useDashboardStats = (): DashboardStats => {
  const leads = useStore(state => state.leads);
  const transactions = useStore(state => state.transactions);
  const metaMensal = useStore(state => state.metaMensal);
  const tasks = useStore(state => state.operacionalTasks);

  const hojeDate = new Date();
  hojeDate.setHours(0, 0, 0, 0);

  const receitasMes = transactions
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + t.valor, 0);

  const fechados = leads.filter(l => l.status === 'fechado');

  const receitaPotencial = leads
    .filter(l => l.status === 'orcado')
    .reduce((sum, l) => sum + (l.valorOrcado ?? 0), 0);

  const receitaProvavel = leads
    .filter(l => l.status === 'orcado')
    .reduce((sum, l) => {
      let peso = 0;
      if (l.temperatura === 'quente') peso = 0.7;
      if (l.temperatura === 'morno') peso = 0.4;
      if (l.temperatura === 'frio') peso = 0.15;
      return sum + ((l.valorOrcado ?? 0) * peso);
    }, 0);

  const receitaConservadora = receitaPotencial * 0.3;

  // ================= SCORE OPERACIONAL =================

  const tarefasHoje = tasks.filter(t => {
    const dataTask = new Date(t.data);
    dataTask.setHours(0, 0, 0, 0);
    return dataTask.getTime() === hojeDate.getTime() && !t.concluido;
  });

  const tarefasAtrasadas = tasks.filter(t => {
    const dataTask = new Date(t.data);
    dataTask.setHours(0, 0, 0, 0);
    return dataTask.getTime() < hojeDate.getTime() && !t.concluido;
  });

  const tarefasCriticas = tasks.filter(t => {
    const dataTask = new Date(t.data);
    dataTask.setHours(0, 0, 0, 0);
    return dataTask.getTime() <= hojeDate.getTime() && !t.concluido;
  });

  const scoreOperacional =
    (tarefasHoje.length * 10) +
    (tarefasAtrasadas.length * 25);

  // ================= SCORE COMERCIAL =================

  const scoreComercial = leads.reduce((acc, lead) => {
    let score = 0;

    if (lead.status === 'orcado') score += 20;
    if (lead.status === 'fechado') score += 30;

    if (lead.temperatura === 'quente') score += 25;
    if (lead.temperatura === 'morno') score += 10;

    if (lead.valorOrcado && lead.valorOrcado > 20000) score += 30;
    else if (lead.valorOrcado && lead.valorOrcado > 10000) score += 20;
    else if (lead.valorOrcado && lead.valorOrcado > 5000) score += 10;

    return acc + score;
  }, 0);

  return {
    totalLeads: leads.length,
    leadsAtrasados: 0,
    leadsCriticos: 0,
    orcamentosEnviados: leads.filter(l => l.orcamentoEnviado).length,
    fechados: fechados.length,
    valorTotalOrcado: leads.reduce((sum, l) => sum + (l.valorOrcado ?? 0), 0),
    receitaMes: receitasMes,
    leadsQuentes: leads.filter(l => l.temperatura === 'quente').length,
    leadsNovos: leads.filter(l => l.status === 'novo').length,
    leadsMornos: leads.filter(l => l.temperatura === 'morno').length,
    leadsFrios: leads.filter(l => l.temperatura === 'frio').length,
    valorFechado: fechados.reduce((sum, l) => sum + (l.valorOrcado ?? 0), 0),
    taxaConversao:
      leads.length > 0
        ? (fechados.length / leads.length) * 100
        : 0,
    receitaPotencial,
    receitaProvavel,
    receitaConservadora,
    metaMensal,
    tarefasHoje: tarefasHoje.length,
    tarefasAtrasadas: tarefasAtrasadas.length,
    tarefasSemana: tasks.length,
    scoreOperacional,
    scoreComercial,
    tarefasCriticas: tarefasCriticas.length,
  };
};

// ================= SELECTOR - LEADS FILTRADOS =================

export const useFilteredLeads = () => {
  const leads = useStore(state => state.leads);
  const filters = useStore(state => state.filters);

  return leads
    .filter((lead: Lead) => {

      // STATUS
      if (filters.status !== 'all' && lead.status !== filters.status)
        return false;

      // TEMPERATURA
      if (
        filters.temperatura !== 'all' &&
        lead.temperatura !== filters.temperatura
      )
        return false;

      // PRIORIDADE
      if (
        filters.prioridadeLevel !== 'all' &&
        lead.prioridadeLevel !== filters.prioridadeLevel
      )
        return false;

      // 🔥 ANALYSIS STATUS (NOVO FILTRO ESTRATÉGICO)
      if (filters.analysisStatus !== 'all') {
        const jaAnalisado = lead.historico?.some(
          h => h.tipo === 'ia_analysis'
        );

        if (
          filters.analysisStatus === 'analisado' &&
          !jaAnalisado
        ) {
          return false;
        }

        if (
          filters.analysisStatus === 'nao_analisado' &&
          jaAnalisado
        ) {
          return false;
        }
      }

      // BUSCA
      if (filters.search) {
        const search = filters.search.toLowerCase();

        if (
          !lead.nome.toLowerCase().includes(search) &&
          !lead.servico.toLowerCase().includes(search) &&
          !lead.telefone.includes(search)
        ) {
          return false;
        }
      }

      return true;
    })
    .sort((a: Lead, b: Lead) => b.prioridadeScore - a.prioridadeScore);
};