import { formatCurrency } from '@/utils/formatters';
import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  addDays,
} from 'date-fns';
import {
  Plus,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  CalendarClock,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import type { ContaReceberStatus, FormaRecebimento } from '@/types';

const statusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'recebido', label: 'Recebido' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const formaOptions = [
  { value: '', label: '— Selecionar —' },
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartão' },
];

const statusFilterOptions = [
  { value: 'all', label: 'Todos' },
  ...statusOptions,
];

function getStatusLabel(status: ContaReceberStatus) {
  switch (status) {
    case 'pendente': return 'Pendente';
    case 'recebido': return 'Recebido';
    case 'atrasado': return 'Atrasado';
    case 'cancelado': return 'Cancelado';
  }
}

function getStatusClasses(status: ContaReceberStatus, vencida: boolean) {
  if (status === 'recebido') return 'bg-[var(--success-subtle)] text-[var(--success)]';
  if (status === 'atrasado' || vencida) return 'bg-[var(--danger-subtle)] text-[var(--danger)]';
  if (status === 'cancelado') return 'bg-[var(--bg-surface-3)] text-[var(--text-tertiary)]';
  return 'bg-[var(--warning-subtle)] text-[var(--warning)]';
}

export function ContasReceber() {
  const contasReceber = useStore((state) => state.contasReceber);
  const fetchContasReceber = useStore((state) => state.fetchContasReceber);
  const deleteContaReceber = useStore((state) => state.deleteContaReceber);
  const marcarComoRecebido = useStore((state) => state.marcarComoRecebido);
  const leads = useStore((state) => state.leads);

  const [showModal, setShowModal] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() =>
    format(new Date(), 'yyyy-MM'),
  );

  useEffect(() => {
    fetchContasReceber();
  }, []);


  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in3Days = addDays(today, 3);

  const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
  const monthEnd = endOfMonth(monthStart);

  const filteredContas = useMemo(() => {
    return contasReceber
      .filter((c) => {
        const venc = parseISO(c.dataVencimento);
        const inMonth = isWithinInterval(venc, { start: monthStart, end: monthEnd });
        const statusMatch = statusFilter === 'all' || c.status === statusFilter;
        return inMonth && statusMatch;
      })
      .sort(
        (a, b) =>
          new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime(),
      );
  }, [contasReceber, monthStart, monthEnd, statusFilter]);

  const stats = useMemo(() => {
    const allThisMonth = contasReceber.filter((c) =>
      isWithinInterval(parseISO(c.dataVencimento), { start: monthStart, end: monthEnd }),
    );

    const pendente = allThisMonth
      .filter((c) => c.status === 'pendente')
      .reduce((sum, c) => sum + (c.valor ?? 0), 0);

    const recebido = allThisMonth
      .filter((c) => c.status === 'recebido')
      .reduce((sum, c) => sum + (c.valor ?? 0), 0);

    const atrasado = contasReceber
      .filter((c) => {
        const venc = parseISO(c.dataVencimento);
        venc.setHours(0, 0, 0, 0);
        return c.status === 'pendente' && venc < today;
      })
      .reduce((sum, c) => sum + (c.valor ?? 0), 0);

    const proximosVencimentos = contasReceber.filter((c) => {
      const venc = parseISO(c.dataVencimento);
      venc.setHours(0, 0, 0, 0);
      return c.status === 'pendente' && venc >= today && venc <= in3Days;
    }).length;

    return { pendente, recebido, atrasado, proximosVencimentos };
  }, [contasReceber, monthStart, monthEnd]);

  const isVencida = (conta: any) => {
    const venc = parseISO(conta.dataVencimento);
    venc.setHours(0, 0, 0, 0);
    return conta.status === 'pendente' && venc < today;
  };

  const getLeadName = (leadId?: string) => {
    if (!leadId) return null;
    return leads.find((l) => l.id === leadId)?.nome ?? null;
  };

  return (
    <div className="h-full flex flex-col">
      {/* HEADER */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-2xl! font-bold text-[var(--text-primary)]">
              Contas a Receber
            </h1>
            <p className="text-sm text-[var(--text-tertiary)]">
              Gestão de cobranças e recebimentos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] shrink-0"
            />
            <Button onClick={() => setShowModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Pendente"
            value={formatCurrency(stats.pendente)}
            color="yellow"
            icon={<Clock />}
          />
          <StatCard
            label="Recebido este Mês"
            value={formatCurrency(stats.recebido)}
            color="green"
            icon={<CheckCircle />}
          />
          <StatCard
            label="Total Atrasado"
            value={formatCurrency(stats.atrasado)}
            color="red"
            icon={<AlertTriangle />}
          />
          <StatCard
            label="Vencem em 3 dias"
            value={`${stats.proximosVencimentos} conta${stats.proximosVencimentos !== 1 ? 's' : ''}`}
            color={stats.proximosVencimentos > 0 ? 'red' : 'default'}
            icon={<CalendarClock />}
          />
        </div>
      </div>

      {/* FILTROS DE STATUS */}
      <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)] flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-[var(--text-tertiary)] mr-1">
          Status:
        </span>
        {statusFilterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredContas.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-[var(--text-tertiary)]">
              Nenhuma conta encontrada para este período
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContas.map((conta) => {
              const vencida = isVencida(conta);
              const leadNome = getLeadName(conta.leadId);

              return (
                <Card key={conta.id} className="p-4" hoverable>
                  <div className="flex items-center gap-4">
                    <DollarSign
                      className={`w-5 h-5 shrink-0 ${
                        conta.status === 'recebido'
                          ? 'text-[var(--success)]'
                          : conta.status === 'atrasado' || vencida
                          ? 'text-[var(--danger)]'
                          : 'text-[var(--warning)]'
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-[var(--text-primary)] truncate">
                          {conta.descricao}
                        </p>
                        {vencida && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[var(--danger-subtle)] text-[var(--danger)] rounded uppercase tracking-wide">
                            Vencida
                          </span>
                        )}
                      </div>
                      {conta.observacao && (
                        <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                          {conta.observacao}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-0.5 flex-wrap">
                        {leadNome && <span>{leadNome}</span>}
                        {leadNome && <span>•</span>}
                        <span>
                          Vence{' '}
                          {format(parseISO(conta.dataVencimento), 'dd/MM/yyyy')}
                        </span>
                        {conta.formaRecebimento && (
                          <>
                            <span>•</span>
                            <span className="capitalize">
                              {conta.formaRecebimento}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(conta.status, vencida)}`}
                      >
                        {getStatusLabel(conta.status)}
                      </span>

                      <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums whitespace-nowrap">
                        {formatCurrency(conta.valor)}
                      </p>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {conta.status === 'pendente' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => marcarComoRecebido(conta.id)}
                          title="Marcar como recebido"
                        >
                          <CheckCheck className="w-4 h-4 text-[var(--success)]" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingConta(conta);
                          setShowEditModal(true);
                        }}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedConta(conta);
                          setConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CRIAR */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Conta a Receber"
      >
        <ContaReceberForm onClose={() => setShowModal(false)} />
      </Modal>

      {/* MODAL EDITAR */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Conta"
      >
        <ContaReceberForm
          initialData={editingConta}
          onClose={() => setShowEditModal(false)}
        />
      </Modal>

      {/* CONFIRM DELETE */}
      <ConfirmDialog
        isOpen={confirmOpen}
        description="Tem certeza que deseja excluir esta conta?"
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedConta(null);
        }}
        onConfirm={async () => {
          if (selectedConta) await deleteContaReceber(selectedConta.id);
          setConfirmOpen(false);
          setSelectedConta(null);
        }}
      />
    </div>
  );
}

