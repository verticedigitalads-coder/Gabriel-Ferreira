import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import type { Orcamento } from '@/types';

export const createOrcamentoSlice = (_set: any, get: any) => ({
  orcamentos: [],

  // ================= ADD =================

  addOrcamento: async (data: Partial<Orcamento>) => {
    const { workspaceId } = get();
    const now = new Date().toISOString();

    const novo = {
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

    const { data: inserted, error } = await supabase
      .from('orcamentos')
      .insert([novo])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar orçamento:', error);
      return;
    }

    _set((state: any) => {
      if (!inserted) return state;

      const exists = state.orcamentos.some((o: any) => o.id === inserted.id);

      if (exists) return state; // evita duplicação

      return {
        orcamentos: [...state.orcamentos, inserted],
      };
    });

    return inserted;
  },

  // ================= DELETE =================

  deleteOrcamento: async (id: string) => {
    const { error } = await supabase.from('orcamentos').delete().eq('id', id);

    if (error) {
      console.error('Erro ao deletar orçamento:', error);
      return;
    }

    _set((state: any) => ({
      orcamentos: state.orcamentos.filter((o: any) => o.id !== id),
    }));
  },

  // ================= UPDATE =================

  updateOrcamento: async (id: string, data: Partial<Orcamento>) => {
    const now = new Date().toISOString();

    // 🔒 mapeamento seguro (camel → snake)
    const payload: any = {
      updated_at: now,
    };

    if (data.leadId !== undefined) payload.lead_id = data.leadId;
    if (data.itens !== undefined) payload.itens = data.itens;
    if (data.subtotal !== undefined) payload.subtotal = data.subtotal;
    if (data.desconto !== undefined) payload.desconto = data.desconto;
    if (data.total !== undefined) payload.total = data.total;
    if (data.multiplicador !== undefined)
      payload.multiplicador = data.multiplicador;
    if (data.status !== undefined) payload.status = data.status;
    if (data.observacoes !== undefined) payload.observacoes = data.observacoes;
    if (data.validadeEmDias !== undefined)
      payload.validade_em_dias = data.validadeEmDias;

    const { data: updated, error } = await supabase
      .from('orcamentos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar orçamento:', error);
      return;
    }

    _set((state: any) => {
      if (!updated) return state;

      const exists = state.orcamentos.some((o: any) => o.id === id);

      if (!exists) {
        // fallback (caso ainda não esteja no state)
        return {
          orcamentos: [...state.orcamentos, updated],
        };
      }

      return {
        orcamentos: state.orcamentos.map((o: any) =>
          o.id === id ? updated : o,
        ),
      };
    });

    return updated;
  },
});
