import { Orcamento } from '@/types';
import { v4 as uuid } from 'uuid';

export function criarOrcamentoFromLead(lead: any): Partial<Orcamento> | null {
  if (!lead || !lead.valorOrcado || lead.valorOrcado <= 0) {
    console.warn('⚠️ Lead sem valor orçado, não gerar orçamento');
    return null;
  }

  const valor = Number(lead.valorOrcado) || 0;

  const itens = [
    {
      id: crypto.randomUUID(),
      descricao: lead.servico || 'Serviço',
      quantidade: 1,
      valorUnitario: valor,
      valorTotal: valor,
    },
  ];

  const subtotal = valor;
  const total = subtotal;

  return {
    id: uuid(),
    leadId: String(lead.id),

    numero: `ORC-${Date.now()}`,

    itens,

    subtotal,
    total,

    desconto: 0,
    multiplicador: 1,

    status: 'rascunho',

    observacoes: `Gerado automaticamente para ${lead.nome}`,
    validadeEmDias: 7,

    workspaceId: lead.workspaceId || '',

    historico: [],

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
