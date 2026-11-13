import { Flame, Snowflake, Sun, type LucideIcon } from 'lucide-react';
import type { LeadTemperature, PriorityLevel } from '@/types';

// Faixa e rótulo da prioridade e ícone da temperatura do lead (redesign D3).
// Usados no card do Kanban, na linha de Leads e na ficha.
// Só visual: a prioridade continua calculada em src/lib/priority.ts, via formatLead.
// Fica fora dos componentes de propósito: exportar constante de arquivo de componente
// quebra o Fast Refresh do Vite (mesmo motivo do faixaPrioridade.ts da D2).

export const FAIXA_PRIORIDADE_LEAD: Record<PriorityLevel, string> = {
  critico: 'var(--danger)',
  alto: 'var(--warning)',
  medio: 'var(--info)',
  baixo: 'var(--border-strong)',
};

export const ROTULO_PRIORIDADE_LEAD: Record<PriorityLevel, { texto: string; cor: string }> = {
  critico: { texto: 'Crítico', cor: 'var(--danger)' },
  alto: { texto: 'Alto', cor: 'var(--warning)' },
  medio: { texto: 'Médio', cor: 'var(--info)' },
  baixo: { texto: 'Baixo', cor: 'var(--text-tertiary)' },
};

export const TEMPERATURA_LEAD: Record<LeadTemperature, { Icone: LucideIcon; cor: string; rotulo: string }> = {
  quente: { Icone: Flame, cor: 'var(--danger)', rotulo: 'Quente' },
  morno: { Icone: Sun, cor: 'var(--warning)', rotulo: 'Morno' },
  frio: { Icone: Snowflake, cor: 'var(--info)', rotulo: 'Frio' },
};

// Nível seguro: lead com prioridadeLevel fora da lista cai em "baixo" (mesmo critério do PriorityBadge).
export function nivelPrioridade(level: unknown): PriorityLevel {
  return typeof level === 'string' && level in FAIXA_PRIORIDADE_LEAD ? (level as PriorityLevel) : 'baixo';
}
