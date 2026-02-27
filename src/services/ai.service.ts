import { Lead, LeadStatus, LeadTemperature } from '../types';
import { calculatePriority } from '../lib/priority';

export interface AIAnalysisResult {
  nome: string | null;
  telefone: string | null;
  servico: string | null;
  temperatura: LeadTemperature;
  status: LeadStatus;
  risco: 'baixo' | 'medio' | 'alto' | 'critico';
  orcamentoEnviado: boolean;
  valorOrcado: number | null;
  resumo: string;
  proximaAcao: string;
  dataSugeridaFollowUp: string;
}

export class AIService {
  /**
   * Analisa o texto da conversa e extrai informações estruturadas.
   * Heurística otimizada para conversas estilo WhatsApp.
   */
  static async analyzeConversation(text: string): Promise<AIAnalysisResult> {
    await new Promise(resolve => setTimeout(resolve, 800));

    // ============================================
    // EXTRAÇÃO DE NOME (formato: Nome:)
    // ============================================
    const nomeMatch = text.match(/^([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+):/m);

    // ============================================
    // EXTRAÇÃO DE TELEFONE
    // ============================================
    const telMatch = text.match(/(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}/);

    // ============================================
    // DETECÇÃO DE SERVIÇO
    // ============================================
    const services = [
      'serralheria',
      'drywall',
      'reforma',
      'pintura',
      'elétrica',
      'instalação elétrica',
      'telhado',
      'portão',
      'grade'
    ];

    let detectedService: string | null = null;

    for (const s of services) {
      if (text.toLowerCase().includes(s)) {
        detectedService = s.charAt(0).toUpperCase() + s.slice(1);
        break;
      }
    }

    // ============================================
    // DETECÇÃO DE ORÇAMENTO
    // ============================================
    const temOrcamento = /orçamento|valor|preço|quanto/i.test(text);
    const valorMatch = text.match(/(?:R\$|R\s?\$)\s?(\d+(?:[.,]\d{2})?)/);

    // ============================================
    // ANÁLISE DE INTENÇÃO / TEMPERATURA
    // ============================================
    const isHot = /urgente|pra ontem|imediato|preciso hoje|o quanto antes/i.test(text);
    const isWarm = /semana que vem|próximos dias|interessado|orçamento/i.test(text);
    const isCold = /pesquisando valores|sem pressa|ver mais pra frente|avaliando/i.test(text);

    let temperatura: LeadTemperature = 'frio';

    if (isHot) temperatura = 'quente';
    else if (isWarm) temperatura = 'morno';
    else if (isCold) temperatura = 'frio';

    // ============================================
    // STATUS INICIAL
    // ============================================
    let status: LeadStatus = 'novo';
    if (temOrcamento) status = 'atendimento';

    return {
      nome: nomeMatch ? nomeMatch[1] : null,
      telefone: telMatch ? telMatch[0] : null,
      servico: detectedService,
      temperatura,
      status,
      risco: 'baixo',
      orcamentoEnviado: false,
      valorOrcado: valorMatch
        ? parseFloat(valorMatch[1].replace(',', '.'))
        : null,
      resumo: `Lead interessado em ${detectedService || 'serviço geral'}. Conversa via WhatsApp.`,
      proximaAcao: "Realizar contato estratégico para qualificar necessidade.",
      dataSugeridaFollowUp: new Date(Date.now() + 86400000)
        .toISOString()
        .split('T')[0],
    };
  }

  /**
   * Verifica duplicidade de leads
   */
  static checkDuplicity(newLead: Partial<Lead>, existingLeads: Lead[]): Lead | null {
    if (!newLead.telefone && !newLead.nome) return null;

    return existingLeads.find(l => {
      if (newLead.telefone && l.telefone) {
        const t1 = newLead.telefone.replace(/\D/g, '');
        const t2 = l.telefone.replace(/\D/g, '');
        if (t1 === t2 && t1.length > 5) return true;
      }

      if (newLead.nome && l.nome) {
        if (newLead.nome.toLowerCase().trim() === l.nome.toLowerCase().trim()) return true;
      }

      return false;
    }) || null;
  }

  /**
   * Converte o resultado da análise para um objeto Lead
   */
  static convertToLead(analysis: AIAnalysisResult, workspaceId: string): Partial<Lead> {
    const leadBase: Partial<Lead> = {
      workspaceId,
      nome: analysis.nome || 'Novo Lead (IA)',
      telefone: analysis.telefone || '',
      email: '',
      servico: analysis.servico || 'Serviço Geral',
      status: analysis.status,
      temperatura: analysis.temperatura,
      orcamentoEnviado: analysis.orcamentoEnviado,
      valorOrcado: analysis.valorOrcado || 0,
      resumo: analysis.resumo,
      observacoes: `Analisado via IA em ${new Date().toLocaleString()}`,
      ultimoContato: new Date().toISOString(),
      proximoContato: analysis.dataSugeridaFollowUp,
      historico: [{
        id: crypto.randomUUID(),
        data: new Date().toISOString(),
        tipo: 'ia',
        descricao: 'Lead criado via análise de conversa por IA.'
      }]
    };

    const { score, level } = calculatePriority(leadBase as Lead);
    leadBase.prioridadeScore = score;
    leadBase.prioridadeLevel = level;

    return leadBase;
  }
}