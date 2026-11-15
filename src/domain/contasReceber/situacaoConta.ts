import { parseISO } from 'date-fns';
import type { ContaReceber } from '@/types';

// Regra única de Contas a Receber (cartões da tela, Saúde do CRM e sino):
// "Atrasado" marcado à mão vale o mesmo que pendente com o vencimento passado.

// Em aberto: ainda vai entrar
export function contaEmAberto(conta: ContaReceber) {
  return conta.status === 'pendente' || conta.status === 'atrasado';
}

// Em atraso: marcada como atrasada, ou pendente com vencimento antes de hoje
export function contaEmAtraso(conta: ContaReceber) {
  if (conta.status === 'atrasado') return true;
  if (conta.status !== 'pendente') return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = parseISO(conta.dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  return vencimento < hoje;
}
