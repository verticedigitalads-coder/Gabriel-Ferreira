import { v4 as uuid } from 'uuid'
import type { ToastMessage } from '@/types'

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createUISlice = (set: any) => ({

  activeModule: 'dashboard',
  selectedLeadId: null,
  toasts: [] as ToastMessage[],
  workspaceId: null,

  // ================= MODULE =================

  setActiveModule: (module: string) =>
    set({ activeModule: module }),

  // ================= WORKSPACE =================

  setWorkspaceId: (id: string) =>
    set({ workspaceId: id }),

  // ================= LEAD SELECTION =================

  selectLead: (id: string | null) =>
    set({ selectedLeadId: id }),

  // ================= TOAST =================

  addToast: (toast: Omit<ToastMessage, 'id'>) => {

    const id = uuid()

    set((state: any) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))

  },

  removeToast: (id: string) =>
    set((state: any) => ({
      toasts: state.toasts.filter((t: ToastMessage) => t.id !== id)
    }))

})