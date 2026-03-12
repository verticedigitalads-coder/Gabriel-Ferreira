import { supabase } from '@/lib/supabase'
import { v4 as uuid } from 'uuid'
import type { Fornecedor } from '@/types'

export const createFornecedorSlice = (set: any, get: any) => ({

  fornecedores: [],

  addFornecedor: async (data: Partial<Fornecedor>) => {

    const { workspaceId, fornecedores } = get()

    const now = new Date().toISOString()

    const fornecedor = {
      id: uuid(),
      workspaceId,
      ...data,
      createdAt: now
    }

    const { error } = await supabase
      .from('fornecedores')
      .insert([{
        id: fornecedor.id,
        workspace_id: workspaceId,
        nome: fornecedor.nome,
        telefone: fornecedor.telefone,
        endereco: fornecedor.endereco,
        observacoes: fornecedor.observacoes,
        created_at: now
      }])

    if (error) {
      console.error("Erro ao criar fornecedor:", error)
      return
    }

    set({
      fornecedores: [...fornecedores, fornecedor]
    })

  },

  deleteFornecedor: async (id: string) => {

    const { fornecedores } = get()

    await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id)

    set({
      fornecedores: fornecedores.filter((f: Fornecedor) => f.id !== id)
    })

  }

})