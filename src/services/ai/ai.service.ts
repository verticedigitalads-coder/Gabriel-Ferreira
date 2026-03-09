import { Lead, LeadStatus, LeadTemperature } from "@/types";
import { calculatePriority } from "@/lib/priority";

export interface AIAnalysisResult {
  nome: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  servico: string | null;
  origem: string | null;
  temperatura: LeadTemperature;
  status: LeadStatus;
  risco: "baixo" | "medio" | "alto" | "critico";
  orcamentoEnviado: boolean;
  valorOrcado: number | null;
  resumo: string;
  proximaAcao: string;
  dataSugeridaFollowUp: string;
}

export class AIService {

  // =========================
  // LIMPEZA DA CONVERSA
  // =========================
  static cleanConversation(text: string) {
    return text
      .replace(/\[\d{1,2}:\d{2},?\s*\d{1,2}\/\d{1,2}\/\d{4}\]/g, "")
      .replace(/:\s*/g, ": ")
      .replace(/\n+/g, "\n")
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
    const match = text.match(
      /(rua|av|avenida|travessa|alameda)\s+[^\n,]+/i
    );
    return match ? match[0] : null;
  }

  // =========================
  // EXTRAÇÃO DE NOME
  // =========================
  static extractName(text: string){

  const lines = text.split("\n")

  for(const line of lines){

    const clean = line.trim()

    if(
      clean.length > 3 &&
      clean.length < 40 &&
      /^[A-Za-zÀ-ÿ\s]+$/.test(clean)
    ){

      if(
        !clean.toLowerCase().includes("bom dia") &&
        !clean.toLowerCase().includes("boa tarde")
      ){
        return clean
      }

    }

  }

  return null
}

  // =========================
  // DETECTAR SERVIÇO
  // =========================
  static detectService(text: string) {

    const services = [
      "varanda",
      "portão",
      "grade",
      "serralheria",
      "cobertura",
      "telhado",
      "estrutura metálica",
      "corrimão",
      "escada"
    ];

    const lower = text.toLowerCase();

    for (const s of services) {
      if (lower.includes(s)) {
        return s.charAt(0).toUpperCase() + s.slice(1);
      }
    }

    return "Serviço geral";
  }

  // =========================
  // DETECTAR ORIGEM DO LEAD
  // =========================
  static detectOrigin(text: string) {

    const lower = text.toLowerCase();

    if (lower.includes("instagram")) return "instagram";
    if (lower.includes("facebook")) return "facebook";
    if (lower.includes("indicação") || lower.includes("indicou")) return "indicacao";

    return "outro";
  }

  // =========================
  // DETECTAR VALORES
  // =========================
  static extractBudget(text: string) {

  const lines = text.split("\n")

  let values: number[] = []

  lines.forEach(line => {

    const match = line.match(/(\d{2,5}[.,]?\d{0,2})/)

    if (match) {

      const value = parseFloat(
        match[1].replace(".", "").replace(",", ".")
      )

      if (value > 100 && value < 100000) {
        values.push(value)
      }

    }

  })

  if (!values.length) return null

  const total = values.reduce((a,b)=>a+b,0)

  return Math.round(total)
}

  // =========================
  // DETECTAR INTENÇÃO DE COMPRA
  // =========================
  static detectTemperature(text: string): LeadTemperature {

    const lower = text.toLowerCase();

    if (
      lower.includes("fechou") ||
      lower.includes("vou fazer") ||
      lower.includes("vamos fazer") ||
      lower.includes("pode fazer")
    ) {
      return "quente";
    }

    if (
      lower.includes("orçamento") ||
      lower.includes("quanto fica") ||
      lower.includes("valor")
    ) {
      return "morno";
    }

    return "frio";
  }

static detectBuyingSignals(text: string) {

  const lower = text.toLowerCase()

  const strongSignals = [
    "vou fazer",
    "vamos fazer",
    "fechou",
    "pode fazer",
    "pode instalar",
    "quando pode instalar",
    "manda a proposta",
    "vou fechar"
  ]

  const mediumSignals = [
    "orçamento",
    "quanto fica",
    "qual valor",
    "valor por metro",
    "tem financiamento"
  ]

  const weakSignals = [
    "como funciona",
    "estou vendo",
    "estou pesquisando"
  ]

  let score = 0

  strongSignals.forEach(s => {
    if (lower.includes(s)) score += 40
  })

  mediumSignals.forEach(s => {
    if (lower.includes(s)) score += 20
  })

  weakSignals.forEach(s => {
    if (lower.includes(s)) score += 5
  })

  return score
}

  static extractLastContact(text: string) {

  const match = text.match(
    /\[(\d{1,2}:\d{2}),\s*(\d{1,2}\/\d{1,2}\/\d{4})\]/
  )

  if (!match) return null

  return match[2]
}
  static extractNeighborhood(text: string){

  const bairros = [
    "deolinda",
    "estados unidos",
    "morada",
    "fabrício"
  ]

  const lower = text.toLowerCase()

  for(const b of bairros){

    if(lower.includes(b)){
      return b
    }

  }

  return null
}
  static detectAudioMessages(text: string){

  const audioPatterns = [
    "<media omitted>",
    "mensagem de voz",
    "audio omitted",
    "áudio",
    "audio"
  ]

  const lower = text.toLowerCase()

  for(const pattern of audioPatterns){
    if(lower.includes(pattern)){
      return true
    }
  }

  return false
}
  
