import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

import { createLeadSlice } from './slices/leadSlice'
import { createOrcamentoSlice } from './slices/orcamentoSlice'
import { createFinanceiroSlice } from './slices/financeiroSlice'
import { createNotaSlice } from './slices/notaSlice'
import { createOperacionalSlice } from './slices/operacionalSlice'
import { createUISlice } from './slices/uiSlice'

import type { DashboardStats } from '@/types'

export const useStore = create<any>((set, get) => ({

  // ================= SLICES =================

  ...createLeadSlice(set, get),
  ...createOrcamentoSlice(set, get),
  ...createFinanceiroSlice(set, get),
  ...createNotaSlice(set, get),
  ...createOperacionalSlice(set, get),
  ...createUISlice(set, get),

  // ================= CORE STATE =================

  metaMensal: 100000,

  filters: {
    status: 'all',
    temperatura: 'all',
    prioridadeLevel: 'all',
    search: '',
    analysisStatus: 'all',
  },

  isLoading: true,

  // ================= INITIALIZE =================

  initialize: async (workspaceId: string) => {

    try {

      set({ isLoading: true })

      if (!workspaceId) {
        set({ isLoading: false })
        return
      }

      const [leadsRes, orcamentosRes] = await Promise.all([

        supabase
          .from('leads')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false }),

        supabase
          .from('orcamentos')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false }),

      ])

      if (leadsRes.error)
        console.error("Erro ao buscar leads:", leadsRes.error)

      if (orcamentosRes.error)
        console.error("Erro ao buscar orçamentos:", orcamentosRes.error)

      const formattedOrcamentos = (orcamentosRes.data || []).map((o: any) => ({

        id: o.id,
        workspaceId: o.workspace_id,
        leadId: o.lead_id,
        numero: o.numero,
        itens: o.itens,
        subtotal: o.subtotal,
        desconto: o.desconto,
        total: o.total,
        status: o.status,
        observacoes: o.observacoes,
        validadeEmDias: o.validade_em_dias,
        historico: o.historico,
        createdAt: o.created_at,
        updatedAt: o.updated_at,

      }))

      set({

        workspaceId,
        leads: leadsRes.data || [],
        orcamentos: formattedOrcamentos,
        isLoading: false

      })

    } catch (error) {

      console.error("INIT ERROR:", error)
      set({ isLoading: false })

    }

  },

  // ================= FILTERS =================

  setFilter: (filter: any) =>
    set((state: any) => ({
      filters: { ...state.filters, ...filter }
    })),

  clearFilters: () =>
    set({
      filters: {
        status: 'all',
        temperatura: 'all',
        prioridadeLevel: 'all',
        search: '',
        analysisStatus: 'all',
      }
    }),

  // ================= LOGOUT =================

  logout: async () => {

    set({

      leads: [],
      orcamentos: [],
      transactions: [],
      notas: [],
      operacionalTasks: [],

      selectedLeadId: null,
      activeModule: 'dashboard'

    })

  }

}))