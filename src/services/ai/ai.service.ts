import { Lead, LeadStatus, LeadTemperature, LeadOrigin, LeadPrazo, HISTORICO_TIPO } from '@/types';
import { calculatePriority } from '@/lib/priority';
import { apiFetch } from '@/lib/apiFetch';

export interface AIAnalysisResult {
  nome: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  servico: string | null;
  origem: string | null;
  temperatura: LeadTemperature;
  status: LeadStatus;
  risco: 'baixo' | 'medio' | 'alto' | 'critico';
  orcamentoEnviado: boolean;
  valorOrcado: number | null;
  resumo: string;
  proximaAcao: string;
  dataSugeridaFollowUp: string;
  ultimoContato?: string;
  visitaSugerida?: boolean | null;
  dataVisitaSugerida?: string | null;

  // 🔥 NOVOS CAMPOS (urgência/prazo e período de visita — usam enums já existentes do Lead)
  prazoCliente: LeadPrazo;
  visitaOrcamentoPeriodo: 'manha' | 'almoco' | 'tarde' | null;

  // 🔥 Indica se a extração usou a IA com sucesso (false = só heurística local)
  aiUsed: boolean;
}

function buildExtractionPrompt(conversation: string): string {
  return `
Extraia os dados abaixo de uma conversa de WhatsApp entre uma empresa de serralheria/marcenaria/reformas e um cliente.
Nunca invente. Se não tiver certeza de um campo, retorne null para ele.

===== CONVERSA =====
${conversation}
===== FIM DA CONVERSA =====

Responda SOMENTE em JSON válido com estas chaves (use null quando não tiver certeza):

{
  "nome": "nome do cliente ou null",
  "telefone": "telefone ou null",
  "email": "email ou null",
  "endereco": "endereço completo da obra, incluindo bairro se mencionado, ou null",
  "servico": "descrição do serviço solicitado, incluindo medidas e materiais mencionados, ou null",
  "origem": "indicacao | facebook | instagram | google | outro",
  "prazoCliente": "urgente | curto | medio | longo | nao_definido",
  "temperatura": "frio | morno | quente",
  "status": "novo | atendimento | orcado | fechado | perdido",
  "valorOrcado": 0,
  "visitaSugerida": false,
  "dataVisitaSugerida": "YYYY-MM-DD ou null",
  "visitaOrcamentoPeriodo": "manha | almoco | tarde | null",
  "resumo": "resumo rico da conversa em 2-4 frases, mencionando medidas, materiais e contexto que não têm campo próprio"
}
`;
}

