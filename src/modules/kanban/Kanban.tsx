import { formatCurrency } from '@/utils/formatters';
import { useDroppable } from '@dnd-kit/core';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useMaiusculaAuto } from '@/hooks/useMaiusculaAuto';
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SlidePanel } from '@/components/ui/Modal';
import { Colophon } from '@/components/editorial/Colophon';
import { LeadDetail } from '@/modules/leads/LeadDetail';
import {
  FAIXA_PRIORIDADE_LEAD,
  ROTULO_PRIORIDADE_LEAD,
  TEMPERATURA_LEAD,
  nivelPrioridade,
} from '@/modules/leads/visualLead';
import type { Lead, LeadStatus, LeadTemperature, KanbanColumn } from '@/types';
import { parseISO, isToday, isBefore } from 'date-fns';
import { GripVertical, MessageCircle, StickyNote, Clock } from 'lucide-react';
import { daysSinceContact, contactSeverity } from '@/utils/date';

const COLUMNS: { id: LeadStatus; title: string }[] = [
  { id: 'novo', title: 'Novo' },
  { id: 'atendimento', title: 'Em Atendimento' },
  { id: 'orcado', title: 'Orçado' },
  { id: 'fechado', title: 'Fechado' },
  { id: 'perdido', title: 'Perdido' },
];

