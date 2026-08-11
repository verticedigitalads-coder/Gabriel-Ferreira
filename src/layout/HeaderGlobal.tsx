import { useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HelpCircle } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

interface HeaderGlobalProps {
  onOpenHelp: () => void;
}

export function HeaderGlobal({ onOpenHelp }: HeaderGlobalProps) {
  const activeModule = useStore(state => state.activeModule);

  const moduleNames: Record<string, string> = {
    dashboard: 'Dashboard Executivo',
    leads: 'Gestão de Leads',
    kanban: 'Pipeline Comercial',
    orcamentos: 'Orçamentos',
    recibos: 'Recibos',
    financeiro: 'Financeiro',
    notas: 'Notas Fiscais',
    ia: 'IA Assistente',
    settings: 'Configurações',
    operacional: 'Painel Operacional',
    central: 'Modo Execução',
    'contas-receber': 'Contas a Receber',
    fornecedores: 'Fornecedores',
    comparador: 'Comparador de Preços',
    estoque: 'Estoque',
    whatsapp: 'WhatsApp',
  };

  // Subtítulo fixo por módulo — linguagem de dono de negócio, textos aprovados.
  const moduleSubtitles: Record<string, string> = {
    dashboard: 'Visão geral do seu negócio: receita prevista, leads que precisam de atenção e suas prioridades do dia.',
    operacional: 'Organize as atividades da equipe, acompanhe o andamento das tarefas e mantenha tudo dentro do prazo.',
    kanban: 'Seus leads organizados em colunas, da primeira conversa ao fechamento. Arraste os cards para avançar cada negociação.',
    central: 'Tudo que precisa da sua atenção em um só lugar: cobranças, orçamentos, leads e outras pendências importantes.',
    leads: 'Gerencie clientes e oportunidades, acompanhe negociações e mantenha todo o histórico de cada contato.',
    whatsapp: 'Suas conversas do WhatsApp dentro do CRM, conectadas aos seus leads — sem trocar de aplicativo.',
    orcamentos: 'Crie e envie orçamentos profissionais em PDF, com sua logo, suas cores e QR Code PIX para pagamento.',
    recibos: 'Emita recibos numerados dos serviços recebidos, em PDF com a identidade da sua empresa e assinatura.',
    financeiro: 'Entradas e saídas do seu caixa: registre receitas e despesas e acompanhe o resultado do mês.',
    'contas-receber': 'Controle do que ainda vai entrar: parcelas, vencimentos e cobranças pendentes dos seus clientes.',
    notas: 'Emita e acompanhe notas fiscais eletrônicas da sua empresa, integradas diretamente ao CRM.',
    ia: 'Análise inteligente dos seus leads: quem priorizar, qual estratégia usar e sugestão de mensagem pronta.',
    fornecedores: 'Organize seus fornecedores, cadastro via CNPJ, contatos e documentos para facilitar compras e negociações.',
    estoque: 'Controle de materiais: quantidades, movimentações e alerta do que está acabando.',
    settings: 'Dados e identidade da sua empresa: logo, cores, PIX e textos padrão que aparecem nos seus documentos.',
  };

  const today = format(new Date(), "dd 'de' MMMM yyyy", { locale: ptBR });
  const subtitle = moduleSubtitles[activeModule];

  return (
    <header className="flex-1 min-w-0 min-h-[64px] bg-[var(--bg-sidebar)] flex items-center justify-between px-2 md:px-6 py-2">

      {/* ESQUERDA */}
      <div className="min-w-0">
        <h1 className="text-sm! md:text-lg font-semibold text-[var(--text-primary)] tracking-tight truncate">
          {moduleNames[activeModule] ?? 'CRM'}
        </h1>

        {/* Empresa (workspace selector) — mobile: info secundária sob o título,
            no espaço onde data/subtítulo aparecem no desktop. -ml-1 compensa o px-1 do botão. */}
        <div className="md:hidden min-w-0 -ml-1">
          <WorkspaceSwitcher variant="mobile" />
        </div>

        <p className="hidden md:block text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
          {today}
        </p>
        {subtitle && (
          <p className="hidden md:block text-xs text-[var(--text-tertiary)] mt-0.5 md:max-w-xl">
            {subtitle}
          </p>
        )}
      </div>

      {/* DIREITA */}
      <div className="flex items-center" style={{ gap: 10 }}>

        {/* Empresa (workspace selector) — desktop: linha principal do header */}
        <div className="hidden md:flex">
          <WorkspaceSwitcher />
        </div>

        {/* Ajuda — mobile: acessível via Sidebar ("Central de Ajuda") */}
        <button
          onClick={onOpenHelp}
          aria-label="Ajuda"
          title="Ajuda"
          className="hidden md:flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notificações */}
        <NotificationsDropdown />

      </div>
    </header>
  );
}