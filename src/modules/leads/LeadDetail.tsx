import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useLeadActions } from '@/hooks/useLeadActions';
import { Button } from '@/components/ui/Button';
import { StatusBadge, TemperatureBadge, PriorityBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LeadForm } from './LeadForm';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  FileText,
  Clock,
  History,
} from 'lucide-react';
import type { Lead } from '@/types';

interface LeadDetailProps {
  lead: Lead;
  onClose: () => void;
}

export function LeadDetail({ lead, onClose }: LeadDetailProps) {
  const deleteLead = useStore(state => state.deleteLead);
  const addOperacionalTask = useStore(state => state.addOperacionalTask);
  const { registerContact, markAsOrcado, markAsFechado, openWhatsApp, copyPhone } = useLeadActions();

  // 🔒 Proteção crítica contra undefined (Realtime safe)
  if (!lead) {
    return (
      <div className="p-6 text-gray-500">
        Carregando lead...
      </div>
    );
  }

  const [showEditModal, setShowEditModal] = useState(false);
  const [showOrcamentoModal, setShowOrcamentoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [visitDate, setVisitDate] = useState("")

  const [valorOrcamento, setValorOrcamento] = useState(
    lead.valorOrcado ? lead.valorOrcado.toString() : ""
  );

  const diasSemContato = lead.ultimoContato
    ? differenceInDays(new Date(), parseISO(lead.ultimoContato))
    : null;

  const formatCurrency = (value?: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleDelete = async () => {
    await deleteLead(lead.id);
    onClose();
  };

  const handleMarkAsOrcado = async () => {
    const valor = Number(valorOrcamento);

    if (!valor || isNaN(valor)) return;

    await markAsOrcado(lead.id, valor);
    setShowOrcamentoModal(false);
  };

const handleScheduleVisit = async () => {

  if (!visitDate) return

  await addOperacionalTask({
    titulo: `Visita orçamento - ${lead.nome}`,
    data: visitDate,
    tipo: "visita",
    prioridade: "media",
    leadId: lead.id
  })

  setShowVisitModal(false)
};

  // 🔥 Resto do seu JSX continua normalmente abaixo

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{lead.nome}</h2>
            <p className="text-sm text-gray-500 mt-1">{lead.servico}</p>
          </div>
          <PriorityBadge level={lead.prioridadeLevel} score={lead.prioridadeScore} />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <StatusBadge status={lead.status} />
          <TemperatureBadge temperatura={lead.temperatura} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Ações Rápidas */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="primary"
            onClick={() => registerContact(lead.id)}
            className="gap-2"
          >
            <Phone className="w-4 h-4" />
            Registrar Contato
          </Button>
          <Button
            variant="secondary"
            onClick={() => openWhatsApp(lead.telefone, lead.nome)}
            className="gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
          {lead.status !== 'fechado' && lead.status !== 'perdido' && (
  <>
  
  <Button
    variant="secondary"
    onClick={() => setShowVisitModal(true)}
    className="gap-2"
>
    <Calendar className="w-4 h-4" />
    Marcar Visita
  </Button>

  <Button
    variant="secondary"
    onClick={() => setShowOrcamentoModal(true)}
    className="gap-2"
  >
    <FileText className="w-4 h-4" />
    Marcar Orçado
  </Button>

  <Button
    variant="success"
    onClick={() => markAsFechado(lead.id)}
    className="gap-2"
  >
    <CheckCircle className="w-4 h-4" />
    Fechar Negócio
  </Button>

  </>
)}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Phone className="w-4 h-4" />
              <span className="text-xs font-medium">Telefone</span>
            </div>
            <p
              className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
              onClick={() => copyPhone(lead.telefone)}
            >
              {lead.telefone}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Mail className="w-4 h-4" />
              <span className="text-xs font-medium">Email</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{lead.email || '-'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Último Contato</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {lead.ultimoContato
                ? format(parseISO(lead.ultimoContato), "dd 'de' MMM", { locale: ptBR })
                : 'Nunca'}
            </p>
            {diasSemContato !== null && diasSemContato > 3 && (
              <p className="text-xs text-red-600 mt-1">⚠️ {diasSemContato} dias atrás</p>
            )}
          </div>
          <div className="p-4 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Próximo Contato</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {lead.proximoContato
                ? format(parseISO(lead.proximoContato), "dd 'de' MMM", { locale: ptBR })
                : 'Não agendado'}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-md col-span-2">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">Valor Orçado</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(lead.valorOrcado)}</p>
            {lead.orcamentoEnviado && (
              <span className="text-xs text-green-600">✓ Orçamento enviado</span>
            )}
          </div>
        </div>

        {/* Resumo */}
        {lead.resumo && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Resumo</h3>
            <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">{lead.resumo}</p>
          </div>
        )}

        {/* Observações */}
        {lead.observacoes && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Observações</h3>
            <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">{lead.observacoes}</p>
          </div>
        )}

        {/* Histórico */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico
          </h3>
          <div className="space-y-2">
            {(Array.isArray(lead.historico) ? lead.historico : [])
  .slice()
  .reverse()
  .map(entry => (
    <div key={entry.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
      <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
      <div className="flex-1">
        <p className="text-sm text-gray-900">{entry.descricao}</p>
        <p className="text-xs text-gray-500 mt-1">
          {entry.createdAt
            ? format(parseISO(entry.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
            : ''}
        </p>
      </div>
    </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          className="gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Excluir
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowEditModal(true)}
          className="gap-1"
        >
          <Edit className="w-4 h-4" />
          Editar
        </Button>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Lead"
        size="lg"
      >
        <LeadForm lead={lead} onClose={() => setShowEditModal(false)} />
      </Modal>

      <Modal
        isOpen={showOrcamentoModal}
        onClose={() => setShowOrcamentoModal(false)}
        title="Marcar como Orçado"
      >
        <div className="p-6 space-y-4">
          <Input
            label="Valor do Orçamento (R$)"
            type="number"
            value={valorOrcamento}
            onChange={e => setValorOrcamento(e.target.value)}
            placeholder="0"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowOrcamentoModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleMarkAsOrcado}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirmar Exclusão"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Tem certeza que deseja excluir o lead <strong>{lead.nome}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    
   <Modal
  isOpen={showVisitModal}
  onClose={() => setShowVisitModal(false)}
  title="Agendar Visita"
>

<div className="p-6 space-y-4">

<Input
label="Data da visita"
type="date"
value={visitDate}
onChange={(e)=>setVisitDate(e.target.value)}
/>

<div className="flex justify-end gap-2">

<Button
variant="secondary"
onClick={()=>setShowVisitModal(false)}
>
Cancelar
</Button>

<Button
variant="primary"
onClick={handleScheduleVisit}
>
Confirmar
</Button>

</div>

</div>

</Modal>

   </div>
  );
}
