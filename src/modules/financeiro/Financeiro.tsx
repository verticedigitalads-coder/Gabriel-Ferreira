import { formatCurrency } from '@/utils/formatters';
import { useEffect, useState, useMemo } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
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

// ─── helpers de status ─────────────────────────────────────────────────────

const getStatusDisplay = (t: Transaction): StatusPagamentoDisplay => {
  if (t.statusPagamento === 'pago') return 'pago';
  if (!t.dataVencimento) return 'a_vencer';
  const hoje = new Date().toISOString().split('T')[0];
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
      t.data,
      t.tipo,
      `"${t.descricao}"`,
      t.categoria,
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
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

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

  const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
  const monthEnd = endOfMonth(monthStart);

  const monthTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const date = parseISO(t.data);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transactions, monthStart, monthEnd]);

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
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {cfg.icon}
      </div>
    );
  };

  const handleConfirmPago = async () => {
    if (!pagarModal) return;
    await marcarComoPago(pagarModal.id, formaPagamentoSelecionada);
    setPagarModal(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div
        className="p-4 md:p-6 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
      >
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Financeiro
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Controle de receitas e despesas
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-md text-sm min-h-[44px]"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportCSV(filteredTransactions, selectedMonth)}
              className="gap-1"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button onClick={() => setShowModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* StatCards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Receitas do mês"
            value={formatCurrency(stats.receitas)}
            color="green"
            icon={<TrendingUp />}
          />
          <StatCard
            label="A pagar"
            value={formatCurrency(stats.despesasPendentes)}
            color="yellow"
            icon={<TrendingDown />}
          />
          <StatCard
            label="Vencidas"
            value={formatCurrency(stats.vencidas)}
            color="red"
            icon={<AlertTriangle />}
          />
          <StatCard
            label="Resultado"
            value={formatCurrency(stats.resultado)}
            color={stats.resultado >= 0 ? 'green' : 'red'}
            icon={<DollarSign />}
          />
        </div>

        {/* Filtros de status */}
        <div className="flex items-center gap-2 flex-wrap">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[32px]"
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
                  className="px-1.5 py-0.5 rounded-full text-[10px]"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.15)' : 'var(--bg-surface-3)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="ml-auto text-xs px-2 py-1.5 rounded-md min-h-[32px]"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--bg-surface-2)',
              color: 'var(--text-secondary)',
            }}
          >
            <option value="todos">Todas categorias</option>
            {categoriaOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Lista ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <DollarSign className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-tertiary)' }}>Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((t) => {
              const statusDisplay = isDespesaTipo(t.tipo) ? getStatusDisplay(t) : null;
              const isPendente =
                statusDisplay === 'a_vencer' || statusDisplay === 'vencido';

              return (
                <Card key={t.id} className="p-4" hoverable>
                  <div className="flex items-start gap-3">
                    {getTypeIcon(t.tipo)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {t.descricao}
                        </p>
                        <StatusBadge transaction={t} />
                      </div>

                      <div
                        className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {t.categoria && <span>{t.categoria}</span>}
                        {t.leadId && getLeadName(t.leadId) && (
                          <span>• {getLeadName(t.leadId)}</span>
                        )}
                        <span>
                          {format(parseISO(t.data), "dd 'de' MMM", { locale: ptBR })}
                        </span>
                        {isDespesaTipo(t.tipo) && t.dataVencimento && (
                          <span>• Vence: {format(parseISO(t.dataVencimento), 'dd/MM/yy')}</span>
                        )}
                        {t.dataPagamento && (
                          <span>
                            • Pago em: {format(parseISO(t.dataPagamento), 'dd/MM/yy')}
                            {t.formaPagamento && ` (${t.formaPagamento.replace('_', ' ')})`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <p
                        className="text-base font-bold tabular-nums"
                        style={{
                          color: t.tipo === 'receita' ? 'var(--success)' : 'var(--danger)',
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
                            className="p-2 rounded-md min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
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
                          className="p-2 rounded-md min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          title="Editar"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => {
                            setSelectedTransaction(t);
                            setConfirmOpen(true);
                          }}
                          className="p-2 rounded-md min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                          style={{ color: 'var(--danger)' }}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
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

  const normalizeDate = (date: string) =>
    date?.includes('T') ? date.split('T')[0] : date;

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

    if (isEditing) {
      await updateTransaction(initialData.id, payload);
    } else {
      await addTransaction(payload);
    }

    onClose();
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
        label="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor (R$)"
          type="number"
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
        <Button type="submit">{isEditing ? 'Salvar Alterações' : 'Adicionar'}</Button>
      </div>
    </form>
  );
}
