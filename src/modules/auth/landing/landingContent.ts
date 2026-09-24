// Fonte única de verdade do CONTEÚDO da landing pública (a tela de auth).
// Os componentes em src/modules/auth/landing/ só cuidam de layout — toda copy,
// lista e constante comercial mora aqui, para iterar texto sem tocar em JSX.

// ─────────────────────────────────────────────────────────────────────────────
// COMERCIAL
// ─────────────────────────────────────────────────────────────────────────────

// WhatsApp COMERCIAL da Vértice (lead novo), separado de propósito do WhatsApp
// de SUPORTE em src/lib/support.ts — trocar aqui não afeta o atendimento a
// cliente existente. Provisório: hoje é o mesmo número, até o comercial existir.
export const SALES_WHATSAPP_NUMBER = '5534998049083';

// Provisório — ainda NÃO exibido na landing (a etapa de pricing vem depois).
export const PRICING = {
  basico: { nome: 'Básico', precoMensal: 147, disponivel: true },
  completo: {
    nome: 'Completo',
    precoMensal: 247,
    disponivel: false,
    recursos: ['NF-e', 'Estoque', 'Equipe'],
  },
} as const;

// A origem entra no texto da mensagem para rastrear qual CTA converteu.
export type WhatsappOrigem =
  | 'nav'
  | 'hero'
  | 'cta-final'
  | 'sem-acesso'
  | 'erro-init';

