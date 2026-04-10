import { useState } from 'react';
import { useStore } from '@/store/useStore';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';

const prioridadeColor: Record<string, string> = {
  baixa: 'bg-blue-100 border-blue-400 text-blue-800',
  media: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  alta: 'bg-red-100 border-red-400 text-red-800',
};
type Props = {
  onDelete: (task: any) => void;
  onEdit: (task: any) => void;
  onCreate?: (date: string) => void;
};

function OperacionalMonthCalendar({ onDelete, onEdit, onCreate }: Props) {
  const tasks = useStore((state) => state.operacionalTasks);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const hoje = format(new Date(), 'yyyy-MM-dd');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = startDate;

  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getTasksForDay = (dateString: string) =>
    tasks.filter((t) => {
      if (!t.data) return false;
      return t.data.slice(0, 10) === dateString;
    });

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl shadow-sm border border-[var(--border)] p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="text-sm bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1 rounded transition-colors"
        >
          ←
        </button>

        <h2 className="text-lg font-bold capitalize text-[var(--text-primary)]">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>

        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="text-sm bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1 rounded transition-colors"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-center mb-2 text-[var(--text-secondary)]">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          const dateString = format(date, 'yyyy-MM-dd');
          const dayTasks = getTasksForDay(dateString);
          const isToday = dateString === hoje;
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

          return (
            <div
              key={index}
              className={`
                min-h-[110px] border rounded p-1 text-xs
                ${isToday ? 'bg-[var(--accent-subtle)] border-[var(--accent)]' : 'border-[var(--border)]'}
                ${!isCurrentMonth ? 'opacity-40' : ''}
              `}
            >
              <div className="font-semibold mb-1 text-right text-[var(--text-primary)]">
                {format(date, 'd')}
              </div>

              <div className="space-y-1 overflow-hidden">
                <button
                  onClick={() => onCreate?.(dateString)}
                  className="text-[10px] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors mb-1"
                >
                  + adicionar
                </button>
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    title={task.titulo}
                    className={`
      border-l-4 px-1 rounded text-[10px]
      ${prioridadeColor[task.prioridade]}
      ${task.concluido ? 'line-through opacity-50' : ''}
    `}
                  >
                    <div className="flex justify-between items-center gap-1">
                      <span className="truncate">{task.titulo}</span>

                      <div className="flex gap-1">
                        <button
                          onClick={() => onEdit(task)}
                          className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
                          title="Editar"
                        >
                          <Pencil size={9} />
                        </button>

                        <button
                          onClick={() => onDelete(task)}
                          className="text-[var(--text-tertiary)] hover:text-[#ef4444] transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={9} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OperacionalMonthCalendar;
