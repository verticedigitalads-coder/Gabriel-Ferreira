import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import type { Orcamento } from '@/types';

export const createOrcamentoSlice = (_set: any, get: any) => ({
  orcamentos: [],

  // ================= ADD =================

  addOrcamento: async (data: Partial<Orcamento>) => {
    const { workspaceId } = get();
    const now = new Date().toISOString();

    if (!workspaceId) {
      console.error('❌ workspaceId está null');
      return;
    }

    if (!data.leadId) {
      console.error('❌ leadId está null');
      return;
    }

    const novoOrcamento = {
      id: uuid(),
      workspace_id: workspaceId,
      lead_id: data.leadId,
      numero: data.numero || `ORC-${Date.now()}`,

      itens: data.itens || [],
      subtotal: data.subtotal || 0,
      desconto: data.desconto || 0,
      total: data.total || 0,

      multiplicador: data.multiplicador ?? 1,

      status: data.status || 'rascunho',
      observacoes: data.observacoes || '',
      validade_em_dias: data.validadeEmDias || 7,

      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase
      .from('orcamentos')
      .insert([novoOrcamento]);

    if (error) {
      console.error('Erro ao criar orçamento:', error);
      return;
    }
  },

  // ================= DELETE =================

  deleteOrcamento: async (id: string) => {
    const { error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar orçamento:', error);
    }
  },

  // ================= UPDATE =================

  updateOrcamento: async (id: string, data: Partial<Orcamento>) => {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('orcamentos')
      .update({
        lead_id: data.leadId,
        itens: data.itens,
        subtotal: data.subtotal,
        desconto: data.desconto,
        total: data.total,
        multiplicador: data.multiplicador,
        status: data.status,
        observacoes: data.observacoes,
        validade_em_dias: data.validadeEmDias,
        updated_at: now,
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar orçamento:', error);
    }
  },
});