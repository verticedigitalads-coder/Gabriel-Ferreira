// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA DE PRIORIDADE AUTOMÁTICA
// ═══════════════════════════════════════════════════════════════════════════

import { differenceInDays, parseISO, isAfter, startOfDay } from 'date-fns';
import type { Lead, PriorityLevel } from '@/types';

interface PriorityCalculation {
  score: number;
  level: PriorityLevel;
  breakdown: {
    temperatura: number;
    diasSemContato: number;
    orcamentoEnviado: number;
    valorAlto: number;
    followUpVencido: number;
  };
}

export function calculatePriority(lead: Lead): PriorityCalculation {
  const now = startOfDay(new Date());
  let score = 0;
  const breakdown = {
    temperatura: 0,
    diasSemContato: 0,
    orcamentoEnviado: 0,
    valorAlto: 0,
    followUpVencido: 0,
  };

  // +5 se temperatura = quente
  if (lead.temperatura === 'quente') {
    breakdown.temperatura = 5;
    score += 5;
  } else if (lead.temperatura === 'morno') {
    breakdown.temperatura = 2;
    score += 2;
  }

  // +5 se >7 dias sem contato
  if (lead.ultimoContato) {
    const diasSemContato = differenceInDays(now, parseISO(lead.ultimoContato));
    if (diasSemContato > 7) {
      breakdown.diasSemContato = 5;
      score += 5;
    } else if (diasSemContato > 3) {
      breakdown.diasSemContato = 3;
      score += 3;
    }
  } else {
    // Se nunca teve contato, considerar crítico
    breakdown.diasSemContato = 5;
    score += 5;
  }

  // +3 se orçamento enviado
  if (lead.orcamentoEnviado) {
    breakdown.orcamentoEnviado = 3;
    score += 3;
  }

  // +2 se valorOrcado > 5000
  if (lead.valorOrcado && lead.valorOrcado > 10000) {
  breakdown.valorAlto = 4;
  score += 4;
} else if (lead.valorOrcado && lead.valorOrcado > 5000) {
  breakdown.valorAlto = 2;
  score += 2;
}

  // +4 se proximoContato vencido
  if (lead.proximoContato) {
    const dataProximo = parseISO(lead.proximoContato);
    if (isAfter(now, dataProximo)) {
      breakdown.followUpVencido = 4;
      score += 4;
    }
  }

  // Classificação
  let level: PriorityLevel;
  if (score >= 13) {
    level = 'critico';
  } else if (score >= 9) {
    level = 'alto';
  } else if (score >= 5) {
    level = 'medio';
  } else {
    level = 'baixo';
  }

  return { score, level, breakdown };
}

export function getPriorityColor(level: PriorityLevel): string {
  switch (level) {
    case 'critico': return 'text-red-600 bg-red-50 border-red-200';
    case 'alto': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medio': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'baixo': return 'text-green-600 bg-green-50 border-green-200';
  }
}

export function getPriorityBadgeColor(level: PriorityLevel): string {
  switch (level) {
    case 'critico': return 'bg-red-500 text-white';
    case 'alto': return 'bg-orange-500 text-white';
    case 'medio': return 'bg-yellow-500 text-white';
    case 'baixo': return 'bg-green-500 text-white';
  }
}

export function getTemperaturaColor(temp: Lead['temperatura']): string {
  switch (temp) {
    case 'quente': return 'text-red-600 bg-red-50';
    case 'morno': return 'text-yellow-600 bg-yellow-50';
    case 'frio': return 'text-blue-600 bg-blue-50';
  }
}

export function getStatusColor(status: Lead['status']): string {
  switch (status) {
    case 'novo': return 'bg-blue-100 text-blue-700';
    case 'atendimento': return 'bg-purple-100 text-purple-700';
    case 'orcado': return 'bg-yellow-100 text-yellow-700';
    case 'fechado': return 'bg-green-100 text-green-700';
    case 'perdido': return 'bg-gray-100 text-gray-700';
  }
}

export function getStatusLabel(status: Lead['status']): string {
  switch (status) {
    case 'novo': return 'Novo';
    case 'atendimento': return 'Em Atendimento';
    case 'orcado': return 'Orçado';
    case 'fechado': return 'Fechado';
    case 'perdido': return 'Perdido';
  }
}
