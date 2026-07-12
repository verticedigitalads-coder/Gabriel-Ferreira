import { supabase } from "@/lib/supabase"
import { formatMaterial } from "@/store/formatters"
import type { Material } from "@/types"

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createMaterialSlice = (set:any,get:any)=>({

  materiais:[],

  loadMateriais: async ()=>{

    const { workspaceId } = get()

    const { data } = await supabase
      .from("materiais")
      .select("*")
      .eq("workspace_id",workspaceId)

    set({ materiais: (data || []).map(formatMaterial) })

  },

  addMaterial: async(data:Partial<Material>)=>{

    const { workspaceId, materiais } = get()

    const { data:inserted, error } = await supabase
      .from("materiais")
      .insert([
        {
          workspace_id: workspaceId,
          nome: data.nome,
          unidade: data.unidade || null,
          categoria: data.categoria || null,
          estoque: data.estoque ?? 0,
          estoque_minimo: data.estoqueMinimo ?? 0,
        }
      ])
      .select()
      .single()

    if(error){
      console.error('[MaterialSlice] Erro ao criar:', error)
      return
    }

    set({
      materiais:[...materiais, formatMaterial(inserted)]
    })

  },

  updateMaterial: async(id:string, data:Partial<Material>)=>{

    const { materiais } = get()

    const payload: Record<string, unknown> = {}
    if(data.nome !== undefined)         payload.nome = data.nome
    if(data.unidade !== undefined)      payload.unidade = data.unidade || null
    if(data.categoria !== undefined)    payload.categoria = data.categoria || null
    if(data.estoqueMinimo !== undefined) payload.estoque_minimo = data.estoqueMinimo ?? 0

    const { data:updated, error } = await supabase
      .from("materiais")
      .update(payload)
      .eq("id", id)
      .eq("workspace_id", get().workspaceId)
      .select()
      .single()

    if(error){
      console.error('[MaterialSlice] Erro ao atualizar:', error)
      return
    }

    set({
      materiais: materiais.map((m:Material)=>
        m.id === id ? formatMaterial(updated) : m
      )
    })

  },

  deleteMaterial: async(id:string)=>{

    const { materiais } = get()

    const { error } = await supabase
      .from("materiais")
      .delete()
      .eq("id", id)
      .eq("workspace_id", get().workspaceId)

    if(error){
      console.error('[MaterialSlice] Erro ao excluir:', error)
      return
    }

    set({
      materiais: materiais.filter((m:Material)=> m.id !== id)
    })

  },

  movimentarEstoque: async(id:string, tipo:'entrada'|'saida', quantidade:number, _motivo:string)=>{

    const { materiais } = get()

    const material = materiais.find((m:Material)=> m.id === id)
    if(!material) return

    const novoEstoque = tipo === 'entrada'
      ? material.estoque + quantidade
      : material.estoque - quantidade

    if(novoEstoque < 0){
      console.warn('[MaterialSlice] Estoque insuficiente para saída')
      return
    }

    const { data:updated, error } = await supabase
      .from("materiais")
      .update({ estoque: novoEstoque })
      .eq("id", id)
      .eq("workspace_id", get().workspaceId)
      .select()
      .single()

    if(error){
      console.error('[MaterialSlice] Erro ao movimentar estoque:', error)
      return
    }

    set({
      materiais: materiais.map((m:Material)=>
        m.id === id ? formatMaterial(updated) : m
      )
    })

  },

  reduceMaterialStock: async (materialId:string, quantidade:number)=>{

    const { materiais } = get()

    const material = materiais.find((m:Material)=>m.id === materialId)

    if(!material) return

    const novoEstoque = material.estoque - quantidade

    await supabase
      .from("materiais")
      .update({
        estoque: novoEstoque
      })
      .eq("id", materialId)
      .eq("workspace_id", get().workspaceId)

    set({
      materiais: materiais.map((m:Material)=>
        m.id === materialId
          ? { ...m, estoque: novoEstoque }
          : m
      )
    })

  },

})
