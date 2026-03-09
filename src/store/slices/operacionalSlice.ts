import { supabase } from '@/lib/supabase'
import { v4 as uuid } from 'uuid'
import type { OperacionalTask } from '@/types'

export const createOperacionalSlice = (set: any, get: any) => ({

  operacionalTasks: [],

  addOperacionalTask: async (taskData: any) => {

    const { workspaceId, operacionalTasks } = get()
    const now = new Date().toISOString()

    const task: OperacionalTask = {
      ...taskData,
      id: uuid(),
      workspaceId,
      concluido: false,
      createdAt: now,
      updatedAt: now,
    }

    await supabase
      .from('operacional_tasks')
      .insert([{
        id: task.id,
        workspace_id: workspaceId,
        titulo: task.titulo,
        data: task.data,
        tipo: task.tipo,
        concluido: false,
        created_at: now,
        updated_at: now
      }])

    set({
      operacionalTasks: [...operacionalTasks, task]
    })

  }

})