export class AIService {
  // =========================
  // LIMPEZA DA CONVERSA
  // =========================
  static cleanConversation(text: string) {
    return text
      .replace(/\[\d{1,2}:\d{2},?\s*\d{1,2}\/\d{1,2}\/\d{4}\]/g, '')
      .replace(/:\s*/g, ': ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  // =========================
  // EXTRAÇÃO DE TELEFONE
  // =========================
  static extractPhone(text: string) {
    const match = text.match(/(\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4})/);
    return match ? match[0] : null;
  }

  // =========================
  // EXTRAÇÃO DE EMAIL
  // =========================
  static extractEmail(text: string) {
    const match = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
    return match ? match[0] : null;
  }

  // =========================
  // EXTRAÇÃO DE ENDEREÇO
  // =========================
  static extractAddress(text: string) {
    const match = text.match(/(rua|av|avenida|travessa|alameda)\s+[^\n,]+/i);
    return match ? match[0] : null;
  }

  // =========================
  // EXTRAÇÃO DE NOME
  // =========================
  static extractName(text: string) {
    const lines = text.split('\n');

    for (const line of lines) {
      const clean = line.trim();

      if (
        clean.length > 3 &&
        clean.length < 40 &&
        /^[A-Za-zÀ-ÿ\s]+$/.test(clean)
      ) {
        if (
          !clean.toLowerCase().includes('bom dia') &&
          !clean.toLowerCase().includes('boa tarde')
        ) {
          return clean;
        }
      }
    }

    return null;
  }

  // =========================
  // DETECTAR SERVIÇO
  // =========================
  static detectService(text: string) {
    const lower = text.toLowerCase();

    const services = [
      'varanda',
      'cobertura',
      'telhado',
      'estrutura metálica',
      'mezanino',

      'portão',
      'porta',
      'grade',
      'corrimão',
      'escada',

      'mesa',
      'cadeira',
      'banco',
      'armário',
      'guarda roupa',
      'estante',

      'lixeira',
      'suporte',
      'prateleira',
      'base metálica',

      'solda',
      'serralheria',
      'reparo',
      'manutenção',

      'pintura',
      'pintura de portão',
      'pintura de grade',
      'pintura de estrutura',
      'pintura de peça',
    ];

    for (const service of services) {
      if (lower.includes(service)) {
        return service.charAt(0).toUpperCase() + service.slice(1);
      }
    }

    return 'Serviço de serralheria';
  }

  // =========================
  // DETECTAR INTENÇÃO DE VISITA
  // =========================
  static detectVisitIntent(text: string) {
    const lower = text.toLowerCase();

    const visitSignals = [
      'pode vir',
      'pode vir ver',
      'pode vir aqui',
      'quando vocês podem vir',
      'vamos marcar',
      'marcar visita',
      'vir ver',
      'vir medir',
      'pode passar aqui',
      'podemos marcar',
      'pode vir amanhã',
      'vir dar uma olhada',
      'vir olhar',
      'vir avaliar',
      'ver no local',
      'ver pessoalmente',
    ];

    for (const signal of visitSignals) {
      if (lower.includes(signal)) {
        return true;
      }
    }

    return false;
  }

  // =========================
  // DETECTAR ORIGEM DO LEAD
  // =========================
  static detectOrigin(text: string) {
    const lower = text.toLowerCase();

    if (lower.includes('instagram')) return 'instagram';
    if (lower.includes('facebook')) return 'facebook';
    if (lower.includes('indicação') || lower.includes('indicou'))
      return 'indicacao';

    return 'outro';
  }

  // =========================
  // DETECTAR PRAZO/URGÊNCIA DO CLIENTE
  // =========================
  static detectPrazoCliente(text: string): LeadPrazo {
    const lower = text.toLowerCase();

    if (
      lower.includes('urgente') ||
      lower.includes('o quanto antes') ||
      lower.includes('pra ontem') ||
      lower.includes('hoje mesmo')
    ) {
      return 'urgente';
    }

    if (
      lower.includes('essa semana') ||
      lower.includes('próximos dias') ||
      lower.includes('proximos dias')
    ) {
      return 'curto';
    }

    if (
      lower.includes('esse mês') ||
      lower.includes('esse mes') ||
      lower.includes('próximas semanas') ||
      lower.includes('proximas semanas')
    ) {
      return 'medio';
    }

    if (
      lower.includes('sem pressa') ||
      lower.includes('futuramente') ||
      lower.includes('mais pra frente')
    ) {
      return 'longo';
    }

    return 'nao_definido';
  }

  // =========================
  // DETECTAR VALORES
  // =========================
  static extractBudget(text: string) {
    const lines = text.split('\n');

    let values: number[] = [];

    lines.forEach((line) => {
      const match = line.match(/R\$?\s?(\d+[.,]?\d{0,2})/);

      if (match) {
        const value = parseFloat(match[1].replace('.', '').replace(',', '.'));

        if (value > 100 && value < 100000) {
          values.push(value);
        }
      }
    });

    if (!values.length) return null;

    const total = values.reduce((a, b) => a + b, 0);

    return Math.round(total);
  }

  // =========================
  // DETECTAR INTENÇÃO DE COMPRA
  // =========================
  static detectTemperature(text: string): LeadTemperature {
    const lower = text.toLowerCase();

    if (
      lower.includes('fechou') ||
      lower.includes('vou fazer') ||
      lower.includes('vamos fazer') ||
      lower.includes('pode fazer')
    ) {
      return 'quente';
    }

    if (
      lower.includes('orçamento') ||
      lower.includes('quanto fica') ||
      lower.includes('valor')
    ) {
      return 'morno';
    }

    return 'frio';
  }

  static detectBuyingSignals(text: string) {
    const lower = text.toLowerCase();

    const strongSignals = [
      'vou fazer',
      'vamos fazer',
      'fechou',
      'pode fazer',
      'pode ser',
      'agendar',
      'confirmar',
      'marcar horário',
    ];

    const mediumSignals = [
      'orçamento',
      'quanto fica',
      'qual valor',
      'valor por metro',
      'tem financiamento',
    ];

    const weakSignals = ['como funciona', 'estou vendo', 'estou pesquisando'];

    let score = 0;

    strongSignals.forEach((s) => {
      if (lower.includes(s)) score += 40;
    });

    mediumSignals.forEach((s) => {
      if (lower.includes(s)) score += 20;
    });

    weakSignals.forEach((s) => {
      if (lower.includes(s)) score += 5;
    });

    return score;
  }

  static extractLastContact(text: string) {
    const match = text.match(
      /\[(\d{1,2}:\d{2}),\s*(\d{1,2}\/\d{1,2}\/\d{4})\]/,
    );

    if (!match) return null;

    return match[2];
  }
  static extractNeighborhood(text: string) {
    const bairros = ['deolinda', 'estados unidos', 'morada', 'fabrício'];

    const lower = text.toLowerCase();

    for (const b of bairros) {
      if (lower.includes(b)) {
        return b;
      }
    }

    return null;
  }
  static detectAudioMessages(text: string) {
    const audioPatterns = [
      '<media omitted>',
      'mensagem de voz',
      'audio omitted',
      'áudio',
      'audio',
    ];

    const lower = text.toLowerCase();

    for (const pattern of audioPatterns) {
      if (lower.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  // =========================
  // DETECTAR FASE DA NEGOCIAÇÃO
  // =========================
  static detectSalesStage(text: string) {
    const lower = text.toLowerCase();

    if (
      lower.includes('fechou') ||
      lower.includes('vamos fazer') ||
      lower.includes('pode fazer') ||
      lower.includes('vou fechar')
    ) {
      return 'fechamento';
    }

    if (
      lower.includes('vou ver') ||
      lower.includes('te retorno') ||
      lower.includes('vou analisar')
    ) {
      return 'negociacao';
    }

    if (
      lower.includes('orçamento') ||
      lower.includes('quanto fica') ||
      lower.includes('qual valor')
    ) {
      return 'orcamento';
    }

    if (
      lower.includes('bom dia') ||
      lower.includes('boa tarde') ||
      lower.includes('preciso de')
    ) {
      return 'qualificacao';
    }

    return 'contato';
  }

  // =========================
  // GERAR RESUMO
  // =========================
  static generateSummary({
    nome,
    servico,
    endereco,
    valor,
    hasAudio,
    stage,
  }: {
    nome: string | null;
    servico: string | null;
    endereco: string | null;
    valor: number | null;
    hasAudio?: boolean;
    stage?: string;
  }) {
    let partes: string[] = [];

    if (nome) {
      partes.push(`Cliente ${nome}`);
    }

    if (servico) {
      partes.push(`solicitou serviço de ${servico}`);
    }

    if (endereco) {
      partes.push(`obra localizada em ${endereco}`);
    }

    if (valor) {
      partes.push(
        `orçamento aproximado de R$ ${valor.toLocaleString('pt-BR')}`,
      );
    }

    let resumo = partes.join('. ');

    if (resumo) {
      resumo += '.';
    }

    if (stage === 'negociacao') {
      resumo += ' Cliente avaliando proposta.';
    }

    if (stage === 'fechamento') {
      resumo += ' Cliente demonstrou intenção de fechamento.';
    }

    if (hasAudio) {
      resumo +=
        ' Conversa contém mensagens de áudio que podem incluir mais detalhes.';
    }

    return (
      resumo || 'Lead gerado automaticamente a partir de conversa do WhatsApp.'
    );
  }

  // =========================
  // ANÁLISE PRINCIPAL
  // =========================
  static async analyzeConversation(text: string): Promise<AIAnalysisResult> {
    const clean = this.cleanConversation(text);

    const ultimoContato = this.extractLastContact(text);
    const bairro = this.extractNeighborhood(clean);

    let nome = this.extractName(clean);

    const telefone = this.extractPhone(clean);
    const email = this.extractEmail(clean);
    const endereco = this.extractAddress(clean);
    const servico = this.detectService(clean);
    const origem = this.detectOrigin(clean);

    const hasAudio = this.detectAudioMessages(clean);

    const buyingScore = this.detectBuyingSignals(clean);

    const stage = this.detectSalesStage(clean);

    const visitIntent = this.detectVisitIntent(clean);
    const visitDate = this.detectVisitDate(clean);
    const visitPeriod = this.detectVisitPeriod(clean);
    const prazoCliente = this.detectPrazoCliente(clean);

    const valor = this.extractBudget(clean);

    // detectar nome quando cliente escreve "meu nome é"
    const nameMatch = clean.match(/meu nome é ([A-Za-zÀ-ÿ\s]+)/i);

    if (nameMatch) {
      nome = nameMatch[1].trim();
    }

    let temperatura: LeadTemperature = 'frio';

    if (buyingScore >= 40) {
      temperatura = 'quente';
    } else if (buyingScore >= 20) {
      temperatura = 'morno';
    }

    let status: LeadStatus = 'novo';

    if (stage === 'orcamento') {
      status = 'atendimento';
    }

    if (valor) {
      status = 'orcado';
    }

    if (stage === 'fechamento') {
      status = 'orcado';
    }

    const resumo = this.generateSummary({
      nome,
      servico,
      endereco: endereco
        ? bairro
          ? `${endereco} - ${bairro}`
          : endereco
        : null,
      valor,
      hasAudio,
      stage,
    });

    return {
      nome,
      telefone,
      email,
      endereco,
      servico,

      visitaSugerida: visitIntent,
      dataVisitaSugerida: visitDate,
      visitaOrcamentoPeriodo: visitPeriod,

      origem,
      prazoCliente,
      temperatura,
      status,
      risco: 'baixo',

      orcamentoEnviado: !!valor,
      valorOrcado: valor,

      ultimoContato: ultimoContato
        ? new Date(ultimoContato.split('/').reverse().join('-')).toISOString()
        : new Date().toISOString(),

      resumo,

      proximaAcao: 'Realizar contato para confirmação do serviço.',

      dataSugeridaFollowUp: new Date(Date.now() + 86400000)
        .toISOString()
        .split('T')[0],

      aiUsed: false, // esta função é 100% heurística; só analyzeConversationWithAI pode marcar true
    };
  }

  // =========================
  // ANÁLISE PRINCIPAL COM IA (fonte primária) + FALLBACK HEURÍSTICO
  // =========================
  static async analyzeConversationWithAI(text: string): Promise<AIAnalysisResult> {
    // 🔥 Heurística SEMPRE roda primeiro — é o piso garantido, nunca falha.
    const heuristic = await this.analyzeConversation(text);

    // Conversas de WhatsApp coladas podem ser longas — trunca preservando
    // a parte mais recente (contexto de negociação atual costuma estar no fim).
    const MAX_CHARS = 12000;
    const truncated = text.length > MAX_CHARS ? text.slice(-MAX_CHARS) : text;

    try {
      const response = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          temperature: 0,
          messages: [
            {
              role: 'system',
              content:
                'Você extrai dados estruturados de conversas de WhatsApp para uma empresa de serralheria/marcenaria/reformas. Nunca invente dados que não estejam explicitamente no texto — use null quando não tiver certeza. Retorne apenas JSON válido.',
            },
            { role: 'user', content: buildExtractionPrompt(truncated) },
          ],
        }),
      });

      if (!response.ok) {
        console.error('[AIService] OpenAI respondeu com erro HTTP', response.status);
        return heuristic;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error('[AIService] Resposta OpenAI sem conteúdo utilizável', data);
        return heuristic;
      }

      let parsed: Partial<AIAnalysisResult>;
      try {
        parsed = JSON.parse(content);
      } catch (err) {
        console.error('[AIService] Falha ao parsear JSON da IA', err, content);
        return heuristic;
      }

      return this.mergeAIWithHeuristic(heuristic, parsed);
    } catch (error) {
      console.error('[AIService] Falha ao chamar IA de extração de conversa:', error);
      return heuristic;
    }
  }

