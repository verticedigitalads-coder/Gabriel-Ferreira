import { supabase } from '@/lib/supabase'
import { v4 as uuid } from 'uuid'
import type { Transaction } from '@/types'

export const createFinanceiroSlice = (set: any, get: any) => ({

  transactions: [],

  addTransaction: async (data: Partial<Transaction>) => {

    const { workspaceId, transactions } = get()
    const now = new Date().toISOString()

    const transaction = {
      id: uuid(),
      workspace_id: workspaceId,
      lead_id: data.leadId,
      tipo: data.tipo || 'receita',
      descricao: data.descricao || '',
      valor: data.valor || 0,
      data: data.data || now,
      categoria: data.categoria || '',
      observacoes: data.observacoes || '',
      created_at: now,
      updated_at: now,
    }

    const { error } = await supabase
      .from('transactions')
      .insert([transaction])

    if (error) {
      console.error("Erro ao salvar transação:", error)
      return
    }

    set({
      transactions: [...transactions, transaction]
    })

  }

})