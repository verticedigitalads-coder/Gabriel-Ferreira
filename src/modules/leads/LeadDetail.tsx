import { formatPhone, formatCurrency } from '@/utils/formatters';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useLeadActions } from '@/hooks/useLeadActions';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { LeadForm } from './LeadForm';
import {
  FAIXA_PRIORIDADE_LEAD,
  ROTULO_PRIORIDADE_LEAD,
  TEMPERATURA_LEAD,
  nivelPrioridade,
} from './visualLead';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  FileText,
  Clock,
} from 'lucide-react';
import type { Lead, LeadTemperature } from '@/types';
import { HISTORICO_TIPO } from '@/types';

// Redesign D3: célula da grade de informações e rótulo em mono (só visual)
const CELULA = 'bg-[var(--bg-surface)] p-4 min-w-0';
const ROTULO = 'ed-mono flex items-center gap-2 text-[var(--text-tertiary)] mb-1.5';

interface LeadDetailProps {
  lead: Lead;
  onClose: () => void;
}

export function LeadDetail({ lead, onClose }: LeadDetailProps) {
  const deleteLead = useStore((state) => state.deleteLead);
  const addOperacionalTask = useStore((state) => state.addOperacionalTask);
  const updateLead = useStore((state) => state.updateLead);
  const handleMarkAsOrcado = useStore((state: any) => state.handleMarkAsOrcado);
  const markAsFechado = useStore((state: any) => state.markAsFechado);
  const addToast = useStore((state: any) => state.addToast);

  const { openWhatsApp, copyPhone } = useLeadActions();

  // 🔒 Proteção crítica contra undefined (Realtime safe)
  if (!lead) {
    return <div className="p-6 text-[var(--text-tertiary)]">Carregando lead...</div>;
  }

  const [isClosing, setIsClosing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOrcamentoModal, setShowOrcamentoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitDate, setVisitDate] = useState('');

  const [valorOrcamento, setValorOrcamento] = useState(
    lead.valorOrcado != null ? String(lead.valorOrcado) : '',
  );

  const [showContatoModal, setShowContatoModal] = useState(false);
  const [textoContato, setTextoContato] = useState('');
  const [dataProximoContato, setDataProximoContato] = useState('');
  const [isSavingContato, setIsSavingContato] = useState(false);

  const diasSemContato = lead.ultimoContato
    ? differenceInDays(new Date(), parseISO(lead.ultimoContato))
    : null;

  const handleDelete = async () => {
    const ok = await deleteLead(lead.id);
    if (!ok) return;
    onClose();
  };

  const handleFechamento = async () => {
    setIsClosing(true);
    await markAsFechado(lead.id);
    setIsClosing(false);
    onClose();
  };

  const handleConfirmOrcamento = async () => {
    const valor = Number(valorOrcamento);

    if (!valor || isNaN(valor)) return;

    await handleMarkAsOrcado(lead.id, valor);

    setShowOrcamentoModal(false);
  };

  const handleScheduleVisit = async () => {
    if (!visitDate) return;

    const ok = await addOperacionalTask({
      titulo: `Visita orçamento - ${lead.nome}`,
      data: visitDate,
      tipo: 'visita',
      prioridade: 'media',
      leadId: lead.id,
    });

    if (!ok) return;

    setShowVisitModal(false);
  };

  const handleRegistrarContato = async () => {
    if (!textoContato.trim()) return;

    setIsSavingContato(true);
    let ok = false;
    try {
      ok = await updateLead(lead.id, {
        ultimoContato: format(new Date(), 'yyyy-MM-dd'),
        proximoContato: dataProximoContato || lead.proximoContato,
        historico: [
          ...(Array.isArray(lead.historico) ? lead.historico : []),
          {
            id: crypto.randomUUID(),
            tipo: HISTORICO_TIPO.CONTATO,
            descricao: textoContato.trim(),
            createdAt: new Date().toISOString(),
          },
        ],
      });
    } finally {
      setIsSavingContato(false);
    }

    if (!ok) return;

    addToast({ type: 'success', message: 'Contato registrado!' });
    setShowContatoModal(false);
    setTextoContato('');
    setDataProximoContato('');
  };

  // ── Redesign D3: só pele. A lógica acima é a mesma de antes. ──
  // O nível já vem calculado (formatLead → src/lib/priority.ts).
  const nivel = nivelPrioridade(lead.prioridadeLevel);
  const temperatura = TEMPERATURA_LEAD[lead.temperatura as LeadTemperature];
  // Numeração contínua só das seções que aparecem (Resumo e Observações são opcionais)
  let secao = 0;
  const proxima = () => String(++secao).padStart(2, '0');

  return (
    <div className="h-full flex flex-col">
      {/* Header: faixa da prioridade, nome, serviço, status, temperatura e prioridade */}
      <div className="relative p-4 pt-5 md:p-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px]" style={{ background: FAIXA_PRIORIDADE_LEAD[nivel] }} />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[length:var(--text-2xl)]! font-bold! leading-tight break-words text-[var(--text-primary)]">{lead.nome}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{lead.servico}</p>
          </div>
          <span className="ed-mono shrink-0 pt-1.5" style={{ color: ROTULO_PRIORIDADE_LEAD[nivel].cor }}>
            {ROTULO_PRIORIDADE_LEAD[nivel].texto}
            {lead.prioridadeScore !== undefined && (
              <span className="tnum ml-1 opacity-80">({lead.prioridadeScore})</span>
            )}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <StatusBadge status={lead.status} />
          {temperatura && (
            <span className="ed-mono flex items-center gap-1.5 border border-[var(--border)] px-2 py-0.5 text-[var(--text-secondary)]">
              <temperatura.Icone aria-hidden="true" className="w-3 h-3" style={{ color: temperatura.cor }} />
              {temperatura.rotulo}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 md:space-y-6">
        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant="primary"
            onClick={() => setShowContatoModal(true)}
            className="gap-2 rounded-none text-[var(--bg-app)]"
          >
            <Phone className="w-4 h-4" />
            Registrar Contato
          </Button>
          <Button
            variant="secondary"
            onClick={() => openWhatsApp(lead.telefone, lead.nome)}
            className="gap-2 rounded-none"
          >
            <MessageCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
            WhatsApp
          </Button>
          {lead.status !== 'fechado' && lead.status !== 'perdido' && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowVisitModal(true)}
                className="gap-2 rounded-none"
              >
                <Calendar className="w-4 h-4" />
                Marcar Visita
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowOrcamentoModal(true)}
                className="gap-2 rounded-none"
              >
                <FileText className="w-4 h-4" />
                Marcar Orçado
              </Button>

              <Button
                variant="success"
                onClick={handleFechamento}
                disabled={isClosing}
                className="gap-2 rounded-none sm:col-span-2"
              >
                <CheckCircle className="w-4 h-4" />
                {isClosing ? 'Fechando...' : 'Fechar Negócio'}
              </Button>
            </>
          )}
        </div>

        {/* Info: grade com fios */}
        <div className="grid grid-cols-2 gap-px border border-[var(--border)] bg-[var(--border)]">
          <div className={CELULA}>
            <div className={ROTULO}>
              <Phone className="w-3.5 h-3.5" />
              <span>Telefone</span>
            </div>
            <button
              type="button"
              className="-mx-1 px-1 min-h-[44px] max-w-full text-left text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate"
              onClick={() => copyPhone(lead.telefone)}
              title="Copiar telefone"
            >
              {formatPhone(lead.telefone)}
            </button>
          </div>
          <div className={CELULA}>
            <div className={ROTULO}>
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </div>
            {lead.email
              ? <p className="text-sm font-medium text-[var(--text-primary)] truncate">{lead.email}</p>
              : <p className="ed-serif text-[length:var(--text-md)] text-[var(--text-tertiary)]">Não informado</p>
            }
          </div>
          <div className={`${CELULA} col-span-2`}>
            <div className={ROTULO}>
              <MapPin className="w-3.5 h-3.5" />
              <span>Endereço</span>
            </div>
            {lead.endereco
              ? <p className="text-sm font-medium text-[var(--text-primary)]">{lead.endereco}</p>
              : <p className="ed-serif text-[length:var(--text-md)] text-[var(--text-tertiary)]">Não informado</p>
            }
          </div>
          <div className={CELULA}>
            <div className={ROTULO}>
              <Clock className="w-3.5 h-3.5" />
              <span>Último Contato</span>
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {lead.ultimoContato
                ? format(parseISO(lead.ultimoContato), "dd 'de' MMM", {
                    locale: ptBR,
                  })
                : 'Nunca'}
            </p>
            {diasSemContato !== null && diasSemContato > 3 && (
              <p className="text-xs text-[var(--danger)] mt-1">
                ⚠️ {diasSemContato} dias atrás
              </p>
            )}
          </div>
          <div className={CELULA}>
            <div className={ROTULO}>
              <Calendar className="w-3.5 h-3.5" />
              <span>Próximo Contato</span>
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {lead.proximoContato
                ? format(parseISO(lead.proximoContato), "dd 'de' MMM", {
                    locale: ptBR,
                  })
                : 'Não agendado'}
            </p>
          </div>
          <div className={`${CELULA} col-span-2`}>
            <div className={ROTULO}>
              <DollarSign className="w-3.5 h-3.5" />
              <span>Valor Orçado</span>
            </div>
            <p className="tnum text-[length:var(--text-xl)] font-bold text-[var(--text-primary)]">
              {formatCurrency(lead.valorOrcado ?? 0)}
            </p>
            {lead.orcamentoEnviado && (
              <span className="text-xs text-[var(--success)]">
                ✓ Orçamento enviado
              </span>
            )}
          </div>
        </div>

        {/* Resumo */}
        {lead.resumo && (
          <div>
            <SectionHeading index={proxima()} label="Resumo" />
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] border-l-2 border-[var(--border-strong)] pl-3">
              {lead.resumo}
            </p>
          </div>
        )}

        {/* Observações */}
        {lead.observacoes && (
          <div>
            <SectionHeading index={proxima()} label="Observações" />
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] border-l-2 border-[var(--border-strong)] pl-3">
              {lead.observacoes}
            </p>
          </div>
        )}

        {/* Histórico: linha do tempo, do mais novo para o mais antigo */}
        <div>
          <SectionHeading index={proxima()} label="Histórico" />
          <ol className="mt-3 ml-1 border-l border-[var(--border)]">
            {(Array.isArray(lead.historico) ? lead.historico : [])
              .slice()
              .reverse()
              .map((entry) => (
                <li
                  key={entry.id}
                  className="relative pl-5 pb-4 last:pb-0"
                >
                  <span aria-hidden="true" className="absolute -left-[4px] top-1.5 h-2 w-2 bg-[var(--accent)]" />
                  <p className="text-sm text-[var(--text-primary)]">{entry.descricao}</p>
                  <p className="ed-mono mt-1 text-[var(--text-tertiary)]">
                    {entry.createdAt
                      ? format(
                          parseISO(entry.createdAt),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR },
                        )
                      : ''}
                  </p>
                </li>
              ))}
          </ol>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          className="gap-1 rounded-none"
          style={{ color: 'var(--danger)' }}
        >
          <Trash2 className="w-4 h-4" />
          Excluir
        </Button>
        <Button
          variant="primary"
          onClick={() => setShowEditModal(true)}
          className="gap-1 rounded-none text-[var(--bg-app)]"
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
        <div className="p-4 md:p-6 space-y-4">
          <Input
            label="Valor do Orçamento (R$)"
            type="number"
            value={valorOrcamento}
            onChange={(e) => {
              const value = e.target.value;

              // 🔒 evita valores inválidos
              if (value === '' || Number(value) >= 0) {
                setValorOrcamento(value);
              }
            }}
            placeholder="0"
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowOrcamentoModal(false)}
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              onClick={handleConfirmOrcamento}
              disabled={!valorOrcamento || Number(valorOrcamento) <= 0}
            >
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
        <div className="p-4 md:p-6">
          <p className="text-[var(--text-secondary)] mb-6">
            Tem certeza que deseja excluir o lead <strong>{lead.nome}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
            >
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
        <div className="p-4 md:p-6 space-y-4">
          <Input
            label="Data da visita"
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowVisitModal(false)}
            >
              Cancelar
            </Button>

            <Button variant="primary" onClick={handleScheduleVisit}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showContatoModal}
        onClose={() => setShowContatoModal(false)}
        title="Registrar Contato"
      >
        <div className="p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              O que foi tratado? *
            </label>
            <textarea
              value={textoContato}
              onChange={e => setTextoContato(e.target.value)}
              rows={3}
              className="w-full border border-[var(--border)] rounded p-2 bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-sm resize-none"
              placeholder="Descreva o contato realizado..."
            />
          </div>
          <Input
            label="Próximo contato (opcional)"
            type="date"
            value={dataProximoContato}
            onChange={e => setDataProximoContato(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowContatoModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleRegistrarContato}
              disabled={!textoContato.trim() || isSavingContato}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
