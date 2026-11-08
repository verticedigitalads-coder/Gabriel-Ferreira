// Fonte única de verdade do CONTEÚDO da landing pública (a tela de auth).
// Os componentes em src/modules/auth/landing/ só cuidam de layout — toda copy,
// lista e constante comercial mora aqui, para iterar texto sem tocar em JSX.

// ─────────────────────────────────────────────────────────────────────────────
// COMERCIAL
// ─────────────────────────────────────────────────────────────────────────────

// WhatsApp COMERCIAL da Vértice (lead novo). Hoje suporte e comercial usam o
// mesmo número, mas as constantes continuam separadas de propósito — trocar
// este aqui não afeta o atendimento a cliente existente em src/lib/support.ts.
export const SALES_WHATSAPP_NUMBER = '5534988501702';

// Exibido na landing (#precos): só o Básico. O Completo NÃO é exibido; fica aqui
// como registro do plano futuro.
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
  | 'erro-init'
  | 'rodape'
  | 'precos';

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

// Chave do ícone; o componente (LandingFeatures.tsx) mapeia chave → ícone lucide,
// para este arquivo seguir sem import de React.
export type FeatureIconKey =
  | 'leads'
  | 'orcamentos'
  | 'dashboard'
  | 'operacional'
  | 'financeiro'
  | 'workspace';

export interface LandingFeature {
  icon: FeatureIconKey;
  title: string;
  desc: string;
  tag: string;
  hi?: boolean;
}

export interface LandingStep {
  n: string;
  t: string;
  d: string;
}

export interface AutomacaoItem {
  quando: string;
  vrtx: string;
}

export interface CelularItem {
  id: 'operacional' | 'lead' | 'orcamentos';
  src: string;
  alt: string;
  legenda: string;
}

