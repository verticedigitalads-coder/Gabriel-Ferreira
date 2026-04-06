import { nanoid } from 'nanoid'
import { HISTORICO_TIPO } from '@/types'
import type { HistoricoEntry } from '@/types'

export function criarHistoricoStatusChange(
  antigoStatus: string,
  novoStatus: string
): HistoricoEntry {
  return {
    id: nanoid(),
    tipo: HISTORICO_TIPO.STATUS_CHANGE,
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
    tipo: HISTORICO_TIPO.LEAD_FECHADO,
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
    tipo: HISTORICO_TIPO.ORCAMENTO_CRIADO,
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
    tipo: HISTORICO_TIPO.ALTERACAO_ESTRATEGICA,
    descricao: `${campo} alterado de ${anterior ?? 'não definido'} para ${novo ?? 'não definido'}`,
    createdAt: new Date().toISOString(),
    meta: {
      campo,
      anterior,
      novo,
    },
  };
}