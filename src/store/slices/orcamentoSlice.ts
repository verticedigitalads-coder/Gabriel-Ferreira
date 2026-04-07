import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import type { Orcamento } from '@/types';
import { calcularOrcamento } from '@/domain/orcamento/calcularOrcamento';

function normalizarItens(itens: any[]) {
  return itens.map((item: any) => {
    const quantidade = Number(item.quantidade) || 1;
    const valorUnitario = Number(item.valorUnitario) || 0;

    return {
      ...item,
      quantidade,
      valorUnitario,
      valorTotal: quantidade * valorUnitario,
    };
  });
}

export const createOrcamentoSlice = (set: any, get: any) => ({
  orcamentos: [],

  // ================= ADD =================
  addOrcamento: async (data: Partial<Orcamento>) => {
    const { workspaceId } = get();
    const now = new Date().toISOString();

    if (!workspaceId) {
      console.error('❌ workspaceId está null');
      return;
    }

    if (!data.leadId || typeof data.leadId !== 'string') {
      console.error('❌ leadId inválido');
      return;
    }

    const itensNormalizados =
      data.itens && data.itens.length > 0 ? normalizarItens(data.itens) : [];

    const { subtotal, total } = calcularOrcamento({
      itens: itensNormalizados,
      multiplicador: data.multiplicador ?? 1,
      desconto: data.desconto || 0,
    });

    const novo = {
      id: uuid(),
      workspace_id: workspaceId,
      lead_id: data.leadId,

      numero: data.numero || `ORC-${Date.now()}`,

      itens: itensNormalizados,

      subtotal,
      total,

      desconto: data.desconto || 0,
      multiplicador: data.multiplicador ?? 1,

      status: data.status || 'rascunho',

      observacoes: data.observacoes || '',
      validade_em_dias: data.validadeEmDias ?? 7,

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

    set((state: any) => {
      const exists = state.orcamentos.some((o: any) => o.id === inserted.id);

      if (exists) return state;

      return {
        orcamentos: [inserted, ...state.orcamentos],
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

    set((state: any) => ({
      orcamentos: state.orcamentos.filter((o: any) => o.id !== id),
    }));
  },

  // ================= UPDATE =================
  updateOrcamento: async (id: string, data: Partial<Orcamento>) => {
    const now = new Date().toISOString();

    const payload: any = {
      updated_at: now,
    };

    if (data.leadId !== undefined) payload.lead_id = data.leadId;
    if (data.itens !== undefined) {
      const itensNormalizados = normalizarItens(data.itens);

      payload.itens = itensNormalizados;

      const { subtotal, total } = calcularOrcamento({
        itens: itensNormalizados,
        multiplicador: data.multiplicador ?? 1,
        desconto: data.desconto || 0,
      });

      payload.subtotal = subtotal;
      payload.total = total;
    }

    if (data.subtotal !== undefined)
      payload.subtotal = Number(data.subtotal) || 0;

    if (data.total !== undefined) payload.total = Number(data.total) || 0;

    if (data.desconto !== undefined) payload.desconto = data.desconto;

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

    set((state: any) => {
      const exists = state.orcamentos.some((o: any) => o.id === id);

      if (!exists) {
        return {
          orcamentos: [updated, ...state.orcamentos],
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
