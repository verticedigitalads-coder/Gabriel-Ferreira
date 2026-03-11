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

  },

	deleteOperacionalTask: async (taskId: string) => {

  const { operacionalTasks } = get()

  await supabase
    .from('operacional_tasks')
    .delete()
    .eq('id', taskId)

  set({
    operacionalTasks: operacionalTasks.filter(
      (task: OperacionalTask) => task.id !== taskId
    )
  })

},

  updateOperacionalTask: async (taskId: string, updates: Partial<OperacionalTask>) => {

    const { operacionalTasks } = get()
    const now = new Date().toISOString()

    await supabase
      .from('operacional_tasks')
      .update({
        ...updates,
        updated_at: now
      })
      .eq('id', taskId)

    const updatedTasks = operacionalTasks.map((task: OperacionalTask) =>
      task.id === taskId
        ? { ...task, ...updates, updatedAt: now }
        : task
    )

    set({
      operacionalTasks: updatedTasks
    })

  }

})