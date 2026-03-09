import { supabase } from '@/lib/supabase'
import type { Lead, LeadStatus } from '@/types'

export const createLeadSlice = (set: any, get: any) => ({

  leads: [],

  addLead: async (data: Partial<Lead>) => {

    const { workspaceId } = get()
    const now = new Date().toISOString()

    const payload = {
      nome: data.nome || '',
      telefone: data.telefone || '',
      email: data.email || '',
      endereco: data.endereco || '',
      servico: data.servico || '',
      status: data.status || 'novo',
      temperatura: data.temperatura || 'frio',
      orcamento_enviado: data.orcamentoEnviado ?? false,
      valor_orcado: data.valorOrcado ?? null,
      resumo: data.resumo || '',
      observacoes: data.observacoes || '',
      workspace_id: workspaceId,
      created_at: now,
      updated_at: now,
    }

    const { data: inserted, error } = await supabase
      .from('leads')
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.error('Erro ao inserir lead:', error)
      return null
    }

    set((state: any) => ({
      leads: [...state.leads, inserted],
    }))

    return inserted
  },

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
  }

})