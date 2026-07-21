import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types'

export async function createLead(data: Partial<Lead>, workspaceId: string) {

  const now = new Date().toISOString()

  const payload = {
    nome: data.nome || '',
    telefone: data.telefone || '',
    email: data.email || '',
    endereco: data.endereco || '',
    servico: data.servico || '',
    status: data.status || 'novo',
    temperatura: data.temperatura || 'frio',
    resumo: data.resumo || '',
    observacoes: data.observacoes || '',
    origem: data.origem || 'outro',
    prazo_cliente: data.prazoCliente || 'nao_definido',
    probabilidade_manual: data.probabilidadeManual ?? 3,
    valor_orcado: data.valorOrcado ?? null,
    orcamento_enviado: data.orcamentoEnviado ?? false,
    ultimo_contato: data.ultimoContato || null,
    proximo_contato: data.proximoContato || null,
    workspace_id: workspaceId,
    created_at: now,
    updated_at: now
  }

  const { data: inserted, error } = await supabase
    .from('leads')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('[LeadService] Erro ao criar lead:', error)
    return null
  }

  return inserted
}