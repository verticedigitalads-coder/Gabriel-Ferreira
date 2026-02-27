import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuid } from 'uuid';
import {
  Plus,
  FileText,
  Trash2,
  Download,
  Edit,
  User,
  Calendar,
} from 'lucide-react';
import type { Orcamento, OrcamentoItem, OrcamentoStatus } from '@/types';

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
  const orcamentos = useStore(state => state.orcamentos);
  const leads = useStore(state => state.leads);
  const deleteOrcamento = useStore(state => state.deleteOrcamento);
  const addToast = useStore(state => state.addToast);

  const [showModal, setShowModal] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<Orcamento | null>(null);

  const sortedOrcamentos = useMemo(() => {
    return [...orcamentos].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orcamentos]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead?.nome || 'Lead não encontrado';
  };

  const handleEdit = (orc: Orcamento) => {
    setEditingOrcamento(orc);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      await deleteOrcamento(id);
    }
  };

  const generatePDF = (orc: Orcamento) => {
    const lead = leads.find(l => l.id === orc.leadId);
    const content = `
ORÇAMENTO ${orc.numero}
==============================
Data: ${format(parseISO(orc.createdAt), "dd/MM/yyyy", { locale: ptBR })}
Cliente: ${lead?.nome || 'N/A'}
Telefone: ${lead?.telefone || 'N/A'}
Email: ${lead?.email || 'N/A'}

ITENS:
${orc.itens.map((item, i) => `${i + 1}. ${item.descricao}
   Qtd: ${item.quantidade} x ${formatCurrency(item.valorUnitario)} = ${formatCurrency(item.valorTotal)}`).join('\n\n')}

==============================
Subtotal: ${formatCurrency(orc.subtotal)}
Desconto: ${formatCurrency(orc.desconto)}
TOTAL: ${formatCurrency(orc.total)}

Validade: ${orc.validadeEmDias} dias

${orc.observacoes ? `Observações: ${orc.observacoes}` : ''}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${orc.numero}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', message: 'Orçamento exportado!' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
            <p className="text-sm text-gray-500">{orcamentos.length} orçamentos</p>
          </div>
          <Button onClick={() => { setEditingOrcamento(null); setShowModal(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedOrcamentos.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum orçamento criado</p>
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
            {sortedOrcamentos.map(orc => (
              <Card key={orc.id} className="p-4" hoverable>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-gray-900">{orc.numero}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[orc.status]}`}>
                        {statusOptions.find(s => s.value === orc.status)?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {getLeadName(orc.leadId)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(orc.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(orc.total)}</p>
                    <p className="text-xs text-gray-500">{orc.itens.length} itens</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => generatePDF(orc)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(orc)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(orc.id)}>
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

interface OrcamentoFormProps {
  orcamento: Orcamento | null;
  onClose: () => void;
}

function OrcamentoForm({ orcamento, onClose }: OrcamentoFormProps) {
  const leads = useStore(state => state.leads);
  const addOrcamento = useStore(state => state.addOrcamento);
  const updateOrcamento = useStore(state => state.updateOrcamento);
  const updateLead = useStore(state => state.updateLead);

  const [leadId, setLeadId] = useState(orcamento?.leadId || '');
  const [status, setStatus] = useState<OrcamentoStatus>(orcamento?.status || 'rascunho');
  const [itens, setItens] = useState<OrcamentoItem[]>(orcamento?.itens || []);
  const [desconto, setDesconto] = useState(orcamento?.desconto || 0);
  const [validadeEmDias, setValidadeEmDias] = useState(orcamento?.validadeEmDias || 15);
  const [observacoes, setObservacoes] = useState(orcamento?.observacoes || '');

  const subtotal = itens.reduce((sum, item) => sum + item.valorTotal, 0);
  const total = subtotal - desconto;

  const activeLeads = leads.filter(l => l.status !== 'perdido');

  const addItem = () => {
    setItens([...itens, {
      id: uuid(),
      descricao: '',
      quantidade: 1,
      valorUnitario: 0,
      valorTotal: 0,
    }]);
  };

  const updateItem = (id: string, field: string, value: string | number) => {
    setItens(itens.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantidade' || field === 'valorUnitario') {
        updated.valorTotal = updated.quantidade * updated.valorUnitario;
      }
      return updated;
    }));
  };

  const removeItem = (id: string) => {
    setItens(itens.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      leadId,
      itens,
      subtotal,
      desconto,
      total,
      status,
      observacoes,
      validadeEmDias,
    };

    if (orcamento) {
      await updateOrcamento(orcamento.id, data);
    } else {
      await addOrcamento(data);
    }

    // Update lead value
    if (leadId && total > 0) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        await updateLead(leadId, {
          valorOrcado: total,
          orcamentoEnviado: status === 'enviado' || status === 'aprovado',
        });
      }
    }

    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Lead/Cliente *"
          value={leadId}
          onChange={e => setLeadId(e.target.value)}
          options={[
            { value: '', label: 'Selecione um lead' },
            ...activeLeads.map(l => ({ value: l.id, label: `${l.nome} - ${l.servico}` })),
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={e => setStatus(e.target.value as OrcamentoStatus)}
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
            <div key={item.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
              <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
              <Input
                placeholder="Descrição"
                value={item.descricao}
                onChange={e => updateItem(item.id, 'descricao', e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Qtd"
                value={item.quantidade}
                onChange={e => updateItem(item.id, 'quantidade', Number(e.target.value))}
                className="w-20"
              />
              <Input
                type="number"
                placeholder="Valor"
                value={item.valorUnitario}
                onChange={e => updateItem(item.id, 'valorUnitario', Number(e.target.value))}
                className="w-28"
              />
              <span className="text-sm font-medium w-24 text-right">
                {formatCurrency(item.valorTotal)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Totais */}
      <div className="bg-gray-50 rounded-md p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Desconto:</span>
          <Input
            type="number"
            value={desconto}
            onChange={e => setDesconto(Number(e.target.value))}
            className="w-32 text-right"
          />
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total:</span>
          <span className="text-green-600">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Validade (dias)"
          type="number"
          value={validadeEmDias}
          onChange={e => setValidadeEmDias(Number(e.target.value))}
        />
      </div>

      <TextArea
        label="Observações"
        value={observacoes}
        onChange={e => setObservacoes(e.target.value)}
        rows={3}
      />

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!leadId}>
          {orcamento ? 'Salvar' : 'Criar Orçamento'}
        </Button>
      </div>
    </form>
  );
}