   // =========================
// DETECTAR FASE DA NEGOCIAÇÃO
// =========================
static detectSalesStage(text: string){

  const lower = text.toLowerCase()

  if(
    lower.includes("fechou") ||
    lower.includes("vamos fazer") ||
    lower.includes("pode fazer") ||
    lower.includes("vou fechar")
  ){
    return "fechamento"
  }

  if(
    lower.includes("vou ver") ||
    lower.includes("te retorno") ||
    lower.includes("vou analisar")
  ){
    return "negociacao"
  }

  if(
    lower.includes("orçamento") ||
    lower.includes("quanto fica") ||
    lower.includes("qual valor")
  ){
    return "orcamento"
  }

  if(
    lower.includes("bom dia") ||
    lower.includes("boa tarde") ||
    lower.includes("preciso de")
  ){
    return "qualificacao"
  }

  return "contato"
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
  stage
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
    partes.push(`orçamento aproximado de R$ ${valor.toLocaleString("pt-BR")}`);
  }

  let resumo = partes.join(". ");

  if (resumo) {
    resumo += ".";
  }
  
  if(stage === "negociacao"){
  resumo += " Cliente avaliando proposta."
}

if(stage === "fechamento"){
  resumo += " Cliente demonstrou intenção de fechamento."
}

  if (hasAudio) {
    resumo += " Conversa contém mensagens de áudio que podem incluir mais detalhes.";
  }

  return resumo || "Lead gerado automaticamente a partir de conversa do WhatsApp.";
}

  // =========================
  // ANÁLISE PRINCIPAL
  // =========================
  static async analyzeConversation(text: string): Promise<AIAnalysisResult> {

  const clean = this.cleanConversation(text);

const ultimoContato = this.extractLastContact(text);
const bairro = this.extractNeighborhood(clean);

const nome = this.extractName(clean);
const telefone = this.extractPhone(clean);
const email = this.extractEmail(clean);
const endereco = this.extractAddress(clean);
const servico = this.detectService(clean);
const origem = this.detectOrigin(clean);

const hasAudio = this.detectAudioMessages(clean);

const buyingScore = this.detectBuyingSignals(clean);

const stage = this.detectSalesStage(clean)

const valor = this.extractBudget(clean);

  let temperatura: LeadTemperature = "frio";
  
  if(hasAudio && buyingScore >= 20){
  temperatura = "quente"
  }
  if (buyingScore >= 40) {
    temperatura = "quente";
  }
  else if (buyingScore >= 20) {
    temperatura = "morno";
  }

  let status: LeadStatus = "novo"

if(stage === "orcamento"){
  status = "atendimento"
}

if(valor){
  status = "orcado"
}

if(stage === "fechamento"){
  status = "orcado"
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
  stage
});

  return {
    nome,
    telefone,
    email,
    endereco,
    servico,
    origem,
    temperatura,
    status,
    risco: "baixo",
    orcamentoEnviado: !!valor,
    valorOrcado: valor,
    ultimoContato: ultimoContato
      ? new Date(ultimoContato.split("/").reverse().join("-")).toISOString()
      : new Date().toISOString(),
    resumo,
    proximaAcao: "Realizar contato para confirmação do serviço.",
    dataSugeridaFollowUp: new Date(Date.now() + 86400000)
      .toISOString()
      .split("T")[0]
  };
}

  // =========================
  // CONVERTER PARA LEAD
  // =========================
  static convertToLead(
    analysis: AIAnalysisResult,
    workspaceId: string
  ): Partial<Lead> {

    const leadBase: Partial<Lead> = {

      workspaceId,

      nome: analysis.nome || "Novo Lead",
      telefone: analysis.telefone || "",
      email: analysis.email || "",
      endereco: analysis.endereco || "",

      servico: analysis.servico || "Serviço",

      status: analysis.status,
      temperatura: analysis.temperatura,

      origem: (analysis.origem as any) || "outro",

      prazoCliente: "nao_definido",
      probabilidadeManual: 3,

      ultimoContato: analysis.ultimoContato || new Date().toISOString(),
      proximoContato: analysis.dataSugeridaFollowUp,

      orcamentoEnviado: analysis.orcamentoEnviado,
      valorOrcado: analysis.valorOrcado,

      resumo: analysis.resumo,
      observacoes: "Lead criado automaticamente via IA.",

      historico: [
        {
          id: crypto.randomUUID(),
          tipo: "ia_analysis",
          descricao: "Lead criado via análise de conversa.",
          createdAt: new Date().toISOString()
        }
      ]
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
    existingLeads: Lead[]
  ): Lead | null {

    return (
      existingLeads.find(l => {

        if (newLead.telefone && l.telefone) {

          const t1 = newLead.telefone.replace(/\D/g, "");
          const t2 = l.telefone.replace(/\D/g, "");

          if (t1 === t2 && t1.length > 6) return true;
        }

        if (newLead.nome && l.nome) {
          if (
            newLead.nome.toLowerCase().trim() ===
            l.nome.toLowerCase().trim()
          )
            return true;
        }

        return false;

      }) || null
    );
  }
}