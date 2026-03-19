import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import type { Orcamento } from '@/types';

export const createOrcamentoSlice = (set: any, get: any) => ({
  orcamentos: [],

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

      multiplicador: data.multiplicador || 1,

      status: data.status || 'rascunho',
      observacoes: data.observacoes || '',
      validade_em_dias: data.validadeEmDias || 7,

      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase.from('orcamentos').insert([novoOrcamento]);

    if (error) {
      console.error('Erro ao salvar orçamento:', error);
      return;
    }

    set({ orcamentos: [...orcamentos, novoOrcamento] });

    return novoOrcamento;
  },

  deleteOrcamento: async (id: string) => {
    const { orcamentos } = get();

    await supabase.from('orcamentos').delete().eq('id', id);

    set({
      orcamentos: orcamentos.filter((o: Orcamento) => o.id !== id),
    });
  },

  updateOrcamento: async (id: string, data: Partial<Orcamento>) => {
    const { orcamentos } = get();
    const now = new Date().toISOString();

    // 1. Atualiza no banco
    const { error } = await supabase
      .from('orcamentos')
      .update({
        lead_id: data.leadId,
        itens: data.itens,
        subtotal: data.subtotal,
        desconto: data.desconto,
        total: data.total,
        status: data.status,
        observacoes: data.observacoes,
        validade_em_dias: data.validadeEmDias,
        updated_at: now,
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar orçamento:', error);
      return;
    }

    // 2. Atualiza no estado local (Zustand)
    set({
      orcamentos: orcamentos.map((o: Orcamento) =>
        o.id === id
          ? {
              ...o,
              ...data,
              updatedAt: now,
            }
          : o,
      ),
    });
  },
});
