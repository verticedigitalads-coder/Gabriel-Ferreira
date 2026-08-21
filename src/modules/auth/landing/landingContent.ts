// Fonte única de verdade do CONTEÚDO da landing pública (a tela de auth).
// Os componentes em src/modules/auth/landing/ só cuidam de layout — toda copy,
// lista e constante comercial mora aqui, para iterar texto sem tocar em JSX.
import { SUPPORT_WHATSAPP_NUMBER } from '@/lib/support';

// ─────────────────────────────────────────────────────────────────────────────
// COMERCIAL
// ─────────────────────────────────────────────────────────────────────────────

// TODO(Gabriel): trocar pelo WhatsApp COMERCIAL quando existir. Hoje aponta para
// o mesmo número do suporte (src/lib/support.ts) — assim o CTA nunca fica quebrado.
export const SALES_WHATSAPP_NUMBER = String(SUPPORT_WHATSAPP_NUMBER);

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
export type WhatsappOrigem = 'nav' | 'hero' | 'cta-final' | 'sem-acesso';

export function whatsappUrl(origem: WhatsappOrigem): string {
  const texto = `Olá! Vim pelo site do VRTX CRM (${origem}) e quero conhecer o sistema.`;
  return `https://wa.me/${SALES_WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DAS LISTAS
// ─────────────────────────────────────────────────────────────────────────────

export interface LandingLink {
  href: string;
  label: string;
}

export interface HeroStat {
  v: string;
  l: string;
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

export interface LandingTestimonial {
  q: string;
  n: string;
  r: string;
  i: string;
  g: string;
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
    { href: '#testi', label: 'Depoimentos' },
  ] as LandingLink[],
  cta: { href: '#login', label: 'Acessar CRM' } as LandingLink,
};

export const hero = {
  badge: '✦ CRM com Inteligência Artificial integrada',
  titleLine1: 'O CRM inteligente para',
  titleHighlight: 'empresas que vendem serviços',
  subtitle:
    'Metalúrgicas, marcenarias e serralherias gerenciam leads, orçamentos e operação em um só lugar — com priorização automática por IA e PDFs profissionais com PIX.',
  ctaPrimary: { href: '#login', label: 'Começar agora — Grátis →' } as LandingLink,
  ctaSecondary: { href: '#features', label: 'Ver funcionalidades' } as LandingLink,
  stats: [
    { v: 'R$ 2M+', l: 'em orçamentos gerenciados' },
    { v: '500+', l: 'leads acompanhados' },
    { v: '98%', l: 'de uptime' },
  ] as HeroStat[],
};

export const mockup = {
  url: 'vertice-digital-crm.vercel.app',
  liveLabel: 'Ao vivo',
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
  title: 'Do cadastro ao primeiro orçamento em menos de 10 minutos',
  steps: [
    { n: '1', t: 'Cadastre sua empresa', d: 'Entre com Google, configure logo, dados PIX e modelo de orçamento. Tudo pronto em poucos cliques.' },
    { n: '2', t: 'Importe ou crie seus leads', d: 'Cadastro manual rápido, importação em lote ou captura via formulário. A IA já começa a priorizar.' },
    { n: '3', t: 'Gerencie tudo num só lugar', d: 'Leads, orçamentos, agenda, financeiro e equipe. Acompanhe o crescimento pelo dashboard executivo.' },
  ] as LandingStep[],
};

export const testimonials = {
  eyebrow: 'O que dizem',
  title: 'Empresas que pararam de perder lead em planilha',
  items: [
    { q: '"Antes eu perdia 3-4 orçamentos por semana esquecidos no WhatsApp. Em 2 meses de VRTX, fechei 32% mais."', n: 'Rafael Marques', r: 'Sócio · Marquemetal Serralheria', i: 'RM', g: 'linear-gradient(135deg,#ff6a00,#ff9a5c)' },
    { q: '"O PDF do orçamento com QR Code PIX virou nosso diferencial. Cliente recebe, vê o valor e paga ali mesmo."', n: 'Carla Lima', r: 'Diretora · Marcenaria Lima & Filhos', i: 'CL', g: 'linear-gradient(135deg,#6366f1,#a78bfa)' },
    { q: '"Tenho 3 empresas e cada uma com workspace separado. Acabou a confusão de relatórios misturados."', n: 'João Pereira', r: 'CEO · Grupo Pereira Indústria', i: 'JP', g: 'linear-gradient(135deg,#22c55e,#86efac)' },
  ] as LandingTestimonial[],
};

export const loginCta = {
  badge: '⚡ Comece grátis · Sem cartão',
  title: 'Pronto para parar de perder venda?',
  subtitle:
    'Entre com sua conta Google, crie seu workspace em segundos e teste todas as funcionalidades.',
  googleLabel: 'Entrar com Google',
  dividerLabel: 'ou',
  salesEmail: 'contato@verticedigital.com.br',
  salesLabel: '✉️ Falar com vendas',
  legalPrefix: 'Ao continuar, você concorda com nossos',
  legalAnd: 'e',
  termsLabel: 'Termos de Uso',
  privacyLabel: 'Política de Privacidade',
  trust: ['🔒 SSL criptografado', '💾 Backup diário', '🛡️ LGPD compliant'],
};

export const footer = {
  brand: 'VRTX CRM',
  brandInitial: 'V',
  links: [
    { href: '#features', label: 'Funcionalidades' },
    { href: '#how', label: 'Como funciona' },
    { href: '#testi', label: 'Depoimentos' },
    { href: '/privacidade', label: 'Privacidade' },
    { href: '/termos', label: 'Termos' },
  ] as LandingLink[],
  copyright: '© 2026 VRTX · CRM Inteligente',
};

export const LEGAL_PATHS = {
  termos: '/termos',
  privacidade: '/privacidade',
} as const;