function ContaReceberForm({
  onClose,
  initialData,
}: {
  onClose: () => void;
  initialData?: any;
}) {
  const leads = useStore((state) => state.leads);
  const addContaReceber = useStore((state) => state.addContaReceber);
  const updateContaReceber = useStore((state) => state.updateContaReceber);

  const isEditing = !!initialData;

  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const [valor, setValor] = useState<number>(initialData?.valor || 0);
  const [dataVencimento, setDataVencimento] = useState(
    initialData?.dataVencimento || format(new Date(), 'yyyy-MM-dd'),
  );
  const [status, setStatus] = useState<ContaReceberStatus>(
    initialData?.status || 'pendente',
  );
  const [formaRecebimento, setFormaRecebimento] = useState<FormaRecebimento | ''>(
    initialData?.formaRecebimento || '',
  );
  const [leadId, setLeadId] = useState(initialData?.leadId || '');
  const [observacao, setObservacao] = useState(initialData?.observacao || '');

  const leadOptions = [
    { value: '', label: '— Sem lead —' },
    ...leads.map((l) => ({ value: l.id, label: l.nome })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      descricao,
      valor: Number(valor),
      dataVencimento,
      status,
      formaRecebimento: formaRecebimento || null,
      leadId: leadId || null,
      observacao: observacao || null,
    };

    if (isEditing) {
      const result = await updateContaReceber(initialData.id, payload);
      if (!result) return;
    } else {
      const result = await addContaReceber(payload);
      if (!result) return;
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
          label="Data de Vencimento"
          type="date"
          value={dataVencimento}
          onChange={(e) => setDataVencimento(e.target.value)}
          required
        />
      </div>

      <Select
        label="Lead vinculado"
        value={leadId}
        onChange={(e) => setLeadId(e.target.value)}
        options={leadOptions}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ContaReceberStatus)}
          options={statusOptions}
        />
        <Select
          label="Forma de Recebimento"
          value={formaRecebimento}
          onChange={(e) =>
            setFormaRecebimento(e.target.value as FormaRecebimento | '')
          }
          options={formaOptions}
        />
      </div>

      <TextArea
        label="Observação"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
      />

      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {isEditing ? 'Salvar Alterações' : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
}
