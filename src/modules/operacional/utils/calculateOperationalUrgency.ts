import { differenceInCalendarDays, isBefore, isToday } from 'date-fns';
import type { Lead } from '@/types';

interface UrgencyParams {
  data: string;
  prioridade: 'baixa' | 'media' | 'alta';
  concluido: boolean;
  lead?: Lead | null;
}

export function calculateOperationalUrgency({
  data,
  prioridade,
  concluido,
  lead,
}: UrgencyParams): number {
  if (concluido) return 0;

  const hoje = new Date();
  const taskDate = new Date(data);

  let score = 0;

  const diff = differenceInCalendarDays(taskDate, hoje);

  // ================= TEMPO =================

  if (isBefore(taskDate, hoje) && !isToday(taskDate)) {
    score += 50; // Atrasada
  }

  if (isToday(taskDate)) {
    score += 30; // Hoje
  }

  if (diff > 0 && diff <= 2) {
    score += 15; // Próximos 2 dias
  }

  // ================= PRIORIDADE MANUAL =================

  if (prioridade === 'alta') score += 20;
  if (prioridade === 'media') score += 10;

  // ================= INTELIGÊNCIA COMERCIAL =================

  if (lead) {
    // Temperatura
    if (lead.temperatura === 'quente') score += 25;
    if (lead.temperatura === 'morno') score += 10;

    // Status
    if (lead.status === 'orcado') score += 15;
    if (lead.status === 'fechado') score += 5;

    // Valor orçado
    if (lead.valorOrcado && lead.valorOrcado > 20000) {
      score += 25;
    } else if (lead.valorOrcado && lead.valorOrcado > 10000) {
      score += 15;
    } else if (lead.valorOrcado && lead.valorOrcado > 5000) {
      score += 5;
    }
  }

  return score;
}