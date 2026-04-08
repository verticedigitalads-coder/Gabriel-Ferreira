import { useState } from "react"
import { useStore } from "@/store/useStore"

export default function ComparadorPrecos(){

  const fornecedores = useStore(state=>state.fornecedores)
  const materiais = useStore(state=>state.materiais)
  const cotacoes = useStore(state=>state.cotacoesMateriais)

  const addCotacao = useStore(state=>state.addCotacaoMaterial)

  const [materialNome,setMaterialNome] = useState("")
  const [fornecedorId,setFornecedorId] = useState("")
  const [valor,setValor] = useState("")
  const [formaPagamento,setFormaPagamento] = useState("")

  const handleAdd = async()=>{

    if(!materialNome || !fornecedorId || !valor) return

    await addCotacao({
      material: materialNome,
      fornecedorId,
      valor:Number(valor),
      formaPagamento
    })

    setValor("")
    setFormaPagamento("")
  }

  const cotacoesMaterial = cotacoes.filter(
    (c:any) => c.material === materialNome
  )

  const menorPreco = cotacoesMaterial.length
    ? Math.min(...cotacoesMaterial.map((c:any)=>c.valor))
    : null

  return(

    <div className="p-6 max-w-5xl">

      <h1 className="text-xl font-bold mb-6">
        Comparador de Preços
      </h1>

      {/* FORM */}

      <div className="flex gap-3 mb-6 flex-wrap">

        <select
          value={materialNome}
          onChange={e=>setMaterialNome(e.target.value)}
          className="border px-3 py-2 rounded"
        >

          <option value="">
            Material
          </option>

          {materiais.map((m:any)=>(
            <option key={m.id} value={m.nome}>
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
            (f:any) => f.id === c.fornecedorId
          )

          const isBest = c.valor === menorPreco

          return(

            <div
              key={c.id}
              style={{
                border: `1px solid ${isBest ? 'var(--success)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: isBest ? 'var(--success-subtle)' : 'var(--bg-surface)',
              }}
            >

              <div>

                <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {fornecedor?.nome}
                </p>

                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  {c.formaPagamento}
                </p>

              </div>

              <p style={{
                fontWeight: 700,
                fontSize: 'var(--text-lg)',
                color: isBest ? 'var(--success)' : 'var(--text-primary)',
              }}>
                R$ {c.valor}
              </p>

            </div>

          )

        })}

      </div>

    </div>

  )
}
