import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import type { OperacionalTask } from '@/types';

export const createOperacionalSlice = (_set: any, get: any) => ({
  operacionalTasks: [],

  addOperacionalTask: async (taskData: any) => {
    console.log('ADD OPERACIONAL TASK CHAMADO:', taskData);

    const { workspaceId } = get();

    const now = new Date().toISOString();

    const task = {
      ...taskData,
      id: uuid(),
      workspaceId,
      concluido: false,
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from('operacional_tasks')
      .insert([
        {
          id: task.id,
          workspace_id: workspaceId,
          lead_id: task.leadId,
          titulo: task.titulo,
          data: task.data,
          tipo: task.tipo,
          prioridade: task.prioridade,
          status: 'pendente',
          concluido: false,
          created_at: now,
          updated_at: now,
        },
      ])
      .select();

    if (error) {
      console.error('ERRO AO CRIAR TAREFA OPERACIONAL:', error);
    } else {
      console.log('TAREFA CRIADA:', data);
    }
  },

  deleteOperacionalTask: async (taskId: string) => {
    await supabase.from('operacional_tasks').delete().eq('id', taskId);
  },

  updateOperacionalTask: async (
    taskId: string,
    updates: Partial<OperacionalTask>,
  ) => {
    const now = new Date().toISOString();

    const payload: any = {
      updated_at: now,
    };

    if (updates.titulo !== undefined) payload.titulo = updates.titulo;
    if (updates.data !== undefined) payload.data = updates.data;
    if (updates.tipo !== undefined) payload.tipo = updates.tipo;
    if (updates.prioridade !== undefined)
      payload.prioridade = updates.prioridade;
    if (updates.concluido !== undefined) payload.concluido = updates.concluido;
    if (updates.status !== undefined) payload.status = updates.status;

    const { error } = await supabase
      .from('operacional_tasks')
      .update(payload)
      .eq('id', taskId);

    if (error) {
      console.error('Erro ao atualizar tarefa:', error);
      return;
    }
  },
});
