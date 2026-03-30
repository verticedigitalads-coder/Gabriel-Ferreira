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

const prioridadeColor: Record<string, string> = {
  baixa: 'bg-blue-100 border-blue-400 text-blue-800',
  media: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  alta: 'bg-red-100 border-red-400 text-red-800',
};
type Props = {
  onDelete: (task: any) => void;
  onEdit: (task: any) => void;
  onCreate?: (date: string) => void; // 🔥 NOVO
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
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="text-sm bg-gray-100 px-3 py-1 rounded"
        >
          ←
        </button>

        <h2 className="text-lg font-bold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>

        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="text-sm bg-gray-100 px-3 py-1 rounded"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-center mb-2">
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
                ${isToday ? 'bg-blue-50 border-blue-400' : ''}
                ${!isCurrentMonth ? 'opacity-40' : ''}
              `}
            >
              <div className="font-semibold mb-1 text-right">
                {format(date, 'd')}
              </div>

              <div className="space-y-1 overflow-hidden">
                {/* 🔥 BOTÃO NOVO */}
                <button
                  onClick={() => onCreate?.(dateString)}
                  className="text-[10px] text-blue-600 mb-1"
                >
                  + adicionar
                </button>
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`
      border-l-4 px-1 rounded text-[10px]
      ${prioridadeColor[task.prioridade]}
      ${task.concluido ? 'line-through opacity-50' : ''}
    `}
                  >
                    <div className="flex justify-between items-center gap-1">
                      <span className="truncate">{task.titulo}</span>

                      <div className="flex gap-1">
                        {/* ✏ EDITAR */}
                        <button
                          onClick={() => onEdit(task)}
                          className="text-blue-600 hover:scale-110"
                        >
                          <span className="text-[9px]">✏</span>
                        </button>

                        {/* 🗑 EXCLUIR */}
                        <button
                          onClick={() => onDelete(task)}
                          className="text-red-600 hover:scale-110"
                        >
                          <span className="text-[9px]">🗑</span>
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
