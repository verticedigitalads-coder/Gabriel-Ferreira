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

const prioridadeColor: Record<string, string> = {
  baixa: 'bg-blue-50 border-blue-400 text-blue-700',
  media: 'bg-yellow-50 border-yellow-500 text-yellow-700',
  alta: 'bg-red-50 border-red-500 text-red-700',
};

const statusColor: Record<string, string> = {
  pendente: 'bg-gray-50 border-gray-400 text-gray-700',
  em_producao: 'bg-yellow-50 border-yellow-500 text-yellow-700',
  pronto: 'bg-green-50 border-green-500 text-green-700',
  instalado: 'bg-blue-50 border-blue-500 text-blue-700',
};

type FilterMode = 'all' | 'critical' | 'urgent' | 'delayed';

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
      style={style}
      className={`
        border-l-4 p-3 rounded-lg text-xs
        transition-all duration-200
        hover:shadow-md
        ${statusColor[task.status] || prioridadeColor[task.prioridade]}
        ${task.concluido ? 'opacity-60' : ''}
        ${isCritical ? 'ring-2 ring-red-600' : ''}
      `}
    >
      <div className="flex justify-between items-start gap-2">
        <div
          {...listeners}
          {...attributes}
          className="flex-1 cursor-grab active:cursor-grabbing"
        >
          <p className={`font-semibold ${task.concluido ? 'line-through italic' : ''}`}>{task.titulo}</p>

          <p className="text-[10px] opacity-70 capitalize">
            Status: {task.status?.replace('_', ' ')}
          </p>

          {lead && (
            <p className="text-[10px] opacity-70">
              {lead.nome} • {lead.status}
            </p>
          )}
          {isCritical && (
            <span className="text-[9px] bg-red-700 text-white px-1 rounded">
              CRÍTICA
            </span>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTask(task.id, { concluido: !task.concluido });
            }}
            className={`transition-colors ${task.concluido ? 'text-[var(--success)]' : 'text-[var(--text-tertiary)] hover:text-[var(--success)]'}`}
            title={task.concluido ? 'Marcar como pendente' : 'Marcar como concluída'}
          >
            {task.concluido ? <CheckCircle2 size={14} /> : <Circle size={14} />}
          </button>

          <button
            onClick={handleEdit}
            className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={handleDelete}
            className="text-[var(--text-tertiary)] hover:text-[#ef4444] transition-colors"
            title="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DroppableDay({ day, tasks, onDelete, onEdit }: any) {
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

  return (
    <div
      ref={setNodeRef}
      className="rounded-xl p-4 border min-h-[160px] bg-[var(--bg-surface)] border-[var(--border)]"
    >
      <div className="mb-3">
        <p className="text-sm font-semibold capitalize">{day.label}</p>
        <p className="text-xs text-[var(--text-tertiary)]">
          {format(day.date, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
        </p>
      </div>

      <div className="space-y-3">
        {sortedTasks.map((task: any) => (
          <DraggableTask
            key={task.id}
            task={task}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
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

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });

    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(start, i);
      return {
        date,
        label: format(date, 'EEEE', { locale: ptBR }),
        dateString: format(date, 'yyyy-MM-dd'),
      };
    });
  }, []);

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
      <div className="bg-[var(--bg-surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
        <div className="flex gap-2 mb-6 text-sm flex-wrap">
          <button
            onClick={() => setFilterMode('all')}
            className="px-3 py-1 bg-[var(--bg-surface-2)] text-[var(--text-secondary)] rounded"
          >
            Todas
          </button>
          <button
            onClick={() => setFilterMode('critical')}
            className="px-3 py-1 bg-[var(--danger-subtle)] text-[var(--danger)] rounded"
          >
            Críticas
          </button>
          <button
            onClick={() => setFilterMode('urgent')}
            className="px-3 py-1 bg-[var(--warning-subtle)] text-[var(--warning)] rounded"
          >
            Urgentes
          </button>
          <button
            onClick={() => setFilterMode('delayed')}
            className="px-3 py-1 bg-[var(--bg-surface-3)] text-[var(--text-secondary)] rounded"
          >
            Atrasadas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-5">
          {weekDays.map((day) => (
            <DroppableDay
              key={day.dateString}
              day={day}
              tasks={getTasksForDay(day.dateString)}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

export default OperacionalCalendar;
