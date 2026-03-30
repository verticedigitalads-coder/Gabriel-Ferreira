// ═══════════════════════════════════════════════════════════════════════════
// TIPOS CENTRAIS DO CRM - Sistema de Gestão Comercial (VERSÃO ESTRATÉGICA 3.0)
// ═══════════════════════════════════════════════════════════════════════════

// =========================
// ENUMS E TIPOS BASE
// =========================

export type LeadStatus =
  | 'novo'
  | 'atendimento'
  | 'orcado'
  | 'fechado'
  | 'perdido';

export type LeadTemperature = 'frio' | 'morno' | 'quente';

export type PriorityLevel = 'baixo' | 'medio' | 'alto' | 'critico';

export type LeadAnalysisStatus = 'all' | 'analisado' | 'nao_analisado';

export type LeadOrigin =
  | 'indicacao'
  | 'facebook'
  | 'instagram'
  | 'google'
  | 'outro';

export type LeadPrazo =
  | 'urgente'
  | 'curto'
  | 'medio'
  | 'longo'
  | 'nao_definido';

export type OrcamentoStatus = 'rascunho' | 'enviado' | 'aprovado' | 'recusado';

export type TransactionType =
  | 'receita'
  | 'despesa'
  | 'comissao'
  | 'pagamento_funcionario';

export type NotaStatus = 'pendente' | 'emitida' | 'cancelada';

// =========================
// HISTÓRICO (ARQUITETURA ORIENTADA A EVENTOS)
// =========================

export type HistoricoTipo =
  | 'status_change'
  | 'orcamento_criado'
  | 'orcamento_status_change'
  | 'receita_vinculada'
  | 'lead_fechado'
  | 'observacao'
  | 'contato'
  | 'ia_analysis'
  | 'alteracao_estrategica';

export interface HistoricoEntry {
  id: string;

  tipo: HistoricoTipo;

  descricao: string;

  createdAt: string;

  // 🔥 Estruturado para analytics e IA futura
  meta?: Record<string, any>;
}

// =========================
// LEAD (VERSÃO ESTRATÉGICA)
// =========================

export interface Lead {
  id: string;
  workspaceId: string;

  nome: string;
  telefone: string;
  email: string;
  endereco?: string;
  servico: string;

  visitaOrcamentoData?: string;
  visitaOrcamentoPeriodo?: 'manha' | 'almoco' | 'tarde';

  status: LeadStatus;
  temperatura: LeadTemperature;

  origem: LeadOrigin;
  prazoCliente: LeadPrazo;
  probabilidadeManual: 1 | 2 | 3 | 4 | 5;

  prioridadeScore: number;
  prioridadeLevel: PriorityLevel;

  ultimoContato: string | null;
  proximoContato: string | null;

  orcamentoEnviado: boolean;
  valorOrcado: number | null;

  dataOrcamento?: string | null;
  dataExecucao?: string | null;

  resumo: string;
  observacoes: string;

  historico: HistoricoEntry[];

  createdAt: string;
  updatedAt: string;
  syncStatus: 'local' | 'pending' | 'synced';
}

// =========================
// ORÇAMENTO
// =========================

export interface OrcamentoItem {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface Orcamento {
  id: string;
  workspaceId: string;
  leadId: string;

  clienteNome?: string;
  clienteTelefone?: string;
  clienteEndereco?: string;

  numero: string;

  itens: OrcamentoItem[];

  subtotal: number;
  desconto: number;
  total: number;

  multiplicador?: number;

  status: OrcamentoStatus;
  observacoes: string;
  validadeEmDias: number;

  historico: HistoricoEntry[];

  createdAt: string;
  updatedAt: string;
}

// =========================
// TRANSAÇÕES
// =========================

export interface Transaction {
  id: string;
  workspaceId: string;
  leadId?: string;

  tipo: TransactionType;
  descricao: string;
  valor: number;

  data: string;
  categoria: string;
  observacoes: string;

  createdAt: string;
  updatedAt: string;
}

// =========================
// NOTAS
// =========================

export interface Nota {
  id: string;
  workspaceId: string;
  leadId?: string;

  numero: string;
  valor: number;
  data: string;

  status: NotaStatus;
  observacoes: string;

  createdAt: string;
  updatedAt: string;
}

// =========================
// WORKSPACE
// =========================

export interface Workspace {
  id: string;
  nome: string;
  logoUrl?: string;
  createdAt: string;
}

// =========================
// DASHBOARD
// =========================

export interface DashboardStats {
  totalLeads: number;
  leadsAtrasados: number;
  leadsCriticos: number;
  orcamentosEnviados: number;
  fechados: number;
  valorTotalOrcado: number;
  receitaMes: number;
  leadsQuentes: number;
  leadsNovos: number;
  leadsMornos: number;
  leadsFrios: number;
  valorFechado: number;
  taxaConversao: number;

  receitaPotencial: number;
  receitaProvavel: number;
  receitaConservadora: number;

  metaMensal: number;

  tarefasHoje: number;
  tarefasAtrasadas: number;
  tarefasSemana: number;
}

// =========================
// IA
// =========================

export interface AIAnalysis {
  temperatura: LeadTemperature;
  status: LeadStatus;
  resumo: string;
  proximaAcao: string;
  dataFollowUp: string;
  confianca: number;
}

// =========================
// BACKUP
// =========================

export interface BackupData {
  version: string;
  exportedAt: string;
  workspaceId: string;
  leads: Lead[];
  orcamentos: Orcamento[];
  transactions: Transaction[];
  notas: Nota[];
}

// =========================
// TOAST
// =========================

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// =========================
// OPERACIONAL
// =========================

export type OperacionalTipo =
  | 'visita'
  | 'orcamento'
  | 'retorno'
  | 'execucao'
  | 'tarefa';

export type OperacionalPrioridade = 'baixa' | 'media' | 'alta';

export type OperacionalStatus =
  | 'pendente'
  | 'em_producao'
  | 'pronto'
  | 'instalado';

export interface OperacionalTask {
  id: string;
  workspaceId: string;
  leadId?: string;

  titulo: string;
  descricao?: string;

  data: string;

  tipo: OperacionalTipo;
  prioridade: OperacionalPrioridade;

  status: OperacionalStatus;

  concluido: boolean;

  createdAt: string;
  updatedAt: string;
}

// =========================
// FORNECEDORES
// =========================

export interface Fornecedor {
  id: string;
  workspaceId: string;

  nome: string;
  telefone?: string;
  endereco?: string;
  observacoes?: string;

  createdAt?: string;
}

// =========================
// MATERIAIS / ESTOQUE
// =========================

export interface Material {
  id: string;
  workspaceId: string;

  nome: string;
  categoria?: string;
  unidade?: string;

  quantidade: number;
  estoqueMinimo?: number;

  estoque: number;

  createdAt?: string;
}

// =========================
// COTAÇÃO DE MATERIAIS
// =========================

export interface CotacaoMaterial {
  id: string;
  workspaceId: string;

  fornecedorId: string;

  material: string;
  quantidade: number;

  valor: number;
  formaPagamento?: string;

  observacoes?: string;

  createdAt?: string;
}
