import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import { formatTransaction } from '@/store/formatters';

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
  addTransaction: async (data: any) => {
    const { workspaceId } = get();
    const now = new Date().toISOString();

    if (!workspaceId) {
      console.error('[FinanceiroSlice] workspaceId não encontrado');
      return;
    }

    const transaction = {
      id: uuid(),
      workspace_id: workspaceId,
      descricao: data.descricao,
      valor: data.valor,
      tipo: data.tipo, // entrada | saida
      data: data.data,
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
      const exists = state.transactions.some((t: any) => t.id === inserted.id);

      if (exists) return state;

      return {
        transactions: [formatTransaction(inserted), ...state.transactions],
      };
    });

    return formatTransaction(inserted);
  },

  // ================= UPDATE =================
  updateTransaction: async (id: string, data: any) => {
    const now = new Date().toISOString();

    const payload: any = {
      updated_at: now,
    };

    if (data.descricao !== undefined) payload.descricao = data.descricao;
    if (data.valor !== undefined) payload.valor = data.valor;
    if (data.tipo !== undefined) payload.tipo = data.tipo;
    if (data.data !== undefined) payload.data = data.data;

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
      const exists = state.transactions.some((t: any) => t.id === id);

      if (!exists) {
        return {
          transactions: [formatTransaction(updated), ...state.transactions],
        };
      }

      return {
        transactions: state.transactions.map((t: any) =>
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
      transactions: state.transactions.filter((t: any) => t.id !== id),
    }));
  },
});
