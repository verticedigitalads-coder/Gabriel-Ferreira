import { formatCurrency } from '@/utils/formatters';
import type { Lead } from '@/types';
import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuid } from 'uuid';
import { calcularOrcamento, calcularItemTotal } from '@/domain/orcamento/calcularOrcamento';
import { useWorkspaceSegment } from '@/hooks/useWorkspaceSegment';
import {
  Plus,
  FileText,
  Trash2,
  Download,
  Edit,
  User,
  Calendar,
  PackageMinus,
  CheckCircle2,
} from 'lucide-react';
import type { Orcamento, OrcamentoItem, OrcamentoStatus, UnidadeOrcamento } from '@/types';

const unitOptionsBySegment: Record<string, { value: string; label: string }[]> = {
  metalurgica: [
    { value: 'unidade', label: 'Unidade' },
    { value: 'peca', label: 'Peça' },
    { value: 'kg', label: 'Kg' },
    { value: 'metro', label: 'Metro' },
  ],
  marcenaria: [
    { value: 'm2', label: 'm²' },
    { value: 'ml', label: 'Metro linear' },
    { value: 'unidade', label: 'Unidade' },
    { value: 'peca', label: 'Peça' },
  ],
};

const statusOptions = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'recusado', label: 'Recusado' },
];

const statusColors: Record<OrcamentoStatus, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  enviado: 'bg-blue-100 text-blue-700',
  aprovado: 'bg-green-100 text-green-700',
  recusado: 'bg-red-100 text-red-700',
};

