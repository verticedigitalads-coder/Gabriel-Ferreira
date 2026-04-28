import { supabase } from "@/lib/supabase"
import { formatConsumoMaterial } from "@/store/formatters"

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createConsumoMaterialSlice = (set:any,get:any)=>({

  consumoMateriais:[],

  registrarConsumoMaterial: async(data:any)=>{

    const { workspaceId } = get()

    const { reduceMaterialStock } = get()

    const { data:inserted } = await supabase
      .from("consumo_materiais")
      .insert([
        {
          workspace_id: workspaceId,
          lead_id: data.leadId,
          material_id: data.materialId,
          quantidade: data.quantidade
        }
      ])
      .select()
      .single()

    await reduceMaterialStock(
      data.materialId,
      data.quantidade
    )

    set((state:any)=>({
      consumoMateriais:[
        ...state.consumoMateriais,
        formatConsumoMaterial(inserted)
      ]
    }))

  }

})