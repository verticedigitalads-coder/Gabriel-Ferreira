import { useState } from "react"
import { useStore } from "@/store/useStore"

export default function Fornecedores() {

  const fornecedores = useStore(state => state.fornecedores)
  const addFornecedor = useStore(state => state.addFornecedor)
  const deleteFornecedor = useStore(state => state.deleteFornecedor)

  const [nome,setNome] = useState("")
  const [telefone,setTelefone] = useState("")
  const [endereco,setEndereco] = useState("")

  const handleAdd = async () => {

    if(!nome.trim()) return

    await addFornecedor({
      nome,
      telefone,
      endereco
    })

    setNome("")
    setTelefone("")
    setEndereco("")
  }

  return (

    <div className="p-6 max-w-5xl">

      <h1 className="text-xl font-bold mb-6">
        Fornecedores
      </h1>

      {/* FORMULÁRIO */}

      <div className="flex gap-3 mb-8">

        <input
          placeholder="Nome"
          value={nome}
          onChange={e=>setNome(e.target.value)}
          className="border px-3 py-2 rounded w-48"
        />

        <input
          placeholder="Telefone"
          value={telefone}
          onChange={e=>setTelefone(e.target.value)}
          className="border px-3 py-2 rounded w-40"
        />

        <input
          placeholder="Endereço"
          value={endereco}
          onChange={e=>setEndereco(e.target.value)}
          className="border px-3 py-2 rounded flex-1"
        />

        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
        >
          Adicionar
        </button>

      </div>


      {/* LISTA */}

      <div className="space-y-3">

        {fornecedores.length === 0 && (
          <p className="text-sm text-gray-500">
            Nenhum fornecedor cadastrado
          </p>
        )}

        {fornecedores.map((f:any)=>(

          <div
            key={f.id}
            className="border rounded-lg p-4 flex justify-between items-center bg-white shadow-sm"
          >

            <div>

              <p className="font-semibold">
                {f.nome}
              </p>

              {f.telefone && (
                <p className="text-sm text-gray-500">
                  {f.telefone}
                </p>
              )}

              {f.endereco && (
                <p className="text-sm text-gray-500">
                  {f.endereco}
                </p>
              )}

            </div>


            {/* AÇÕES */}

            <div className="flex gap-3">

              {f.telefone && (
                <a
                  href={`tel:${f.telefone}`}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  Ligar
                </a>
              )}

              <button
                onClick={()=>deleteFornecedor(f.id)}
                className="text-red-600 text-sm hover:underline"
              >
                Remover
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  )
}