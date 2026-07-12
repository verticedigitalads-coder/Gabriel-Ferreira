import { supabase } from "@/lib/supabase"
import { formatCotacaoMaterial } from "@/store/formatters"
import type { CotacaoMaterial } from "@/types"

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createCotacaoMaterialSlice = (set: any, get: any) => ({

  cotacoesMateriais: [],

  fetchCotacoesMateriais: async () => {
    const { workspaceId } = get()
    if (!workspaceId) return

    const { data, error } = await supabase
      .from('cotacoes_materiais')
      .select('*, materiais(nome), fornecedores(nome)')
      .eq('workspace_id', workspaceId)
      .order('data', { ascending: false })

    if (error) {
      console.error('[CotacaoMaterialSlice] Erro ao buscar cotações:', error)
      return
    }

    set({ cotacoesMateriais: (data || []).map(formatCotacaoMaterial) })
  },

  addCotacaoMaterial: async (data: Partial<CotacaoMaterial>) => {
    const { workspaceId } = get()
    if (!workspaceId) return

    const { error } = await supabase
      .from('cotacoes_materiais')
      .insert([{
        workspace_id: workspaceId,
        material_id: data.materialId ?? null,
        fornecedor_id: data.fornecedorId,
        material: data.material ?? null,
        quantidade: data.quantidade ?? 1,
        valor: data.valor,
        forma_pagamento: data.formaPagamento ?? null,
        data: data.data,
        created_at: new Date().toISOString(),
      }])

    if (error) {
      console.error('[CotacaoMaterialSlice] Erro ao criar cotação:', error)
      get().addToast?.({
        type: 'error',
        message: `Erro ao salvar cotação: ${error.message}`,
      })
      return
    }

    await get().fetchCotacoesMateriais()
  },

  deleteCotacaoMaterial: async (id: string) => {
    const { error } = await supabase
      .from('cotacoes_materiais')
      .delete()
      .eq('id', id)
      .eq('workspace_id', get().workspaceId)

    if (error) {
      console.error('[CotacaoMaterialSlice] Erro ao deletar cotação:', error)
      return
    }

    set((state: any) => ({
      cotacoesMateriais: state.cotacoesMateriais.filter((c: CotacaoMaterial) => c.id !== id),
    }))
  },

})
