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
import * as db from '@/lib/db';
import { calculatePriority } from '@/lib/priority';

export const useStore = create<any>((set, get) => ({
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

initialize: async () => {
  console.log("INIT START");

  try {
    set({ isLoading: true });

    const workspaceId = get().workspaceId;
if (!workspaceId) {
  console.warn("Workspace não definido");
  return;
}

    console.log("ANTES DO PROMISE ALL");

    const [
      leads,
      orcamentos,
      transactions,
      notas,
      operacionalTasks,
    ] = await Promise.all([
      db.getAllLeads(workspaceId),
      db.getAllOrcamentos(workspaceId),
      db.getAllTransactions(workspaceId),
      db.getAllNotas(workspaceId),
      db.getAllOperacionalTasks(workspaceId),
    ]);

    console.log("DEPOIS DO PROMISE ALL");

    set({
      leads,
      orcamentos,
      transactions,
      notas,
      operacionalTasks,
      isLoading: false,
    });

    console.log("INIT END");

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

  // ================= LEADS =================

addLead: async (leadData: any) => {
  const { workspaceId, leads } = get();
  const now = new Date().toISOString();

  const baseLead: Lead = {
    ...leadData,
    id: uuid(),
    workspaceId,
    prioridadeScore: 0,
    prioridadeLevel: 'baixo',
    historico: [],
    dataOrcamento: null,
    dataExecucao: null,
    syncStatus: 'local',
    createdAt: now,
    updatedAt: now,
  };

  const priority = calculatePriority(baseLead);

  const lead: Lead = {
    ...baseLead,
    prioridadeScore: priority.score,
    prioridadeLevel: priority.level,
  };

  await db.saveLead(lead);
  set({ leads: [...leads, lead] });

  return lead;
},

updateLead: async (id: string, updates: Partial<Lead>) => {
  const { leads, operacionalTasks } = get();
  const index = leads.findIndex((l: Lead) => l.id === id);
  if (index === -1) return;

  const previousLead = leads[index];

  const mergedLead: Lead = {
    ...previousLead,
    ...updates,
    updatedAt: new Date().toISOString(),
    syncStatus:
      previousLead.syncStatus === 'local'
        ? 'local'
        : 'pending',
  };

  const historicoEntries = [];

  const camposEstrategicos: (keyof Lead)[] = [
    'temperatura',
    'prazoCliente',
    'probabilidadeManual',
    'valorOrcado',
  ];

  camposEstrategicos.forEach((campo) => {
    if (previousLead[campo] !== mergedLead[campo]) {
      historicoEntries.push(
        criarHistoricoAlteracaoEstrategica(
          campo,
          previousLead[campo],
          mergedLead[campo]
        )
      );
    }
  });

  const priority = calculatePriority(mergedLead);

  const updated: Lead = {
  ...mergedLead,
  prioridadeScore: priority.score,
  prioridadeLevel: priority.level,
  historico: [
    ...(updates.historico || previousLead.historico || []),
    ...historicoEntries,
  ],
};

  const existingTask = operacionalTasks.find(
    (t: OperacionalTask) =>
      t.leadId === id && t.tipo === 'orcamento'
  );

  if (updates.dataOrcamento) {
    if (existingTask) {
      await get().updateOperacionalTask(existingTask.id, {
        data: updates.dataOrcamento,
        titulo: `Orçamento - ${updated.nome}`,
        descricao: `Cliente: ${updated.nome}
Serviço: ${updated.servico}
Telefone: ${updated.telefone}`,
      });
    } else {
      await get().addOperacionalTask({
        leadId: id,
        titulo: `Orçamento - ${updated.nome}`,
        data: updates.dataOrcamento,
        prioridade: 'media',
        tipo: 'orcamento',
        descricao: `Cliente: ${updated.nome}
Serviço: ${updated.servico}
Telefone: ${updated.telefone}`,
      });
    }
  }

  if (updates.dataOrcamento === null && existingTask) {
    await get().deleteOperacionalTask(existingTask.id);
  }

  await db.saveLead(updated);

  const newLeads = [...leads];
  newLeads[index] = updated;
  set({ leads: newLeads });
},

deleteLead: async (id: string) => {
  const { leads } = get();
  await db.deleteLead(id);
  set({ leads: leads.filter((l: Lead) => l.id !== id) });
},

updateLeadStatus: async (id: string, status: LeadStatus) => {
  const { leads } = get();
  const index = leads.findIndex((l: Lead) => l.id === id);
  if (index === -1) return;

  const lead = leads[index];
  if (lead.status === status) return;

  const now = new Date().toISOString();

  const historicoEntry = criarHistoricoStatusChange(
    lead.status,
    status
  );

  const updatedLead: Lead = {
    ...lead,
    status,
    updatedAt: now,
    historico: [...(lead.historico || []), historicoEntry],
    syncStatus:
      lead.syncStatus === 'local'
        ? 'local'
        : 'pending',
  };

  const priority = calculatePriority(updatedLead);

  updatedLead.prioridadeScore = priority.score;
  updatedLead.prioridadeLevel = priority.level;

  await db.saveLead(updatedLead);

  const newLeads = [...leads];
  newLeads[index] = updatedLead;

  set({ leads: newLeads });
},

markAsOrcado: async (id: string, valor: number) => {
  const { leads } = get();
  const index = leads.findIndex((l: Lead) => l.id === id);
  if (index === -1) return;

  const lead = leads[index];
  const now = new Date().toISOString();

  const historicoEntry = criarHistoricoOrcamentoCriado(valor);

  const updatedLead: Lead = {
    ...lead,
    status: 'orcado',
    orcamentoEnviado: true,
    valorOrcado: valor,
    dataOrcamento: now,
    updatedAt: now,
    historico: [...(lead.historico || []), historicoEntry],
    syncStatus:
      lead.syncStatus === 'local'
        ? 'local'
        : 'pending',
  };

  const priority = calculatePriority(updatedLead);

  updatedLead.prioridadeScore = priority.score;
  updatedLead.prioridadeLevel = priority.level;

  await db.saveLead(updatedLead);

  const newLeads = [...leads];
  newLeads[index] = updatedLead;

  set({ leads: newLeads });
},

markAsFechado: async (id: string) => {
  const { leads } = get();
  const index = leads.findIndex((l: Lead) => l.id === id);
  if (index === -1) return;

  const lead = leads[index];
  if (lead.status === 'fechado') return;

  const now = new Date().toISOString();

  const historicoEntry = criarHistoricoLeadFechado(
    lead.valorOrcado || undefined
  );

  const updatedLead: Lead = {
    ...lead,
    status: 'fechado',
    updatedAt: now,
    historico: [...(lead.historico || []), historicoEntry],
    syncStatus:
      lead.syncStatus === 'local'
        ? 'local'
        : 'pending',
  };

  const priority = calculatePriority(updatedLead);

  updatedLead.prioridadeScore = priority.score;
  updatedLead.prioridadeLevel = priority.level;

  await db.saveLead(updatedLead);

  const newLeads = [...leads];
  newLeads[index] = updatedLead;

  set({ leads: newLeads });
},

  // ================= ORÇAMENTOS =================

addOrcamento: async (data: Partial<Orcamento>) => {
  const { workspaceId, orcamentos } = get();
  const now = new Date().toISOString();

  const orcamento: Orcamento = {
    id: uuid(),
    workspaceId,
    leadId: data.leadId!,
    numero: data.numero || `ORC-${Date.now()}`,
    itens: data.itens || [],
    subtotal: data.subtotal || 0,
    desconto: data.desconto || 0,
    total: data.total || 0,
    status: data.status || 'rascunho',
    observacoes: data.observacoes || '',
    validadeEmDias: data.validadeEmDias || 7,
    historico: [],
    createdAt: now,
    updatedAt: now,
  };

  await db.saveOrcamento(orcamento);

  set({ orcamentos: [...orcamentos, orcamento] });

  return orcamento;
},

updateOrcamento: async (id: string, updates: Partial<Orcamento>) => {
  const { orcamentos } = get();
  const index = orcamentos.findIndex(o => o.id === id);
  if (index === -1) return;

  const updated = {
    ...orcamentos[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.saveOrcamento(updated);

  const newList = [...orcamentos];
  newList[index] = updated;

  set({ orcamentos: newList });
},

deleteOrcamento: async (id: string) => {
  const { orcamentos } = get();
  await db.deleteOrcamento(id);
  set({ orcamentos: orcamentos.filter(o => o.id !== id) });
},

  // ================= TRANSACTIONS =================

addTransaction: async (data: Partial<Transaction>) => {
  const { workspaceId, transactions } = get();
  const now = new Date().toISOString();

  const transaction: Transaction = {
    id: uuid(),
    workspaceId,
    leadId: data.leadId,
    tipo: data.tipo || 'receita',
    descricao: data.descricao || '',
    valor: data.valor || 0,
    data: data.data || now,
    categoria: data.categoria || '',
    observacoes: data.observacoes || '',
    createdAt: now,
    updatedAt: now,
  };

  await db.saveTransaction(transaction);

  set({ transactions: [...transactions, transaction] });

  return transaction;
},

deleteTransaction: async (id: string) => {
  const { transactions } = get();
  await db.deleteTransaction(id);
  set({ transactions: transactions.filter(t => t.id !== id) });
},

  // ================= NOTAS =================

addNota: async (data: Partial<Nota>) => {
  const { workspaceId, notas } = get();
  const now = new Date().toISOString();

  const nota: Nota = {
    id: uuid(),
    workspaceId,
    leadId: data.leadId,
    numero: data.numero || `NF-${Date.now()}`,
    valor: data.valor || 0,
    data: data.data || now,
    status: data.status || 'pendente',
    observacoes: data.observacoes || '',
    createdAt: now,
    updatedAt: now,
  };

  await db.saveNota(nota);

  set({ notas: [...notas, nota] });

  return nota;
},

updateNota: async (id: string, updates: Partial<Nota>) => {
  const { notas } = get();
  const index = notas.findIndex(n => n.id === id);
  if (index === -1) return;

  const updated: Nota = {
    ...notas[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.saveNota(updated);

  const newNotas = [...notas];
  newNotas[index] = updated;

  set({ notas: newNotas });
},

deleteNota: async (id: string) => {
  const { notas } = get();
  await db.deleteNota(id);
  set({ notas: notas.filter(n => n.id !== id) });
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

  await db.saveOperacionalTask(task); // 🔥 SALVA NO BANCO

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

      await db.saveLead(updatedLead);

      const newLeads = [...leads];
      newLeads[leadIndex] = updatedLead;
      set({ leads: newLeads });
    }
  }

  await db.saveOperacionalTask(updatedTask); // 🔥 SALVA NO BANCO

  const newTasks = [...operacionalTasks];
  newTasks[index] = updatedTask;

  set({ operacionalTasks: newTasks });
},

deleteOperacionalTask: async (id: string) => {
  const { operacionalTasks } = get();

  await db.deleteOperacionalTaskDB(id); // 🔥 REMOVE DO BANCO

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