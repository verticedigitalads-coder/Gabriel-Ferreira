import { supabase } from '@/lib/supabase'
import { v4 as uuid } from 'uuid'
import { formatNota } from '@/store/formatters'
import type { Nota } from '@/types'

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
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

  },

  updateNota: async (id: string, data: Partial<Nota>) => {
    const { notas, workspaceId } = get()
    const now = new Date().toISOString()
    await supabase.from('notas').update({ ...data, updated_at: now }).eq('id', id).eq('workspace_id', workspaceId)
    set({ notas: notas.map((n: Nota) => n.id === id ? { ...n, ...data } : n) })
  },

  deleteNota: async (id: string) => {
    const { notas, workspaceId } = get()
    await supabase.from('notas').delete().eq('id', id).eq('workspace_id', workspaceId)
    set({ notas: notas.filter((n: Nota) => n.id !== id) })
  },

})