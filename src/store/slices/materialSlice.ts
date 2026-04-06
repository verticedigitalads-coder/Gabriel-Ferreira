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
          workspace_id:workspaceId,
          nome:data.nome,
          unidade:data.unidade
        }
      ])
      .select()
      .single()

    if(error){
      console.error(error)
      return
    }

    set({
      materiais:[...materiais, formatMaterial(inserted)]
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