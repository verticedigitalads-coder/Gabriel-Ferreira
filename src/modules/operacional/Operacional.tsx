import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { CheckCircle2, Trash2 } from 'lucide-react';

import OperacionalCalendar from './components/OperacionalCalendar';
import OperacionalMonthCalendar from './components/OperacionalMonthCalendar';

export function Operacional() {
  const tasks = useStore((state) => state.operacionalTasks) || [];
  const addTask = useStore((state) => state.addOperacionalTask);
  const handleCreateTask = (date: string) => {
    addTask({
      titulo: 'Nova tarefa',
      data: date,
      prioridade: 'media',
      concluido: false,
    });
  };
  const updateTask = useStore((state: any) => state.updateOperacionalTask);
  const deleteTask = useStore((state: any) => state.deleteOperacionalTask);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // 🔥 TOGGLE SEMANA / MÊS
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState('');
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta'>(
    'media',
  );

  const hoje = format(new Date(), 'yyyy-MM-dd');

  const tarefasHoje = tasks.filter((t) => t.data === hoje);
  const tarefasHojePendentes = tarefasHoje.filter((t) => !t.concluido);
  const tarefasHojeConcluidas = tarefasHoje.filter((t) => t.concluido);
  const tarefasSemana = tasks.filter((t) => t.data >= hoje);

  const confirmEdit = async () => {
    if (!taskToEdit) return;

    await updateTask(taskToEdit.id, {
      titulo: newTitle,
    });

    setShowEditModal(false);
    setTaskToEdit(null);
    setNewTitle('');
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    setLoadingDelete(true);

    await deleteTask(taskToDelete.id);

    setLoadingDelete(false);
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const handleAdd = async () => {
    if (!titulo || !data) return;

    await addTask({
      titulo,
      data,
      prioridade,
      concluido: false,
    });

    setTitulo('');
    setData('');
    setPrioridade('media');
  };

  const prioridadeColor = (nivel: string) => {
    if (nivel === 'alta') return 'text-[var(--danger)]';
    if (nivel === 'media') return 'text-[var(--warning)]';
    return 'text-[var(--success)]';
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Painel Operacional</h1>

      {/* ================= NOVA TAREFA ================= */}
      <div className="bg-[var(--bg-surface)] p-4 rounded shadow space-y-3 border border-[var(--border)]">
        <h2 className="font-semibold text-[var(--text-primary)]">Nova Tarefa</h2>

        <input
          type="text"
          placeholder="Título da tarefa"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="border border-[var(--border)] p-2 w-full rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
        />

        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="border border-[var(--border)] p-2 w-full rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)]"
        />

        <select
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value as any)}
          className="border border-[var(--border)] p-2 w-full rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)]"
        >
          <option value="baixa">Prioridade Baixa</option>
          <option value="media">Prioridade Média</option>
          <option value="alta">Prioridade Alta</option>
        </select>

        <button
          onClick={handleAdd}
          className="bg-[var(--accent)] text-white p-2 w-full rounded hover:bg-[var(--accent-hover)]"
        >
          Adicionar Tarefa
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteModal}
        title="Excluir tarefa"
        description="Tem certeza que deseja excluir esta tarefa?"
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={loadingDelete}
      />

      {/* ================= TOGGLE VISUALIZAÇÃO ================= */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('week')}
          className={`px-3 py-1 rounded ${
            viewMode === 'week'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-surface-3)] text-[var(--text-secondary)]'
          }`}
        >
          Semana
        </button>

        <button
          onClick={() => setViewMode('month')}
          className={`px-3 py-1 rounded ${
            viewMode === 'month'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-surface-3)] text-[var(--text-secondary)]'
          }`}
        >
          Mês
        </button>
      </div>

      {/* ================= CALENDÁRIO ================= */}
      {viewMode === 'week' ? (
        <OperacionalCalendar
          onDelete={(task: any) => {
            setTaskToDelete(task);
            setShowDeleteModal(true);
          }}
          onEdit={(task: any) => {
            setTaskToEdit(task);
            setNewTitle(task.titulo);
            setShowEditModal(true);
          }}
        />
      ) : (
        <OperacionalMonthCalendar
          onDelete={(task: any) => {
            setTaskToDelete(task);
            setShowDeleteModal(true);
          }}
          onEdit={(task: any) => {
            setTaskToEdit(task);
            setNewTitle(task.titulo);
            setShowEditModal(true);
          }}
          onCreate={handleCreateTask} // 🔥 NOVO
        />
      )}

      {/* ================= HOJE ================= */}
      <div>
        <h2 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">Hoje</h2>

        {tarefasHoje.length === 0 && (
          <p className="text-[var(--text-tertiary)] text-sm">Nenhuma tarefa para hoje</p>
        )}

        {tarefasHojePendentes.map((task) => (
          <div
            key={task.id}
            className="bg-[var(--bg-surface)] p-3 rounded shadow flex justify-between items-center mb-2 border border-[var(--border)]"
          >
            <div>
              <div className="font-medium text-[var(--text-primary)]">{task.titulo}</div>
              <div className={`text-sm ${prioridadeColor(task.prioridade)}`}>
                {task.prioridade.toUpperCase()}
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <button
                onClick={() => updateTask(task.id, { concluido: true })}
                className="text-[var(--text-tertiary)] hover:text-[var(--success)] transition-colors"
                title="Marcar como concluída"
              >
                <CheckCircle2 size={16} />
              </button>

              <button
                onClick={() => {
                  setTaskToDelete(task);
                  setShowDeleteModal(true);
                }}
                className="text-[var(--text-tertiary)] hover:text-[#ef4444] transition-colors"
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {tarefasHojeConcluidas.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-2">Concluídas hoje</h3>
            {tarefasHojeConcluidas.map((task) => (
              <div
                key={task.id}
                className="bg-[var(--bg-surface)] p-3 rounded shadow flex justify-between items-center mb-2 border border-[var(--border)] opacity-60"
              >
                <div>
                  <div className="font-medium text-[var(--text-tertiary)] line-through italic">
                    {task.titulo}
                  </div>
                  <div className={`text-sm ${prioridadeColor(task.prioridade)}`}>
                    {task.prioridade.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={() => updateTask(task.id, { concluido: false })}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm"
                  title="Desfazer conclusão"
                >
                  ↩
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= PRÓXIMOS DIAS ================= */}
      <div>
        <h2 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">Próximos Dias</h2>

        {tarefasSemana.length === 0 && (
          <p className="text-[var(--text-tertiary)] text-sm">Nenhuma tarefa agendada</p>
        )}

        {tarefasSemana.map((task) => (
          <div key={task.id} className="bg-[var(--bg-surface-2)] p-3 rounded mb-2 border border-[var(--border)]">
            <div className="text-sm text-[var(--text-tertiary)]">{task.data}</div>
            <div className="font-medium text-[var(--text-primary)]">{task.titulo}</div>
          </div>
        ))}
      </div>
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar tarefa"
      >
        <div className="p-4 space-y-4">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full border border-[var(--border)] p-2 rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)]"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-3 py-1 bg-[var(--bg-surface-3)] text-[var(--text-secondary)] rounded"
            >
              Cancelar
            </button>

            <button
              onClick={confirmEdit}
              className="px-3 py-1 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)]"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
