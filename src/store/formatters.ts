// ═══════════════════════════════════════════════════════════════════════════
// FORMATTERS — Conversão snake_case (Supabase) → camelCase (TypeScript)
// Usar em TODOS os pontos que recebem dados crus do Supabase:
//   - slices (addX, updateX, loadX)
//   - useStore initialize()
//   - useStore startRealtime() handlers
// ═══════════════════════════════════════════════════════════════════════════

export const formatLead = (raw: any) => ({
  id: raw.id,
  workspaceId: raw.workspace_id,
  nome: raw.nome,
  telefone: raw.telefone,
  email: raw.email,
  endereco: raw.endereco,
  servico: raw.servico,
  visitaOrcamentoData: raw.visita_orcamento_data,
  visitaOrcamentoPeriodo: raw.visita_orcamento_periodo,
  status: raw.status,
  temperatura: raw.temperatura,
  origem: raw.origem,
  prazoCliente: raw.prazo_cliente,
  probabilidadeManual: raw.probabilidade_manual,
  prioridadeScore: raw.prioridade_score ?? 0,
  prioridadeLevel: raw.prioridade_level ?? 'baixo',
  ultimoContato: raw.ultimo_contato ?? null,
  proximoContato: raw.proximo_contato ?? null,
  orcamentoEnviado: raw.orcamento_enviado ?? false,
  valorOrcado: raw.valor_orcado ?? null,
  dataOrcamento: raw.data_orcamento ?? null,
  dataExecucao: raw.data_execucao ?? null,
  resumo: raw.resumo || '',
  observacoes: raw.observacoes || '',
  historico: raw.historico || [],
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
  syncStatus: raw.sync_status || 'synced',
})

export const formatOperacionalTask = (raw: any) => ({
  id: raw.id,
  workspaceId: raw.workspace_id,
  leadId: raw.lead_id ?? null,
  titulo: raw.titulo,
  descricao: raw.descricao ?? null,
  data: raw.data,
  tipo: raw.tipo,
  prioridade: raw.prioridade,
  status: raw.status,
  concluido: raw.concluido ?? false,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
})

export const formatTransaction = (raw: any) => ({
  id: raw.id,
  workspaceId: raw.workspace_id,
  leadId: raw.lead_id ?? null,
  tipo: raw.tipo,
  descricao: raw.descricao,
  valor: raw.valor,
  data: raw.data,
  categoria: raw.categoria,
  observacoes: raw.observacoes,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
})

export const formatNota = (raw: any) => ({
  id: raw.id,
  workspaceId: raw.workspace_id,
  leadId: raw.lead_id ?? null,
  numero: raw.numero,
  valor: raw.valor,
  data: raw.data,
  status: raw.status,
  observacoes: raw.observacoes,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
})

export const formatMaterial = (raw: any) => ({
  id: raw.id,
  workspaceId: raw.workspace_id,
  nome: raw.nome,
  categoria: raw.categoria ?? null,
  unidade: raw.unidade ?? null,
  quantidade: raw.quantidade ?? 0,
  estoqueMinimo: raw.estoque_minimo ?? null,
  estoque: raw.estoque ?? 0,
  createdAt: raw.created_at ?? null,
})

export const formatCotacaoMaterial = (raw: any) => ({
  id: raw.id,
  workspaceId: raw.workspace_id,
  fornecedorId: raw.fornecedor_id,
  material: raw.material,
  quantidade: raw.quantidade,
  valor: raw.valor,
  formaPagamento: raw.forma_pagamento ?? null,
  observacoes: raw.observacoes ?? null,
  createdAt: raw.created_at ?? null,
})

export const formatConsumoMaterial = (raw: any) => ({
  id: raw.id,
  workspaceId: raw.workspace_id,
  leadId: raw.lead_id ?? null,
  materialId: raw.material_id,
  quantidade: raw.quantidade,
})
