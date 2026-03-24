import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { format } from 'date-fns';

import OperacionalCalendar from './components/OperacionalCalendar';
import OperacionalMonthCalendar from './components/OperacionalMonthCalendar';

export function Operacional() {
  const tasks = useStore((state) => state.operacionalTasks) || [];
  const addTask = useStore((state) => state.addOperacionalTask);
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
    if (nivel === 'alta') return 'text-red-600';
    if (nivel === 'media') return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Painel Operacional</h1>

      {/* ================= NOVA TAREFA ================= */}
      <div className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="font-semibold">Nova Tarefa</h2>

        <input
          type="text"
          placeholder="Título da tarefa"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="border p-2 w-full rounded"
        />

        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="border p-2 w-full rounded"
        />

        <select
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value as any)}
          className="border p-2 w-full rounded"
        >
          <option value="baixa">Prioridade Baixa</option>
          <option value="media">Prioridade Média</option>
          <option value="alta">Prioridade Alta</option>
        </select>

        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white p-2 w-full rounded hover:bg-blue-700"
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
            viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Semana
        </button>

        <button
          onClick={() => setViewMode('month')}
          className={`px-3 py-1 rounded ${
            viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'
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
        />
      )}

      {/* ================= HOJE ================= */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Hoje</h2>

        {tarefasHoje.length === 0 && (
          <p className="text-gray-400 text-sm">Nenhuma tarefa para hoje</p>
        )}

        {tarefasHoje.map((task) => (
          <div
            key={task.id}
            className={`bg-white p-3 rounded shadow flex justify-between items-center mb-2 ${
              task.concluido ? 'opacity-50 line-through' : ''
            }`}
          >
            <div>
              <div className="font-medium">{task.titulo}</div>
              <div className={`text-sm ${prioridadeColor(task.prioridade)}`}>
                {task.prioridade.toUpperCase()}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  updateTask(task.id, {
                    concluido: !task.concluido,
                  })
                }
                className="text-green-600 font-bold"
              >
                ✓
              </button>

              <button
                onClick={() => {
                  setTaskToDelete(task);
                  setShowDeleteModal(true);
                }}
                className="text-red-600 font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= PRÓXIMOS DIAS ================= */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Próximos Dias</h2>

        {tarefasSemana.length === 0 && (
          <p className="text-gray-400 text-sm">Nenhuma tarefa agendada</p>
        )}

        {tarefasSemana.map((task) => (
          <div key={task.id} className="bg-gray-50 p-3 rounded mb-2">
            <div className="text-sm text-gray-500">{task.data}</div>
            <div className="font-medium">{task.titulo}</div>
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
            className="w-full border p-2 rounded"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Cancelar
            </button>

            <button
              onClick={confirmEdit}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
