import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import { formatContaReceber } from '@/store/formatters';
import type { ContaReceber, ContaReceberFormData } from '@/types';

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createContasReceberSlice = (_set: any, get: any) => ({
  contasReceber: [] as ContaReceber[],

  // ================= FETCH =================
  fetchContasReceber: async () => {
    const { workspaceId } = get();
    if (!workspaceId) {
      console.error('[ContasReceberSlice] workspaceId não encontrado');
      return;
    }

    const { data, error } = await supabase
      .from('contas_receber')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('data_vencimento', { ascending: true });

    if (error) {
      console.error('[ContasReceberSlice] Erro ao buscar contas:', error);
      return;
    }

    _set({ contasReceber: (data || []).map(formatContaReceber) });
  },

  // ================= ADD =================
  addContaReceber: async (data: ContaReceberFormData) => {
    const { workspaceId } = get();
    if (!workspaceId) {
      console.error('[ContasReceberSlice] workspaceId não encontrado');
      return;
    }

    const now = new Date().toISOString();
    const conta = {
      id: uuid(),
      workspace_id: workspaceId,
      lead_id: data.leadId ?? null,
      descricao: data.descricao,
      valor: data.valor,
      data_vencimento: data.dataVencimento,
      status: data.status ?? 'pendente',
      forma_recebimento: data.formaRecebimento ?? null,
      observacao: data.observacao ?? null,
      created_at: now,
      updated_at: now,
    };

    const { data: inserted, error } = await supabase
      .from('contas_receber')
      .insert([conta])
      .select()
      .single();

    if (error) {
      console.error('[ContasReceberSlice] Erro ao criar conta:', error);
      get().addToast({
        type: 'error',
        message: `Erro ao salvar: ${error.message}`,
      });
      return;
    }

    _set((state: any) => {
      const exists = state.contasReceber.some((c: ContaReceber) => c.id === inserted.id);
      if (exists) return state;
      return { contasReceber: [formatContaReceber(inserted), ...state.contasReceber] };
    });

    return formatContaReceber(inserted);
  },

  // ================= UPDATE =================
  updateContaReceber: async (id: string, data: Partial<ContaReceberFormData>) => {
    const now = new Date().toISOString();

    const payload: Record<string, unknown> = { updated_at: now };
    if (data.descricao !== undefined) payload.descricao = data.descricao;
    if (data.valor !== undefined) payload.valor = data.valor;
    if (data.dataVencimento !== undefined) payload.data_vencimento = data.dataVencimento;
    if (data.status !== undefined) payload.status = data.status;
    if (data.formaRecebimento !== undefined) payload.forma_recebimento = data.formaRecebimento;
    if (data.observacao !== undefined) payload.observacao = data.observacao;
    if (data.leadId !== undefined) payload.lead_id = data.leadId;

    const { data: updated, error } = await supabase
      .from('contas_receber')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ContasReceberSlice] Erro ao atualizar conta:', error);
      get().addToast({
        type: 'error',
        message: `Erro ao atualizar: ${error.message}`,
      });
      return;
    }

    _set((state: any) => ({
      contasReceber: state.contasReceber.map((c: ContaReceber) =>
        c.id === id ? formatContaReceber(updated) : c,
      ),
    }));

    return formatContaReceber(updated);
  },

  // ================= DELETE =================
  deleteContaReceber: async (id: string) => {
    const { error } = await supabase.from('contas_receber').delete().eq('id', id);

    if (error) {
      console.error('[ContasReceberSlice] Erro ao deletar conta:', error);
      return;
    }

    _set((state: any) => ({
      contasReceber: state.contasReceber.filter((c: ContaReceber) => c.id !== id),
    }));
  },

  // ================= MARCAR COMO RECEBIDO =================
  marcarComoRecebido: async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const conta = get().contasReceber.find((c: ContaReceber) => c.id === id);
    if (!conta) {
      console.error('[ContasReceberSlice] Conta não encontrada:', id);
      return;
    }

    const { data: updated, error } = await supabase
      .from('contas_receber')
      .update({ status: 'recebido', data_recebimento: today, updated_at: now })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ContasReceberSlice] Erro ao marcar como recebido:', error);
      return;
    }

    _set((state: any) => ({
      contasReceber: state.contasReceber.map((c: ContaReceber) =>
        c.id === id ? formatContaReceber(updated) : c,
      ),
    }));

    // Cria transação de receita no módulo Financeiro
    await get().addTransaction({
      descricao: conta.descricao,
      valor: conta.valor,
      tipo: 'receita',
      data: today,
    });

    return formatContaReceber(updated);
  },
});