  // =========================
  // MERGE: IA sobrescreve só o que confirmou; heurística cobre o resto
  // =========================
  private static readonly ORIGENS: LeadOrigin[] = ['indicacao', 'facebook', 'instagram', 'google', 'outro'];
  private static readonly PRAZOS: LeadPrazo[] = ['urgente', 'curto', 'medio', 'longo', 'nao_definido'];
  private static readonly PERIODOS = ['manha', 'almoco', 'tarde'] as const;
  private static readonly STATUSES: LeadStatus[] = ['novo', 'atendimento', 'orcado', 'fechado', 'perdido'];
  private static readonly TEMPERATURAS: LeadTemperature[] = ['frio', 'morno', 'quente'];

  private static mergeAIWithHeuristic(
    heuristic: AIAnalysisResult,
    ai: Partial<AIAnalysisResult>,
  ): AIAnalysisResult {
    const pickEnum = <T,>(value: unknown, allowed: readonly T[], fallback: T): T =>
      (allowed as readonly unknown[]).includes(value) ? (value as T) : fallback;

    const pickText = (value: unknown, fallback: string | null) =>
      typeof value === 'string' && value.trim() ? value.trim() : fallback;

    const valorOrcadoAI =
      typeof ai.valorOrcado === 'number' && ai.valorOrcado > 0 ? ai.valorOrcado : null;

    return {
      ...heuristic,
      nome: pickText(ai.nome, heuristic.nome),
      telefone: pickText(ai.telefone, heuristic.telefone),
      email: pickText(ai.email, heuristic.email),
      endereco: pickText(ai.endereco, heuristic.endereco),
      servico: pickText(ai.servico, heuristic.servico),
      origem: pickEnum(ai.origem, this.ORIGENS, (heuristic.origem as LeadOrigin) || 'outro'),
      prazoCliente: pickEnum(ai.prazoCliente, this.PRAZOS, heuristic.prazoCliente),
      temperatura: pickEnum(ai.temperatura, this.TEMPERATURAS, heuristic.temperatura),
      status: pickEnum(ai.status, this.STATUSES, heuristic.status),
      valorOrcado: valorOrcadoAI ?? heuristic.valorOrcado,
      orcamentoEnviado: valorOrcadoAI !== null ? true : heuristic.orcamentoEnviado,
      resumo: pickText(ai.resumo, heuristic.resumo) || heuristic.resumo,
      visitaSugerida: typeof ai.visitaSugerida === 'boolean' ? ai.visitaSugerida : heuristic.visitaSugerida,
      dataVisitaSugerida: pickText(ai.dataVisitaSugerida, heuristic.dataVisitaSugerida ?? null),
      visitaOrcamentoPeriodo: pickEnum(
        ai.visitaOrcamentoPeriodo,
        this.PERIODOS,
        heuristic.visitaOrcamentoPeriodo,
      ),
      aiUsed: true,
    };
  }

