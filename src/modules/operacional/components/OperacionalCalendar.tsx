import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from '@dnd-kit/core';
import { Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';

import { calculateOperationalUrgency } from '@/domain/operacional/calculateOperationalUrgency';
import { getStatusLabel } from '@/lib/priority';
import { cn } from '@/utils/cn';
import { statusConfig } from '../statusConfig';
import { FAIXA_PRIORIDADE } from './faixaPrioridade';

type FilterMode = 'all' | 'critical' | 'urgent' | 'delayed';

// Chips da agenda (redesign D2): mesmos valores de filterMode de antes
const FILTROS: { id: FilterMode; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'critical', label: 'Críticas' },
  { id: 'urgent', label: 'Urgentes' },
  { id: 'delayed', label: 'Atrasadas' },
];

// Botões do card: 44px em 1 coluna (abaixo de lg), tamanho anterior em lg+ (para caber nas 7 colunas)
const BOTAO_CARD = 'flex min-h-[44px] min-w-[44px] items-center justify-center p-1.5 transition-colors lg:min-h-0 lg:min-w-0';

function DraggableTask({ task, onDelete, onEdit }: any) {
  const updateTask = useStore((state: any) => state.updateOperacionalTask);
  const leads = useStore((state) => state.leads);

  const lead = task.leadId
    ? leads.find((l: any) => l.id === task.leadId)
    : null;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const urgencyScore = calculateOperationalUrgency({
    ...task,
    lead,
  });

  const isCritical = urgencyScore >= 60;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task); // 🔥 chama o modal do Operacional
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task);
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative w-full max-w-full border bg-[var(--bg-surface-2)] py-2 pl-3 pr-1.5 text-xs transition-all duration-200 hover:shadow-md motion-reduce:transition-none ${task.concluido ? 'opacity-60' : ''}`}
      style={{
        ...style,
        borderColor: isCritical ? 'var(--danger)' : 'var(--border)',
      }}
    >
      {/* Faixa da prioridade da tarefa */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: FAIXA_PRIORIDADE[task.prioridade] ?? FAIXA_PRIORIDADE.media }}
      />

      {/* Área arrastável */}
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing mb-2"
      >
        <p className={`font-semibold text-xs leading-tight break-words text-[var(--text-primary)] ${task.concluido ? 'line-through italic' : ''}`} title={task.titulo}>
          {task.titulo}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: statusConfig[task.status || 'pendente']?.color }}>
          Status: {statusConfig[task.status || 'pendente']?.label}
        </p>
        {lead && (
          <p className="text-[10px] text-[var(--text-tertiary)] truncate">
            {lead.nome} • {getStatusLabel(lead.status)}
          </p>
        )}
        {isCritical && (
          <span className="inline-block text-[9px] bg-[var(--danger)] text-white px-1 mt-1">
            CRÍTICA
          </span>
        )}
      </div>

      {/* Botões de ação — fora da área arrastável; quebram linha em coluna estreita */}
      <div className="flex flex-wrap items-center justify-end gap-1 pt-1 border-t border-[var(--border)]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateTask(task.id, { concluido: !task.concluido });
          }}
          className={`${BOTAO_CARD} ${task.concluido ? 'text-[var(--success)]' : 'text-[var(--text-tertiary)] hover:text-[var(--success)]'}`}
          title={task.concluido ? 'Marcar como pendente' : 'Concluir'}
        >
          {task.concluido ? <CheckCircle2 size={14} /> : <Circle size={14} />}
        </button>

        <button
          onClick={handleEdit}
          className={`${BOTAO_CARD} text-[var(--text-tertiary)] hover:text-[var(--accent)]`}
          title="Editar"
        >
          <Pencil size={14} />
        </button>

        <button
          onClick={handleDelete}
          className={`${BOTAO_CARD} text-[var(--text-tertiary)] hover:text-[var(--danger)]`}
          title="Excluir"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

const DAY_ABBREV: Record<string, string> = {
  'segunda-feira': 'Seg', 'terça-feira': 'Ter', 'quarta-feira': 'Qua',
  'quinta-feira': 'Qui', 'sexta-feira': 'Sex', 'sábado': 'Sáb', 'domingo': 'Dom',
};

function DroppableDay({ day, tasks, onDelete, onEdit, isToday }: any) {
  const { setNodeRef } = useDroppable({
    id: day.dateString,
  });

  const leads = useStore((state) => state.leads);

  const sortedTasks = [...tasks].sort((a, b) => {
    const leadA = a.leadId ? leads.find((l: any) => l.id === a.leadId) : null;

    const leadB = b.leadId ? leads.find((l: any) => l.id === b.leadId) : null;

    const scoreA = calculateOperationalUrgency({
      ...a,
      lead: leadA,
    });

    const scoreB = calculateOperationalUrgency({
      ...b,
      lead: leadB,
    });

    return scoreB - scoreA;
  });

  const isEmpty = sortedTasks.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={cn('relative min-w-0', isEmpty ? 'px-3 py-2 min-h-[48px] lg:px-2 lg:py-3 lg:min-h-[160px]' : 'px-3 pt-3 pb-4 min-h-[160px] lg:px-2')}
    >
      {isToday && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-[var(--accent)]" />}

      <div className={cn('flex flex-wrap items-baseline gap-x-2', isEmpty ? 'min-h-[32px]' : 'mb-3')}>
        <span
          className={cn(
            'ed-mono',
            isToday ? 'text-[var(--accent)]' : isEmpty ? 'text-[var(--text-disabled)]' : 'text-[var(--text-tertiary)]'
          )}
        >
          {DAY_ABBREV[day.label] ?? day.label}
        </span>
        <span
          className={cn(
            'ed-serif text-[26px] leading-none',
            isToday ? 'text-[var(--text-primary)]' : isEmpty ? 'text-[var(--text-disabled)]' : 'text-[var(--text-secondary)]'
          )}
        >
          {format(day.date, 'dd', { locale: ptBR })}
        </span>
      </div>

      {!isEmpty && (
        <div className="space-y-2">
          {sortedTasks.map((task: any) => (
            <DraggableTask
              key={task.id}
              task={task}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  onDelete: (task: any) => void;
  onEdit: (task: any) => void;
};

function OperacionalCalendar({ onDelete, onEdit }: Props) {
  const tasks = useStore((state) => state.operacionalTasks);
  const leads = useStore((state) => state.leads);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const hoje = format(new Date(), 'yyyy-MM-dd');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const lead = task.leadId ? leads.find((l) => l.id === task.leadId) : null;

      const score = calculateOperationalUrgency({
        ...task,
        lead,
      });

      if (filterMode === 'critical') return score >= 60;
      if (filterMode === 'urgent') return score >= 30;
      if (filterMode === 'delayed') return task.data < hoje && !task.concluido;

      return true;
    });
  }, [tasks, filterMode, leads]);

  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = useMemo(() => {
    const baseStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const start = addDays(baseStart, weekOffset * 7);

    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(start, i);
      return {
        date,
        label: format(date, 'EEEE', { locale: ptBR }),
        dateString: format(date, 'yyyy-MM-dd'),
      };
    });
  }, [weekOffset]);

  const getTasksForDay = (dateString: string) =>
    filteredTasks.filter((t) => t.data?.substring(0, 10) === dateString);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const updateTask = (useStore.getState() as any).updateOperacionalTask;

    const taskId = active.id as string;
    const newDate = over.id as string;

    const task = useStore
      .getState()
      .operacionalTasks.find((t: any) => t.id === taskId);

    if (!task) return;

    if (task.data !== newDate) {
      updateTask(taskId, { data: newDate });
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="mt-4">
        <div className="flex flex-wrap gap-2 px-5 md:px-6">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              aria-pressed={filterMode === f.id}
              className={cn(
                'ed-mono min-h-[44px] border px-3 transition-colors lg:min-h-0 lg:py-1',
                filterMode === f.id
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 items-center gap-2 px-5 md:flex md:justify-between md:px-6">
          <div className="col-span-2 flex flex-wrap items-center justify-center gap-x-3 text-center md:order-2">
            <span className="ed-mono text-[var(--text-primary)]">
              {format(weekDays[0].date, "dd 'de' MMM", { locale: ptBR })} — {format(weekDays[6].date, "dd 'de' MMM", { locale: ptBR })}
            </span>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="ed-mono min-h-[44px] text-[var(--accent)] hover:underline"
              >
                Voltar pra semana atual
              </button>
            )}
          </div>

          <button
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="min-h-[44px] border border-[var(--border)] px-2 text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] md:order-1 md:px-4 md:text-sm"
          >
            ← Semana anterior
          </button>

          <button
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="min-h-[44px] border border-[var(--border)] px-2 text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] md:order-3 md:px-4 md:text-sm"
          >
            Próxima semana →
          </button>
        </div>

        {/* 7 colunas só a partir de lg (1024): abaixo disso, 1 coluna como no celular */}
        <div className="mt-4 grid grid-cols-1 divide-y divide-[var(--border)] border-t border-[var(--border)] lg:grid-cols-7 lg:divide-x lg:divide-y-0">
          {weekDays.map((day) => (
            <DroppableDay
              key={day.dateString}
              day={day}
              tasks={getTasksForDay(day.dateString)}
              onDelete={onDelete}
              onEdit={onEdit}
              isToday={day.dateString === hoje}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

export default OperacionalCalendar;