export interface Testimonial {
  empresa: string;
  nicho: string;
  cidade: string;
  desde: string;
  frase: string;
  metrica?: string;
  autor?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVA SOCIAL
// ─────────────────────────────────────────────────────────────────────────────

// Clientes reais. As frases entram quando os clientes enviarem — até lá ficam
// vazias e a seção #clientes (e o link "Clientes" do nav) fica oculta pela guarda
// abaixo. A guarda olha a FRASE, não o tamanho do array: estes dois registros já
// existem e não podem ir ao ar com depoimento em branco.
export const TESTIMONIALS: Testimonial[] = [
  {
    empresa: 'FL Art Metal',
    nicho: 'Metalúrgica',
    cidade: 'Uberaba/MG',
    desde: 'fev/2026',
    frase:
      'Antes eu controlava os orçamentos no caderno. Hoje tenho orçamento e cadastro de cliente num lugar só, e o orçamento chega ao cliente bem explicado e profissional. Isso trouxe credibilidade com os clientes.',
    autor: 'Fabrício Lima',
  },
  {
    empresa: 'Ítalo Colares Drywall',
    nicho: 'Drywall',
    cidade: 'Uberaba/MG',
    desde: 'jun/2026',
    frase:
      'Eu fazia meus orçamentos num modelo que montei na internet. Pedi para o VRTX sair com a minha logo e do jeito da minha empresa, e fui atendido. Hoje mando orçamento profissional direto pelo sistema.',
    autor: 'Ítalo Colares',
  },
];

// Só depoimento com frase preenchida aparece. Lista vazia = seção e link somem.
export const TESTIMONIALS_VISIVEIS = TESTIMONIALS.filter(
  (t) => t.frase.trim() !== '',
);

// ─────────────────────────────────────────────────────────────────────────────
// CONTEÚDO
// ─────────────────────────────────────────────────────────────────────────────

export const nav = {
  brand: 'VRTX',
  brandSuffix: 'CRM',
  brandInitial: 'V',
  links: [
    // Mesma guarda da seção: sem depoimento visível, o link não aparece.
    ...(TESTIMONIALS_VISIVEIS.length
      ? [{ href: '#clientes', label: 'Clientes' }]
      : []),
    { href: '#features', label: 'Funcionalidades' },
    { href: '#how', label: 'Como funciona' },
    { href: '#precos', label: 'Preços' },
  ] as LandingLink[],
  // Login é caminho secundário: link de texto, não botão.
  ctaLogin: { href: '#acesso', label: 'Entrar' } as LandingLink,
};

export const hero = {
  badge: 'Serralheria · Marcenaria · Metalúrgica · Drywall',
  titleLine1: 'O CRM de quem vende',
  titleHighlight: 'por orçamento',
  // Duas linhas no desktop: o <br> do LandingHero está casado com este texto
  // exato (e com o maxWidth 720). Mudou a copy? Revise a quebra.
  subtitleLine1: 'Do primeiro contato ao PIX recebido.',
  subtitleLine2:
    'Orçamento em PDF com sua logo e lead priorizado automaticamente.',
  // Primário é WhatsApp (href vem de whatsappUrl('hero')), por isso só o label.
  ctaSecondary: {
    href: '#features',
    label: 'Ver funcionalidades',
  } as LandingLink,
};

export const mockup = {
  url: 'vrtxcrm.com.br',
  sidebarItems: [
    '⊞ Dashboard',
    '👥 Leads',
    '📄 Orçamentos',
    '📅 Operacional',
    '💰 Financeiro',
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
    {
      n: 'João Almeida — Portão automático',
      p: 'Crítico',
      c: '#ff6a00',
      bc: 'rgba(255,106,0,0.12)',
    },
    {
      n: 'Marcenaria Souza — Móveis sob medida',
      p: 'Médio',
      c: '#60a5fa',
      bc: 'rgba(96,165,250,0.12)',
    },
    {
      n: 'Construtora Lima — Estruturas metálicas',
      p: 'Baixo',
      c: '#7a7f8c',
      bc: '#1f2330',
    },
  ] as MockupLead[],
};

export const features = {
  eyebrow: 'Funcionalidades',
  title: 'Tudo que sua operação precisa, sem amarrar 5 ferramentas',
  subtitle:
    'De primeiro contato a recebimento — uma plataforma única, pensada para quem vende serviços de alto valor.',
  items: [
    {
      icon: 'leads',
      title: 'Gestão de Leads com priorização automática',
      desc: 'O sistema classifica cada lead em crítico, alto, médio ou baixo com base no valor, no tempo sem contato e no estágio do orçamento. Quem está esfriando aparece primeiro na lista.',
      tag: 'Priorização automática',
      hi: true,
    },
    {
      icon: 'orcamentos',
      title: 'Orçamentos profissionais',
      desc: 'PDF com sua identidade visual, QR Code PIX integrado e assinatura digital.',
      tag: 'PDF · PIX · Assinatura',
    },
    {
      icon: 'dashboard',
      title: 'Dashboard executivo',
      desc: 'Receita prevista, foco do dia e saúde do CRM.',
      tag: 'Visão estratégica',
    },
    {
      icon: 'operacional',
      title: 'Painel operacional',
      desc: 'Agenda semanal e mensal, tarefas por prioridade, alertas de atraso.',
      tag: 'Agenda semanal e mensal',
    },
    {
      icon: 'financeiro',
      title: 'Financeiro completo',
      desc: 'Receitas, despesas, contas a receber e resultado do mês com fluxo de caixa visual.',
      tag: 'Fluxo de caixa',
    },
    {
      icon: 'workspace',
      title: 'Multi-workspace',
      desc: 'Cada empresa com dados isolados: leads, financeiro, branding e documentos separados.',
      tag: 'Isolamento total',
    },
  ] as LandingFeature[],
};

// Só automação ATIVA e validada (_build/automacoes-reais.md: F1, F2, F7, F10,
// reconferidas no código). Tudo dispara a partir de uma ação do usuário no app.
export const automacoes = {
  eyebrow: 'Automações',
  title: 'Você faz o principal, o VRTX cuida do resto',
  subtitle: 'Ações que o sistema faz sozinho a partir do que você registra.',
  quandoLabel: 'Quando você',
  vrtxLabel: 'O VRTX',
  items: [
    {
      quando: 'cadastra um lead novo',
      vrtx: 'Cria a tarefa de hoje no Operacional: lead quente vira “Criar orçamento”, morno vira “Entrar em contato” e frio vira “Reativar lead”.',
    },
    {
      quando: 'fecha um negócio',
      vrtx: 'Cria a tarefa “Executar serviço” no Operacional. Se já houver uma aberta para esse cliente, não cria outra.',
    },
    {
      quando: 'aprova um orçamento',
      vrtx: 'Gera o recibo como pendente, com os mesmos itens e o valor total. Falta só emitir.',
    },
    {
      quando: 'marca uma conta a receber como recebida',
      vrtx: 'Lança a receita no Financeiro, com o mesmo valor e a data de hoje.',
    },
  ] as AutomacaoItem[],
};

// Telas reais do app no celular (public/landing/*.webp, 780x1691). A ordem do
// array é a ordem de leitura e do carrossel no mobile; no desktop o CSS
// (landingStyles.tsx) coloca o Operacional no centro. `pwa` só vale enquanto o
// manifesto PWA estiver ativo em vite.config.ts.
export const celular = {
  eyebrow: 'No celular',
  title: 'Sua operação no bolso, até dentro da obra',
  pwa: 'Funciona como aplicativo, sem baixar da loja.',
  items: [
    {
      id: 'operacional',
      src: '/landing/mobile-operacional.webp',
      alt: 'Tela do Painel Operacional no celular: tarefa “Instalar grades” com os status Pendente, Em produção, Pronto e Instalado para marcar.',
      legenda: 'Atualize o serviço direto da obra: em produção, pronto, instalado.',
    },
    {
      id: 'lead',
      src: '/landing/mobile-lead.webp',
      alt: 'Tela de detalhes de um lead no celular, com os botões Registrar Contato, WhatsApp, Marcar Visita, Marcar Orçado e Fechar Negócio.',
      legenda: 'Registre o contato e chame o cliente no WhatsApp com um toque.',
    },
    {
      id: 'orcamentos',
      src: '/landing/mobile-orcamentos.webp',
      alt: 'Tela de Orçamentos no celular: lista de orçamentos com valor, status e os botões PDF e PIX em cada um.',
      legenda: 'Gere o orçamento em PDF com PIX pelo celular.',
    },
  ] as CelularItem[],
};

export const howItWorks = {
  eyebrow: 'Como funciona',
  title: 'Três passos até sua operação rodar no VRTX',
  steps: [
    {
      n: '1',
      t: 'Fale com a equipe',
      d: 'A gente entende sua operação e configura seu workspace: logo, dados PIX e o modelo de orçamento do seu jeito.',
    },
    {
      n: '2',
      t: 'Cadastre seus leads',
      d: 'Cadastro rápido de lead e orçamento. O sistema já começa a priorizar por valor, tempo sem contato e estágio do orçamento.',
    },
    {
      n: '3',
      t: 'Time usando no mesmo dia',
      d: 'Suporte humano, direto no WhatsApp. E dentro do sistema tem uma central de ajuda que responde dúvida na hora, sem abrir chamado.',
    },
  ] as LandingStep[],
};

// Só módulos VISÍVEIS no menu (Sidebar.tsx; WhatsApp e Notas ocultos por flag).
// Estoque fica de fora até decidir o conflito com PRICING.completo.recursos.
// O valor vem de PRICING.basico.precoMensal — não repetir o número aqui.
export const precos = {
  eyebrow: 'Preços',
  title: 'Quanto custa o VRTX',
  moeda: 'R$',
  periodo: '/mês por empresa',
  incluiTitulo: 'O que está incluso',
  inclui: [
    'Leads e Kanban com prioridade automática',
    'Orçamentos em PDF com sua logo, QR Code PIX e assinatura do cliente',
    'Recibos com numeração automática',
    'Financeiro e contas a receber',
    'Agenda de tarefas e visitas no Operacional',
    'Dashboard com receita prevista e foco do dia',
    'Fornecedores, com preenchimento pelo CNPJ',
    'Suporte no WhatsApp e central de ajuda dentro do sistema',
  ],
};

// Copy provisória — a seção só aparece quando houver depoimento com frase.
export const clientes = {
  eyebrow: 'Clientes',
  title: 'Quem já vende com o VRTX',
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
    { href: '#precos', label: 'Preços' },
    // TODO: confirmar caixa antes de publicar
    // { href: 'mailto:contato@verticedigital.com.br', label: 'Contato' },
    { href: '/privacidade', label: 'Privacidade' },
    { href: '/termos', label: 'Termos' },
  ] as LandingLink[],
  copyright: '© 2026 VRTX CRM · Vértice Digital',
  local: 'Vértice Digital · Uberaba/MG',
  // CNPJ: entra aqui (e numa linha abaixo de `local` no LandingFooter) quando existir.
  // Exibição derivada de SALES_WHATSAPP_NUMBER ('55' + DDD + número) — trocar o
  // número lá atualiza aqui.
  whatsappLabel: `(${SALES_WHATSAPP_NUMBER.slice(2, 4)}) ${SALES_WHATSAPP_NUMBER.slice(4, 9)}-${SALES_WHATSAPP_NUMBER.slice(9)}`,
};

export const LEGAL_PATHS = {
  termos: '/termos',
  privacidade: '/privacidade',
} as const;
