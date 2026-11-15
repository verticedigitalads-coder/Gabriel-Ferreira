import { formatCurrency } from '@/utils/formatters';
import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/editorial/EmptyState';
import { Colophon } from '@/components/editorial/Colophon';
import { SectionHeading } from '@/components/editorial/SectionHeading';
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
  CheckCircle,
  AlertTriangle,
  Pencil,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import type { ContaReceberStatus, FormaRecebimento } from '@/types';
import { contaEmAberto, contaEmAtraso } from '@/domain/contasReceber/situacaoConta';

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

// ─── Redesign D6: peças visuais (só UI; os números chegam prontos) ──────────

// Total Pendente no topo compacto: mesma marcação do número da Receita Provável
// no Financeiro, sem contagem (não pedida). Tamanhos de display sem token (cabe a 320px).
function ValorGrande({ valor }: { valor: number }) {
  const [inteiro, centavos] = formatCurrency(valor).replace(/^R\$\s*/, '').split(',');

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

const CHIP = 'ed-mono shrink-0 inline-flex items-center px-3 min-h-[44px] whitespace-nowrap transition-colors';
const ACAO = 'flex h-11 w-11 shrink-0 items-center justify-center transition-colors hover:bg-[var(--bg-surface-2)]';

// Texto da ajuda (docs/help/contas-a-receber.md, passo a passo "Dar baixa" e perguntas)
const COMO_FUNCIONA = [
  { titulo: 'Nova Conta', texto: 'Descrição, valor e vencimento; vincule o cliente se quiser.' },
  { titulo: 'Marcar como recebido', texto: 'Toque no check duplo, também na conta atrasada. A data do recebimento fica registrada.' },
  { titulo: 'A receita entra no Financeiro', texto: 'Sozinha, com o mesmo valor e a data de hoje. Lançar de novo duplica o valor.' },
];

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

    // Em aberto no mês: pendente ou marcada como atrasada
    const pendente = allThisMonth
      .filter(contaEmAberto)
      .reduce((sum, c) => sum + (c.valor ?? 0), 0);

    const recebido = allThisMonth
      .filter((c) => c.status === 'recebido')
      .reduce((sum, c) => sum + (c.valor ?? 0), 0);

    // Em atraso, em todos os meses: marcada como atrasada ou pendente vencida
    const atrasado = contasReceber
      .filter(contaEmAtraso)
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

  // ── Redesign D6: só pele. A lógica acima é a mesma de antes. ──
  const setActiveModule = useStore((state) => state.setActiveModule);

  return (
    <div className="flex flex-col md:h-full">
      {/* Topo compacto (padrão de Leads e Orçamentos) com o "CR" cortado ao fundo: Total Pendente, mês, ação, cartões e status */}
      <section className="relative overflow-hidden border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 pt-4 pb-4 md:px-6 md:pt-5">
        <span
          aria-hidden="true"
          className="ed-serif ed-ghost pointer-events-none select-none absolute -right-4 -top-12 leading-none text-[150px] md:text-[190px]"
        >
          CR
        </span>
        <span aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] w-32 bg-[var(--accent)]" />

        <div className="relative flex items-end justify-between flex-wrap gap-3 mb-4">
          <div className="min-w-0 border-l-2 border-[var(--accent)] pl-3">
            <ValorGrande valor={stats.pendente} />
            <p className="ed-mono mt-2 text-[var(--text-tertiary)]">
              Total Pendente
              <span className="normal-case tracking-normal"> · em aberto no mês</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="min-h-[44px] min-w-[150px] flex-1 sm:flex-none border border-[var(--border-strong)] bg-[var(--bg-app)] px-3 text-sm text-[var(--text-primary)]"
            />
            <Button onClick={() => setShowModal(true)} className="gap-2 rounded-none text-[var(--bg-app)]">
              <Plus className="w-4 h-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Cartões (o Total Pendente está no número grande e o Total Atrasado no diagnóstico) */}
        <div className="relative grid grid-cols-2 gap-px border border-[var(--border)] bg-[var(--border)] mb-4">
          {[
            { label: 'Recebido este Mês', valor: formatCurrency(stats.recebido), cor: 'var(--success)', perigo: false },
            {
              label: 'Vencem em 3 dias',
              valor: `${stats.proximosVencimentos} conta${stats.proximosVencimentos !== 1 ? 's' : ''}`,
              cor: stats.proximosVencimentos > 0 ? 'var(--danger)' : 'var(--border-strong)',
              perigo: stats.proximosVencimentos > 0,
            },
          ].map((c) => (
            <div key={c.label} className="min-w-0 bg-[var(--bg-surface)] px-3 py-3 md:px-4">
              <p className="ed-mono flex items-center gap-2 text-[var(--text-tertiary)]">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0" style={{ background: c.cor }} />
                {c.label}
              </p>
              <p
                className="tnum mt-1.5 leading-none text-lg md:text-xl [overflow-wrap:anywhere]"
                style={{
                  color: c.perigo ? 'var(--danger)' : 'var(--text-primary)',
                  fontWeight: 'var(--font-bold)',
                  letterSpacing: '-0.02em',
                }}
              >
                {c.valor}
              </p>
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="relative flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="ed-mono shrink-0 text-[var(--text-tertiary)]">Status:</span>
          {statusFilterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={CHIP}
              style={{
                background: statusFilter === opt.value ? 'var(--accent-subtle)' : 'var(--bg-surface-2)',
                color: statusFilter === opt.value ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${statusFilter === opt.value ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Diagnóstico, lista e explicação (no desktop, só esta parte rola) */}
      <div className="pt-4 md:pt-5 md:flex-1 md:min-h-0 md:overflow-y-auto space-y-4">
        {/* Diagnóstico de atraso: Total Atrasado (todas as contas, qualquer mês) */}
        <div
          className="relative border px-4 py-3 md:px-5"
          style={{
            background: stats.atrasado > 0 ? 'var(--danger-subtle)' : 'var(--bg-surface)',
            borderColor: stats.atrasado > 0 ? 'var(--danger)' : 'var(--border-strong)',
          }}
        >
          {stats.atrasado > 0 && (
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-[var(--danger)]" />
          )}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="min-w-0">
              <p
                className="ed-mono flex items-center gap-2"
                style={{ color: stats.atrasado > 0 ? 'var(--danger)' : 'var(--text-tertiary)' }}
              >
                {stats.atrasado > 0 ? (
                  <AlertTriangle aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <CheckCircle aria-hidden="true" className="w-3.5 h-3.5 shrink-0 text-[var(--success)]" />
                )}
                Diagnóstico de atraso
              </p>
              <p className="mt-1 max-w-xl text-xs text-[var(--text-tertiary)]">
                Soma, de qualquer mês, as contas pendentes com o vencimento passado (selo "Vencida") e as marcadas como
                "Atrasado".
              </p>
            </div>
            <div className="shrink-0 md:text-right">
              <p className="ed-mono text-[var(--text-tertiary)]">Total Atrasado</p>
              <p
                className="tnum mt-1 text-xl leading-none [overflow-wrap:anywhere]"
                style={{
                  color: stats.atrasado > 0 ? 'var(--danger)' : 'var(--text-primary)',
                  fontWeight: 'var(--font-bold)',
                }}
              >
                {formatCurrency(stats.atrasado)}
              </p>
            </div>
          </div>
        </div>

        {filteredContas.length === 0 ? (
          <EmptyState title="Nenhuma conta encontrada para este período" note="Troque o mês ou o status" />
        ) : (
          <ul className="divide-y divide-[var(--border)] border border-[var(--border-strong)] bg-[var(--bg-surface)]">
            {filteredContas.map((conta) => {
              const vencida = isVencida(conta);
              const leadNome = getLeadName(conta.leadId);

              return (
                <li
                  key={conta.id}
                  className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-4 py-4 md:px-5 transition-colors hover:bg-[var(--bg-surface-2)]"
                >
                  <div className="flex items-start md:items-center gap-2 md:gap-4 flex-1 min-w-0">
                    <DollarSign
                      className={`w-5 h-5 shrink-0 mt-0.5 md:mt-0 ${
                        conta.status === 'recebido'
                          ? 'text-[var(--success)]'
                          : conta.status === 'atrasado' || vencida
                          ? 'text-[var(--danger)]'
                          : 'text-[var(--warning)]'
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className="font-medium min-w-0 [overflow-wrap:anywhere] text-[var(--text-primary)]">
                          {conta.descricao}
                        </p>
                        {vencida && (
                          <span className="ed-mono shrink-0 border border-[var(--danger)] bg-[var(--danger-subtle)] px-1.5 py-0.5 text-[var(--danger)]">
                            Vencida
                          </span>
                        )}
                      </div>
                      {conta.observacao && (
                        <p className="text-xs text-[var(--text-secondary)] [overflow-wrap:anywhere] mt-0.5">
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
                            {/* Rótulo das opções do formulário (PIX, Transferência...); valor desconhecido sai como está */}
                            <span>
                              {formaOptions.find((o) => o.value === conta.formaRecebimento)?.label ?? conta.formaRecebimento}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 flex-wrap md:flex-nowrap shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className={`ed-mono px-1.5 py-0.5 shrink-0 ${getStatusClasses(conta.status, vencida)}`}>
                        {getStatusLabel(conta.status)}
                      </span>

                      <p
                        className="tnum text-lg text-[var(--text-primary)] md:whitespace-nowrap"
                        style={{ fontWeight: 'var(--font-bold)' }}
                      >
                        {formatCurrency(conta.valor)}
                      </p>
                    </div>

                    <div className="flex gap-1 shrink-0 ml-auto md:ml-0">
                      {contaEmAberto(conta) && (
                        <button
                          onClick={() => marcarComoRecebido(conta.id)}
                          title="Marcar como recebido"
                          aria-label="Marcar como recebido"
                          className={ACAO}
                          style={{ color: 'var(--success)', background: 'var(--success-subtle)' }}
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingConta(conta);
                          setShowEditModal(true);
                        }}
                        title="Editar"
                        aria-label="Editar"
                        className={ACAO}
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedConta(conta);
                          setConfirmOpen(true);
                        }}
                        title="Excluir"
                        aria-label="Excluir"
                        className={ACAO}
                        style={{ color: 'var(--danger)' }}
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

        {/* Como funciona: o fluxo recebido → Financeiro */}
        <section className="border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-4 md:px-5">
          <SectionHeading index="01" label="Como funciona" accent="recebido vira receita" />
          <ol className="mt-3 grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
            {COMO_FUNCIONA.map((passo, i) => (
              <li key={passo.titulo} className="bg-[var(--bg-surface)] px-4 py-3">
                <p className="flex items-baseline gap-2">
                  <span className="ed-serif text-xl text-[var(--accent)]">{i + 1}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{passo.titulo}</span>
                </p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">{passo.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <Colophon label="VRTX CRM · Contas a Receber" onBack={() => setActiveModule('dashboard')} />
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
  // Trava de clique duplo: o botão fica desabilitado enquanto grava
  const [salvando, setSalvando] = useState(false);

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

    setSalvando(true);
    try {
      if (isEditing) {
        const result = await updateContaReceber(initialData.id, payload);
        if (!result) return;
      } else {
        const result = await addContaReceber(payload);
        if (!result) return;
      }
      onClose();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
        maiuscula="frase"
        label="Observação"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
      />

      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {isEditing ? 'Salvar Alterações' : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
}