  static detectVisitDate(text: string) {
    const lower = text.toLowerCase();

    if (lower.includes('amanhã')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
    }

    const match = text.match(/\d{1,2}\/\d{1,2}/);

    if (match) {
      const year = new Date().getFullYear();
      return `${year}-${match[0].split('/').reverse().join('-')}`;
    }

    return null;
  }

  static detectVisitPeriod(text: string) {
    const lower = text.toLowerCase();

    if (
      lower.includes('manhã') ||
      lower.includes('manha') ||
      lower.includes('cedo')
    ) {
      return 'manha';
    }

    if (lower.includes('almoço') || lower.includes('meio dia')) {
      return 'almoco';
    }

    if (lower.includes('tarde')) {
      return 'tarde';
    }

    return null;
  }

  // =========================
  // CONVERTER PARA LEAD
  // =========================
  static convertToLead(
    analysis: AIAnalysisResult,
    workspaceId: string,
  ): Partial<Lead> {
    const leadBase: Partial<Lead> = {
      workspaceId,

      nome: analysis.nome || 'Novo Lead',
      telefone: analysis.telefone || '',
      email: analysis.email || '',
      endereco: analysis.endereco || '',

      servico: analysis.servico || 'Serviço',

      status: analysis.status,
      temperatura: analysis.temperatura || 'frio',

      origem: (analysis.origem as any) || 'outro',

      prazoCliente: analysis.prazoCliente || 'nao_definido',
      probabilidadeManual: 3,

      visitaOrcamentoData: analysis.dataVisitaSugerida || undefined,
      visitaOrcamentoPeriodo: analysis.visitaOrcamentoPeriodo || undefined,

      ultimoContato: analysis.ultimoContato || new Date().toISOString(),
      proximoContato: analysis.dataSugeridaFollowUp,

      orcamentoEnviado: analysis.orcamentoEnviado,
      valorOrcado: analysis.valorOrcado,

      resumo: analysis.resumo,
      observacoes: 'Lead criado automaticamente via IA.',

      historico: [
        {
          id: crypto.randomUUID(),
          tipo: HISTORICO_TIPO.IA_ANALYSIS,
          descricao: 'Lead criado via análise de conversa.',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const { score, level } = calculatePriority(leadBase as Lead);

    leadBase.prioridadeScore = score;
    leadBase.prioridadeLevel = level;

    return leadBase;
  }

  // =========================
  // VERIFICAR DUPLICIDADE
  // =========================
  static checkDuplicity(
    newLead: Partial<Lead>,
    existingLeads: Lead[],
  ): Lead | null {
    return (
      existingLeads.find((l) => {
        if (newLead.telefone && l.telefone) {
          const t1 = newLead.telefone.replace(/\D/g, '');
          const t2 = l.telefone.replace(/\D/g, '');

          if (t1 === t2 && t1.length > 6) return true;
        }

        if (newLead.nome && l.nome) {
          if (newLead.nome.toLowerCase().trim() === l.nome.toLowerCase().trim())
            return true;
        }

        return false;
      }) || null
    );
  }
}
