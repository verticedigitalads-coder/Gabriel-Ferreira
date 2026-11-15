import { formatCurrency } from '@/utils/formatters';
import { useEffect, useState, useMemo } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useStore } from '@/store/useStore';
import { useDashboardStats } from '@/store/selectors/dashboardSelectors';
import { useCountUp } from '@/hooks/useCountUp';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/editorial/EmptyState';
import { Colophon } from '@/components/editorial/Colophon';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Users,
  Percent,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
} from 'lucide-react';
import type {
  Transaction,
  TransactionType,
  StatusPagamentoDisplay,
  FormaPagamentoTransacao,
} from '@/types';

// ─── helpers de data ───────────────────────────────────────────────────────

// transactions.data é timestamptz no Postgres ("2026-05-05T00:00:00+00:00") e chega cru do
// formatters.ts (único campo de data que não passa por toDateInput). parseISO nesse valor
// converte para o fuso local (UTC-3) e cai no dia anterior — o que empurra lançamentos do dia 1
// para o mês anterior no filtro de mês. Normaliza para "AAAA-MM-DD", mesmo tratamento que
// formatters.toDateInput já dá a dataVencimento/dataPagamento.
const normalizeDate = (date: string) =>
  date?.includes('T') ? date.split('T')[0] : date;

// ─── helpers de status ─────────────────────────────────────────────────────

const getStatusDisplay = (t: Transaction): StatusPagamentoDisplay => {
  if (t.statusPagamento === 'pago') return 'pago';
  if (!t.dataVencimento) return 'a_vencer';
  const hoje = format(new Date(), 'yyyy-MM-dd');
  return t.dataVencimento < hoje ? 'vencido' : 'a_vencer';
};

const statusConfig: Record<
  StatusPagamentoDisplay,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pago: {
    label: 'Pago',
    color: 'var(--success)',
    bg: 'var(--success-subtle)',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  a_vencer: {
    label: 'A vencer',
    color: 'var(--warning)',
    bg: 'var(--warning-subtle)',
    icon: <Clock className="w-3 h-3" />,
  },
  vencido: {
    label: 'Vencido',
    color: 'var(--danger)',
    bg: 'var(--danger-subtle)',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
};

const formaPagamentoOptions: { value: FormaPagamentoTransacao; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'debito_automatico', label: 'Débito Automático' },
];

// ─── opções de tipo/categoria ───────────────────────────────────────────────

const tipoOptions = [
  { value: 'receita', label: '↑ Receita' },
  { value: 'despesa', label: '↓ Despesa' },
  { value: 'comissao', label: '% Comissão' },
  { value: 'pagamento_funcionario', label: '👤 Pagamento Funcionário' },
];

