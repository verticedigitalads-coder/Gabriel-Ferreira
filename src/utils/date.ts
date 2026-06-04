import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDateBR(date: string | Date) {
  const d = new Date(date);

  if (!isValid(d)) return "";

  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function daysSinceContact(ultimoContato: string | Date | null): number | null {
  if (!ultimoContato) return null;
  const last = new Date(ultimoContato);
  if (isNaN(last.getTime())) return null;
  return Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
}

export function contactSeverity(days: number | null): 'hidden' | 'neutral' | 'warn' | 'crit' {
  if (days === null || days <= 1) return 'hidden';
  if (days <= 4) return 'neutral';
  if (days <= 6) return 'warn';
  return 'crit';
}