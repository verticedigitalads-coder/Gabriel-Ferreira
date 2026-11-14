import { Orcamento } from '@/types';
import type { WorkspaceSettings } from '@/store/slices/settingsSlice';
import { v4 as uuid } from 'uuid';

// Padrões da empresa (Configurações > Documentos) que valem para orçamento novo.
type PadroesOrcamento = Pick<
  WorkspaceSettings,
  'validadePadraoOrcamento' | 'observacaoPadraoOrcamento' | 'multiplicadorPadrao' | 'percentualComissao'
>;

export function criarOrcamentoFromLead(
  lead: any,
  padroes: PadroesOrcamento,
): Partial<Orcamento> | null {
  if (!lead || !lead.valorOrcado || lead.valorOrcado <= 0) {
    console.warn('⚠️ Lead sem valor orçado, não gerar orçamento');
    return null;
  }

  if (!lead.workspaceId) {
    console.error('[OrcamentoAutomation] Lead sem workspaceId');
    return null;
  }

  const nome = lead.nome?.trim() || 'Novo Lead';
  const valor = Number(lead.valorOrcado) || 0;

  const desconto = 0;
  const multiplicador = padroes.multiplicadorPadrao;
  const percentualComissao = padroes.percentualComissao;

  // O valor digitado no Marcar Orçado é o total final: o item sai de trás para
  // frente, com a mão de obra e a comissão da empresa dentro. O addOrcamento
  // recalcula subtotal e total (diferença de até 1 centavo pelo arredondamento
  // do item).
  const valorItem =
    Math.round((valor / (multiplicador * (1 + percentualComissao / 100))) * 100) / 100;

  const itens = [
    {
      id: crypto.randomUUID(),
      descricao: lead.servico?.trim() || 'Serviço principal',
      quantidade: 1,
      valorUnitario: valorItem,
      valorTotal: valorItem,
    },
  ];

  return {
    id: uuid(),
    leadId: String(lead.id),

    clienteNome: nome,
    clienteTelefone: lead.telefone || '',
    clienteEndereco: lead.endereco || '',

    // numero: o addOrcamento gera o sequencial da empresa

    itens,

    desconto,
    multiplicador,
    percentualComissao,

    status: 'rascunho',

    // Observação padrão da empresa (vai para o PDF do cliente); nunca texto interno
    observacoes: padroes.observacaoPadraoOrcamento || '',
    validadeEmDias: padroes.validadePadraoOrcamento,

    workspaceId: lead.workspaceId,

    historico: [],

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
