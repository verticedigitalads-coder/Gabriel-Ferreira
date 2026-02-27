import { nanoid } from 'nanoid'
import type { HistoricoEntry } from '@/types'

export function criarHistoricoStatusChange(
  antigoStatus: string,
  novoStatus: string
): HistoricoEntry {
  return {
    id: nanoid(),
    tipo: 'status_change',
    descricao: `Status alterado de ${antigoStatus} para ${novoStatus}`,
    createdAt: new Date().toISOString(),
    meta: {
      antigoStatus,
      novoStatus,
    },
  }
}

export function criarHistoricoLeadFechado(valor?: number): HistoricoEntry {
  return {
    id: nanoid(),
    tipo: 'lead_fechado',
    descricao: valor
      ? `Lead fechado no valor de R$ ${valor.toLocaleString('pt-BR')}`
      : 'Lead fechado',
    createdAt: new Date().toISOString(),
    meta: {
      valor: valor ?? null,
    },
  }
}

export function criarHistoricoOrcamentoCriado(valor: number): HistoricoEntry {
  return {
    id: nanoid(),
    tipo: 'orcamento_criado',
    descricao: `Orçamento criado no valor de R$ ${valor.toLocaleString('pt-BR')}`,
    createdAt: new Date().toISOString(),
    meta: {
      valor,
    },
  };
}

export function criarHistoricoAlteracaoEstrategica(
  campo: string,
  anterior: any,
  novo: any
): HistoricoEntry {
  return {
    id: nanoid(),
    tipo: 'alteracao_estrategica',
    descricao: `${campo} alterado de ${anterior ?? 'não definido'} para ${novo ?? 'não definido'}`,
    createdAt: new Date().toISOString(),
    meta: {
      campo,
      anterior,
      novo,
    },
  };
}