const categoriaOptions = [
  { value: 'Gasto pessoal', label: 'Gasto pessoal' },
  { value: 'Material', label: 'Material' },
  { value: 'Funcionário', label: 'Funcionário' },
  { value: 'Despesa fixa', label: 'Despesa fixa' },
  { value: 'Variável', label: 'Variável' },
  { value: 'Serviços', label: 'Serviços' },
  { value: 'Aluguel', label: 'Aluguel' },
  { value: 'Transporte', label: 'Transporte' },
  { value: 'Alimentação', label: 'Alimentação' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Mão de obra', label: 'Mão de obra' },
  { value: 'Outros', label: 'Outros' },
];

const isDespesaTipo = (tipo: string) =>
  ['despesa', 'comissao', 'pagamento_funcionario'].includes(tipo);

// ─── exportar CSV ───────────────────────────────────────────────────────────

// Texto digitado pelo usuário: entre aspas, com as aspas internas dobradas, e
// apóstrofo na frente do que começa com =, +, - ou @ (o Excel não roda como fórmula)
function celulaTexto(valor?: string | null) {
  const texto = valor ?? '';
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replace(/"/g, '""')}"`;
}

function exportCSV(transactions: Transaction[], month: string) {
  const header = [
    'Data',
    'Tipo',
    'Descrição',
    'Categoria',
    'Valor',
    'Status',
    'Vencimento',
    'Data Pagamento',
    'Forma Pagamento',
  ].join(';');

  const rows = transactions.map((t) => {
    const status = getStatusDisplay(t);
    return [
      normalizeDate(t.data),
      t.tipo,
      celulaTexto(t.descricao),
      celulaTexto(t.categoria),
      t.valor.toFixed(2).replace('.', ','),
      statusConfig[status].label,
      t.dataVencimento || '',
      t.dataPagamento || '',
      t.formaPagamento || '',
    ].join(';');
  });

  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financeiro-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── StatusBadge ────────────────────────────────────────────────────────────

function StatusBadge({ transaction }: { transaction: Transaction }) {
  if (!isDespesaTipo(transaction.tipo)) return null;
  const status = getStatusDisplay(transaction);
  const cfg = statusConfig[status];
  return (
    <span
      className="ed-mono inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.color }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Redesign D6: peças visuais (só UI; os números chegam prontos) ──────────

// Receita Provável com contagem, no topo compacto (padrão de Leads e Orçamentos).
// Mesma marcação do ReceitaPotencialContada do Dashboard (local, sem export), em
// tamanho menor. Componente próprio para a contagem não re-renderizar a tela a
// cada quadro; com "reduzir movimento", sai direto o valor final. Tamanhos de
// display sem token (cabe a 320px).
function ReceitaProvavelContada({ valor }: { valor: number }) {
  const animado = useCountUp(valor);
  const [inteiro, centavos] = formatCurrency(animado).replace(/^R\$\s*/, '').split(',');

  return (
    <p
      className="tnum flex flex-wrap items-baseline leading-[0.8] text-[var(--text-primary)]"
      style={{ fontWeight: 'var(--font-bold)', letterSpacing: '-0.045em' }}
    >
      <span className="sr-only">{formatCurrency(valor)}</span>
      <span aria-hidden="true" className="ed-serif mr-1.5 text-[22px] md:text-[28px] text-[var(--accent)]">R$</span>
      <span aria-hidden="true" className="min-w-0 [overflow-wrap:anywhere] text-[clamp(32px,10vw,44px)] md:text-[52px]">
        {inteiro}
      </span>
      <span
        aria-hidden="true"
        className="text-[18px] md:text-[24px] text-[var(--text-tertiary)]"
        style={{ fontWeight: 'var(--font-semibold)' }}
      >
        ,{centavos}
      </span>
    </p>
  );
}

const CHIP = 'ed-mono shrink-0 inline-flex items-center gap-1.5 px-3 min-h-[44px] whitespace-nowrap transition-colors';
const ACAO = 'flex h-11 w-11 shrink-0 items-center justify-center transition-colors hover:bg-[var(--bg-surface-2)]';

// ─── componente principal ───────────────────────────────────────────────────

export function Financeiro() {
  const transactions = useStore((state) => state.transactions);
  const fetchTransactions = useStore((state) => state.fetchTransactions);
  const leads = useStore((state) => state.leads);
  const deleteTransaction = useStore((state) => state.deleteTransaction);
  const marcarComoPago = useStore((state) => state.marcarComoPago);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [pagarModal, setPagarModal] = useState<Transaction | null>(null);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] =
    useState<FormaPagamentoTransacao>('pix');

  const [selectedMonth, setSelectedMonth] = useState(() =>
    format(new Date(), 'yyyy-MM'),
  );
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusPagamentoDisplay>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');

  // input[type=month] emite "AAAA-MM" e normalizeDate devolve "AAAA-MM-DD" — o prefixo casa
  // exatamente, sem conversão de fuso no meio (ver comentário de normalizeDate).
  const monthTransactions = useMemo(() => {
    return transactions
      .filter((t) => normalizeDate(t.data).startsWith(selectedMonth))
      .sort((a, b) => normalizeDate(b.data).localeCompare(normalizeDate(a.data)));
  }, [transactions, selectedMonth]);

  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter((t) => {
      const statusOk =
        filtroStatus === 'todos' ||
        (isDespesaTipo(t.tipo) && getStatusDisplay(t) === filtroStatus) ||
        (filtroStatus === 'pago' && t.tipo === 'receita');

      const categoriaOk =
        filtroCategoria === 'todos' || t.categoria === filtroCategoria;

      return statusOk && categoriaOk;
    });
  }, [monthTransactions, filtroStatus, filtroCategoria]);

  const statusCounts = useMemo(() => {
    const despesas = monthTransactions.filter((t) => isDespesaTipo(t.tipo));
    return {
      todos: monthTransactions.length,
      a_vencer: despesas.filter((t) => getStatusDisplay(t) === 'a_vencer').length,
      vencido: despesas.filter((t) => getStatusDisplay(t) === 'vencido').length,
      pago: despesas.filter((t) => getStatusDisplay(t) === 'pago').length,
    };
  }, [monthTransactions]);

  const stats = useMemo(() => {
    let receitas = 0;
    let despesasPendentes = 0;
    let despesasPagas = 0;
    let vencidas = 0;

    monthTransactions.forEach((t) => {
      if (t.tipo === 'receita') {
        receitas += t.valor;
      } else if (isDespesaTipo(t.tipo)) {
        const status = getStatusDisplay(t);
        if (status === 'pago') {
          despesasPagas += t.valor;
        } else {
          despesasPendentes += t.valor;
          if (status === 'vencido') vencidas += t.valor;
        }
      }
    });

    return {
      receitas,
      despesasPendentes,
      despesasPagas,
      vencidas,
      resultado: receitas - despesasPagas - despesasPendentes,
    };
  }, [monthTransactions]);

  const getLeadName = (leadId?: string | null) => {
    if (!leadId) return null;
    return leads.find((l) => l.id === leadId)?.nome ?? null;
  };

  const tipoConfig: Record<TransactionType, { icon: React.ReactNode; color: string; bg: string }> = {
    receita:               { icon: <ArrowUpCircle className="w-4 h-4" />,   color: 'var(--success)', bg: 'var(--success-subtle)' },
    despesa:               { icon: <ArrowDownCircle className="w-4 h-4" />, color: 'var(--danger)',  bg: 'var(--danger-subtle)' },
    comissao:              { icon: <Percent className="w-4 h-4" />,         color: 'var(--warning)', bg: 'var(--warning-subtle)' },
    pagamento_funcionario: { icon: <Users className="w-4 h-4" />,           color: 'var(--info)',    bg: 'var(--info-subtle)' },
  };

  const getTypeIcon = (tipo: TransactionType) => {
    const cfg = tipoConfig[tipo];
    if (!cfg) return null;
    return (
      <div
        className="w-9 h-9 flex items-center justify-center shrink-0"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {cfg.icon}
      </div>
    );
  };

  const handleConfirmPago = async () => {
    if (!pagarModal) return;
    // Falhou: o slice já mostrou o erro e o modal fica aberto
    const pago = await marcarComoPago(pagarModal.id, formaPagamentoSelecionada);
    if (!pago) return;
    setPagarModal(null);
  };

  // ── Redesign D6: só pele. A lógica acima é a mesma de antes. ──
  const { receitaProvavel, metaMensal } = useDashboardStats();
  const setActiveModule = useStore((state) => state.setActiveModule);
  // Mesma conta e mesmo texto do Dashboard (Dashboard.tsx:356 e :564-572)
  const pctMeta = metaMensal > 0 ? (receitaProvavel / metaMensal) * 100 : null;

  return (
    <div className="flex flex-col md:h-full">
      {/* Topo compacto (padrão de Leads e Orçamentos): Receita Provável com contagem, meta, ações, cartões e filtros */}
      <section className="relative border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 pt-4 pb-4 md:px-6 md:pt-5">
        <span aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] w-32 bg-[var(--accent)]" />

        <div className="flex items-end justify-between flex-wrap gap-3 mb-3">
          <div className="min-w-0 border-l-2 border-[var(--accent)] pl-3">
            <ReceitaProvavelContada valor={receitaProvavel} />
            <p className="ed-mono mt-2 text-[var(--text-tertiary)]">
              Receita Provável
              <span className="normal-case tracking-normal"> · não muda com o mês</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="min-h-[44px] min-w-[150px] flex-1 sm:flex-none border border-[var(--border-strong)] bg-[var(--bg-app)] px-3 text-sm text-[var(--text-primary)]"
            />
            <Button
              variant="secondary"
              onClick={() => exportCSV(filteredTransactions, selectedMonth)}
              className="gap-1.5 rounded-none"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button onClick={() => setShowModal(true)} className="gap-2 rounded-none text-[var(--bg-app)]">
              <Plus className="w-4 h-4" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Linha da meta: mesma conta e mesmo texto do Dashboard */}
        <div className="mb-4">
          {pctMeta !== null && (
            <div className="mb-1.5 h-[3px] w-full bg-[var(--border-strong)]">
              <div className="ed-grow h-full bg-[var(--accent)]" style={{ width: `${Math.min(pctMeta, 100)}%` }} />
            </div>
          )}
          <p className="ed-mono text-[var(--text-tertiary)]">
            {pctMeta !== null && `${pctMeta.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da meta · `}
            <span className="ed-mono text-[var(--text-secondary)]">
              {metaMensal > 0 ? `Meta ${formatCurrency(metaMensal)}` : 'Meta não definida'}
            </span>
          </p>
          {receitaProvavel === 0 && (
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Marque leads como orçados com valor para ver a previsão de receita.
            </p>
          )}
        </div>

        {/* Cartões do mês */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-[var(--border)] bg-[var(--border)] mb-4">
          {[
            { label: 'Receitas do mês', valor: formatCurrency(stats.receitas), cor: 'var(--success)' },
            { label: 'A pagar', valor: formatCurrency(stats.despesasPendentes), cor: 'var(--warning)' },
            { label: 'Vencidas', valor: formatCurrency(stats.vencidas), cor: 'var(--danger)' },
            {
              label: 'Resultado',
              valor: formatCurrency(stats.resultado),
              cor: stats.resultado >= 0 ? 'var(--success)' : 'var(--danger)',
            },
          ].map((c) => (
            <div key={c.label} className="min-w-0 bg-[var(--bg-surface)] px-3 py-3 md:px-4">
              <p className="ed-mono flex items-center gap-2 text-[var(--text-tertiary)]">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0" style={{ background: c.cor }} />
                {c.label}
              </p>
              <p
                className="tnum mt-1.5 leading-none text-lg md:text-xl [overflow-wrap:anywhere] text-[var(--text-primary)]"
                style={{ fontWeight: 'var(--font-bold)', letterSpacing: '-0.02em' }}
              >
                {c.valor}
              </p>
            </div>
          ))}
        </div>

        {/* Filtros: status e categoria */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex min-w-0 gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {(
              [
                { key: 'todos', label: 'Todos', count: statusCounts.todos },
                { key: 'a_vencer', label: 'A vencer', count: statusCounts.a_vencer },
                { key: 'vencido', label: 'Vencido', count: statusCounts.vencido },
                { key: 'pago', label: 'Pago', count: statusCounts.pago },
              ] as const
            ).map(({ key, label, count }) => {
              const isActive = filtroStatus === key;
              const cfg = key !== 'todos' ? statusConfig[key as StatusPagamentoDisplay] : null;
              return (
                <button
                  key={key}
                  onClick={() => setFiltroStatus(key)}
                  className={CHIP}
                  style={{
                    background: isActive
                      ? cfg
                        ? cfg.bg
                        : 'var(--accent-subtle)'
                      : 'var(--bg-surface-2)',
                    color: isActive
                      ? cfg
                        ? cfg.color
                        : 'var(--accent)'
                      : 'var(--text-secondary)',
                    border: `1px solid ${isActive ? (cfg ? cfg.color : 'var(--accent)') : 'var(--border)'}`,
                  }}
                >
                  {label}
                  <span
                    className="tnum px-1.5"
                    style={{
                      background: isActive ? 'var(--bg-surface)' : 'var(--bg-surface-3)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="min-h-[44px] md:ml-auto border border-[var(--border-strong)] bg-[var(--bg-app)] px-3 text-sm text-[var(--text-secondary)]"
          >
            <option value="todos">Todas categorias</option>
            {categoriaOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Resultado do Mês e lista (no desktop, só esta parte rola) */}
      <div className="pt-4 md:pt-5 md:flex-1 md:min-h-0 md:overflow-y-auto space-y-4">
        {/* Resultado do Mês (o que está filtrado na lista) */}
        {(() => {
          const receitasMes = filteredTransactions
            .filter(t => t.tipo === 'receita')
            .reduce((sum, t) => sum + (t.valor || 0), 0);
          const despesasMes = filteredTransactions
            .filter(t => t.tipo !== 'receita')
            .reduce((sum, t) => sum + (t.valor || 0), 0);
          const resultado = receitasMes - despesasMes;
          const positivo = resultado >= 0;
          return (
            <div
              className="relative flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-2 border px-4 py-3 md:px-5"
              style={{
                background: positivo ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                borderColor: positivo ? 'var(--success)' : 'var(--danger)',
              }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ background: positivo ? 'var(--success)' : 'var(--danger)' }}
              />
              <div>
                <span className="ed-mono" style={{ color: positivo ? 'var(--success)' : 'var(--danger)' }}>
                  Resultado do Mês
                </span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                  <span className="tnum text-xs text-[var(--text-tertiary)]">
                    Receitas: {formatCurrency(receitasMes)}
                  </span>
                  <span className="tnum text-xs text-[var(--text-tertiary)]">
                    Despesas: {formatCurrency(despesasMes)}
                  </span>
                </div>
              </div>
              <span
                className="tnum text-xl [overflow-wrap:anywhere]"
                style={{ color: positivo ? 'var(--success)' : 'var(--danger)', fontWeight: 'var(--font-bold)' }}
              >
                {positivo ? '+' : '−'}{formatCurrency(Math.abs(resultado))}
              </span>
            </div>
          );
        })()}

        {filteredTransactions.length === 0 ? (
          <EmptyState title="Nenhuma transação encontrada" note="Ajuste o mês ou os filtros" />
        ) : (
          <ul className="divide-y divide-[var(--border)] border border-[var(--border-strong)] bg-[var(--bg-surface)]">
            {filteredTransactions.map((t) => {
              const statusDisplay = isDespesaTipo(t.tipo) ? getStatusDisplay(t) : null;
              const isPendente =
                statusDisplay === 'a_vencer' || statusDisplay === 'vencido';

              return (
                <li
                  key={t.id}
                  className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 px-4 py-4 md:px-5 transition-colors hover:bg-[var(--bg-surface-2)]"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getTypeIcon(t.tipo)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className="font-medium min-w-0 [overflow-wrap:anywhere] text-[var(--text-primary)]">
                          {t.descricao}
                        </p>
                        <StatusBadge transaction={t} />
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-[var(--text-tertiary)]">
                        {t.categoria && <span>{t.categoria}</span>}
                        {t.leadId && getLeadName(t.leadId) && (
                          <span>• {getLeadName(t.leadId)}</span>
                        )}
                        <span>
                          {format(parseISO(normalizeDate(t.data)), "dd 'de' MMM", { locale: ptBR })}
                        </span>
                        {isDespesaTipo(t.tipo) && t.dataVencimento && (
                          <span>• Vence: {format(parseISO(t.dataVencimento), 'dd/MM/yy')}</span>
                        )}
                        {t.dataPagamento && (
                          <span>
                            • Pago em: {format(parseISO(t.dataPagamento), 'dd/MM/yy')}
                            {/* Rótulo das opções do formulário (PIX, Débito Automático...); valor desconhecido sai como está */}
                            {t.formaPagamento &&
                              ` (${formaPagamentoOptions.find((o) => o.value === t.formaPagamento)?.label ?? t.formaPagamento})`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                    <p
                      className="tnum text-base whitespace-nowrap"
                      style={{
                        color: t.tipo === 'receita' ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 'var(--font-bold)',
                        letterSpacing: '-0.3px',
                      }}
                    >
                      {t.tipo === 'receita' ? '+' : '−'}{formatCurrency(t.valor)}
                    </p>

                    <div className="flex gap-1">
                      {isPendente && (
                        <button
                          onClick={() => {
                            setFormaPagamentoSelecionada('pix');
                            setPagarModal(t);
                          }}
                          title="Marcar como pago"
                          aria-label="Marcar como pago"
                          className={ACAO}
                          style={{
                            color: 'var(--success)',
                            background: 'var(--success-subtle)',
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingTransaction(t);
                          setShowEditModal(true);
                        }}
                        className={ACAO}
                        style={{ color: 'var(--text-secondary)' }}
                        title="Editar"
                        aria-label="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTransaction(t);
                          setConfirmOpen(true);
                        }}
                        className={ACAO}
                        style={{ color: 'var(--danger)' }}
                        title="Excluir"
                        aria-label="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Colophon label="VRTX CRM · Financeiro" onBack={() => setActiveModule('dashboard')} />
      </div>

      {/* ── Modal: Nova transação ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Transação">
        <TransactionForm onClose={() => setShowModal(false)} />
      </Modal>

      {/* ── Modal: Editar ── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTransaction(null);
        }}
        title="Editar Transação"
      >
        <TransactionForm
          initialData={editingTransaction}
          onClose={() => {
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
        />
      </Modal>

      {/* ── Modal: Marcar como pago ── */}
      <Modal
        isOpen={!!pagarModal}
        onClose={() => setPagarModal(null)}
        title="Marcar como pago"
      >
        <div className="p-4 md:p-6 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{pagarModal?.descricao}</strong>
            {' — '}
            {pagarModal ? formatCurrency(pagarModal.valor) : ''}
          </p>

          <Select
            label="Forma de pagamento"
            value={formaPagamentoSelecionada}
            onChange={(e) =>
              setFormaPagamentoSelecionada(e.target.value as FormaPagamentoTransacao)
            }
            options={formaPagamentoOptions}
          />

          <div
            className="flex justify-end gap-2 pt-4 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <Button variant="secondary" onClick={() => setPagarModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPago}>Confirmar pagamento</Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm delete ── */}
      <ConfirmDialog
        isOpen={confirmOpen}
        description="Tem certeza que deseja excluir esta transação?"
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedTransaction(null);
        }}
        onConfirm={async () => {
          if (selectedTransaction) {
            await deleteTransaction(selectedTransaction.id);
          }
          setConfirmOpen(false);
          setSelectedTransaction(null);
        }}
      />
    </div>
  );
}

// ─── TransactionForm ─────────────────────────────────────────────────────────

function TransactionForm({ onClose, initialData }: { onClose: () => void; initialData?: any }) {
  const leads = useStore((state) => state.leads);
  const addTransaction = useStore((state) => state.addTransaction);
  const updateTransaction = useStore((state) => state.updateTransaction);

  const isEditing = !!initialData;

  const [tipo, setTipo] = useState<string>(initialData?.tipo || 'receita');
  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const [valor, setValor] = useState<number>(initialData?.valor || 0);

  const [data, setData] = useState(
    initialData?.data
      ? normalizeDate(initialData.data)
      : format(new Date(), 'yyyy-MM-dd'),
  );
  const [categoria, setCategoria] = useState(
    initialData?.categoria || 'Serviços',
  );
  const [leadId, setLeadId] = useState(initialData?.leadId || '');
  const [observacoes, setObservacoes] = useState(initialData?.observacoes || '');
  const [dataVencimento, setDataVencimento] = useState(
    initialData?.dataVencimento || format(new Date(), 'yyyy-MM-dd'),
  );
  const [formaPagamento, setFormaPagamento] = useState<string>(
    initialData?.formaPagamento || '',
  );
  // Trava de clique duplo: o botão fica desabilitado enquanto grava
  const [salvando, setSalvando] = useState(false);

  const ehDespesa = isDespesaTipo(tipo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      tipo,
      descricao,
      valor,
      data,
      categoria,
      leadId: leadId || undefined,
      observacoes,
    };

    if (ehDespesa) {
      payload.dataVencimento = dataVencimento;
      if (formaPagamento) payload.formaPagamento = formaPagamento;
    }

    // Falhou: o slice já mostrou o erro e o formulário fica aberto
    setSalvando(true);
    try {
      const salvo = isEditing
        ? await updateTransaction(initialData.id, payload)
        : await addTransaction(payload);
      if (!salvo) return;
      onClose();
    } finally {
      setSalvando(false);
    }
  };

  const leadOptions = [
    { value: '', label: 'Nenhum' },
    ...leads.map((l) => ({ value: l.id, label: l.nome })),
  ];

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
      <Select
        label="Tipo"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        options={tipoOptions}
      />
      <Input
        maiuscula="inicio"
        label="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor (R$)"
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
          required
        />
        <Input
          label="Data de lançamento"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
      </div>

      {ehDespesa && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data de vencimento"
            type="date"
            value={dataVencimento}
            onChange={(e) => setDataVencimento(e.target.value)}
            required
          />
          <Select
            label="Forma de pagamento (opcional)"
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
            options={[{ value: '', label: 'Não informada' }, ...formaPagamentoOptions]}
          />
        </div>
      )}

      <Select
        label="Categoria"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        options={categoriaOptions}
      />

      <Select
        label="Lead vinculado (opcional)"
        value={leadId}
        onChange={(e) => setLeadId(e.target.value)}
        options={leadOptions}
      />

      <TextArea
        maiuscula="frase"
        label="Observações"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
      />

      <div
        className="flex justify-end gap-2 pt-4 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>{isEditing ? 'Salvar Alterações' : 'Adicionar'}</Button>
      </div>
    </form>
  );
}
