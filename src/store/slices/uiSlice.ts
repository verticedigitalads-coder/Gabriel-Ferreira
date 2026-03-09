import { v4 as uuid } from 'uuid'

export const createUISlice = (set: any, get: any) => ({

  activeModule: 'dashboard',
  selectedLeadId: null,
  toasts: [],
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

  addToast: (toast: any) => {

    const id = uuid()

    set((state: any) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))

  },

  removeToast: (id: string) =>
    set((state: any) => ({
      toasts: state.toasts.filter((t: any) => t.id !== id)
    }))

})