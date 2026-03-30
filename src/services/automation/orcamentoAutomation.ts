import { Orcamento } from '@/types';
import { v4 as uuid } from 'uuid';

export function criarOrcamentoFromLead(lead: any): Partial<Orcamento> | null {
  if (!lead || !lead.valorOrcado || lead.valorOrcado <= 0) {
    console.warn('⚠️ Lead sem valor orçado, não gerar orçamento');
    return null;
  }

  if (!lead.workspaceId) {
    console.error('❌ Lead sem workspaceId');
    return null;
  }

  const nome = lead.nome?.trim() || 'Novo Lead';
  const valor = Number(lead.valorOrcado) || 0;

  const itens = [
    {
      id: crypto.randomUUID(),
      descricao: lead.servico?.trim() || 'Serviço principal',
      quantidade: 1,
      valorUnitario: valor,
      valorTotal: valor,
    },
  ];

  const subtotal = valor;

  const desconto = 0;
  const multiplicador = 1;

  const total = (subtotal - desconto) * multiplicador;

  return {
    id: uuid(),
    leadId: String(lead.id),

    clienteNome: nome,
    clienteTelefone: lead.telefone || '',
    clienteEndereco: lead.endereco || '',

    numero: `ORC-${Date.now()}`,

    itens,

    subtotal,
    total,

    desconto,
    multiplicador,

    status: 'rascunho',

    observacoes: `Gerado automaticamente para ${nome}`,
    validadeEmDias: 7,

    workspaceId: lead.workspaceId,

    historico: [],

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
