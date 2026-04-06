// ═══════════════════════════════════════════════════════════════════════════
// SEED DATA SERVICE - Dados de demonstração para o CRM
// ═══════════════════════════════════════════════════════════════════════════

import { v4 as uuid } from 'uuid';
import { format, subDays, addDays } from 'date-fns';
import { HISTORICO_TIPO } from '@/types';
import type { Lead, LeadStatus, LeadTemperature, Transaction } from '@/types';
import { calculatePriority } from '@/lib/priority';

const nomes = [
  'João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Costa', 'Pedro Souza',
  'Fernanda Lima', 'Ricardo Almeida', 'Juliana Pereira', 'Roberto Ferreira', 'Camila Rodrigues',
  'Lucas Martins', 'Patrícia Gomes', 'Marcos Ribeiro', 'Beatriz Carvalho', 'Felipe Nascimento',
  'Letícia Barbosa', 'Bruno Cardoso', 'Mariana Mendes', 'Gustavo Araújo', 'Isabela Vieira',
  'André Rocha', 'Daniela Castro', 'Thiago Melo', 'Aline Dias', 'Eduardo Machado'
];

const servicos = [
  'Portão de alumínio', 'Grade de proteção', 'Cobertura de policarbonato',
  'Forro de drywall', 'Divisória de gesso', 'Reforma banheiro', 'Pintura residencial',
  'Serralheria completa', 'Escada metálica', 'Guarda-corpo inox', 'Porta de vidro',
  'Janelas de alumínio', 'Cerca de aço', 'Pergolado metálico', 'Box de vidro'
];

const telefones = [
  '(11) 99123-4567', '(11) 98765-4321', '(11) 97654-3210', '(21) 99876-5432',
  '(21) 98234-5678', '(31) 99345-6789', '(31) 98456-7890', '(41) 99567-8901',
  '(41) 98678-9012', '(51) 99789-0123', '(51) 98890-1234', '(61) 99901-2345'
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): string {
  return format(subDays(new Date(), randomInt(0, daysAgo)), 'yyyy-MM-dd');
}

export function generateDemoLeads(workspaceId: string, count: number = 118): Lead[] {
  const leads: Lead[] = [];

  // Distribution based on realistic CRM scenario
  // 118 leads: ~25 novos, ~35 em atendimento, ~30 orçados, ~4 fechados, ~24 perdidos
  const distribution = {
    novo: Math.floor(count * 0.21),
    atendimento: Math.floor(count * 0.30),
    orcado: Math.floor(count * 0.25),
    fechado: Math.floor(count * 0.04),
    perdido: Math.floor(count * 0.20),
  };

  let index = 0;
  for (const [status, qty] of Object.entries(distribution)) {
    for (let i = 0; i < qty && index < count; i++, index++) {
      const now = new Date();
      const createdAt = randomDate(60);
      
      // Determine temperature based on status
      let temperatura: LeadTemperature;
      if (status === 'novo') {
        temperatura = randomItem(['frio', 'morno', 'morno']);
      } else if (status === 'atendimento' || status === 'orcado') {
        temperatura = randomItem(['morno', 'morno', 'quente', 'quente']);
      } else if (status === 'fechado') {
        temperatura = 'quente';
      } else {
        temperatura = 'frio';
      }

      // Last contact - newer for active leads, older for stale
      let ultimoContato: string | null = null;
      let proximoContato: string | null = null;
      
      if (status !== 'novo') {
        // Some leads have old contacts (creating critical scenarios)
        if (Math.random() < 0.3 && status !== 'fechado' && status !== 'perdido') {
          ultimoContato = format(subDays(now, randomInt(8, 15)), 'yyyy-MM-dd');
        } else if (Math.random() < 0.5) {
          ultimoContato = format(subDays(now, randomInt(4, 7)), 'yyyy-MM-dd');
        } else {
          ultimoContato = format(subDays(now, randomInt(0, 3)), 'yyyy-MM-dd');
        }
      }

      // Schedule follow-up for active leads
      if (status === 'atendimento' || status === 'orcado') {
        if (Math.random() < 0.5) {
          proximoContato = format(addDays(now, randomInt(-2, 5)), 'yyyy-MM-dd');
        }
      }

      // Value - higher for orcado and fechado
      let valorOrcado = 0;
      let orcamentoEnviado = false;
      if (status === 'orcado' || status === 'fechado') {
        valorOrcado = randomInt(2, 30) * 1000;
        orcamentoEnviado = true;
      } else if (status === 'atendimento' && Math.random() < 0.3) {
        valorOrcado = randomInt(1, 15) * 1000;
      }

      const baseLead: Lead = {
        id: uuid(),
        workspaceId,
        nome: nomes[index % nomes.length] + (index >= nomes.length ? ` ${Math.floor(index / nomes.length) + 1}` : ''),
        telefone: telefones[index % telefones.length],
        email: `cliente${index + 1}@email.com`,
        servico: randomItem(servicos),
        status: status as LeadStatus,
        temperatura,
        prioridadeScore: 0,
        prioridadeLevel: 'baixo',
        ultimoContato,
        proximoContato,
        orcamentoEnviado,
        valorOrcado,
        resumo: '',
        observacoes: '',
        historico: [{
          id: uuid(),
          data: createdAt + 'T10:00:00.000Z',
          tipo: HISTORICO_TIPO.STATUS_CHANGE,
          descricao: 'Lead criado',
        }],
        createdAt: createdAt + 'T10:00:00.000Z',
        updatedAt: new Date().toISOString(),
      };

      // Calculate priority
      const priority = calculatePriority(baseLead);
      baseLead.prioridadeScore = priority.score;
      baseLead.prioridadeLevel = priority.level;

      leads.push(baseLead);
    }
  }

  // Shuffle array to mix statuses
  return leads.sort(() => Math.random() - 0.5);
}

export function generateDemoTransactions(workspaceId: string, leads: Lead[]): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();

  // Create transactions for closed leads
  const closedLeads = leads.filter(l => l.status === 'fechado');
  closedLeads.forEach(lead => {
    transactions.push({
      id: uuid(),
      workspaceId,
      leadId: lead.id,
      tipo: 'receita',
      descricao: `Fechamento: ${lead.nome} - ${lead.servico}`,
      valor: lead.valorOrcado,
      data: format(subDays(now, randomInt(1, 30)), 'yyyy-MM-dd'),
      categoria: 'Serviços',
      observacoes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // Add some expenses
  const despesas = [
    { descricao: 'Material de escritório', categoria: 'Outros', valor: 250 },
    { descricao: 'Combustível', categoria: 'Transporte', valor: 500 },
    { descricao: 'Almoço com cliente', categoria: 'Alimentação', valor: 120 },
    { descricao: 'Google Ads', categoria: 'Marketing', valor: 800 },
    { descricao: 'Aluguel do galpão', categoria: 'Aluguel', valor: 2500 },
  ];

  despesas.forEach(d => {
    transactions.push({
      id: uuid(),
      workspaceId,
      tipo: 'despesa',
      descricao: d.descricao,
      valor: d.valor,
      data: format(subDays(now, randomInt(1, 30)), 'yyyy-MM-dd'),
      categoria: d.categoria,
      observacoes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return transactions;
}
