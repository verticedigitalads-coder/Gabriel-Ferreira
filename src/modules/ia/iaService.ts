// ═══════════════════════════════════════════════════════════════════════════
// IA SERVICE - Análise Estratégica de Leads B2B para Serviços Locais
// (Serralheria, Drywall, Reformas)
// ═══════════════════════════════════════════════════════════════════════════

import type { Lead } from '@/types';

export interface IAAnalysis {
  temperaturaSugerida: 'fria' | 'morna' | 'quente';
  statusSugerido: Lead['status'];
  riscoDePerda: 'baixo' | 'medio' | 'alto' | 'critico';
  nivelDeUrgencia: 1 | 2 | 3 | 4 | 5;
  estrategiaDeAbordagem: string;
  mensagemSugeridaWhatsApp: string;
  resumoExecutivo: string;
  dataIdealFollowUp: string;
  justificativa: string;
}

/**
 * Analisa lead com IA estratégica para vendas B2B de serviços locais
 * 
 * Critérios estratégicos:
 * - Se pediu orçamento detalhado → intenção real
 * - Se sumiu após envio de valor → risco médio
 * - Se mencionou prazo curto → urgência alta
 * - Se pediu visita técnica → alta probabilidade
 * - Se falou "vou ver" sem prazo → risco alto
 * 
 * Regras:
 * - Nunca inventar dados
 * - Nunca prometer fechamento
 * - Ser conservador
 * - Priorizar leads com maior probabilidade real de conversão
 * - Identificar leads que devem ser descartados
 */
