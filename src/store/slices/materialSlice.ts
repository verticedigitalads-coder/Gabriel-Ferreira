import { supabase } from "@/lib/supabase"
import { formatMaterial } from "@/store/formatters"

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

  addMaterial: async(data:any)=>{

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

  updateMaterial: async(id:string, data:any)=>{

    const { materiais } = get()

    const payload: any = {}
    if(data.nome !== undefined)         payload.nome = data.nome
    if(data.unidade !== undefined)      payload.unidade = data.unidade || null
    if(data.categoria !== undefined)    payload.categoria = data.categoria || null
    if(data.estoqueMinimo !== undefined) payload.estoque_minimo = data.estoqueMinimo ?? 0

    const { data:updated, error } = await supabase
      .from("materiais")
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if(error){
      console.error('[MaterialSlice] Erro ao atualizar:', error)
      return
    }

    set({
      materiais: materiais.map((m:any)=>
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

    if(error){
      console.error('[MaterialSlice] Erro ao excluir:', error)
      return
    }

    set({
      materiais: materiais.filter((m:any)=> m.id !== id)
    })

  },

  movimentarEstoque: async(id:string, tipo:'entrada'|'saida', quantidade:number, _motivo:string)=>{

    const { materiais } = get()

    const material = materiais.find((m:any)=> m.id === id)
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
      .select()
      .single()

    if(error){
      console.error('[MaterialSlice] Erro ao movimentar estoque:', error)
      return
    }

    set({
      materiais: materiais.map((m:any)=>
        m.id === id ? formatMaterial(updated) : m
      )
    })

  },

  reduceMaterialStock: async (materialId:string, quantidade:number)=>{

    const { materiais } = get()

    const material = materiais.find((m:any)=>m.id === materialId)

    if(!material) return

    const novoEstoque = material.estoque - quantidade

    await supabase
      .from("materiais")
      .update({
        estoque: novoEstoque
      })
      .eq("id", materialId)

    set({
      materiais: materiais.map((m:any)=>
        m.id === materialId
          ? { ...m, estoque: novoEstoque }
          : m
      )
    })

  },

})
