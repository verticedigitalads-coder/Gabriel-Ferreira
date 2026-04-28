import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import { formatTransaction } from '@/store/formatters';
import type { Transaction } from '@/types';

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createFinanceiroSlice = (set: any, get: any) => ({
  transactions: [],

  // ================= FETCH =================
  fetchTransactions: async () => {
    const { workspaceId } = get();

    if (!workspaceId) {
      console.error('[FinanceiroSlice] workspaceId não encontrado');
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('data', { ascending: false });

    if (error) {
      console.error('[FinanceiroSlice] Erro ao buscar transações:', error);
      return;
    }

    set({
      transactions: (data || []).map(formatTransaction),
    });
  },

  // ================= ADD =================
  addTransaction: async (data: Partial<Transaction>) => {
    const { workspaceId } = get();
    const now = new Date().toISOString();

    if (!workspaceId) {
      console.error('[FinanceiroSlice] workspaceId não encontrado');
      return;
    }

    const isDespesa = ['despesa', 'comissao', 'pagamento_funcionario'].includes(data.tipo);

    const transaction: Record<string, unknown> = {
      id: uuid(),
      workspace_id: workspaceId,
      descricao: data.descricao,
      valor: data.valor,
      tipo: data.tipo,
      data: data.data,
      categoria: data.categoria || null,
      lead_id: data.leadId || null,
      observacoes: data.observacoes || null,
      // Fase 15 — Status de pagamento
      status_pagamento: data.tipo === 'receita' ? 'pago' : 'pendente',
      data_vencimento: isDespesa ? (data.dataVencimento || data.data) : null,
      data_pagamento: data.tipo === 'receita' ? data.data : null,
      forma_pagamento: data.formaPagamento || null,
      created_at: now,
      updated_at: now,
    };

    const { data: inserted, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) {
      console.error('[FinanceiroSlice] Erro ao criar transação:', error);
      return;
    }

    set((state: any) => {
      const exists = state.transactions.some((t: Transaction) => t.id === inserted.id);

      if (exists) return state;

      return {
        transactions: [formatTransaction(inserted), ...state.transactions],
      };
    });

    return formatTransaction(inserted);
  },

  // ================= UPDATE =================
  updateTransaction: async (id: string, data: Partial<Transaction>) => {
    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      updated_at: now,
    };

    if (data.descricao !== undefined) payload.descricao = data.descricao;
    if (data.valor !== undefined) payload.valor = data.valor;
    if (data.tipo !== undefined) payload.tipo = data.tipo;
    if (data.data !== undefined) payload.data = data.data;
    if (data.categoria !== undefined) payload.categoria = data.categoria;
    if (data.leadId !== undefined) payload.lead_id = data.leadId || null;
    if (data.observacoes !== undefined) payload.observacoes = data.observacoes;
    // Fase 15
    if (data.statusPagamento !== undefined) payload.status_pagamento = data.statusPagamento;
    if (data.dataVencimento !== undefined) payload.data_vencimento = data.dataVencimento;
    if (data.dataPagamento !== undefined) payload.data_pagamento = data.dataPagamento;
    if (data.formaPagamento !== undefined) payload.forma_pagamento = data.formaPagamento;

    const { data: updated, error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[FinanceiroSlice] Erro ao atualizar transação:', error);
      return;
    }

    set((state: any) => {
      const exists = state.transactions.some((t: Transaction) => t.id === id);

      if (!exists) {
        return {
          transactions: [formatTransaction(updated), ...state.transactions],
        };
      }

      return {
        transactions: state.transactions.map((t: Transaction) =>
          t.id === id ? formatTransaction(updated) : t,
        ),
      };
    });

    return formatTransaction(updated);
  },

  // ================= DELETE =================
  deleteTransaction: async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) {
      console.error('[FinanceiroSlice] Erro ao deletar transação:', error);
      return;
    }

    set((state: any) => ({
      transactions: state.transactions.filter((t: Transaction) => t.id !== id),
    }));
  },

  // ================= MARCAR COMO PAGO =================
  marcarComoPago: async (id: string, formaPagamento: string) => {
    const now = new Date().toISOString();
    const hoje = now.split('T')[0];

    const { data: updated, error } = await supabase
      .from('transactions')
      .update({
        status_pagamento: 'pago',
        data_pagamento: hoje,
        forma_pagamento: formaPagamento,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[FinanceiroSlice] Erro ao marcar como pago:', error);
      return;
    }

    set((state: any) => ({
      transactions: state.transactions.map((t: Transaction) =>
        t.id === id ? formatTransaction(updated) : t,
      ),
    }));

    return formatTransaction(updated);
  },
});
