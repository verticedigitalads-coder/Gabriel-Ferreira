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

import { calculateOperationalUrgency } from '../utils/calculateOperationalUrgency';

const prioridadeColor: Record<string, string> = {
  baixa: 'bg-blue-50 border-blue-400 text-blue-700',
  media: 'bg-yellow-50 border-yellow-500 text-yellow-700',
  alta: 'bg-red-50 border-red-500 text-red-700',
};

type FilterMode = 'all' | 'critical' | 'urgent' | 'delayed';

function DraggableTask({ task }: any) {
  const updateTask = useStore(state => state.updateOperacionalTask);
  const deleteTask = useStore(state => state.deleteOperacionalTask);
  const leads = useStore(state => state.leads);

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
    const novoTitulo = prompt('Editar título:', task.titulo);
    if (novoTitulo && novoTitulo.trim() !== '') {
      updateTask(task.id, { titulo: novoTitulo });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Excluir tarefa?')) {
      deleteTask(task.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        border-l-4 p-3 rounded-lg text-xs
        transition-all duration-200
        hover:shadow-md
        ${prioridadeColor[task.prioridade]}
        ${task.concluido ? 'opacity-50 line-through' : ''}
        ${isCritical ? 'ring-2 ring-red-600' : ''}
      `}
    >
      <div className="flex justify-between items-start gap-2">
        <div
          {...listeners}
          {...attributes}
          className="flex-1 cursor-grab active:cursor-grabbing"
          onClick={() =>
            updateTask(task.id, {
              concluido: !task.concluido,
            })
          }
        >
          <p className="font-semibold">{task.titulo}</p>
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

        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="text-blue-600 text-xs"
          >
            ✏
          </button>

          <button
            onClick={handleDelete}
            className="text-red-600 text-xs"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

function DroppableDay({ day, tasks }: any) {
  const { setNodeRef } = useDroppable({
    id: day.dateString,
  });

  const leads = useStore.getState().leads;

  const sortedTasks = [...tasks].sort((a, b) => {
    const leadA = a.leadId
      ? leads.find((l: any) => l.id === a.leadId)
      : null;

    const leadB = b.leadId
      ? leads.find((l: any) => l.id === b.leadId)
      : null;

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
      className="rounded-xl p-4 border min-h-[160px] bg-white border-gray-200"
    >
      <div className="mb-3">
        <p className="text-sm font-semibold capitalize">
          {day.label}
        </p>
        <p className="text-xs text-gray-400">
          {format(day.date, 'dd/MM')}
        </p>
      </div>

      <div className="space-y-3">
        {sortedTasks.map((task: any) => (
          <DraggableTask key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function OperacionalCalendar() {
  const tasks = useStore(state => state.operacionalTasks);
  const leads = useStore(state => state.leads);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const hoje = format(new Date(), 'yyyy-MM-dd');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const lead = task.leadId
        ? leads.find(l => l.id === task.leadId)
        : null;

      const score = calculateOperationalUrgency({
        ...task,
        lead,
      });

      if (filterMode === 'critical') return score >= 60;
      if (filterMode === 'urgent') return score >= 30;
      if (filterMode === 'delayed')
        return task.data < hoje && !task.concluido;

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
    filteredTasks.filter(t => t.data === dateString);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const updateTask = useStore.getState().updateOperacionalTask;

    updateTask(active.id as string, {
      data: over.id as string,
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

        <div className="flex gap-2 mb-6 text-sm flex-wrap">
          <button onClick={() => setFilterMode('all')} className="px-3 py-1 bg-gray-200 rounded">
            Todas
          </button>
          <button onClick={() => setFilterMode('critical')} className="px-3 py-1 bg-red-200 rounded">
            Críticas
          </button>
          <button onClick={() => setFilterMode('urgent')} className="px-3 py-1 bg-yellow-200 rounded">
            Urgentes
          </button>
          <button onClick={() => setFilterMode('delayed')} className="px-3 py-1 bg-gray-300 rounded">
            Atrasadas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-5">
          {weekDays.map(day => (
            <DroppableDay
              key={day.dateString}
              day={day}
              tasks={getTasksForDay(day.dateString)}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

export default OperacionalCalendar;