import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import { formatOperacionalTask } from '@/store/formatters';
import type { OperacionalTask } from '@/types';

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createOperacionalSlice = (set: any, get: any) => ({
  operacionalTasks: [],

  // ================= ADD =================
  addOperacionalTask: async (taskData: Partial<OperacionalTask>) => {
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
    };

    const { data, error } = await supabase
      .from('operacional_tasks')
      .insert([newTask])
      .select()
      .single();

    if (error) {
      console.error('[OperacionalSlice] Erro ao criar tarefa:', error);
      return;
    }

    // ✅ atualização imediata (UX)
    set((state: any) => {
      const exists = state.operacionalTasks.some((t: OperacionalTask) => t.id === data.id);

      if (exists) return state;

      return {
        operacionalTasks: [formatOperacionalTask(data), ...state.operacionalTasks],
      };
    });

    return data;
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
      return;
    }

    set((state: any) => ({
      operacionalTasks: state.operacionalTasks.filter(
        (t: OperacionalTask) => t.id !== taskId,
      ),
    }));
  },

  // ================= UPDATE =================
  updateOperacionalTask: async (
    taskId: string,
    updates: Partial<OperacionalTask>,
  ) => {
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
      return;
    }

    set((state: any) => ({
      operacionalTasks: state.operacionalTasks.map((t: OperacionalTask) =>
        t.id === taskId ? formatOperacionalTask(data) : t,
      ),
    }));

    return formatOperacionalTask(data);
  },
});
