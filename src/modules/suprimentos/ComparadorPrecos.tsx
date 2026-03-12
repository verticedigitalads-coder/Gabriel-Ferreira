import { useState } from "react"
import { useStore } from "@/store/useStore"

export default function ComparadorPrecos(){

  const fornecedores = useStore(state=>state.fornecedores)
  const materiais = useStore(state=>state.materiais)
  const cotacoes = useStore(state=>state.cotacoesMateriais)

  const addCotacao = useStore(state=>state.addCotacaoMaterial)

  const [materialId,setMaterialId] = useState("")
  const [fornecedorId,setFornecedorId] = useState("")
  const [valor,setValor] = useState("")
  const [formaPagamento,setFormaPagamento] = useState("")

  const handleAdd = async()=>{

    if(!materialId || !fornecedorId || !valor) return

    await addCotacao({
      materialId,
      fornecedorId,
      valor:Number(valor),
      formaPagamento
    })

    setValor("")
    setFormaPagamento("")
  }

  const cotacoesMaterial = cotacoes.filter(
    c=>c.material_id === materialId
  )

  const menorPreco = cotacoesMaterial.length
    ? Math.min(...cotacoesMaterial.map(c=>c.valor))
    : null

  return(

    <div className="p-6 max-w-5xl">

      <h1 className="text-xl font-bold mb-6">
        Comparador de Preços
      </h1>

      {/* FORM */}

      <div className="flex gap-3 mb-6 flex-wrap">

        <select
          value={materialId}
          onChange={e=>setMaterialId(e.target.value)}
          className="border px-3 py-2 rounded"
        >

          <option value="">
            Material
          </option>

          {materiais.map((m:any)=>(
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}

        </select>


        <select
          value={fornecedorId}
          onChange={e=>setFornecedorId(e.target.value)}
          className="border px-3 py-2 rounded"
        >

          <option value="">
            Fornecedor
          </option>

          {fornecedores.map((f:any)=>(
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}

        </select>


        <input
          placeholder="Valor"
          value={valor}
          onChange={e=>setValor(e.target.value)}
          className="border px-3 py-2 rounded w-28"
        />


        <input
          placeholder="Forma pagamento"
          value={formaPagamento}
          onChange={e=>setFormaPagamento(e.target.value)}
          className="border px-3 py-2 rounded w-48"
        />

        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Adicionar
        </button>

      </div>


      {/* LISTA */}

      <div className="space-y-2">

        {cotacoesMaterial.map((c:any)=>{

          const fornecedor = fornecedores.find(
            f=>f.id === c.fornecedor_id
          )

          const isBest = c.valor === menorPreco

          return(

            <div
              key={c.id}
              className={`border rounded p-3 flex justify-between items-center
              ${isBest ? "bg-green-50 border-green-400" : ""}`}
            >

              <div>

                <p className="font-semibold">
                  {fornecedor?.nome}
                </p>

                <p className="text-sm text-gray-500">
                  {c.forma_pagamento}
                </p>

              </div>

              <p className={`font-bold text-lg ${isBest ? "text-green-700" : ""}`}>
                R$ {c.valor}
              </p>

            </div>

          )

        })}

      </div>

    </div>

  )
}