export function whatsappUrl(origem: WhatsappOrigem): string {
  const texto = `Olá! Vim pelo site do VRTX CRM (${origem}) e quero conhecer o sistema.`;
  return `https://wa.me/${SALES_WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}

// Um label só para todos os CTAs de conversão — nav, hero, card e banner.
export const CTA_WHATSAPP_LABEL = 'Falar com a equipe';

// Avisos mostrados na landing quando o login acontece mas o acesso não rola.
// As chaves são origens válidas de whatsappUrl(), então o banner rastreia o motivo.
export const accessNotice = {
  'sem-acesso':
    'Login feito, mas esta conta ainda não tem acesso ao VRTX. Fale com a equipe para liberar.',
  'erro-init':
    'Não conseguimos carregar seus dados agora. Tente novamente em instantes ou fale com a equipe.',
} as const;

export type AccessNoticeKind = keyof typeof accessNotice;

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DAS LISTAS
// ─────────────────────────────────────────────────────────────────────────────

export interface LandingLink {
  href: string;
  label: string;
}

export interface MockupStat {
  l: string;
  v: string;
  c: string;
}

export interface MockupLead {
  n: string;
  p: string;
  c: string;
  bc: string;
}

export interface LandingFeature {
  icon: string;
  title: string;
  desc: string;
  tag: string;
  hi?: boolean;
  iconBg: string;
  iconColor: string;
}

export interface LandingStep {
  n: string;
  t: string;
  d: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEÚDO
// ─────────────────────────────────────────────────────────────────────────────

export const nav = {
  brand: 'VRTX',
  brandSuffix: 'CRM',
  brandInitial: 'V',
  links: [
    { href: '#features', label: 'Funcionalidades' },
    { href: '#how', label: 'Como funciona' },
  ] as LandingLink[],
  // Login é caminho secundário: link de texto, não botão.
  ctaLogin: { href: '#acesso', label: 'Entrar' } as LandingLink,
};

export const hero = {
  badge: '✦ CRM com Inteligência Artificial integrada',
  titleLine1: 'O CRM inteligente para',
  titleHighlight: 'empresas que vendem serviços',
  subtitle:
    'Metalúrgicas, marcenarias e serralherias gerenciam leads, orçamentos e operação em um só lugar — com priorização automática por IA e PDFs profissionais com PIX.',
  // Primário é WhatsApp (href vem de whatsappUrl('hero')), por isso só o label.
  ctaSecondary: { href: '#features', label: 'Ver funcionalidades' } as LandingLink,
};

export const mockup = {
  url: 'vrtxcrm.com.br',
  sidebarItems: [
    '⊞ Dashboard',
    '👥 Leads',
    '📄 Orçamentos',
    '📅 Operacional',
    '💰 Financeiro',
    '✦ IA Assistente',
  ],
  title: 'Dashboard Executivo',
  subtitle: 'Receita prevista, foco do dia e saúde do CRM em tempo real',
  stats: [
    { l: 'Receita prevista', v: 'R$ 84.250', c: '#ff6a00' },
    { l: 'Leads críticos', v: '7', c: '#f87171' },
    { l: 'Tarefas hoje', v: '12', c: '#f4f5f7' },
    { l: 'Conversão', v: '28%', c: '#22c55e' },
  ] as MockupStat[],
  focusLabel: 'Foco hoje · 3 leads',
  leads: [
    { n: 'João Almeida — Portão automático', p: 'Crítico', c: '#ff6a00', bc: 'rgba(255,106,0,0.12)' },
    { n: 'Marcenaria Souza — Móveis sob medida', p: 'Médio', c: '#60a5fa', bc: 'rgba(96,165,250,0.12)' },
    { n: 'Construtora Lima — Estruturas metálicas', p: 'Baixo', c: '#7a7f8c', bc: '#1f2330' },
  ] as MockupLead[],
};

export const features = {
  eyebrow: 'Funcionalidades',
  title: 'Tudo que sua operação precisa, sem amarrar 5 ferramentas',
  subtitle:
    'De primeiro contato a recebimento — uma plataforma única, pensada para quem vende serviços de alto valor.',
  items: [
    { icon: '✦', title: 'Gestão de Leads com IA', desc: 'A IA analisa cada lead e atribui prioridade automática com base em valor, urgência e histórico de contato.', tag: '✦ Priorização automática', hi: true, iconBg: 'rgba(168,85,247,0.12)', iconColor: '#a855f7' },
    { icon: '📄', title: 'Orçamentos profissionais', desc: 'PDF com sua identidade visual, QR Code PIX integrado e assinatura digital.', tag: 'PDF · PIX · Assinatura', iconBg: 'rgba(255,106,0,0.12)', iconColor: '#ff6a00' },
    { icon: '📊', title: 'Dashboard executivo', desc: 'Receita prevista, foco do dia, saúde do CRM e conversão por etapa.', tag: 'Visão estratégica', iconBg: 'rgba(34,197,94,0.12)', iconColor: '#22c55e' },
    { icon: '📅', title: 'Painel operacional', desc: 'Agenda semanal e mensal, tarefas por prioridade, alertas de atraso.', tag: 'Agenda inteligente', iconBg: 'rgba(96,165,250,0.12)', iconColor: '#60a5fa' },
    { icon: '💰', title: 'Financeiro completo', desc: 'Receitas, despesas, contas a receber e resultado do mês com fluxo de caixa visual.', tag: 'Fluxo de caixa', iconBg: 'rgba(245,158,11,0.12)', iconColor: '#f59e0b' },
    { icon: '🏢', title: 'Multi-workspace', desc: 'Cada empresa com dados isolados: leads, financeiro, branding e documentos separados.', tag: 'Isolamento total', iconBg: 'rgba(248,113,113,0.12)', iconColor: '#f87171' },
  ] as LandingFeature[],
};

export const howItWorks = {
  eyebrow: 'Como funciona',
  title: 'Três passos até sua operação rodar no VRTX',
  steps: [
    { n: '1', t: 'Fale com a equipe', d: 'A gente entende sua operação e configura seu workspace: logo, dados PIX e o modelo de orçamento do seu jeito.' },
    { n: '2', t: 'Cadastre seus leads', d: 'Cadastro rápido de lead e orçamento. A IA já começa a priorizar por valor, urgência e histórico de contato.' },
    { n: '3', t: 'Gerencie tudo num só lugar', d: 'Leads, orçamentos, agenda, financeiro e equipe. Acompanhe o crescimento pelo dashboard executivo.' },
  ] as LandingStep[],
};

export const loginCta = {
  title: 'Pronto para parar de perder venda?',
  subtitle:
    'Acesso liberado para clientes VRTX. Ainda não é cliente? Fale com nossa equipe.',
  googleLabel: 'Entrar com Google',
  dividerLabel: 'Já é cliente?',
  legalPrefix: 'Ao continuar, você concorda com nossos',
  legalAnd: 'e',
  termsLabel: 'Termos de Uso',
  privacyLabel: 'Política de Privacidade',
  trust: ['🔒 SSL criptografado', '🏢 Dados isolados por workspace'],
};

export const footer = {
  brand: 'VRTX CRM',
  brandInitial: 'V',
  links: [
    { href: '#features', label: 'Funcionalidades' },
    { href: '#how', label: 'Como funciona' },
    // TODO: confirmar caixa antes de publicar
    // { href: 'mailto:contato@verticedigital.com.br', label: 'Contato' },
    { href: '/privacidade', label: 'Privacidade' },
    { href: '/termos', label: 'Termos' },
  ] as LandingLink[],
  copyright: '© 2026 VRTX · CRM Inteligente',
};

export const LEGAL_PATHS = {
  termos: '/termos',
  privacidade: '/privacidade',
} as const;
