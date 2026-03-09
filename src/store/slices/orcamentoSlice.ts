import { supabase } from '@/lib/supabase'
import { v4 as uuid } from 'uuid'
import type { Orcamento } from '@/types'

export const createOrcamentoSlice = (set: any, get: any) => ({

  orcamentos: [],

  addOrcamento: async (data: Partial<Orcamento>) => {

    const { workspaceId, orcamentos } = get()
    const now = new Date().toISOString()

    const novoOrcamento = {
      id: uuid(),
      workspace_id: workspaceId,
      lead_id: data.leadId!,
      numero: data.numero || `ORC-${Date.now()}`,
      itens: data.itens || [],
      subtotal: data.subtotal || 0,
      desconto: data.desconto || 0,
      total: data.total || 0,
      status: data.status || 'rascunho',
      observacoes: data.observacoes || '',
      validade_em_dias: data.validadeEmDias || 7,
      created_at: now,
      updated_at: now,
    }

    const { error } = await supabase
      .from('orcamentos')
      .insert([novoOrcamento])

    if (error) {
      console.error("Erro ao salvar orçamento:", error)
      return
    }

    set({ orcamentos: [...orcamentos, novoOrcamento] })

    return novoOrcamento
  },

  deleteOrcamento: async (id: string) => {

    const { orcamentos } = get()

    await supabase
      .from('orcamentos')
      .delete()
      .eq('id', id)

    set({
      orcamentos: orcamentos.filter((o: Orcamento) => o.id !== id)
    })

  }

})