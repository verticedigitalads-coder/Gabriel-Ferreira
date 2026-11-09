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
  | 'manifesto'
  | 'faq'
  | 'form';

export function whatsappUrl(origem: WhatsappOrigem): string {
  const texto = `Olá! Vim pelo site do VRTX CRM (${origem}) e quero conhecer o sistema.`;
  return `https://wa.me/${SALES_WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}

// Formulário "Falar com a equipe" (LandingContato.tsx). Segmentos e limites se
// repetem em server.js (POST /api/landing/contato), que é quem decide: o backend
// é JS solto e não importa este arquivo. Mudou aqui, muda lá.
export const CONTATO_SEGMENTOS: string[] = [
  'Serralheria',
  'Marcenaria',
  'Metalúrgica',
  'Drywall/Gesso',
  'Vidraçaria/Esquadrias',
  'Outro',
];

export const CONTATO_LIMITES = { nome: 80, empresa: 80, whatsapp: 20, email: 120 } as const;

export interface ContatoCampos {
  nome: string;
  empresa: string;
  whatsapp: string;
  email: string;
  segmento: string;
}

// Mensagem do WhatsApp depois do formulário, montada a partir dos campos.
export function whatsappContatoUrl(c: ContatoCampos): string {
  const texto = `Olá! Sou ${c.nome}, da ${c.empresa} (${c.segmento}). Vim pelo site do VRTX CRM e quero conhecer o sistema.`;
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

// Abas da seção Produto (LandingProduto.tsx). O número 01, 02... sai da posição no
// array: uma aba nova entra com 1 item aqui, sem mexer no JSX.
export interface ProdutoAba {
  id: string;
  label: string;
  src: string;
  alt: string;
  frase: string;
}

// Segmentos (LandingSegmentos.tsx). `foto` é opcional: sem ela, o painel do
// desktop mostra só o nome sobre o fundo escuro.
export interface SegmentoItem {
  nome: string;
  frase: string;
  foto?: string;
}

// Perguntas da seção Dúvidas (LandingDuvidas.tsx).
export interface DuvidaItem {
  pergunta: string;
  resposta: string;
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
  // Só links com seção de destino na página, na ordem em que as seções aparecem.
  // O rodapé (LandingFooter.tsx) usa esta mesma lista.
  links: [
    { href: '#produto', label: 'Produto' },
    { href: '#automacoes', label: 'Automações' },
    { href: '#segmentos', label: 'Segmentos' },
    { href: '#precos', label: 'Preço' },
    { href: '#duvidas', label: 'Dúvidas' },
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

// Produto em abas (LandingProduto.tsx, id="produto"). Prints reais do desktop
// (public/landing/desk-*.webp), sem o menu lateral, com dados de demonstração do
// workspace Vértice: por isso a `nota` na barra do navegador. Todos os prints têm
// o mesmo corte, então largura/altura valem para todos.
export const produto = {
  eyebrow: 'Produto',
  titulo: 'O VRTX',
  destaque: 'por dentro.',
  abasLabel: 'Telas do VRTX',
  url: 'vrtxcrm.com.br',
  nota: 'dados de demonstração',
  largura: 1600,
  altura: 1216,
  abas: [
    {
      id: 'leads',
      label: 'Leads',
      src: '/landing/desk-leads.webp',
      alt: 'Tela do Kanban de leads no computador: colunas Novo, Em Atendimento, Orçado e Fechado, com cards de clientes, prioridade, valor e botão de WhatsApp.',
      frase: 'Cada cliente numa coluna, do primeiro contato ao fechamento. Arraste o card e o status muda.',
    },
    {
      id: 'orcamentos',
      label: 'Orçamentos',
      src: '/landing/desk-orcamentos.webp',
      alt: 'Tela de Orçamentos no computador: lista com cliente, status Aprovado ou Enviado, valor, quantidade de itens e os botões de PDF e PIX em cada orçamento.',
      frase: 'Todos os orçamentos num lugar, com status, valor e PDF com PIX a um clique.',
    },
    {
      id: 'operacional',
      label: 'Operacional',
      src: '/landing/desk-operacional.webp',
      alt: 'Tela do Painel Operacional no computador: tarefas atrasadas e de hoje, cada uma com os status Pendente, Em produção, Pronto e Instalado.',
      frase: 'O que está atrasado, o que é para hoje e o andamento de cada serviço.',
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      src: '/landing/desk-financeiro.webp',
      alt: 'Tela do Financeiro no computador: cards de receitas do mês, a pagar, vencidas e resultado, o resultado do mês e a lista de lançamentos, com as despesas marcadas como pagas.',
      frase: 'Receitas, despesas e o resultado do mês numa tela só.',
    },
  ] as ProdutoAba[],
};

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
  // titleDestaque sai em serif itálico, logo depois de title.
  title: 'Você faz o principal,',
  titleDestaque: 'o VRTX cuida do resto',
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
  // titleDestaque sai em serif itálico, logo depois de title.
  title: 'Sua operação no bolso,',
  titleDestaque: 'até dentro da obra',
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

// Segmentos (LandingSegmentos.tsx, id="segmentos"). O número 01, 02... sai da
// posição no array. `foto` é opcional e decorativa (alt vazio), e só aparece a
// partir de 1024px. Para pôr foto num segmento: salve o webp em public/landing/
// (paisagem, ~1248x832, até 150 KB) e preencha `foto` aqui, sem mexer no JSX.
// Fotos geradas por IA: workshop (galpão com perfis), forge (a mesma do interlúdio),
// marcenaria (fresadora CNC) e drywall (operário parafusando a placa). As duas
// últimas são retrato: o painel é quadrado e o object-fit:cover centrado já
// enquadra o assunto, então não há campo de posição.
export const segmentos = {
  eyebrow: 'Segmentos',
  // titulo + destaque (serif laranja).
  titulo: 'Para quem vende',
  destaque: 'por orçamento.',
  nota: 'Também atende vidraçarias, esquadrias e serviços sob medida.',
  items: [
    {
      nome: 'Serralherias',
      frase: 'Portão, grade e guarda-corpo: cliente, orçamento e andamento do serviço no mesmo lugar.',
      foto: '/landing/workshop.webp',
    },
    {
      nome: 'Marcenarias',
      frase: 'Móveis planejados e projetos sob medida, com orçamento em PDF saindo com a sua marca.',
      foto: '/landing/marcenaria.webp',
    },
    {
      nome: 'Metalúrgicas',
      frase: 'Estruturas e peças por encomenda, do orçamento aprovado ao recibo.',
      foto: '/landing/forge.webp',
    },
    {
      nome: 'Drywall & Gesso',
      frase: 'Forro, parede e divisória, com visitas e obras na agenda do Operacional.',
      foto: '/landing/drywall.webp',
    },
  ] as SegmentoItem[],
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
  // titleDestaque sai em serif laranja, logo depois de title.
  title: 'Quanto custa',
  titleDestaque: 'o VRTX',
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
  // Termos de Uso §5 (cancelar a assinatura a qualquer momento) e §5.1 (garantia
  // de 7 dias). Não usar "sem fidelidade": não é o que os Termos dizem.
  selos: ['Garantia de 7 dias', 'Cancele quando quiser'],
};

// Dúvidas (LandingDuvidas.tsx, id="duvidas"). O número 01, 02... sai da posição
// no array. Respostas conferidas: importação de leads por CSV em Settings.tsx; a
// última pergunta tem o texto aprovado, com base nos Termos §5 e §5.1. O CTA abre
// whatsappUrl('faq').
export const duvidas = {
  eyebrow: 'Dúvidas',
  // titulo + destaque (serif laranja).
  titulo: 'Perguntas',
  destaque: 'frequentes.',
  ctaTexto: 'Não achou sua pergunta?',
  ctaLabel: 'Conversar com a equipe',
  items: [
    {
      pergunta: 'Serve só para serralheria?',
      resposta:
        'Não. Foi feito para quem vende por orçamento: serralheria, marcenaria, metalúrgica, drywall, vidraçaria, esquadrias e serviços sob medida.',
    },
    {
      pergunta: 'O orçamento sai com a minha marca?',
      resposta:
        'Sim. PDF com sua logo, seus dados e, se quiser, o QR Code PIX para o cliente pagar.',
    },
    {
      pergunta: 'Preciso abandonar o WhatsApp?',
      resposta:
        'Não. Você continua conversando pelo WhatsApp; o VRTX guarda o cliente, o orçamento e o próximo contato para nada se perder.',
    },
    {
      pergunta: 'Funciona no celular?',
      resposta:
        'Sim. Abre no navegador do celular e pode ser instalado como aplicativo, sem baixar da loja.',
    },
    {
      pergunta: 'Consigo trazer meus clientes de uma planilha?',
      resposta:
        'Sim, dá para importar leads por planilha (CSV). A equipe ajuda na configuração inicial.',
    },
    {
      pergunta: 'Como começo?',
      resposta:
        'Fala com a equipe no WhatsApp. A gente configura seu acesso, sua logo e seus dados de PIX.',
    },
    {
      pergunta: 'Meus dados ficam separados dos outros clientes?',
      resposta:
        'Sim. Cada empresa tem seu espaço isolado e a conexão é criptografada.',
    },
    {
      pergunta: 'Posso cancelar? Tem garantia?',
      resposta:
        'Pode cancelar quando quiser; o acesso continua até o fim do mês já pago. Nos primeiros 7 dias da assinatura, se não servir, você pede e recebe o valor de volta.',
    },
  ] as DuvidaItem[],
};

// Copy provisória — a seção só aparece quando houver depoimento com frase.
export const clientes = {
  eyebrow: 'Clientes',
  title: 'Quem já vende com o VRTX',
  // Antes da data real de TESTIMONIALS[].desde, na legenda do depoimento.
  desdeLabel: 'cliente desde',
};

// Fechamento + login (LandingLoginCta.tsx). À esquerda o título (titleDestaque em
// serif laranja) e o CTA whatsappUrl('cta-final'); à direita o card #acesso
// (acessoTitulo, acessoTexto, Google, linha legal e trust).
export const loginCta = {
  title: 'O próximo grande negócio já está no seu',
  titleDestaque: 'pipeline.',
  acessoTitulo: 'Já é cliente?',
  acessoTexto: 'Acesso liberado para clientes VRTX.',
  googleLabel: 'Entrar com Google',
  legalPrefix: 'Ao continuar, você concorda com nossos',
  legalAnd: 'e',
  termsLabel: 'Termos de Uso',
  privacyLabel: 'Política de Privacidade',
  trust: ['SSL criptografado', 'Dados isolados por workspace'],
};

// Rodapé (LandingFooter.tsx). Os links de navegação são os mesmos do nav
// (nav.links); o wordmark usa nav.brand + nav.brandSuffix. Os hrefs de
// Privacidade e Termos vêm de LEGAL_PATHS, no componente.
export const footer = {
  // TODO: confirmar caixa antes de publicar
  // { href: 'mailto:contato@verticedigital.com.br', label: 'Contato' },
  privacidadeLabel: 'Privacidade',
  termosLabel: 'Termos',
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

// Painel do formulário (LandingContato.tsx), aberto por todo CTA "Falar com a
// equipe". O envio grava o lead e a página segue para o WhatsApp na mesma aba.
// Nunca "enviado/recebido": no sucesso só `abrindo`; se a gravação falhar ou
// demorar, só `avisoFalha`, e o WhatsApp abre do mesmo jeito.
export const contato = {
  eyebrow: 'Falar com a equipe',
  titulo: 'Conta um pouco da sua',
  destaque: 'empresa.',
  texto:
    'Preencha os dados e siga para o WhatsApp com a mensagem pronta. A conversa continua por lá.',
  itens: [
    'A conversa segue no WhatsApp',
    'A equipe configura seu acesso',
    'Sua logo e seu PIX no orçamento',
  ],
  campos: {
    nome: 'Seu nome',
    empresa: 'Empresa',
    whatsapp: 'WhatsApp',
    email: 'E-mail (opcional)',
    segmento: 'Segmento',
  },
  placeholders: {
    nome: 'Nome e sobrenome',
    empresa: 'Nome da empresa',
    whatsapp: 'DDD + número',
    email: 'nome@empresa.com.br',
  },
  segmentoVazio: 'Escolha',
  erros: {
    nome: 'Escreva seu nome.',
    empresa: 'Escreva o nome da empresa.',
    whatsapp: 'Confira o número com DDD.',
    email: 'Confira o e-mail ou deixe em branco.',
    segmento: 'Escolha o segmento.',
  },
  enviar: 'Enviar e abrir o WhatsApp',
  enviando: 'Enviando…',
  abrindo: 'Abrindo o WhatsApp…',
  avisoFalha: 'Vamos continuar pelo WhatsApp.',
  direto: 'Prefiro ir direto pro WhatsApp',
  legalPrefix: 'Ao enviar, você concorda com a',
  legalLink: 'Política de Privacidade',
  fechar: 'Fechar',
  // Rótulo do honeypot: fica fora da tela e escondido do leitor de tela.
  honeypot: 'Site',
};
