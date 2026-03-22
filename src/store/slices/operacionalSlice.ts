import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';
import type { OperacionalTask } from '@/types';

export const createOperacionalSlice = (_set: any, get: any) => ({
  operacionalTasks: [],

  // ================= ADD =================

  addOperacionalTask: async (taskData: any) => {
    const { workspaceId } = get();
    const now = new Date().toISOString();

    const task = {
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
      .insert([task])
      .select()
      .single();

    if (error) {
      console.error('ERRO AO CRIAR TAREFA:', error);
      return;
    }

    _set((state: any) => {
      if (!data) return state;

      const exists = state.operacionalTasks.some((t: any) => t.id === data.id);

      if (exists) return state; // evita duplicação (realtime)

      return {
        operacionalTasks: [...state.operacionalTasks, data],
      };
    });

    return data;
  },

  // ================= DELETE =================

  deleteOperacionalTask: async (taskId: string) => {
    const { error } = await supabase
      .from('operacional_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Erro ao deletar tarefa:', error);
      return;
    }

    _set((state: any) => ({
      operacionalTasks: state.operacionalTasks.filter(
        (t: any) => t.id !== taskId,
      ),
    }));
  },

  // ================= UPDATE =================

  updateOperacionalTask: async (
    taskId: string,
    updates: Partial<OperacionalTask>,
  ) => {
    const now = new Date().toISOString();

    const payload: any = {
      updated_at: now,
    };

    // 🔒 mapeamento seguro (evita camelCase → snake_case bug)
    if (updates.titulo !== undefined) payload.titulo = updates.titulo;
    if (updates.data !== undefined) payload.data = updates.data;
    if (updates.tipo !== undefined) payload.tipo = updates.tipo;
    if (updates.prioridade !== undefined)
      payload.prioridade = updates.prioridade;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.concluido !== undefined) payload.concluido = updates.concluido;

    const { data, error } = await supabase
      .from('operacional_tasks')
      .update(payload)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar tarefa:', error);
      return;
    }

    _set((state: any) => {
      if (!data) return state;

      const exists = state.operacionalTasks.some((t: any) => t.id === taskId);

      if (!exists) {
        // fallback (caso ainda não esteja no state)
        return {
          operacionalTasks: [...state.operacionalTasks, data],
        };
      }

      return {
        operacionalTasks: state.operacionalTasks.map((t: any) =>
          t.id === taskId ? data : t,
        ),
      };
    });

    return data;
  },
});
