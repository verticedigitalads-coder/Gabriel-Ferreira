import { formatCurrency } from '@/utils/formatters';
import { apiFetch } from '@/lib/apiFetch';
import { useDefaultSettings } from '@/hooks/useDefaultSettings';
import type { Recibo, ReciboStatus } from '@/types';
import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  FileText,
  Receipt,
  CheckCircle2,
  Download,
  Edit,
  X,
  Plus,
  CalendarDays,
  User,
} from 'lucide-react';

const statusColors: Record<ReciboStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  emitido: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
};

const statusLabel: Record<ReciboStatus, string> = {
  pendente: 'Pendente',
  emitido: 'Emitido',
  cancelado: 'Cancelado',
};

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export function Recibos() {
  const recibos = useStore((state) => state.recibos) as Recibo[];
  const emitirRecibo = useStore((state) => state.emitirRecibo);
  const updateRecibo = useStore((state) => state.updateRecibo);
  const addToast = useStore((state) => state.addToast);
  const defaultSettings = useDefaultSettings();

  const [showModal, setShowModal] = useState(false);
  const [editingRecibo, setEditingRecibo] = useState<Recibo | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const sortedRecibos = useMemo(
    () =>
      [...recibos].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      ),
    [recibos],
  );

  const handleEdit = (r: Recibo) => {
    setEditingRecibo(r);
    setShowModal(true);
  };

  const handleNovo = () => {
    setEditingRecibo(null);
    setShowModal(true);
  };

  const handleEmitir = async (r: Recibo) => {
    await emitirRecibo(r.id);
    addToast({ type: 'success', message: `Recibo emitido com sucesso!` });
  };

  const generateReciboPDF = async (recibo: Recibo) => {
    try {
      const response = await apiFetch('/api/gerar-recibo', {
        method: 'POST',
        body: JSON.stringify({
          template_version: 'v2',
          numero_recibo: recibo.numeroRecibo,
          cliente_nome: recibo.clienteNome,
          cliente_telefone: recibo.clienteTelefone || '',
          cliente_endereco: recibo.clienteEndereco || '',
          descricao: recibo.descricao,
          itens: recibo.itens,
          valor_total: recibo.valorTotal,
          observacoes: recibo.observacoes || '',
          data_emissao: recibo.dataEmissao
            ? new Date(recibo.dataEmissao).toLocaleDateString('pt-BR')
            : new Date().toLocaleDateString('pt-BR'),
          empresa_nome: defaultSettings.empresaNome,
          empresa_telefone: defaultSettings.empresaTelefone,
          empresa_email: defaultSettings.empresaEmail,
          empresa_endereco: defaultSettings.empresaEndereco,
          empresa_cnpj: defaultSettings.empresaCnpj,
          empresa_logo_url: defaultSettings.empresaLogoUrl,
          empresa_logo_bg_url: defaultSettings.empresaLogoBgUrl,
          cor_primaria: defaultSettings.corPrimaria || '#ff6a00',
        }),
      });

      if (!response.ok) {
        addToast({ type: 'error', message: 'Erro ao gerar PDF do recibo' });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${recibo.numeroRecibo || 'pendente'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      addToast({ type: 'success', message: 'PDF do recibo gerado!' });
    } catch (error) {
      console.error('[Recibos] Erro ao gerar PDF:', error);
      addToast({ type: 'error', message: 'Erro na conexão com o servidor' });
    }
  };

  const handleCancelarClick = (id: string) => {
    setCancelTargetId(id);
    setConfirmOpen(true);
  };

  const handleConfirmCancelar = async () => {
    if (!cancelTargetId) return;
    await updateRecibo(cancelTargetId, { status: 'cancelado' });
    addToast({ type: 'success', message: 'Recibo cancelado.' });
    setConfirmOpen(false);
    setCancelTargetId(null);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const [y, m, day] = d.split('T')[0].split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
              Recibos
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {recibos.length} {recibos.length === 1 ? 'recibo' : 'recibos'}
            </p>
          </div>
          <Button onClick={handleNovo} className="gap-2 min-h-[44px]">
            <Plus className="w-4 h-4" />
            Novo Recibo
          </Button>
        </div>

        <ConfirmDialog
          isOpen={confirmOpen}
          onConfirm={handleConfirmCancelar}
          onCancel={() => {
            setConfirmOpen(false);
            setCancelTargetId(null);
          }}
          description="Tem certeza que deseja cancelar este recibo?"
        />
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {sortedRecibos.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">Nenhum recibo encontrado.</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Recibos são gerados automaticamente ao aprovar um orçamento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRecibos.map((r) => (
              <Card
                key={r.id}
                className="p-4 hover:shadow-md transition-shadow"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Ícone + número */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--bg-surface-2)' }}
                    >
                      <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {r.numeroRecibo || 'Pendente'}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[r.status]}`}
                        >
                          {statusLabel[r.status]}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-[var(--text-tertiary)]" />
                        <span className="text-sm text-[var(--text-secondary)] truncate">
                          {r.clienteNome}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-0.5">
                        <CalendarDays className="w-3 h-3 text-[var(--text-tertiary)]" />
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {r.dataEmissao
                            ? formatDate(r.dataEmissao)
                            : formatDate(r.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Valor + ações */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <span className="text-base font-bold text-green-600">
                      {formatCurrency(r.valorTotal)}
                    </span>

                    {/* Emitir — só pendente */}
                    {r.status === 'pendente' && (
                      <Button
                        size="sm"
                        variant="success"
                        className="gap-1 min-h-[44px] px-3"
                        onClick={() => handleEmitir(r)}
                        title="Emitir recibo"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Emitir</span>
                      </Button>
                    )}

                    {/* PDF — só emitido */}
                    {r.status === 'emitido' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1 min-h-[44px] px-3"
                        onClick={() => generateReciboPDF(r)}
                        title="Gerar PDF"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </Button>
                    )}

                    {/* Editar — só pendente */}
                    {r.status === 'pendente' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="min-h-[44px] px-3"
                        onClick={() => handleEdit(r)}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Cancelar — se não cancelado */}
                    {r.status !== 'cancelado' && (
                      <Button
                        size="sm"
                        variant="danger"
                        className="min-h-[44px] px-3"
                        onClick={() => handleCancelarClick(r.id)}
                        title="Cancelar recibo"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                {r.descricao && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-2 border-t border-[var(--border)] pt-2">
                    {r.descricao}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRecibo ? 'Editar Recibo' : 'Novo Recibo'}
        size="md"
      >
        <ReciboForm
          recibo={editingRecibo}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// Formulário
// ─────────────────────────────────────────────

interface ReciboFormProps {
  recibo: Recibo | null;
  onClose: () => void;
}

function ReciboForm({ recibo, onClose }: ReciboFormProps) {
  const leads = useStore((state) => state.leads) as any[];
  const orcamentos = useStore((state) => state.orcamentos) as any[];
  const addRecibo = useStore((state) => state.addRecibo);
  const updateRecibo = useStore((state) => state.updateRecibo);
  const addToast = useStore((state) => state.addToast);

  const hoje = new Date().toISOString().split('T')[0];

  const [leadId, setLeadId] = useState(recibo?.leadId || '');
  const [orcamentoId, setOrcamentoId] = useState(recibo?.orcamentoId || '');
  const [clienteNome, setClienteNome] = useState(recibo?.clienteNome || '');
  const [descricao, setDescricao] = useState(recibo?.descricao || '');
  const [valorTotal, setValorTotal] = useState(recibo?.valorTotal ?? 0);
  const [dataEmissao, setDataEmissao] = useState(
    recibo?.dataEmissao || hoje,
  );
  const [observacoes, setObservacoes] = useState(recibo?.observacoes || '');

  // Ao selecionar lead, preencher clienteNome automaticamente
  const handleLeadChange = (id: string) => {
    setLeadId(id);
    if (id) {
      const lead = leads.find((l) => l.id === id);
      if (lead) setClienteNome(lead.nome);

      // Preencher orcamentoId com o último orçamento aprovado do lead (se existir)
      const orcAprovado = orcamentos
        .filter((o) => o.leadId === id && o.status === 'aprovado')
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )[0];

      if (orcAprovado) {
        setOrcamentoId(orcAprovado.id);
        setValorTotal(orcAprovado.total ?? 0);
        setDescricao(`Serviços ref. orçamento ${orcAprovado.numero || ''}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteNome.trim()) {
      addToast({ type: 'error', message: 'Nome do cliente é obrigatório.' });
      return;
    }

    if (!descricao.trim()) {
      addToast({ type: 'error', message: 'Descrição é obrigatória.' });
      return;
    }

    if (!orcamentoId && !recibo) {
      addToast({ type: 'error', message: 'Selecione um lead com orçamento aprovado.' });
      return;
    }

    if (recibo) {
      await updateRecibo(recibo.id, {
        clienteNome,
        descricao,
        valorTotal,
        dataEmissao,
        observacoes,
      });
      addToast({ type: 'success', message: 'Recibo atualizado!' });
    } else {
      await addRecibo({
        orcamentoId,
        leadId: leadId || null,
        clienteNome,
        descricao,
        valorTotal,
        dataEmissao,
        observacoes,
        status: 'pendente',
        itens: [],
      });
      addToast({ type: 'success', message: 'Recibo criado!' });
    }

    onClose();
  };

  // Leads com orçamento aprovado (para novo recibo)
  const leadsComOrcamento = useMemo(() => {
    const idsComOrc = new Set(
      orcamentos
        .filter((o) => o.status === 'aprovado')
        .map((o) => o.leadId),
    );
    return leads.filter((l) => idsComOrc.has(l.id));
  }, [leads, orcamentos]);

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
      {/* Seleção de lead (só para novo recibo) */}
      {!recibo && (
        <Select
          label="Lead / Cliente *"
          value={leadId}
          onChange={(e) => handleLeadChange(e.target.value)}
          options={[
            { value: '', label: 'Selecione um lead' },
            ...leadsComOrcamento.map((l: any) => ({
              value: l.id,
              label: `${l.nome} — ${l.servico || ''}`,
            })),
          ]}
        />
      )}

      <Input
        label="Nome do Cliente *"
        value={clienteNome}
        onChange={(e) => setClienteNome(e.target.value)}
        placeholder="Ex: João da Silva"
      />

      <TextArea
        label="Descrição dos Serviços *"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        rows={3}
        placeholder="Ex: Serviços de instalação conforme orçamento..."
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor Total (R$)"
          type="number"
          step="0.01"
          min="0"
          value={valorTotal}
          onChange={(e) => setValorTotal(Number(e.target.value))}
        />
        <Input
          label="Data de Emissão"
          type="date"
          value={dataEmissao}
          onChange={(e) => setDataEmissao(e.target.value)}
        />
      </div>

      <TextArea
        label="Observações"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        rows={2}
        placeholder="Informações adicionais..."
      />

      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <Button type="button" variant="secondary" onClick={onClose} className="min-h-[44px]">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" className="min-h-[44px]">
          {recibo ? 'Salvar' : 'Criar Recibo'}
        </Button>
      </div>
    </form>
  );
}