export function analyzeLeadWithIA(lead: Lead): IAAnalysis {
  const now = new Date();
  const diasSemContato = lead.ultimoContato
    ? Math.floor((now.getTime() - new Date(lead.ultimoContato).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const diasDesdeCriacao = lead.createdAt
    ? Math.floor((now.getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const temOrcamento = lead.valorOrcado > 0;
  const temPrazoCurto = lead.proximoContato ? new Date(lead.proximoContato) <= now : false;
  const prazoVencido = lead.proximoContato ? new Date(lead.proximoContato) < now : false;

  // ============================================
  // ANÁLISE DE RISCO DE PERDA
  // ============================================
  let riscoDePerda: IAAnalysis['riscoDePerda'] = 'baixo';

  // Critérios de risco baseados em comportamento
  if (lead.status === 'orcado' && diasSemContato > 3) {
    riscoDePerda = 'medio'; // Sumiu após envio de valor
  }
  if (lead.status === 'orcado' && diasSemContato > 7) {
    riscoDePerda = 'alto';
  }
  if (diasSemContato > 10 && lead.status !== 'fechado' && lead.status !== 'perdido') {
    riscoDePerda = 'alto';
  }
  if (diasSemContato > 21) {
    riscoDePerda = 'critico'; // Quase perdido
  }
  if (lead.status === 'atendimento' && diasSemContato > 5) {
    riscoDePerda = 'medio'; // Esfriou no meio do atendimento
  }
  if (prazoVencido && diasSemContato > 3) {
    riscoDePerda = 'alto'; // Prazo vencido + sem contato
  }
  if (lead.status === 'novo' && diasDesdeCriacao > 30) {
    riscoDePerda = 'critico'; // Lead novo muito antigo, provavelmente perdido
  }

  // ============================================
  // NÍVEL DE URGÊNCIA (1-5)
  // ============================================
  let nivelDeUrgencia: IAAnalysis['nivelDeUrgencia'] = 1;

  // Urgência por tempo sem contato
  if (diasSemContato >= 1) nivelDeUrgencia = 2;
  if (diasSemContato >= 3) nivelDeUrgencia = 3;
  if (diasSemContato >= 7) nivelDeUrgencia = 4;
  if (diasSemContato >= 14) nivelDeUrgencia = 5;

  // Urgência por prazo vencido
  if (prazoVencido) {
    nivelDeUrgencia = Math.max(nivelDeUrgencia, 4) as 1 | 2 | 3 | 4 | 5;
  }

  // Urgência por valor alto (oportunidade grande)
  if (lead.valorOrcado > 10000) {
    nivelDeUrgencia = Math.max(nivelDeUrgencia, 3) as 1 | 2 | 3 | 4 | 5;
  }

  // Urgência por temperatura quente
  if (lead.temperatura === 'quente' && diasSemContato > 2) {
    nivelDeUrgencia = Math.max(nivelDeUrgencia, 4) as 1 | 2 | 3 | 4 | 5;
  }

  // Urgência por status orcado (momento crítico de decisão)
  if (lead.status === 'orcado' && diasSemContato <= 5) {
    nivelDeUrgencia = Math.max(nivelDeUrgencia, 3) as 1 | 2 | 3 | 4 | 5;
  }

  // ============================================
  // TEMPERATURA SUGERIDA
  // ============================================
  let temperaturaSugerida: IAAnalysis['temperaturaSugerida'] = 
    lead.temperatura === 'frio' ? 'fria' : lead.temperatura === 'morno' ? 'morna' : 'quente';

  // Upgrade de temperatura
  if (temOrcamento && lead.valorOrcado > 5000 && diasSemContato <= 3) {
    temperaturaSugerida = 'quente'; // Orçamento alto + contato recente
  }
  if (lead.status === 'atendimento' && diasSemContato <= 2) {
    temperaturaSugerida = 'quente'; // Em atendimento ativo
  }

  // Downgrade de temperatura
  if (diasSemContato > 10 && lead.temperatura === 'quente') {
    temperaturaSugerida = 'morna'; // Esfriou
  }
  if (diasSemContato > 21) {
    temperaturaSugerida = 'fria'; // Muito tempo sem contato
  }
  if (lead.status === 'orcado' && diasSemContato > 7) {
    temperaturaSugerida = 'morna'; // Orçamento enviado e sumiu
  }
  if (lead.status === 'novo' && diasSemContato > 14) {
    temperaturaSugerida = 'fria'; // Lead novo esfriou
  }

  // ============================================
  // STATUS SUGERIDO
  // ============================================
  let statusSugerido: Lead['status'] = lead.status;

  // Sugestão de mudança de status baseada em inatividade
  if (lead.status === 'novo' && diasSemContato > 30) {
    statusSugerido = 'perdido'; // Lead novo muito antigo
  }
  if (lead.status === 'atendimento' && diasSemContato > 21) {
    statusSugerido = 'perdido'; // Atendimento abandonado
  }
  if (lead.status === 'novo' && diasSemContato > 0 && diasSemContato <= 7) {
    statusSugerido = 'atendimento'; // Já teve contato, saiu do novo
  }

  // ============================================
  // ESTRATÉGIA DE ABORDAGEM
  // ============================================
  const estrategias: string[] = [];

  // Baseado no risco
  if (riscoDePerda === 'critico') {
    estrategias.push('🚨 AÇÃO IMEDIATA: Contato urgente necessário para recuperar lead');
  } else if (riscoDePerda === 'alto') {
    estrategias.push('⚠️ PRIORIDADE ALTA: Risco de perda significativo, abordar em 24h');
  } else if (riscoDePerda === 'medio') {
    estrategias.push('📋 MONITORAR: Situação requer atenção, follow-up em 48h');
  }

  // Baseado no status
  if (lead.status === 'orcado' && diasSemContato > 3) {
    estrategias.push('💰 Orçamento pendente de decisão - oferecer condição especial ou esclarecer dúvidas');
  }
  if (lead.status === 'atendimento' && diasSemContato > 3) {
    estrategias.push('🔄 Retomar contato para destravar processo e agendar próxima etapa');
  }
  if (lead.status === 'novo' && diasSemContato > 2) {
    estrategias.push('📞 Primeiro contato qualificador - entender necessidade real e prazo');
  }
  if (lead.status === 'novo' && diasSemContato === 0) {
    estrategias.push('🎯 Contato imediato - lead recém-chegado, alta chance de conversão');
  }

  // Baseado no valor
  if (lead.valorOrcado > 10000) {
    estrategias.push('💎 Oportunidade de alto valor - dedicar tempo extra e proposta personalizada');
  } else if (lead.valorOrcado > 0 && lead.valorOrcado <= 3000) {
    estrategias.push('⚡ Oportunidade de fechamento rápido - proposta objetiva e direta');
  }

  // Baseado no tempo
  if (diasSemContato > 14) {
    estrategias.push('🔄 Reabordagem necessária - tratar como novo lead com histórico');
  }

  // Baseado em prazo
  if (temPrazoCurto && !prazoVencido) {
    estrategias.push('⏰ Prazo curto identificado - acelerar processo de decisão');
  }

  if (estrategias.length === 0) {
    estrategias.push('✅ Lead em acompanhamento normal - manter ritmo de follow-up');
  }

  const estrategiaDeAbordagem = estrategias.join(' | ');

  // ============================================
  // MENSAGEM WHATSAPP SUGERIDA
  // ============================================
  const mensagemSugeridaWhatsApp = generateWhatsAppMessage(lead, diasSemContato);

  // ============================================
  // RESUMO EXECUTIVO
  // ============================================
  const resumoExecutivo = generateExecutiveSummary(lead, diasSemContato, riscoDePerda, diasDesdeCriacao);

  // ============================================
  // DATA IDEAL DE FOLLOW-UP
  // ============================================
  const dataIdealFollowUp = calculateIdealFollowUp(lead, diasSemContato, nivelDeUrgencia);

  // ============================================
  // JUSTIFICATIVA
  // ============================================
  const justificativa = generateJustification(
    lead,
    diasSemContato,
    riscoDePerda,
    temperaturaSugerida,
    lead.valorOrcado,
    diasDesdeCriacao
  );

  return {
    temperaturaSugerida,
    statusSugerido,
    riscoDePerda,
    nivelDeUrgencia,
    estrategiaDeAbordagem,
    mensagemSugeridaWhatsApp,
    resumoExecutivo,
    dataIdealFollowUp,
    justificativa,
  };
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function generateWhatsAppMessage(lead: Lead, diasSemContato: number): string {
  const nome = lead.nome.split(' ')[0]; // Primeiro nome
  const servico = lead.servico || 'o projeto';

  if (diasSemContato > 14) {
    return `Olá ${nome}, tudo bem? 
Sou [Seu Nome] da [Sua Empresa]. 
Vi que conversamos há algumas semanas sobre ${servico}. 
Gostaria de saber se ainda está precisando do serviço ou se já encontrou uma solução. 
Posso ajudar de alguma forma?`;
  }

  if (lead.status === 'orcado') {
    return `Olá ${nome}, bom dia! 
Aqui é [Seu Nome] da [Sua Empresa]. 
Estou acompanhando o orçamento que enviei sobre ${servico}. 
Ficou alguma dúvida? Posso revisar algum ponto ou agendar uma visita para detalharmos melhor? 
Fico no aguardo!`;
  }

  if (lead.status === 'atendimento') {
    return `Oi ${nome}, tudo bem? 
Aqui é [Seu Nome]. 
Estou dando sequência no seu projeto de ${servico}. 
Preciso confirmar alguns detalhes para avançarmos. 
Qual o melhor horário para conversarmos hoje?`;
  }

  if (lead.status === 'novo') {
    return `Olá ${nome}, tudo bem? 
Aqui é [Seu Nome] da [Sua Empresa]. 
Recebi seu contato sobre ${servico}. 
Gostaria de entender melhor sua necessidade e como posso ajudar. 
Tem um momento para conversarmos?`;
  }

  // Mensagem padrão
  return `Olá ${nome}, tudo bem? 
Aqui é [Seu Nome] da [Sua Empresa]. 
Gostaria de saber como posso ajudar com seu projeto de ${servico}. 
Tem um momento para conversarmos?`;
}

function generateExecutiveSummary(
  lead: Lead,
  diasSemContato: number,
  riscoDePerda: string,
  diasDesdeCriacao: number
): string {
  const parts: string[] = [];

  // Status atual
  parts.push(`Lead ${lead.status} há ${diasSemContato === 999 ? 'nunca contatado' : diasSemContato + ' dias'} sem contato.`);

  // Risco
  if (riscoDePerda === 'critico') {
    parts.push('Risco CRÍTICO de perda - ação imediata necessária.');
  } else if (riscoDePerda === 'alto') {
    parts.push('Risco ALTO - priorizar hoje.');
  } else if (riscoDePerda === 'medio') {
    parts.push('Risco MÉDIO - acompanhar de perto.');
  }

  // Valor
  if (lead.valorOrcado > 10000) {
    parts.push(`Oportunidade de R$ ${lead.valorOrcado.toLocaleString('pt-BR')} - alto potencial.`);
  } else if (lead.valorOrcado > 0) {
    parts.push(`Orçamento de R$ ${lead.valorOrcado.toLocaleString('pt-BR')} enviado.`);
  }

  // Temperatura
  if (lead.temperatura === 'quente') {
    parts.push('Lead QUENTE - alta probabilidade de conversão.');
  }

  // Idade do lead
  if (diasDesdeCriacao > 30 && lead.status === 'novo') {
    parts.push(`Lead com ${diasDesdeCriacao} dias sem evolução - considerar descarte.`);
  }

  return parts.join(' ');
}

function calculateIdealFollowUp(
  lead: Lead,
  diasSemContato: number,
  nivelDeUrgencia: number
): string {
  const today = new Date();
  let followUpDays = 0;

  // Baseado na urgência
  switch (nivelDeUrgencia) {
    case 5:
      followUpDays = 0; // Hoje
      break;
    case 4:
      followUpDays = 1; // Amanhã
      break;
    case 3:
      followUpDays = 2; // Em 2 dias
      break;
    case 2:
      followUpDays = 3; // Em 3 dias
      break;
    default:
      followUpDays = 7; // Em 1 semana
  }

  // Ajuste por status
  if (lead.status === 'orcado' && diasSemContato <= 3) {
    followUpDays = Math.min(followUpDays, 2);
  }

  const followUpDate = new Date(today);
  followUpDate.setDate(followUpDate.getDate() + followUpDays);

  return followUpDate.toISOString().split('T')[0];
}

function generateJustification(
  lead: Lead,
  diasSemContato: number,
  _riscoDePerda: string,
  temperaturaSugerida: string,
  valorOrcado: number,
  diasDesdeCriacao: number
): string {
  const reasons: string[] = [];

  // Tempo sem contato
  if (diasSemContato > 7 && diasSemContato !== 999) {
    reasons.push(`+${diasSemContato} dias sem contato indica desinteresse ou perda`);
  }
  if (diasSemContato === 999) {
    reasons.push('Nunca houve contato registrado - prioridade máxima');
  }

  // Status + tempo
  if (lead.status === 'orcado' && diasSemContato > 3) {
    reasons.push('Orçamento enviado sem retorno = risco de perda para concorrente');
  }

  // Valor
  if (valorOrcado > 5000) {
    reasons.push(`Valor de R$ ${valorOrcado.toLocaleString('pt-BR')} justifica atenção especial`);
  }

  // Temperatura
  if (temperaturaSugerida === 'fria' && lead.temperatura === 'quente') {
    reasons.push('Temperatura downgrade por inatividade prolongada');
  }

  // Prazo
  if (lead.proximoContato) {
    const isOverdue = new Date(lead.proximoContato) < new Date();
    if (isOverdue) {
      reasons.push('Prazo de follow-up vencido - compromete credibilidade');
    }
  }

  // Idade do lead
  if (diasDesdeCriacao > 30 && lead.status === 'novo') {
    reasons.push(`Lead com ${diasDesdeCriacao} dias sem evolução - baixo potencial`);
  }

  return reasons.length > 0 ? reasons.join('. ') : 'Análise baseada em padrões de conversão do setor';
}

/**
 * Analisa múltiplos leads e retorna priorização estratégica
 */
export function analyzeLeadsBatch(leads: Lead[]): {
  criticos: Lead[];
  altaPrioridade: Lead[];
  mediaPrioridade: Lead[];
  baixaPrioridade: Lead[];
  sugeridosDescarte: Lead[];
} {
  const criticos: Lead[] = [];
  const altaPrioridade: Lead[] = [];
  const mediaPrioridade: Lead[] = [];
  const baixaPrioridade: Lead[] = [];
  const sugeridosDescarte: Lead[] = [];

  leads.forEach(lead => {
    const analysis = analyzeLeadWithIA(lead);

    if (analysis.riscoDePerda === 'critico' || analysis.nivelDeUrgencia >= 5) {
      criticos.push(lead);
    } else if (analysis.riscoDePerda === 'alto' || analysis.nivelDeUrgencia >= 4) {
      altaPrioridade.push(lead);
    } else if (analysis.riscoDePerda === 'medio' || analysis.nivelDeUrgencia >= 3) {
      mediaPrioridade.push(lead);
    } else {
      baixaPrioridade.push(lead);
    }

    // Leads sugeridos para descarte
    if (analysis.statusSugerido === 'perdido' && lead.status !== 'perdido') {
      sugeridosDescarte.push(lead);
    }
  });

  return {
    criticos: criticos.sort((a, b) => b.valorOrcado - a.valorOrcado),
    altaPrioridade: altaPrioridade.sort((a, b) => b.valorOrcado - a.valorOrcado),
    mediaPrioridade: mediaPrioridade.sort((a, b) => b.valorOrcado - a.valorOrcado),
    baixaPrioridade: baixaPrioridade.sort((a, b) => b.valorOrcado - a.valorOrcado),
    sugeridosDescarte,
  };
}

/**
 * Gera relatório executivo de priorização
 */
export function generatePriorityReport(leads: Lead[]): string {
  const batch = analyzeLeadsBatch(leads);
  const total = leads.length;

  const report = `
📊 RELATÓRIO DE PRIORIZAÇÃO DE LEADS
=====================================

Total de Leads Analisados: ${total}

🔴 CRÍTICOS (Ação Imediata): ${batch.criticos.length}
   - Requerem contato hoje
   - Risco máximo de perda

🟠 ALTA PRIORIDADE (24h): ${batch.altaPrioridade.length}
   - Contato necessário amanhã
   - Bom potencial de conversão

🟡 MÉDIA PRIORIDADE (48h): ${batch.mediaPrioridade.length}
   - Acompanhar de perto
   - Follow-up programado

🟢 BAIXA PRIORIDADE (7 dias): ${batch.baixaPrioridade.length}
   - Manter no radar
   - Contato semanal

⚠️ SUGERIDOS DESCARTE: ${batch.sugeridosDescarte.length}
   - Inativos há muito tempo
   - Baixo potencial identificado

RECOMENDAÇÃO:
Foque 80% do seu tempo nos leads CRÍTICOS e ALTA PRIORIDADE.
Estes representam a maior probabilidade de fechamento imediato.
`;

  return report.trim();
}
