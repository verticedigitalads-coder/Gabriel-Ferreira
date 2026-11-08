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
  | 'precos'
  | 'dock'
  | 'manifesto';

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

// Cartões ilustrativos do hero (HeroCards.tsx): só os 3 níveis que aparecem lá.
export type PrioridadeIlustrativa = 'critico' | 'alto' | 'medio';

export interface LeadIlustrativo {
  nome: string;
  servico: string;
  prioridade: PrioridadeIlustrativa;
}

export interface ItemIlustrativo {
  desc: string;
  valor: string;
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

// Cards da seção Três frentes (LandingFrentes.tsx). `chips` são rótulos reais do
// app; `fluxo` põe seta entre eles quando são etapas em sequência (status).
export interface FrenteItem {
  n: string;
  label: string;
  titulo: string;
  destaque: string;
  desc: string;
  chips: string[];
  fluxo?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVA SOCIAL
// ─────────────────────────────────────────────────────────────────────────────

// Clientes reais. As frases entram quando os clientes enviarem — até lá ficam
// vazias e a seção #clientes fica oculta pela guarda abaixo. A guarda olha a
// FRASE, não o tamanho do array: estes dois registros já existem e não podem ir
// ao ar com depoimento em branco.
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

// Só depoimento com frase preenchida aparece. Lista vazia = seção some.
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
  // Só links com seção de destino na página. Segmentos e Dúvidas entram na R4 do
  // redesign junto com as seções; Produto passa para #produto na R3.
  links: [
    { href: '#features', label: 'Produto' },
    { href: '#automacoes', label: 'Automações' },
    { href: '#precos', label: 'Preço' },
  ] as LandingLink[],
  // Login é caminho secundário: link de texto, não botão.
  ctaLogin: { href: '#acesso', label: 'Entrar' } as LandingLink,
};

export const hero = {
  // Linha de cima do hero. À direita o LandingHero mostra footer.local.
  meta: 'VRTX CRM — CRM para quem vende por orçamento',
  // Título em 4 linhas; titleWord e titleEnd saem em serif itálico.
  title1: 'O próximo',
  titleWord: 'orçamento',
  title2: 'pode ser o seu',
  title3: 'próximo grande',
  titleEnd: 'negócio.',
  subtitle:
    'Do primeiro contato ao PIX recebido. Orçamento em PDF com sua logo e lead priorizado automaticamente.',
  // No lugar de métricas: só fatos do produto.
  fatos: ['PDF com sua logo', 'QR Code PIX', 'Prioridade automática'],
  // Primário é WhatsApp (href vem de whatsappUrl('hero')), por isso só o label.
  // Embaixo do botão: ctaNota + footer.whatsappLabel.
  ctaNota: 'WhatsApp',
  ctaSecondary: {
    href: '#features',
    label: 'Ver funcionalidades',
  } as LandingLink,
};

// Cartões ILUSTRATIVOS do hero: dados fictícios, nomes genéricos e só campos que
// o app tem. Prioridade com os rótulos da lista de Leads (LeadsList.tsx); Cliente,
// Nº, itens, total e PIX como no PDF (templates/orcamento-v2.html). Sem métrica de
// resultado, sem total de pipeline, sem "visualizado".
export const heroCards = {
  selo: 'Ilustrativo',
  prioridades: {
    critico: 'Crítico',
    alto: 'Alto',
    medio: 'Médio',
  } as Record<PrioridadeIlustrativa, string>,
  leads: {
    titulo: 'Leads por prioridade',
    itens: [
      { nome: 'Cliente A', servico: 'Portão de correr', prioridade: 'critico' },
      { nome: 'Cliente B', servico: 'Móveis planejados', prioridade: 'alto' },
      { nome: 'Cliente C', servico: 'Forro de drywall', prioridade: 'medio' },
    ] as LeadIlustrativo[],
  },
  orcamento: {
    titulo: 'Orçamento',
    numero: 'Nº 0042',
    clienteLabel: 'Cliente',
    cliente: 'Cliente A',
    itens: [
      { desc: 'Portão de correr', valor: 'R$ 4.800,00' },
      { desc: 'Motor do portão', valor: 'R$ 1.650,00' },
      { desc: 'Instalação', valor: 'R$ 550,00' },
    ] as ItemIlustrativo[],
    totalLabel: 'Total',
    total: 'R$ 7.000,00',
    pix: 'PIX no PDF',
  },
};

// Faixa laranja logo abaixo do hero (rolagem em CSS no LandingFaixa.tsx).
export const faixa = {
  itens: ['Serralheria', 'Marcenaria', 'Metalúrgica', 'Drywall', 'Vidraçaria', 'Esquadrias'],
};

// Barra fixa do celular (LandingDock.tsx): kicker + footer.whatsappLabel à esquerda
// e CTA_WHATSAPP_LABEL no botão. Curto de propósito para caber a 320px.
export const dock = {
  kicker: 'WhatsApp',
};

// Seção clara "O problema real" (LandingProblema.tsx), logo depois da faixa. Sem
// o card de "custo invisível" da referência: nenhum número de resultado aqui.
export const problema = {
  eyebrow: 'O problema real',
  // Título em 4 pedaços: tituloDestaque sai em serif itálico e tituloApagado em
  // tinta mais clara.
  titulo1: 'Vender por orçamento é uma',
  tituloDestaque: 'operação.',
  tituloApagado: 'Não uma pasta de',
  tituloFim: 'orçamentos no WhatsApp.',
  antesLabel: 'Antes',
  antes: [
    'Cliente anotado no caderno',
    'Orçamento perdido no WhatsApp',
    'Follow-up de memória',
    'Recebimento sem controle',
  ],
  comLabel: 'Com o VRTX',
  com: [
    'Cada cliente num lugar só',
    'Orçamento em PDF com a sua marca',
    'Quem esfriou aparece primeiro',
    'Contas a receber organizadas',
  ],
};

// Interlúdio com foto (LandingInterludio.tsx). Botão: CTA_WHATSAPP_LABEL com
// whatsappUrl('manifesto'); embaixo, hero.ctaNota + footer.whatsappLabel, igual
// ao hero. `destaque` sai em laranja e sublinhado. A foto é decorativa (alt
// vazio): forja com faíscas, gerada por IA (1248x832).
export const interludio = {
  foto: '/landing/forge.webp',
  linha1: 'A obra não espera.',
  linha2: 'A venda',
  destaque: 'também não',
  fim: '.',
};

// Os depoimentos (LandingDepoimentos.tsx) usam TESTIMONIALS_VISIVEIS e `clientes`.

// Três frentes (LandingFrentes.tsx, id="features"). Título e subtítulo vêm do
// bloco de funcionalidades anterior; as descrições, de frases que já estavam na
// página (funcionalidades e legenda do celular). Rótulos dos chips conferidos no
// app: prioridade em LeadsList.tsx, status em operacional/statusConfig.ts.
export const frentes = {
  eyebrow: 'Funcionalidades',
  titulo: 'Tudo que sua operação precisa,',
  tituloDestaque: 'sem amarrar 5 ferramentas.',
  subtitulo:
    'De primeiro contato a recebimento — uma plataforma única, pensada para quem vende serviços de alto valor.',
  items: [
    {
      n: '01',
      label: 'Leads',
      titulo: 'Leads com',
      destaque: 'prioridade automática.',
      desc: 'O sistema classifica cada lead em crítico, alto, médio ou baixo com base no valor, no tempo sem contato e no estágio do orçamento. Quem está esfriando aparece primeiro na lista.',
      chips: ['Crítico', 'Alto', 'Médio', 'Baixo'],
    },
    {
      n: '02',
      label: 'Orçamentos',
      titulo: 'Orçamento em PDF com',
      destaque: 'logo, PIX e assinatura.',
      desc: 'PDF com sua logo e seus dados, QR Code PIX para o cliente pagar e assinatura digital.',
      chips: ['Logo', 'PIX', 'Assinatura'],
    },
    {
      n: '03',
      label: 'Operacional',
      titulo: 'Agenda e status de',
      destaque: 'cada serviço.',
      desc: 'Agenda semanal e mensal, com tarefas por prioridade. Atualize o serviço direto da obra: em produção, pronto, instalado.',
      chips: ['Pendente', 'Em produção', 'Pronto', 'Instalado'],
      fluxo: true,
    },
  ] as FrenteItem[],
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
  // Antes da data real de TESTIMONIALS[].desde, na legenda do depoimento.
  desdeLabel: 'cliente desde',
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