export function Kanban() {
  const leads = useStore(state => state.leads);
  const updateLeadStatus = useStore(state => state.updateLeadStatus);
  const markAsFechado = useStore(state => state.markAsFechado);
  const selectLead = useStore(state => state.selectLead);
  const selectedLeadId = useStore(state => state.selectedLeadId);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const columns = useMemo<KanbanColumn[]>(() => {
    return COLUMNS.map(col => {
      const columnLeads = leads
        .filter(l => l.status === col.id)
        .sort((a, b) => b.prioridadeScore - a.prioridadeScore);

      const valorTotal = columnLeads.reduce((sum, l) => sum + (l.valorOrcado ?? 0), 0);

      return {
        id: col.id,
        title: col.title,
        leads: columnLeads,
        valorTotal,
      };
    });
  }, [leads]);

  const selectedLead = useMemo(
    () => leads.find(l => l.id === selectedLeadId),
    [leads, selectedLeadId]
  );

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;


  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const leadId = active.id as string;
    const newStatus =
      over.data.current?.sortable?.containerId || over.id;

    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    if (lead.status !== newStatus) {
      if (newStatus === 'fechado') {
        markAsFechado(leadId);
      } else {
        await updateLeadStatus(leadId, newStatus as LeadStatus);
      }
    }
  };

  // ── Redesign D3: só pele. A lógica acima é a mesma de antes. ──
  const setActiveModule = useStore(state => state.setActiveModule);

  return (
    <div className="h-full flex flex-col gap-3 md:gap-4">
      {/* Faixa fina: o header global já diz "Pipeline Comercial"; as colunas ficam com a altura */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-3">
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-[var(--accent)]" />
        <p className="ed-mono min-w-0 flex-1 truncate text-[var(--text-tertiary)]">
          <span className="sm:hidden">Arraste pela alça</span>
          <span className="hidden sm:inline">Arraste os leads entre as colunas para atualizar o status</span>
        </p>
        <p className="ed-mono shrink-0 text-[var(--text-tertiary)]">
          <span className="tnum text-[var(--text-primary)]">{leads.length}</span> leads
        </p>
      </div>

      {/* Colunas: rolagem lateral (como antes) e rolagem dentro de cada coluna */}
      <div className="flex-1 min-h-0 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          // Rolagem automática mais lenta e com zona lateral menor: no padrão do dnd-kit (20%, até 2000px/s)
          // a 390 a coluna vizinha inteira ficava na zona e o card passava dela (até cair em Fechado)
          autoScroll={{ acceleration: 2, threshold: { x: 0.1, y: 0.2 } }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 md:gap-4 h-full min-w-max pb-2">
            {columns.map((column, index) => (
              <KanbanColumnComponent
                key={column.id}
                column={column}
                index={index}
                onLeadClick={selectLead}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead && (
              <div className="relative w-64 border border-[var(--border-accent)] bg-[var(--bg-surface-2)] py-3 pl-4 pr-3 opacity-90 shadow-[var(--shadow-lg)]">
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-[3px]"
                  style={{ background: FAIXA_PRIORIDADE_LEAD[nivelPrioridade(activeLead.prioridadeLevel)] }}
                />
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{activeLead.nome}</p>
                <p className="truncate text-xs text-[var(--text-tertiary)]">{activeLead.servico}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Abaixo de md o BottomNav já tem "Início" (mesmo destino) e a altura fica para as colunas */}
      <div className="hidden md:block">
        <Colophon label="VRTX CRM · Pipeline Comercial" onBack={() => setActiveModule('dashboard')} />
      </div>

      <SlidePanel
        isOpen={!!selectedLead}
        onClose={() => selectLead(null)}
        title="Detalhes do Lead"
      >
        {selectedLead && (
          <LeadDetail lead={selectedLead} onClose={() => selectLead(null)} />
        )}
      </SlidePanel>
    </div>
  );
}

function KanbanColumnComponent({ column, index, onLeadClick, formatCurrency }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className="w-72 flex-shrink-0 flex flex-col border border-[var(--border-strong)] bg-[var(--bg-surface)]"
    >
      {/* Cabeçalho: número da etapa, nome, quantidade e soma dos valores orçados */}
      <div className="px-4 pt-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="ed-mono shrink-0 text-[var(--accent)]">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="ed-mono truncate text-[var(--text-primary)]">{column.title}</h3>
            </div>
            <p className="ed-mono tnum mt-1 min-h-[1.4em] text-[var(--text-tertiary)]">
              {column.valorTotal > 0 && formatCurrency(column.valorTotal)}
            </p>
          </div>
          <span
            className="ed-serif tnum shrink-0 text-[30px] leading-none text-[var(--text-secondary)]"
            aria-label={`${column.leads.length} leads`}
          >
            {String(column.leads.length).padStart(2, '0')}
          </span>
        </div>
        <span aria-hidden="true" className="mt-2 block h-px bg-[var(--border)]" />
        <span aria-hidden="true" className="block h-[2px] w-8 bg-[var(--accent)]" />
      </div>

      <SortableContext
        id={column.id}
        items={column.leads.map((l: Lead) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`flex-1 min-h-0 overflow-y-auto p-3 space-y-2 pb-16 transition-colors
          ${isOver ? 'bg-[var(--bg-surface-2)]' : ''}`}
        >
          {column.leads.length === 0 ? (
            <p className="ed-mono py-8 text-center text-[var(--text-tertiary)]">
              Arraste leads para cá
            </p>
          ) : (
            column.leads.map((lead: Lead) => (
              <SortableLeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick(lead.id)}
                formatCurrency={formatCurrency}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableLeadCard({ lead, onClick, formatCurrency }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const updateLead = useStore((state: any) => state.updateLead);

  const [showObs, setShowObs] = useState(false);
  const [obsText, setObsText] = useState(lead.observacoes || '');
  const refFrase = useMaiusculaAuto('frase');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showObs) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowObs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showObs]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const followUpAtrasado =
    !!lead.proximoContato &&
    (isToday(parseISO(lead.proximoContato)) ||
      isBefore(parseISO(lead.proximoContato), new Date()));

  const contactDays = daysSinceContact(lead.ultimoContato);
  const contactSev = contactSeverity(contactDays);
  const contactBorderColor =
    !followUpAtrasado && contactSev === 'warn'
      ? 'var(--warning)'
      : !followUpAtrasado && contactSev === 'crit'
        ? 'var(--danger)'
        : undefined;

  // Só visual: o nível já vem calculado (formatLead → src/lib/priority.ts)
  const nivel = nivelPrioridade(lead.prioridadeLevel);
  const temperatura = TEMPERATURA_LEAD[lead.temperatura as LeadTemperature];

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...(contactBorderColor ? { borderColor: contactBorderColor } : {}) }}
      className={`relative flex border cursor-pointer transition-colors
        ${followUpAtrasado
          ? 'bg-[var(--danger-subtle)] border-[var(--danger)]'
          : 'bg-[var(--bg-surface-2)] border-[var(--border)] hover:border-[var(--border-strong)]'}`}
      onClick={onClick}
    >
      {/* Faixa da prioridade: crítico, alto, médio, baixo */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: FAIXA_PRIORIDADE_LEAD[nivel] }}
      />

      {/* Alça (ícone de pontinhos): coluna inteira da esquerda, 44px de largura.
          touch-none só aqui: sem ele o Chrome do Android assume o gesto como rolagem e cancela o arrasto */}
      <button
        {...attributes}
        {...listeners}
        className="flex w-11 shrink-0 justify-center pt-3 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-grab active:cursor-grabbing touch-none"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0 pt-3 pr-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-[var(--text-primary)] text-sm truncate">
            {lead.nome}
          </p>
          {temperatura && (
            <span role="img" aria-label={temperatura.rotulo} title={temperatura.rotulo} className="mt-0.5 shrink-0">
              <temperatura.Icone aria-hidden="true" className="w-3.5 h-3.5" style={{ color: temperatura.cor }} />
            </span>
          )}
        </div>

        <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
          {lead.servico}
        </p>

        <div className="flex items-center justify-between gap-2 mt-2.5">
          <span className="ed-mono" style={{ color: ROTULO_PRIORIDADE_LEAD[nivel].cor }}>
            {ROTULO_PRIORIDADE_LEAD[nivel].texto}
          </span>
          {lead.valorOrcado > 0
            ? <span className="tnum text-xs font-bold text-[var(--text-primary)]">{formatCurrency(lead.valorOrcado)}</span>
            : <span className="ed-serif text-[length:var(--text-sm)] text-[var(--text-tertiary)]">Sem valor</span>
          }
        </div>

        {followUpAtrasado && (
          <p className="text-xs text-[var(--danger)] mt-2 font-semibold">
            ⚠ Follow-up atrasado
          </p>
        )}

        {/* Indicador: dias sem contato */}
        {(() => {
          const days = daysSinceContact(lead.ultimoContato);
          const sev = contactSeverity(days);
          if (sev === 'hidden') return null;
          const colorMap = {
            neutral: 'var(--text-tertiary)',
            warn: 'var(--warning)',
            crit: 'var(--danger)',
          } as const;
          const color = colorMap[sev];
          return (
            <div
              className="flex items-center gap-1 mt-2"
              style={{ color }}
            >
              <Clock style={{ width: 12, height: 12, flexShrink: 0 }} />
              <span style={{ fontSize: '11.5px', fontWeight: 500 }}>
                {days}d sem contato
              </span>
            </div>
          );
        })()}

        {/* Rodapé do card: WhatsApp + Observação */}
        <div className="flex items-center gap-1 mt-1 -ml-2">
          {/* Item 1 — WhatsApp */}
          {lead.telefone && (
            <button
              onClick={e => {
                e.stopPropagation();
                const cleanPhone = lead.telefone.replace(/\D/g, '');
                const phone = cleanPhone.startsWith('55') && cleanPhone.length >= 12
                  ? cleanPhone
                  : `55${cleanPhone}`;
                window.open(`https://wa.me/${phone}`, '_blank');
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--success)] hover:opacity-80 transition-opacity min-h-[44px] px-2"
              title="Abrir WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </button>
          )}

          {/* Item 2 — Observação rápida. O popover ocupa a largura do card (não sai da tela no celular) */}
          <div ref={popoverRef}>
            <button
              onClick={e => { e.stopPropagation(); setShowObs(v => !v); }}
              className="flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
              title="Observação rápida"
            >
              <StickyNote className="w-3.5 h-3.5" />
              {lead.observacoes && (
                <span className="w-1.5 h-1.5 bg-[var(--accent)] inline-block" />
              )}
            </button>

            {showObs && (
              <div
                className="absolute left-0 right-0 top-full z-50 mt-1 border border-[var(--border-strong)] bg-[var(--bg-surface)] p-2 space-y-2 shadow-[var(--shadow-lg)]"
                onClick={e => e.stopPropagation()}
              >
                <textarea
                  ref={refFrase}
                  autoCapitalize="sentences"
                  value={obsText}
                  onChange={e => setObsText(e.target.value)}
                  rows={3}
                  className="w-full text-xs border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] p-2 resize-none focus:outline-none focus:border-[var(--accent)]"
                  placeholder="Observação..."
                  autoFocus
                />
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    const ok = await updateLead(lead.id, { observacoes: obsText });
                    if (ok) setShowObs(false);
                  }}
                  className="w-full min-h-[44px] text-xs font-semibold bg-[var(--accent)] text-[var(--bg-app)] hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Salvar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
