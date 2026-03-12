import { useState } from "react"
import { useStore } from "@/store/useStore"

export default function Estoque(){

  const materiais = useStore(state=>state.materiais)
  const addMaterial = useStore(state=>state.addMaterial)

  const [nome,setNome] = useState("")
  const [unidade,setUnidade] = useState("")
  const [estoque,setEstoque] = useState("")
  const [estoqueMinimo,setEstoqueMinimo] = useState("")

  const handleAdd = async()=>{

    if(!nome) return

    await addMaterial({
      nome,
      unidade,
      estoque:Number(estoque),
      estoqueMinimo:Number(estoqueMinimo)
    })

    setNome("")
    setUnidade("")
    setEstoque("")
    setEstoqueMinimo("")
  }

  return(

    <div className="p-6 max-w-5xl">

      <h1 className="text-xl font-bold mb-6">
        Controle de Estoque
      </h1>

      <div className="flex gap-3 mb-6 flex-wrap">

        <input
          placeholder="Material"
          value={nome}
          onChange={e=>setNome(e.target.value)}
          className="border px-3 py-2 rounded"
        />

        <input
          placeholder="Unidade"
          value={unidade}
          onChange={e=>setUnidade(e.target.value)}
          className="border px-3 py-2 rounded"
        />

        <input
          placeholder="Estoque"
          value={estoque}
          onChange={e=>setEstoque(e.target.value)}
          className="border px-3 py-2 rounded w-24"
        />

        <input
          placeholder="Estoque mínimo"
          value={estoqueMinimo}
          onChange={e=>setEstoqueMinimo(e.target.value)}
          className="border px-3 py-2 rounded w-32"
        />

        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Adicionar
        </button>

      </div>


      <div className="space-y-3">

        {materiais.map((m:any)=>{

          const baixoEstoque = m.estoque <= m.estoque_minimo

          return(

            <div
              key={m.id}
              className={`border rounded-lg p-4 flex justify-between items-center
              ${baixoEstoque ? "bg-red-50 border-red-400" : ""}`}
            >

              <div>

                <p className="font-semibold">
                  {m.nome}
                </p>

                <p className="text-sm text-gray-500">
                  Unidade: {m.unidade}
                </p>

              </div>

              <div className="text-right">

                <p className="font-bold">
                  Estoque: {m.estoque}
                </p>

                {baixoEstoque && (
                  <p className="text-red-600 text-sm font-semibold">
                    Estoque baixo
                  </p>
                )}

              </div>

            </div>

          )

        })}

      </div>

    </div>

  )
}