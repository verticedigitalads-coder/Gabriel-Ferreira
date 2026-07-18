import type { Lead } from '@/types'
import { differenceInDays, parseISO } from 'date-fns'
import { refineLeadStrategyWithAI } from './openaiStrategicService'

export interface StrategicDiagnosis {
  riscoDePerda: 'baixo' | 'medio' | 'alto' | 'critico'
  nivelDeUrgencia: 1 | 2 | 3 | 4 | 5
  temperaturaSugerida: 'fria' | 'morna' | 'quente'
  statusSugerido: Lead['status']

  // 🔥 NOVOS PARÂMETROS ESTRATÉGICOS
  probabilidadeConversao: number
  tipoLead: string
  interesse: 'baixo' | 'medio' | 'alto'
  riscoConcorrencia: 'baixo' | 'medio' | 'alto'
  maturidade: number
  potencialFuturo: 'baixo' | 'medio' | 'alto'

  resumoExecutivo: string
  estrategiaDeAbordagem: string
  mensagemSugeridaWhatsApp: string
  dataIdealFollowUp: string

  // 🔥 Indica se o refinamento por IA foi realmente aplicado (false = fallback heurístico)
  aiUsed: boolean
}

/**
 * MOTOR HÍBRIDO
 * Base local + Refinamento OpenAI
 */
export async function generateFullStrategicDiagnosisWithAI(
  lead: Lead
): Promise<StrategicDiagnosis> {

  // ==============================
  // 1️⃣ DIAGNÓSTICO BASE LOCAL
  // ==============================

  let diasSemContato = 0

  if (lead.ultimoContato) {
    diasSemContato = differenceInDays(
      new Date(),
      parseISO(lead.ultimoContato)
    )
  }

  let risco: StrategicDiagnosis['riscoDePerda'] = 'baixo'

  if (diasSemContato > 10) risco = 'critico'
  else if (diasSemContato > 7) risco = 'alto'
  else if (diasSemContato > 3) risco = 'medio'

  let urgencia: 1 | 2 | 3 | 4 | 5 = 1

  if (risco === 'critico') urgencia = 5
  else if (risco === 'alto') urgencia = 4
  else if (risco === 'medio') urgencia = 3

  // 🔥 CÁLCULO LOCAL DE PROBABILIDADE
  let probabilidade = 30

  if (lead.temperatura === 'quente') probabilidade += 30
  if (lead.status === 'orcado') probabilidade += 20
  if (diasSemContato <= 2) probabilidade += 10
  if (lead.valorOrcado && lead.valorOrcado > 0) probabilidade += 10

  if (probabilidade > 95) probabilidade = 95

  const baseDiagnosis: StrategicDiagnosis = {
    riscoDePerda: risco,
    nivelDeUrgencia: urgencia,

    temperaturaSugerida:
      risco === 'critico' || risco === 'alto'
        ? 'quente'
        : risco === 'medio'
        ? 'morna'
        : 'fria',

    statusSugerido:
      risco === 'critico'
        ? 'atendimento'
        : lead.status,

    // 🔥 NOVOS CAMPOS BASE
    probabilidadeConversao: probabilidade,
    tipoLead:
      lead.status === 'orcado'
        ? 'Oportunidade ativa'
        : lead.status === 'novo'
        ? 'Lead em qualificação'
        : 'Lead em acompanhamento',

    interesse:
      lead.temperatura === 'quente'
        ? 'alto'
        : lead.temperatura === 'morno'
        ? 'medio'
        : 'baixo',

    riscoConcorrencia:
      diasSemContato > 7
        ? 'alto'
        : diasSemContato > 3
        ? 'medio'
        : 'baixo',

    maturidade:
      lead.status === 'orcado'
        ? 4
        : lead.status === 'atendimento'
        ? 3
        : 2,

    potencialFuturo:
      lead.valorOrcado && lead.valorOrcado > 3000
        ? 'alto'
        : 'medio',

    resumoExecutivo:
      diasSemContato === 0
        ? 'Lead em atendimento recente.'
        : `Lead sem contato há ${diasSemContato} dias.`,

    estrategiaDeAbordagem:
      risco === 'critico'
        ? 'Contato imediato com abordagem direta e foco em fechamento.'
        : risco === 'alto'
        ? 'Reforçar urgência e identificar objeções.'
        : risco === 'medio'
        ? 'Manter follow-up estratégico.'
        : 'Acompanhamento normal.',

    mensagemSugeridaWhatsApp:
      `Olá ${lead.nome}, tudo bem?\n` +
      `Estou acompanhando seu projeto de ${lead.servico}.\n` +
      `Podemos conversar para avançarmos?`,

    dataIdealFollowUp: new Date(
      Date.now() + 2 * 86400000
    ).toISOString(),

    aiUsed: false, // valor base — sobrescrito para true só se a IA responder com sucesso
  }

  // ==============================
  // 2️⃣ REFINAMENTO OPENAI
  // ==============================

  try {
    const refined = await refineLeadStrategyWithAI(lead, baseDiagnosis)

    // refined !== null significa que a IA respondeu com sucesso (mesmo que {}
    // — "está tudo adequado" é uma resposta válida, não uma falha).
    if (refined) {
      return {
        ...baseDiagnosis,
        ...refined,
        aiUsed: true,
      }
    }

    console.warn('[IA Estratégica] IA não retornou ajustes utilizáveis — usando diagnóstico base.')
  } catch (error) {
    console.error('[IA Estratégica] Falha ao chamar IA de refinamento estratégico:', error)
  }

  // ==============================
  // 3️⃣ FALLBACK
  // ==============================

  return baseDiagnosis // aiUsed já é false aqui
}