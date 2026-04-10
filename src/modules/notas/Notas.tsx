import { formatCurrency } from '@/utils/formatters';
import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  FileCheck,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { Nota, NotaStatus } from '@/types';

const statusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'emitida', label: 'Emitida' },
  { value: 'cancelada', label: 'Cancelada' },
];

const statusColors: Record<NotaStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  emitida: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
};

const statusIcons: Record<NotaStatus, React.ReactNode> = {
  pendente: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  emitida: <CheckCircle className="w-5 h-5 text-green-500" />,
  cancelada: <XCircle className="w-5 h-5 text-red-500" />,
};

export function Notas() {
  const notas = useStore(state => state.notas);
  const leads = useStore(state => state.leads);
  const deleteNota = useStore(state => state.deleteNota);

  const [showModal, setShowModal] = useState(false);
  const [editingNota, setEditingNota] = useState<Nota | null>(null);

  const sortedNotas = useMemo(() => {
    return [...notas].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notas]);


  const getLeadName = (leadId?: string) => {
    if (!leadId) return null;
    const lead = leads.find(l => l.id === leadId);
    return lead?.nome;
  };

  const handleEdit = (nota: Nota) => {
    setEditingNota(nota);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      await deleteNota(id);
    }
  };

  const stats = useMemo(() => {
    const pendentes = notas.filter(n => n.status === 'pendente');
    const emitidas = notas.filter(n => n.status === 'emitida');
    const valorTotal = emitidas.reduce((sum, n) => sum + n.valor, 0);
    return { pendentes: pendentes.length, emitidas: emitidas.length, valorTotal };
  }, [notas]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notas Fiscais</h1>
            <p className="text-sm text-[var(--text-tertiary)]">Controle de notas fiscais</p>
          </div>
          <Button onClick={() => { setEditingNota(null); setShowModal(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Nota
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-tertiary)]">Pendentes:</span>
            <span className="font-semibold text-yellow-600">{stats.pendentes}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-tertiary)]">Emitidas:</span>
            <span className="font-semibold text-green-600">{stats.emitidas}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-tertiary)]">Valor Total Emitido:</span>
            <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(stats.valorTotal)}</span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Preparado para integração futura</p>
            <p className="text-xs text-blue-600 mt-1">
              Este módulo está preparado para futura integração com APIs de emissão de notas fiscais municipais.
              Por enquanto, funciona como controle interno.
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedNotas.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma nota registrada</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => setShowModal(true)}
            >
              Registrar primeira nota
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedNotas.map(nota => (
              <Card key={nota.id} className="p-4" hoverable>
                <div className="flex items-center gap-4">
                  {statusIcons[nota.status]}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        Nota #{nota.numero}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[nota.status]}`}>
                        {statusOptions.find(s => s.value === nota.status)?.label}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {nota.leadId && <span>{getLeadName(nota.leadId)} • </span>}
                      {format(parseISO(nota.data), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(nota.valor)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(nota)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(nota.id)}>
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
        title={editingNota ? 'Editar Nota' : 'Nova Nota'}
      >
        <NotaForm
          nota={editingNota}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}

interface NotaFormProps {
  nota: Nota | null;
  onClose: () => void;
}

function NotaForm({ nota, onClose }: NotaFormProps) {
  const leads = useStore(state => state.leads);
  const addNota = useStore(state => state.addNota);
  const updateNota = useStore(state => state.updateNota);

  const [numero, setNumero] = useState(nota?.numero || '');
  const [valor, setValor] = useState(nota?.valor || 0);
  const [data, setData] = useState(nota?.data || format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<NotaStatus>(nota?.status || 'pendente');
  const [leadId, setLeadId] = useState(nota?.leadId || '');
  const [observacoes, setObservacoes] = useState(nota?.observacoes || '');

  const closedLeads = leads.filter(l => l.status === 'fechado');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const notaData = {
      numero,
      valor,
      data,
      status,
      leadId: leadId || undefined,
      observacoes,
    };

    if (nota) {
      await updateNota(nota.id, notaData);
    } else {
      await addNota(notaData);
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <Input
        label="Número da Nota *"
        value={numero}
        onChange={e => setNumero(e.target.value)}
        placeholder="Ex: 001234"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor (R$) *"
          type="number"
          value={valor}
          onChange={e => setValor(Number(e.target.value))}
          required
        />
        <Input
          label="Data *"
          type="date"
          value={data}
          onChange={e => setData(e.target.value)}
          required
        />
      </div>
      <Select
        label="Status"
        value={status}
        onChange={e => setStatus(e.target.value as NotaStatus)}
        options={statusOptions}
      />
      <Select
        label="Vincular a Lead"
        value={leadId}
        onChange={e => setLeadId(e.target.value)}
        options={[
          { value: '', label: 'Nenhum' },
          ...closedLeads.map(l => ({
            value: l.id,
            label: l.nome,
          })),
        ]}
      />
      <TextArea
        label="Observações"
        value={observacoes}
        onChange={e => setObservacoes(e.target.value)}
        rows={2}
      />
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {nota ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
}
