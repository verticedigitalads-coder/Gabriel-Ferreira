import { format, isValid, parse, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// "yyyy-MM-dd" de um dia que existe (2026-02-30 não passa): formato do <input type="date">
// e o que a tarefa do Operacional exige em `data`.
export function isValidDateInput(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    isValid(parse(value, "yyyy-MM-dd", new Date()))
  );
}

export function formatDateBR(date: string) {
  const d = parseISO(date);

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