// ═══════════════════════════════════════════════════════════════════════════
// FORMATTERS — Conversão snake_case (Supabase) → camelCase (TypeScript)
// Usar em TODOS os pontos que recebem dados crus do Supabase:
//   - slices (addX, updateX, loadX)
//   - useStore initialize()
//   - useStore startRealtime() handlers
// ═══════════════════════════════════════════════════════════════════════════

// Converte ISO 8601 do Supabase → yyyy-MM-dd para <input type="date">
// Ex: "2026-03-16T00:00:00+00:00" → "2026-03-16"
const toDateInput = (val: string | null | undefined): string | null =>
  val ? val.split('T')[0] : null

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
  ultimoContato: toDateInput(raw.ultimo_contato),
  proximoContato: toDateInput(raw.proximo_contato),
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
  categoria: raw.categoria ?? '',
  observacoes: raw.observacoes ?? '',
  statusPagamento: raw.status_pagamento ?? 'pendente',
  dataVencimento: toDateInput(raw.data_vencimento),
  dataPagamento: toDateInput(raw.data_pagamento),
  formaPagamento: raw.forma_pagamento ?? null,
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

export const formatContaReceber = (raw: any) => ({
  id: raw.id,
  workspaceId: raw.workspace_id,
  leadId: raw.lead_id ?? null,
  descricao: raw.descricao,
  valor: raw.valor,
  dataVencimento: toDateInput(raw.data_vencimento),
  dataRecebimento: toDateInput(raw.data_recebimento),
  status: raw.status,
  formaRecebimento: raw.forma_recebimento ?? null,
  observacao: raw.observacao ?? null,
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
  materialId: raw.material_id ?? null,
  fornecedorId: raw.fornecedor_id,
  material: raw.material ?? null,
  materialNome: raw.materiais?.nome ?? raw.material ?? null,
  fornecedorNome: raw.fornecedores?.nome ?? null,
  quantidade: raw.quantidade,
  valor: raw.valor,
  formaPagamento: raw.forma_pagamento ?? null,
  data: raw.data ?? null,
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

export const formatFornecedor = (raw: any) => ({
  id: raw.id,
  workspaceId: raw.workspace_id,
  nome: raw.nome,
  nomeFantasia: raw.nome_fantasia ?? null,
  cnpj: raw.cnpj ?? null,
  categoria: raw.categoria ?? null,
  status: raw.status ?? 'ativo',
  telefone: raw.telefone ?? null,
  email: raw.email ?? null,
  endereco: raw.endereco ?? null,
  logradouro: raw.logradouro ?? null,
  numeroEndereco: raw.numero_endereco ?? null,
  cidade: raw.cidade ?? null,
  estado: raw.estado ?? null,
  prazoEntrega: raw.prazo_entrega ?? null,
  condicaoPagamento: raw.condicao_pagamento ?? null,
  observacoes: raw.observacoes ?? null,
  createdAt: raw.created_at ?? null,
})

export const formatOrcamento = (raw: any) => ({
  id: raw.id,
  workspaceId: raw.workspace_id,
  leadId: raw.lead_id,
  clienteNome: raw.cliente_nome ?? null,
  clienteTelefone: raw.cliente_telefone ?? null,
  clienteEndereco: raw.cliente_endereco ?? null,
  numero: raw.numero,
  itens: raw.itens || [],
  subtotal: Number(raw.subtotal) || 0,
  desconto: Number(raw.desconto) || 0,
  total: Number(raw.total) || 0,
  multiplicador: Number(raw.multiplicador) || 1,
  percentualComissao: Number(raw.percentual_comissao) || 0,
  valorComissao: Number(raw.valor_comissao) || 0,
  status: raw.status || 'rascunho',
  observacoes: raw.observacoes || '',
  validadeEmDias: raw.validade_em_dias ?? 7,
  ambiente: raw.ambiente ?? null,
  historico: raw.historico || [],
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
})
