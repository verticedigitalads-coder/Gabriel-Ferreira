import { createLead } from '@/services/database/lead.service'
import { supabase } from '@/lib/supabase'
import type { Lead, LeadStatus } from '@/types'

export const createLeadSlice = (set: any, get: any) => ({

  leads: [],

  // ================= ADD LEAD =================

  addLead: async (data: Partial<Lead>) => {

    const { workspaceId, leads } = get()

    const inserted = await createLead(data, workspaceId)

    if (!inserted) return

    set({
      leads: [...leads, inserted]
    })

    return inserted
  },

  // ================= UPDATE LEAD =================

updateLead: async (id: string, updates: Partial<Lead>) => {

  const now = new Date().toISOString()

  const payload: any = {
    updated_at: now
  }

  if (updates.nome !== undefined) payload.nome = updates.nome
  if (updates.telefone !== undefined) payload.telefone = updates.telefone
  if (updates.email !== undefined) payload.email = updates.email
  if (updates.endereco !== undefined) payload.endereco = updates.endereco
  if (updates.servico !== undefined) payload.servico = updates.servico
  if (updates.resumo !== undefined) payload.resumo = updates.resumo
  if (updates.observacoes !== undefined) payload.observacoes = updates.observacoes
  if (updates.valorOrcado !== undefined) payload.valor_orcado = updates.valorOrcado
  if (updates.orcamentoEnviado !== undefined) payload.orcamento_enviado = updates.orcamentoEnviado

  const { data: updatedLead, error } = await supabase
    .from('leads')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error("Erro ao atualizar lead:", error)
    return
  }

  set((state: any) => ({
    leads: state.leads.map((lead: Lead) =>
      lead.id === id ? updatedLead : lead
    )
  }))
},

  // ================= UPDATE STATUS =================

  updateLeadStatus: async (leadId: string, status: LeadStatus) => {

    const now = new Date().toISOString()

    const { error } = await supabase
      .from('leads')
      .update({
        status,
        updated_at: now
      })
      .eq('id', leadId)

    if (error) {
      console.error("Erro ao atualizar status:", error)
      return
    }

    set((state: any) => ({
      leads: state.leads.map((lead: Lead) =>
        lead.id === leadId
          ? { ...lead, status }
          : lead
      )
    }))
  },

  // ================= DELETE LEAD =================

  deleteLead: async (id: string) => {

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("Erro ao deletar lead:", error)
      return
    }

    set((state: any) => ({
      leads: state.leads.filter((l: Lead) => l.id !== id)
    }))
  },

// ================= MARCAR ORÇADO =================

  markAsOrcado: async (id: string, valor: number) => {

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('leads')
    .update({
      status: 'orcado',
      valor_orcado: valor,
      orcamento_enviado: true,
      data_orcamento: now,
      updated_at: now
    })
    .eq('id', id)

  if (error) {
    console.error("Erro ao marcar como orçado:", error)
    return
  }

  const { addOrcamento } = get()

  await addOrcamento({
  leadId: id,
  numero: `ORC-${Date.now()}`,
  itens: [],
  subtotal: valor,
  desconto: 0,
  total: valor,
  status: 'rascunho',
  observacoes: '',
  validadeEmDias: 7,
  createdAt: new Date().toISOString()
})

  set((state: any) => ({
    leads: state.leads.map((lead: Lead) =>
      lead.id === id
        ? {
            ...lead,
            status: 'orcado',
            valorOrcado: valor,
            orcamentoEnviado: true
          }
        : lead
    )
  }))
},

  // ================= MARCAR FECHADO =================

  markAsFechado: async (id: string) => {

    const now = new Date().toISOString()

    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update({
        status: 'fechado',
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao marcar como fechado:', error)
      return
    }

    set((state: any) => ({
      leads: state.leads.map((lead: Lead) =>
        lead.id === id ? updatedLead : lead
      )
    }))
  }

})

