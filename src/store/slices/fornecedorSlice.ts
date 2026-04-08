import { supabase } from '@/lib/supabase'
import { v4 as uuid } from 'uuid'
import { formatFornecedor } from '@/store/formatters'
import type { Fornecedor } from '@/types'

export const createFornecedorSlice = (set: any, get: any) => ({

  fornecedores: [],

  addFornecedor: async (data: Partial<Fornecedor>) => {

    const { workspaceId, fornecedores } = get()

    if (!workspaceId) {
      console.error('[FornecedorSlice] workspaceId não encontrado')
      return
    }

    const now = new Date().toISOString()
    const id = uuid()

    const { data: inserted, error } = await supabase
      .from('fornecedores')
      .insert([{
        id,
        workspace_id: workspaceId,
        nome: data.nome,
        nome_fantasia: data.nomeFantasia ?? null,
        cnpj: data.cnpj ?? null,
        categoria: data.categoria ?? null,
        status: data.status ?? 'ativo',
        telefone: data.telefone ?? null,
        email: data.email ?? null,
        endereco: data.endereco ?? null,
        logradouro: data.logradouro ?? null,
        numero_endereco: data.numeroEndereco ?? null,
        cidade: data.cidade ?? null,
        estado: data.estado ?? null,
        prazo_entrega: data.prazoEntrega ?? null,
        condicao_pagamento: data.condicaoPagamento ?? null,
        observacoes: data.observacoes ?? null,
        created_at: now,
      }])
      .select()
      .single()

    if (error) {
      console.error('[FornecedorSlice] Erro ao criar fornecedor:', error)
      return
    }

    const novo = formatFornecedor(inserted)

    set((state: any) => ({
      fornecedores: state.fornecedores.some((f: Fornecedor) => f.id === novo.id)
        ? state.fornecedores
        : [...state.fornecedores, novo],
    }))

    return novo
  },

  updateFornecedor: async (id: string, data: Partial<Fornecedor>) => {

    const payload: any = {}

    if (data.nome !== undefined)              payload.nome = data.nome
    if (data.nomeFantasia !== undefined)      payload.nome_fantasia = data.nomeFantasia
    if (data.cnpj !== undefined)              payload.cnpj = data.cnpj
    if (data.categoria !== undefined)         payload.categoria = data.categoria
    if (data.status !== undefined)            payload.status = data.status
    if (data.telefone !== undefined)          payload.telefone = data.telefone
    if (data.email !== undefined)             payload.email = data.email
    if (data.endereco !== undefined)          payload.endereco = data.endereco
    if (data.logradouro !== undefined)        payload.logradouro = data.logradouro
    if (data.numeroEndereco !== undefined)    payload.numero_endereco = data.numeroEndereco
    if (data.cidade !== undefined)            payload.cidade = data.cidade
    if (data.estado !== undefined)            payload.estado = data.estado
    if (data.prazoEntrega !== undefined)      payload.prazo_entrega = data.prazoEntrega
    if (data.condicaoPagamento !== undefined) payload.condicao_pagamento = data.condicaoPagamento
    if (data.observacoes !== undefined)       payload.observacoes = data.observacoes

    const { data: updated, error } = await supabase
      .from('fornecedores')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[FornecedorSlice] Erro ao atualizar fornecedor:', error)
      return
    }

    const formatado = formatFornecedor(updated)

    set((state: any) => ({
      fornecedores: state.fornecedores.map((f: Fornecedor) =>
        f.id === id ? formatado : f
      ),
    }))

    return formatado
  },

  deleteFornecedor: async (id: string) => {

    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[FornecedorSlice] Erro ao deletar fornecedor:', error)
      return
    }

    set((state: any) => ({
      fornecedores: state.fornecedores.filter((f: Fornecedor) => f.id !== id),
    }))
  },

})