export function Orcamentos() {
  const leads = useStore((state) => state.leads) as Lead[];
  const orcamentos = useStore((state) => state.orcamentos);
  const deleteOrcamento = useStore((state) => state.deleteOrcamento);
  const addToast = useStore((state) => state.addToast);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [orcToDelete, setOrcToDelete] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<Orcamento | null>(
    null,
  );

  const sortedOrcamentos = useMemo(() => {
    return [...orcamentos].sort(
      (a, b) =>
        new Date(b.createdAt || b.created_at || 0).getTime() -
        new Date(a.createdAt || a.created_at || 0).getTime(),
    );
  }, [orcamentos]);


  const leadsMap = useMemo(() => {
    const map: Record<string, string> = {};
    leads.forEach((l) => (map[l.id] = l.nome));
    return map;
  }, [leads]);

  const getLeadName = (orc: Orcamento) =>
    orc.clienteNome || leadsMap[orc.leadId] || 'Cliente';

  const handleEdit = (orc: Orcamento) => {
    setEditingOrcamento(orc);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setOrcToDelete(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orcToDelete) return;

    await deleteOrcamento(orcToDelete);

    setConfirmOpen(false);
    setOrcToDelete(null);
  };

  const generatePDF = async (orc: Orcamento) => {
    try {
      const lead = leads.find((l) => l.id === orc.leadId);

      const clienteNome = orc.clienteNome || lead?.nome || 'Cliente';
      const clienteTelefone = orc.clienteTelefone || lead?.telefone || '';
      const clienteEndereco = orc.clienteEndereco || lead?.endereco || '';

      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

      console.log('API_URL:', API_URL);
      const response = await fetch(`${API_URL}/api/gerar-orcamento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          id: orc.id,
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone,
          cliente_endereco: clienteEndereco,
          itens: orc.itens,
          subtotal: orc.subtotal,
          multiplicador: orc.multiplicador ?? 1,
          desconto: orc.desconto,
          total: orc.total,
          observacoes: orc.observacoes,
          validade: orc.validadeEmDias,
        }),
      });

      if (!response.ok) {
        addToast({ type: 'error', message: 'Erro ao gerar PDF' });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `orcamento-${orc.numero}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);

      addToast({ type: 'success', message: 'PDF gerado com sucesso!' });
    } catch (error) {
      console.error('Erro:', error);
      addToast({ type: 'error', message: 'Erro na conexão com o servidor' });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Orçamentos</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {orcamentos.length} orçamentos
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingOrcamento(null);
              setShowModal(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Orçamento
          </Button>
        </div>

        <ConfirmDialog
          isOpen={confirmOpen}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmOpen(false)}
          description="Tem certeza que deseja excluir este orçamento?"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedOrcamentos.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">Nenhum orçamento criado</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => setShowModal(true)}
            >
              Criar primeiro orçamento
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedOrcamentos.map((orc) => (
              <Card key={orc.id} className="p-4" hoverable>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                        {orc.numero}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[orc.status as OrcamentoStatus]}`}
                      >
                        {
                          statusOptions.find((s) => s.value === orc.status)
                            ?.label
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {getLeadName(orc)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {orc.createdAt
                          ? format(parseISO(orc.createdAt), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })
                          : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {formatCurrency(orc.total)}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {orc.itens.length} {orc.itens.length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generatePDF(orc)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(orc)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(orc.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingOrcamento ? 'Editar Orçamento' : 'Novo Orçamento'}
        size="xl"
      >
        <OrcamentoForm
          orcamento={editingOrcamento}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// BaixaEstoqueModal — seleção de materiais para baixa ao aprovar orçamento
// ─────────────────────────────────────────────

interface BaixaItem {
  itemId: string;
  descricao: string;
  quantidadeOrc: number;
  checked: boolean;
  materialId: string;
  quantidadeBaixar: number;
}

interface BaixaEstoqueModalProps {
  orcamentoNumero: string;
  itens: OrcamentoItem[];
  materiais: any[];
  onCancel: () => void;
  onConfirm: (baixas: BaixaItem[]) => Promise<void>;
}

function BaixaEstoqueModal({ orcamentoNumero, itens, materiais, onCancel, onConfirm }: BaixaEstoqueModalProps) {
  const [rows, setRows] = useState<BaixaItem[]>(() =>
    itens.map(item => ({
      itemId: item.id,
      descricao: item.descricao,
      quantidadeOrc: item.quantidade,
      checked: true,
      materialId: '',
      quantidadeBaixar: item.quantidade,
    }))
  );
  const [loading, setLoading] = useState(false);

  const updateRow = (itemId: string, changes: Partial<BaixaItem>) => {
    setRows(prev => prev.map(r => r.itemId === itemId ? { ...r, ...changes } : r));
  };

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(rows.filter(r => r.checked && r.materialId && r.quantidadeBaixar > 0));
    setLoading(false);
  };

  const cellStyle: React.CSSProperties = {
    padding: '8px 10px',
    borderBottom: '1px solid var(--border)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    verticalAlign: 'middle',
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '4px 8px',
    fontSize: 'var(--text-sm)',
    width: '100%',
    outline: 'none',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100,
      }}
    >
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-modal)',
        width: 660,
        maxWidth: '95vw',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <PackageMinus size={20} color="var(--warning)" />
            <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Baixa no Estoque — {orcamentoNumero}
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Selecione quais itens deseja baixar do estoque ao aprovar este orçamento.
          </p>
        </div>

        {/* Tabela */}
        <div style={{ overflow: 'auto', flex: 1, padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Item do Orçamento', 'Qtd', 'Material no Estoque', 'Qtd a Baixar'].map(h => (
                  <th key={h} style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.itemId}>
                  <td style={{ ...cellStyle, width: 32 }}>
                    <input
                      type="checkbox"
                      checked={row.checked}
                      onChange={e => updateRow(row.itemId, { checked: e.target.checked })}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent)', width: 16, height: 16 }}
                    />
                  </td>
                  <td style={{ ...cellStyle, maxWidth: 180 }}>
                    <span style={{ color: row.checked ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                      {row.descricao || '(sem descrição)'}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, width: 50, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {row.quantidadeOrc}
                  </td>
                  <td style={{ ...cellStyle, width: 200 }}>
                    <select
                      value={row.materialId}
                      disabled={!row.checked}
                      onChange={e => updateRow(row.itemId, { materialId: e.target.value })}
                      style={{ ...inputStyle, opacity: row.checked ? 1 : 0.4 }}
                    >
                      <option value="">Não vincular</option>
                      {materiais.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.nome} (estoque: {m.estoque})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ ...cellStyle, width: 110 }}>
                    <input
                      type="number"
                      min="0"
                      value={row.quantidadeBaixar}
                      disabled={!row.checked}
                      onChange={e => updateRow(row.itemId, { quantidadeBaixar: Number(e.target.value) })}
                      style={{ ...inputStyle, opacity: row.checked ? 1 : 0.4 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              padding: '8px 16px',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-foreground)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 16px',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 size={15} />
            {loading ? 'Confirmando...' : 'Confirmar Baixa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────

interface OrcamentoFormProps {
  orcamento: Orcamento | null;
  onClose: () => void;
}

function OrcamentoForm({ orcamento, onClose }: OrcamentoFormProps) {
  const leads = useStore((state: any) => state.leads);
  const addOrcamento = useStore((state) => state.addOrcamento);
  const updateOrcamento = useStore((state) => state.updateOrcamento);
  const updateLead = useStore((state) => state.updateLead);
  const materiais = useStore((state) => state.materiais);
  const movimentarEstoque = useStore((state) => state.movimentarEstoque);
  const addToast = useStore((state: any) => state.addToast);

  const [leadId, setLeadId] = useState(orcamento?.leadId || '');
  const [status, setStatus] = useState<OrcamentoStatus>(
    orcamento?.status || 'rascunho',
  );
  const [itens, setItens] = useState<OrcamentoItem[]>(orcamento?.itens || []);
  const [desconto, setDesconto] = useState(orcamento?.desconto || 0);
  const [multiplicador, setMultiplicador] = useState(
    orcamento?.multiplicador || 1,
  );

  const [validadeEmDias, setValidadeEmDias] = useState(
    orcamento?.validadeEmDias || 15,
  );
  const [observacoes, setObservacoes] = useState(orcamento?.observacoes || '');

  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  const segment = useWorkspaceSegment();
  const isMarcenaria = segment === 'marcenaria';

  const { subtotal, total, maoDeObra } = calcularOrcamento({
    itens,
    multiplicador,
    desconto,
  });

  const activeLeads = leads.filter((l: Lead) => l.status !== 'perdido');

  const addItem = () => {
    setItens([
      ...itens,
      {
        id: uuid(),
        descricao: '',
        quantidade: 1,
        valorUnitario: 0,
        valorTotal: 0,
        unitType: isMarcenaria ? 'm2' : 'unidade',
        ...(isMarcenaria ? { ambiente: '', largura: 0, altura: 0 } : {}),
      },
    ]);
  };

  const updateItem = (id: string, field: string, value: string | number) => {
    setItens(
      itens.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (['quantidade', 'valorUnitario', 'largura', 'altura', 'unitType'].includes(field)) {
          updated.valorTotal = calcularItemTotal(updated);
        }
        return updated;
      }),
    );
  };

  const removeItem = (id: string) => {
    setItens(itens.filter((item) => item.id !== id));
  };

  const saveOrcamento = async (data: any) => {
    if (orcamento) {
      await updateOrcamento(orcamento.id, data);
    } else {
      await addOrcamento(data);
    }

    if (data.leadId && data.total > 0) {
      const lead = leads.find((l: Lead) => l.id === data.leadId);
      if (lead) {
        await updateLead(data.leadId, {
          valorOrcado: data.total,
          orcamentoEnviado: data.status === 'enviado' || data.status === 'aprovado',
        });
      }
    }

    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const leadSelecionado = leads.find((l: Lead) => l.id === leadId);

    const clienteNome = leadSelecionado?.nome || 'Cliente';
    const clienteTelefone = leadSelecionado?.telefone || '';
    const clienteEndereco = leadSelecionado?.endereco || '';

    const data = {
      leadId,
      clienteNome,
      clienteTelefone,
      clienteEndereco,
      itens,
      desconto,
      multiplicador,
      status,
      observacoes,
      validadeEmDias,
      subtotal,
      total,
    };

    // Interceptar somente quando TRANSICIONANDO para 'aprovado'
    const transicionandoParaAprovado =
      status === 'aprovado' && orcamento?.status !== 'aprovado';

    if (transicionandoParaAprovado) {
      setPendingData(data);
      setShowBaixaModal(true);
      return;
    }

    await saveOrcamento(data);
  };


  return (
    <>
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Lead/Cliente *"
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          options={[
            { value: '', label: 'Selecione um lead' },
            ...activeLeads.map((l: any) => ({
              value: l.id,
              label: `${l.nome} - ${l.servico}`,
            })),
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrcamentoStatus)}
          options={statusOptions}
        />
      </div>

      {/* Itens */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Itens</label>
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Item
          </Button>
        </div>
        <div className="space-y-2">
          {itens.map((item, index) => (
            <div
              key={item.id}
              className="p-3 bg-[var(--bg-surface-2)] rounded-md space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-secondary)] w-6">{index + 1}.</span>
                <Input
                  placeholder="Descrição"
                  value={item.descricao}
                  onChange={(e) =>
                    updateItem(item.id, 'descricao', e.target.value)
                  }
                  className="flex-1"
                />
                {isMarcenaria && (
                  <Input
                    placeholder="Ambiente"
                    value={item.ambiente || ''}
                    onChange={(e) =>
                      updateItem(item.id, 'ambiente', e.target.value)
                    }
                    className="w-32"
                  />
                )}
                <select
                  value={item.unitType || 'unidade'}
                  onChange={(e) =>
                    updateItem(item.id, 'unitType', e.target.value as UnidadeOrcamento)
                  }
                  className="h-10 px-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] w-28"
                >
                  {(unitOptionsBySegment[segment] || unitOptionsBySegment.metalurgica).map(
                    (opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    )
                  )}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
              <div className="flex items-center gap-2 pl-8">
                {item.unitType === 'm2' && (
                  <>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Largura (m)"
                      value={item.largura || ''}
                      onChange={(e) =>
                        updateItem(item.id, 'largura', Number(e.target.value))
                      }
                      className="w-28"
                    />
                    <span className="text-[var(--text-tertiary)]">×</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Altura (m)"
                      value={item.altura || ''}
                      onChange={(e) =>
                        updateItem(item.id, 'altura', Number(e.target.value))
                      }
                      className="w-28"
                    />
                  </>
                )}
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={item.quantidade}
                  onChange={(e) =>
                    updateItem(item.id, 'quantidade', Number(e.target.value))
                  }
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Valor unit."
                  value={item.valorUnitario}
                  onChange={(e) =>
                    updateItem(item.id, 'valorUnitario', Number(e.target.value))
                  }
                  className="w-28"
                />
                <span className="text-sm font-medium w-24 text-right">
                  {formatCurrency(item.valorTotal)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totais */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md p-4 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Subtotal:</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>

        {/* 🔥 MÃO DE OBRA (AQUI) */}
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Mão de obra:</span>
          <span className="font-medium text-blue-600">
            {formatCurrency(maoDeObra)}
          </span>
        </div>

        {/* Multiplicador */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--text-secondary)]">Multiplicador:</span>
          <Input
            type="number"
            step="0.1"
            value={multiplicador}
            onChange={(e) => setMultiplicador(Number(e.target.value))}
            className="w-32 text-right py-2 bg-[var(--bg-app)] text-[var(--text-primary)] border-[var(--border)]"
          />
        </div>

        {/* Dica */}
        <p className="text-xs text-[var(--text-tertiary)] text-right">
          Ex: 2.5 = 250% do valor
        </p>

        {/* Desconto */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--text-secondary)]">Desconto:</span>
          <Input
            type="number"
            value={desconto}
            onChange={(e) => setDesconto(Number(e.target.value))}
            className="w-32 text-right py-2 bg-[var(--bg-app)] text-[var(--text-primary)] border-[var(--border)]"
          />
        </div>

        {/* Total */}
        <div className="flex justify-between text-lg font-bold border-t border-[var(--border)] pt-2">
          <span>Total:</span>
          <span className="text-green-600">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Validade (dias)"
          type="number"
          value={validadeEmDias}
          onChange={(e) => setValidadeEmDias(Number(e.target.value))}
        />
      </div>

      <TextArea
        label="Observações"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        rows={3}
        placeholder="Ex: Instalação no mesmo dia. Não incluso serviço de pedreiro..."
      />

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!leadId || itens.length === 0}
        >
          {orcamento ? 'Salvar' : 'Criar Orçamento'}
        </Button>
      </div>
    </form>

    {showBaixaModal && pendingData && (
      <BaixaEstoqueModal
        orcamentoNumero={orcamento?.numero || ''}
        itens={itens}
        materiais={materiais}
        onCancel={() => {
          setShowBaixaModal(false);
          setPendingData(null);
        }}
        onConfirm={async (baixas) => {
          for (const b of baixas) {
            await movimentarEstoque(b.materialId, 'saida', b.quantidadeBaixar, `Aprovação ${orcamento?.numero || 'orçamento'}`);
          }
          await saveOrcamento(pendingData);
          addToast({
            type: 'success',
            message: `Orçamento aprovado! ${baixas.length} item(s) baixado(s) do estoque.`,
          });
        }}
      />
    )}
    </>
  );
}
