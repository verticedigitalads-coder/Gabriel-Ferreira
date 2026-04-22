import { formatCurrency } from '@/utils/formatters';
import { useDroppable } from '@dnd-kit/core';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
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
import { TemperatureBadge, PriorityBadge } from '@/components/ui/Badge';
import { SlidePanel } from '@/components/ui/Modal';
import { LeadDetail } from '@/modules/leads/LeadDetail';
import type { Lead, LeadStatus, KanbanColumn } from '@/types';
import { parseISO, isToday, isBefore } from 'date-fns';
import { GripVertical, DollarSign, MessageCircle, StickyNote } from 'lucide-react';

const COLUMNS: { id: LeadStatus; title: string; color: string }[] = [
  { id: 'novo', title: 'Novo', color: 'border-t-blue-500' },
  { id: 'atendimento', title: 'Em Atendimento', color: 'border-t-purple-500' },
  { id: 'orcado', title: 'Orçado', color: 'border-t-yellow-500' },
  { id: 'fechado', title: 'Fechado', color: 'border-t-green-500' },
  { id: 'perdido', title: 'Perdido', color: 'border-t-gray-400' },
];

export function Kanban() {
  const leads = useStore(state => state.leads);
  const updateLeadStatus = useStore(state => state.updateLeadStatus);
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const leadId = active.id as string;
    const newStatus =
      over.data.current?.sortable?.containerId || over.id;

    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    if (lead.status !== newStatus) {
      updateLeadStatus(leadId, newStatus as LeadStatus);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 md:p-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">Kanban</h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          Arraste os leads entre as colunas para atualizar o status
        </p>
      </div>

      <div className="flex-1 overflow-x-auto p-2 md:p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column, index) => (
              <KanbanColumnComponent
                key={column.id}
                column={column}
                colorClass={COLUMNS[index].color}
                onLeadClick={selectLead}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-lg p-3 w-64 opacity-90">
                <p className="font-semibold text-[var(--text-primary)]">{activeLead.nome}</p>
                <p className="text-sm text-[var(--text-tertiary)]">{activeLead.servico}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
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

function KanbanColumnComponent({ column, colorClass, onLeadClick, formatCurrency }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 flex-shrink-0 bg-[var(--bg-surface-2)] rounded-md border-t-4 ${colorClass} flex flex-col`}
    >
      <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-surface-3)] rounded-t-md">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-primary)]">{column.title}</h3>
          <span className="text-sm text-[var(--text-secondary)]">{column.leads.length}</span>
        </div>

        {column.valorTotal > 0 && (
          <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-tertiary)]">
            <DollarSign className="w-3 h-3" />
            {formatCurrency(column.valorTotal)}
          </div>
        )}
      </div>

      <SortableContext
        id={column.id}
        items={column.leads.map((l: Lead) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-[600px] pb-32 transition
          ${isOver ? 'bg-[var(--bg-surface-3)]' : ''}`}
        >
          {column.leads.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">
              Arraste leads para cá
            </div>
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-md p-3 cursor-pointer transition-shadow
        ${followUpAtrasado
          ? 'bg-[var(--danger-subtle)] border-[var(--danger)]'
          : 'bg-[var(--bg-surface)] border-[var(--border)]'}
        hover:shadow-md`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-grab active:cursor-grabbing"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-[var(--text-primary)] text-sm truncate">
              {lead.nome}
            </p>
            <PriorityBadge level={lead.prioridadeLevel} />
          </div>

          <p className="text-xs text-[var(--text-tertiary)] truncate mb-2">
            {lead.servico}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <TemperatureBadge temperatura={lead.temperatura} />
            {lead.valorOrcado > 0
              ? <span className="text-xs font-medium text-[var(--text-secondary)]">{formatCurrency(lead.valorOrcado)}</span>
              : <span className="text-xs text-[var(--text-tertiary)]">Sem valor</span>
            }
          </div>

          {followUpAtrasado && (
            <p className="text-xs text-[var(--danger)] mt-2 font-semibold">
              ⚠ Follow-up atrasado
            </p>
          )}

          {/* Rodapé do card: WhatsApp + Observação */}
          <div className="flex items-center gap-3 mt-2">
            {/* Item 1 — WhatsApp */}
            {lead.telefone && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  window.open(`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`, '_blank');
                }}
                className="flex items-center gap-1 text-xs text-green-500 hover:text-green-400 transition-colors min-h-[44px] px-2 py-2"
                title="Abrir WhatsApp"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </button>
            )}

            {/* Item 2 — Observação rápida */}
            <div className="relative" ref={popoverRef}>
              <button
                onClick={e => { e.stopPropagation(); setShowObs(v => !v); }}
                className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors min-h-[44px] px-2 py-2"
                title="Observação rápida"
              >
                <StickyNote className="w-3 h-3" />
                {lead.observacoes && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block" />
                )}
              </button>

              {showObs && (
                <div
                  className="absolute right-0 top-8 z-50 w-56 max-w-[calc(100vw-2rem)] bg-[var(--bg-surface)] border border-[var(--border)] rounded shadow-lg p-2 space-y-2"
                  onClick={e => e.stopPropagation()}
                >
                  <textarea
                    value={obsText}
                    onChange={e => setObsText(e.target.value)}
                    rows={3}
                    className="w-full text-xs border border-[var(--border)] rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)] p-1 resize-none"
                    placeholder="Observação..."
                    autoFocus
                  />
                  <button
                    onClick={async e => {
                      e.stopPropagation();
                      await updateLead(lead.id, { observacoes: obsText });
                      setShowObs(false);
                    }}
                    className="w-full text-xs bg-[var(--accent)] text-white rounded py-2 hover:bg-[var(--accent-hover)]"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
