import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import { formatOperacionalTask } from '@/store/formatters';
import { isValidDateInput } from '@/utils/date';
import type { OperacionalTask } from '@/types';

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createOperacionalSlice = (set: any, get: any) => ({
  operacionalTasks: [],

  // ================= ADD =================
  addOperacionalTask: async (taskData: Partial<OperacionalTask>) => {
    // Tarefa sem data derruba o sino do header e o calendário (parseISO na data):
    // recusa antes de tocar no estado ou no banco.
    if (!isValidDateInput(taskData.data)) {
      get().addToast({ type: 'error', message: 'A tarefa precisa de uma data válida.' });
      return false;
    }

    const { workspaceId } = get();
    const now = new Date().toISOString();

    const newTask = {
      id: uuid(),
      workspace_id: workspaceId,
      lead_id: taskData.leadId,
      titulo: taskData.titulo,
      data: taskData.data,
      tipo: taskData.tipo,
      prioridade: taskData.prioridade,
      status: 'pendente',
      concluido: false,
      created_at: now,
      updated_at: now,
      // Só entra quando quem chama manda (endereço da visita, mensagem sugerida da IA).
      ...(taskData.descricao !== undefined ? { descricao: taskData.descricao } : {}),
    };

    const { data, error } = await supabase
      .from('operacional_tasks')
      .insert([newTask])
      .select()
      .single();

    if (error) {
      console.error('[OperacionalSlice] Erro ao criar tarefa:', error);
      get().addToast({ type: 'error', message: 'Erro ao criar tarefa' });
      return false;
    }

    // ✅ atualização imediata (UX)
    set((state: any) => {
      const exists = state.operacionalTasks.some((t: OperacionalTask) => t.id === data.id);

      if (exists) return state;

      return {
        operacionalTasks: [formatOperacionalTask(data), ...state.operacionalTasks],
      };
    });

    return true;
  },

  // ================= DELETE =================
  deleteOperacionalTask: async (taskId: string) => {
    const { error } = await supabase
      .from('operacional_tasks')
      .delete()
      .eq('id', taskId)
      .eq('workspace_id', get().workspaceId);

    if (error) {
      console.error('[OperacionalSlice] Erro ao deletar tarefa:', error);
      get().addToast({ type: 'error', message: 'Erro ao excluir tarefa' });
      return false;
    }

    set((state: any) => ({
      operacionalTasks: state.operacionalTasks.filter(
        (t: OperacionalTask) => t.id !== taskId,
      ),
    }));

    return true;
  },

  // ================= UPDATE =================
  updateOperacionalTask: async (
    taskId: string,
    updates: Partial<OperacionalTask>,
  ) => {
    // Editar não pode apagar a data nem gravar fora de yyyy-MM-dd (mesmo motivo do add).
    if (updates.data !== undefined && !isValidDateInput(updates.data)) {
      get().addToast({ type: 'error', message: 'A tarefa precisa de uma data válida.' });
      return false;
    }

    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      updated_at: now,
    };

    if (updates.titulo !== undefined) payload.titulo = updates.titulo;
    if (updates.data !== undefined) payload.data = updates.data;
    if (updates.tipo !== undefined) payload.tipo = updates.tipo;
    if (updates.prioridade !== undefined)
      payload.prioridade = updates.prioridade;
    if (updates.concluido !== undefined) payload.concluido = updates.concluido;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.descricao !== undefined) payload.descricao = updates.descricao;

    const { data, error } = await supabase
      .from('operacional_tasks')
      .update(payload)
      .eq('id', taskId)
      .eq('workspace_id', get().workspaceId)
      .select()
      .single();

    if (error) {
      console.error('[OperacionalSlice] Erro ao atualizar tarefa:', error);
      get().addToast({ type: 'error', message: 'Erro ao atualizar tarefa' });
      return false;
    }

    set((state: any) => ({
      operacionalTasks: state.operacionalTasks.map((t: OperacionalTask) =>
        t.id === taskId ? formatOperacionalTask(data) : t,
      ),
    }));

    return true;
  },
});
