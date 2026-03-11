import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDateBR(date: string | Date) {
  const d = new Date(date);

  if (!isValid(d)) return "";

  return format(d, "dd/MM/yyyy", { locale: ptBR });
}