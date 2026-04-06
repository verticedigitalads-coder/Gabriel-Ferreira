import { supabase } from "@/lib/supabase"
import { formatCotacaoMaterial } from "@/store/formatters"

export const createCotacaoMaterialSlice = (set:any,get:any)=>({

  cotacoesMateriais:[],

  addCotacaoMaterial: async(data:any)=>{

    const { workspaceId, cotacoesMateriais } = get()

    const { data:inserted, error } = await supabase
      .from("cotacoes_materiais")
      .insert([
        {
          workspace_id: workspaceId,
          fornecedor_id: data.fornecedorId,
          material: data.material,
          quantidade: data.quantidade,
          valor: data.valor,
          forma_pagamento: data.formaPagamento
        }
      ])
      .select()
      .single()

    if(error){
      console.error("Erro ao criar cotação:",error)
      return
    }

    set({
      cotacoesMateriais:[...cotacoesMateriais, formatCotacaoMaterial(inserted)]
    })

  },

})