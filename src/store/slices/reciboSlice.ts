import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import type { Recibo, ReciboStatus } from '@/types';

const VALID_RECIBO_STATUS: ReciboStatus[] = ['pendente', 'emitido', 'cancelado'];

function formatRecibo(r: any): Recibo {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    orcamentoId: r.orcamento_id,
    leadId: r.lead_id ?? null,
    numeroRecibo: r.numero_recibo ?? null,
    clienteNome: r.cliente_nome,
    clienteTelefone: r.cliente_telefone ?? null,
    clienteEndereco: r.cliente_endereco ?? null,
    descricao: r.descricao,
    itens: Array.isArray(r.itens) ? r.itens : [],
    valorTotal: Number(r.valor_total) || 0,
    dataEmissao: r.data_emissao ?? null,
    status: VALID_RECIBO_STATUS.includes(r.status) ? r.status : 'pendente',
    observacoes: r.observacoes ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createReciboSlice = (set: any, get: any) => ({
  recibos: [] as Recibo[],

  // ================= FETCH =================
  fetchRecibos: async (workspaceId: string) => {
    if (!workspaceId) return;

    const { data, error } = await supabase
      .from('recibos')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ReciboSlice] Erro ao buscar recibos:', error);
      return;
    }

    set({ recibos: (data || []).map(formatRecibo) });
  },

  // ================= ADD =================
  addRecibo: async (data: Partial<Recibo>) => {
    const { workspaceId } = get();
    const now = new Date().toISOString();

    if (!workspaceId) {
      console.error('[ReciboSlice] workspaceId está null');
      return;
    }

    if (!data.orcamentoId) {
      console.error('[ReciboSlice] orcamentoId é obrigatório');
      return;
    }

    const novo = {
      id: uuid(),
      workspace_id: workspaceId,
      orcamento_id: data.orcamentoId,
      lead_id: data.leadId ?? null,
      numero_recibo: null,
      cliente_nome: data.clienteNome || 'Cliente',
      cliente_telefone: data.clienteTelefone ?? null,
      cliente_endereco: data.clienteEndereco ?? null,
      descricao: data.descricao || '',
      itens: data.itens ?? [],
      valor_total: data.valorTotal ?? 0,
      data_emissao: data.dataEmissao ?? null,
      status: data.status || 'pendente',
      observacoes: data.observacoes ?? null,
      created_at: now,
      updated_at: now,
    };

    const { data: inserted, error } = await supabase
      .from('recibos')
      .insert([novo])
      .select()
      .single();

    if (error) {
      console.error('[ReciboSlice] Erro ao criar recibo:', error);
      return;
    }

    const formatted = formatRecibo(inserted);

    set((state: any) => {
      const exists = state.recibos.some((r: Recibo) => r.id === inserted.id);
      if (exists) return state;
      return { recibos: [formatted, ...state.recibos] };
    });

    return formatted;
  },

  // ================= UPDATE =================
  updateRecibo: async (id: string, data: Partial<Recibo>) => {
    const now = new Date().toISOString();

    const payload: Record<string, unknown> = { updated_at: now };

    if (data.clienteNome !== undefined) payload.cliente_nome = data.clienteNome;
    if (data.clienteTelefone !== undefined) payload.cliente_telefone = data.clienteTelefone;
    if (data.clienteEndereco !== undefined) payload.cliente_endereco = data.clienteEndereco;
    if (data.descricao !== undefined) payload.descricao = data.descricao;
    if (data.itens !== undefined) payload.itens = data.itens;
    if (data.valorTotal !== undefined) payload.valor_total = data.valorTotal;
    if (data.dataEmissao !== undefined) payload.data_emissao = data.dataEmissao;
    if (data.status !== undefined) payload.status = data.status;
    if (data.observacoes !== undefined) payload.observacoes = data.observacoes;
    if (data.numeroRecibo !== undefined) payload.numero_recibo = data.numeroRecibo;

    const { data: updated, error } = await supabase
      .from('recibos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ReciboSlice] Erro ao atualizar recibo:', error);
      return;
    }

    const formatted = formatRecibo(updated);

    set((state: any) => ({
      recibos: state.recibos.map((r: Recibo) => (r.id === id ? formatted : r)),
    }));

    return formatted;
  },

  // ================= DELETE =================
  deleteRecibo: async (id: string) => {
    const { error } = await supabase.from('recibos').delete().eq('id', id);

    if (error) {
      console.error('[ReciboSlice] Erro ao deletar recibo:', error);
      return;
    }

    set((state: any) => ({
      recibos: state.recibos.filter((r: Recibo) => r.id !== id),
    }));
  },

  // ================= EMITIR =================
  emitirRecibo: async (id: string) => {
    const ano = new Date().getFullYear();
    const prefixo = `REC-${ano}-`;

    // Buscar último recibo do ano para gerar número sequencial
    const { data: ultimosRecibos } = await supabase
      .from('recibos')
      .select('numero_recibo')
      .like('numero_recibo', `${prefixo}%`)
      .order('numero_recibo', { ascending: false })
      .limit(1);

    let sequencial = 1;

    if (ultimosRecibos && ultimosRecibos.length > 0) {
      const ultimo = ultimosRecibos[0].numero_recibo as string;
      const partes = ultimo.split('-');
      const ultimoNum = parseInt(partes[partes.length - 1], 10);
      if (!isNaN(ultimoNum)) {
        sequencial = ultimoNum + 1;
      }
    }

    const numeroRecibo = `${prefixo}${String(sequencial).padStart(3, '0')}`;

    const { data: updated, error } = await supabase
      .from('recibos')
      .update({
        numero_recibo: numeroRecibo,
        status: 'emitido',
        data_emissao: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ReciboSlice] Erro ao emitir recibo:', error);
      return;
    }

    const formatted = formatRecibo(updated);

    set((state: any) => ({
      recibos: state.recibos.map((r: Recibo) => (r.id === id ? formatted : r)),
    }));

    return formatted;
  },
});
