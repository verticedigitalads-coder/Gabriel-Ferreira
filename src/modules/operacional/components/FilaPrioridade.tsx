import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { CircleDot } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { calculateOperationalUrgency } from '@/domain/operacional/calculateOperationalUrgency';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { EmptyState } from '@/components/editorial/EmptyState';
import { cn } from '@/utils/cn';
import { ROTULO_PRIORIDADE } from './faixaPrioridade';

type Props = {
  index: string;
  onEdit: (task: any) => void;
};

// 03 Fila de prioridade (redesign D2): as 5 tarefas abertas com maior
// calculateOperationalUrgency (task + lead, como no calendário). Empate: data mais
// antiga primeiro. Tarefa sem data fica fora: o cálculo chama parseISO(data), que
// lança erro com null no date-fns 4.
export function FilaPrioridade({ index, onEdit }: Props) {
  const tasks = useStore((state) => state.operacionalTasks) || [];
  const leads = useStore((state) => state.leads);
  const hoje = format(new Date(), 'yyyy-MM-dd');

  const fila = tasks
    .filter((t) => !t.concluido && t.data)
    .map((task) => {
      const lead = task.leadId ? leads.find((l) => l.id === task.leadId) : null;
      return { task, lead, score: calculateOperationalUrgency({ ...task, lead }) };
    })
    .sort((a, b) => b.score - a.score || a.task.data.localeCompare(b.task.data))
    .slice(0, 5);

  return (
    <section className="border border-[var(--border-strong)] bg-[var(--bg-surface)] lg:grid lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-8">
        <div className="px-5 pt-5 md:px-6">
          <SectionHeading index={index} label="Fila de prioridade" />
        </div>

        {fila.length === 0 ? (
          <div className="px-5 pt-4 pb-5 md:px-6">
            <EmptyState title="Nenhuma tarefa aberta" note="Crie uma em Nova Tarefa." />
          </div>
        ) : (
          <ol className="mt-2 px-2 pb-2">
            {fila.map(({ task, lead, score }, i) => {
              const atrasada = task.data < hoje;
              const dias = differenceInCalendarDays(parseISO(hoje), parseISO(task.data));
              const quando = atrasada
                ? `atrasada há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
                : task.data === hoje
                  ? 'hoje'
                  : format(parseISO(task.data), 'dd/MM');
              const pill =
                score >= 60
                  ? { texto: 'Crítica', cor: 'var(--danger)', borda: 'var(--danger)', fundo: 'var(--danger-subtle)' }
                  : score >= 30
                    ? { texto: 'Urgente', cor: 'var(--warning)', borda: 'var(--warning)', fundo: 'var(--warning-subtle)' }
                    : { texto: ROTULO_PRIORIDADE[task.prioridade] ?? task.prioridade, cor: 'var(--text-secondary)', borda: 'var(--border-strong)', fundo: 'transparent' };
              return (
                <li key={task.id} className={cn(i < fila.length - 1 && 'border-b border-[var(--border)]')}>
                  <button
                    onClick={() => onEdit(task)}
                    className="flex w-full min-h-[44px] items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
                  >
                    <span className="ed-mono w-6 shrink-0 text-[var(--accent)]">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{task.titulo}</span>
                      <span className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2">
                        {lead && <span className="min-w-0 truncate text-xs text-[var(--text-tertiary)]">{lead.nome}</span>}
                        <span className={cn('ed-mono shrink-0', atrasada ? 'text-[var(--danger)]' : 'text-[var(--text-tertiary)]')}>
                          {quando}
                        </span>
                      </span>
                    </span>
                    <span
                      className="ed-mono shrink-0 border px-2 py-0.5"
                      style={{ color: pill.cor, borderColor: pill.borda, background: pill.fundo }}
                    >
                      {pill.texto}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--bg-surface-2)] px-5 py-4 md:px-6 lg:col-span-4 lg:border-t-0 lg:border-l">
        <p className="ed-mono flex items-center gap-2 text-[var(--text-secondary)]">
          <CircleDot className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />
          Prioridade automática
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-tertiary)]">
          A ordem soma a data (atrasada, hoje ou nos próximos 2 dias), a prioridade da tarefa e o peso do cliente vinculado (lead quente, orçado ou de valor alto).
        </p>
      </div>
    </section>
  );
}
