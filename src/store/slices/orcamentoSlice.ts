import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import type { Orcamento, OrcamentoItem } from '@/types';
import { calcularOrcamento } from '@/domain/orcamento/calcularOrcamento';
import { formatOrcamento } from '@/store/formatters';

function normalizarItens(itens: OrcamentoItem[]) {
  return itens.map((item: OrcamentoItem) => {
    const quantidade = Number(item.quantidade) || 1;
    const valorUnitario = Number(item.valorUnitario) || 0;

    return {
      ...item,
      // Textos sem espaço sobrando nas pontas (o meio não muda)
      descricao: item.descricao?.trim() ?? item.descricao,
      ambiente: item.ambiente?.trim() ?? item.ambiente,
      quantidade,
      valorUnitario,
      valorTotal: quantidade * valorUnitario,
    };
  });
}

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createOrcamentoSlice = (set: any, get: any) => ({
  orcamentos: [],

  // ================= ADD =================
  addOrcamento: async (data: Partial<Orcamento>) => {
    const { workspaceId } = get();
    const now = new Date().toISOString();

    if (!workspaceId) {
      console.error('[OrcamentoSlice] workspaceId está null');
      return;
    }

    if (!data.leadId || typeof data.leadId !== 'string') {
      console.error('[OrcamentoSlice] leadId inválido');
      return;
    }

    const itensNormalizados =
      data.itens && data.itens.length > 0 ? normalizarItens(data.itens) : [];

    const { subtotal, total, comissao } = calcularOrcamento({
      itens: itensNormalizados,
      multiplicador: data.multiplicador ?? 1,
      desconto: data.desconto || 0,
      percentualComissao: data.percentualComissao ?? 0,
    });

    // Número do documento: ORC-<ano>-NNN, sequencial por empresa e por ano. O
    // maior do ano é calculado aqui (a ordem por texto quebraria depois de
    // 999). O legado guarda ORC-2026-001, então em 2026 o primeiro novo é 002.
    const prefixo = `ORC-${new Date().getFullYear()}-`;
    const { data: doAno, error: erroNumero } = await supabase
      .from('orcamentos')
      .select('numero_documento')
      .eq('workspace_id', workspaceId)
      .like('numero_documento', `${prefixo}%`);

    if (erroNumero) {
      console.error('[OrcamentoSlice] Erro ao buscar o número do orçamento:', erroNumero);
      return;
    }

    const maior = (doAno || []).reduce((max: number, o: any) => {
      const n = parseInt(String(o.numero_documento).slice(prefixo.length), 10);
      return Number.isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const numeroDocumento = (seq: number) => `${prefixo}${String(seq).padStart(3, '0')}`;

    const novo = {
      id: uuid(),
      workspace_id: workspaceId,
      lead_id: data.leadId,

      // O mesmo número em todo lugar (lista, recibo, arquivo, PDF)
      numero: numeroDocumento(maior + 1),
      numero_documento: numeroDocumento(maior + 1),

      itens: itensNormalizados,

      subtotal,
      total,

      desconto: data.desconto || 0,
      multiplicador: data.multiplicador ?? 1,
      percentual_comissao: data.percentualComissao ?? 0,
      valor_comissao: comissao,

      status: data.status || 'rascunho',

      observacoes: (data.observacoes || '').trim(),
      validade_em_dias: data.validadeEmDias ?? 7,

      created_at: now,
      updated_at: now,
    };

    const inserir = (linha: typeof novo) =>
      supabase.from('orcamentos').insert([linha]).select().single();

    let { data: inserted, error } = await inserir(novo);

    // Outro orçamento da empresa pegou o mesmo número ao mesmo tempo (índice
    // único): tenta uma vez com o seguinte
    if (error?.code === '23505') {
      const seguinte = numeroDocumento(maior + 2);
      ({ data: inserted, error } = await inserir({
        ...novo,
        numero: seguinte,
        numero_documento: seguinte,
      }));
    }

    if (error) {
      console.error('[OrcamentoSlice] Erro ao criar orçamento:', error);
      return;
    }

    set((state: any) => {
      const exists = state.orcamentos.some((o: Orcamento) => o.id === inserted.id);

      if (exists) return state;

      return {
        orcamentos: [formatOrcamento(inserted), ...state.orcamentos],
      };
    });

    return formatOrcamento(inserted);
  },

  // ================= DELETE =================
  deleteOrcamento: async (id: string) => {
    const { error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', id)
      .eq('workspace_id', get().workspaceId);

    if (error) {
      console.error('[OrcamentoSlice] Erro ao deletar orçamento:', error);
      return;
    }

    set((state: any) => ({
      orcamentos: state.orcamentos.filter((o: Orcamento) => o.id !== id),
    }));
  },

  // ================= UPDATE =================
  updateOrcamento: async (id: string, data: Partial<Orcamento>) => {
    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      updated_at: now,
    };

    if (data.leadId !== undefined) payload.lead_id = data.leadId;
    if (data.itens !== undefined) {
      const itensNormalizados = normalizarItens(data.itens);

      payload.itens = itensNormalizados;

      const { subtotal, total, comissao } = calcularOrcamento({
        itens: itensNormalizados,
        multiplicador: data.multiplicador ?? 1,
        desconto: data.desconto || 0,
        percentualComissao: data.percentualComissao ?? 0,
      });

      payload.subtotal = subtotal;
      payload.total = total;
      payload.valor_comissao = comissao;
    }

    if (data.subtotal !== undefined)
      payload.subtotal = Number(data.subtotal) || 0;

    if (data.total !== undefined) payload.total = Number(data.total) || 0;

    if (data.desconto !== undefined) payload.desconto = data.desconto;

    if (data.multiplicador !== undefined)
      payload.multiplicador = data.multiplicador;
    if (data.percentualComissao !== undefined)
      payload.percentual_comissao = data.percentualComissao;
    if (data.valorComissao !== undefined)
      payload.valor_comissao = data.valorComissao;
    if (data.status !== undefined) payload.status = data.status;
    if (data.observacoes !== undefined)
      payload.observacoes = data.observacoes?.trim() ?? data.observacoes;
    if (data.validadeEmDias !== undefined)
      payload.validade_em_dias = data.validadeEmDias;

    const { data: updated, error } = await supabase
      .from('orcamentos')
      .update(payload)
      .eq('id', id)
      .eq('workspace_id', get().workspaceId)
      .select()
      .single();

    if (error) {
      console.error('[OrcamentoSlice] Erro ao atualizar orçamento:', error);
      return;
    }

    set((state: any) => {
      const exists = state.orcamentos.some((o: Orcamento) => o.id === id);

      if (!exists) {
        return {
          orcamentos: [formatOrcamento(updated), ...state.orcamentos],
        };
      }

      return {
        orcamentos: state.orcamentos.map((o: Orcamento) =>
          o.id === id ? formatOrcamento(updated) : o,
        ),
      };
    });

    return formatOrcamento(updated);
  },

  // ================= ASSINATURA CLIENTE =================
  salvarAssinaturaCliente: async (orcamentoId: string, assinatura: string) => {
    const { error } = await supabase
      .from('orcamentos')
      .update({
        assinatura_cliente: assinatura,
        data_assinatura: new Date().toISOString(),
      })
      .eq('id', orcamentoId)
      .eq('workspace_id', get().workspaceId);

    if (error) {
      console.error('[OrcamentoSlice] Erro ao salvar assinatura:', error);
      return false;
    }

    set((state: any) => ({
      orcamentos: state.orcamentos.map((o: Orcamento) =>
        o.id === orcamentoId
          ? { ...o, assinaturaCliente: assinatura, dataAssinatura: new Date().toISOString() }
          : o,
      ),
    }));

    return true;
  },
});
