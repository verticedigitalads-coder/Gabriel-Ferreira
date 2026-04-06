import { supabase } from '@/lib/supabase'
import { v4 as uuid } from 'uuid'
import { formatNota } from '@/store/formatters'
import type { Nota } from '@/types'

export const createNotaSlice = (set: any, get: any) => ({

  notas: [],

  addNota: async (data: Partial<Nota>) => {

    const { workspaceId, notas } = get()
    const now = new Date().toISOString()

    const notaRaw = {
      id: uuid(),
      workspace_id: workspaceId,
      lead_id: data.leadId,
      numero: data.numero || `NF-${Date.now()}`,
      valor: data.valor || 0,
      data: data.data || now,
      status: data.status || 'pendente',
      observacoes: data.observacoes || '',
      created_at: now,
      updated_at: now,
    }

    await supabase
      .from('notas')
      .insert([notaRaw])

    set({
      notas: [...notas, formatNota(notaRaw)]
    })

  }

})