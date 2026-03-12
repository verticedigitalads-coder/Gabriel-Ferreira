import { create } from "zustand"
import { persist } from "zustand/middleware"

import { supabase } from "@/lib/supabase"

import { createLeadSlice } from "./slices/leadSlice"
import { createOrcamentoSlice } from "./slices/orcamentoSlice"
import { createFinanceiroSlice } from "./slices/financeiroSlice"
import { createNotaSlice } from "./slices/notaSlice"
import { createOperacionalSlice } from "./slices/operacionalSlice"
import { createUISlice } from "./slices/uiSlice"

import { createFornecedorSlice } from "./slices/fornecedorSlice"
import { createCotacaoMaterialSlice } from "./slices/cotacaoMaterialSlice"
import { createMaterialSlice } from "./slices/materialSlice"
import { createConsumoMaterialSlice } from "./slices/consumoMaterialSlice"
import { createFormSlice } from "./slices/formSlice"

import type { DashboardStats } from "@/types"

export const useStore = create(
  persist(
    (set, get) => ({

      // ================= CORE STATE =================

      workspaceId: null,

      metaMensal: 100000,

      filters: {
        status: "all",
        temperatura: "all",
        prioridadeLevel: "all",
        search: "",
        analysisStatus: "all",
      },

      isLoading: true,

      // ================= SLICES =================

      ...createLeadSlice(set, get),
      ...createOrcamentoSlice(set, get),
      ...createFinanceiroSlice(set, get),
      ...createNotaSlice(set, get),
      ...createOperacionalSlice(set, get),
      ...createUISlice(set, get),

      ...createFornecedorSlice(set, get),
      ...createCotacaoMaterialSlice(set, get),
      ...createMaterialSlice(set, get),
      ...createConsumoMaterialSlice(set, get),

      ...createFormSlice(set, get),

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
              .from("leads")
              .select("*")
              .eq("workspace_id", workspaceId)
              .order("created_at", { ascending: false }),

            supabase
              .from("orcamentos")
              .select("*")
              .eq("workspace_id", workspaceId)
              .order("created_at", { ascending: false }),

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
            status: "all",
            temperatura: "all",
            prioridadeLevel: "all",
            search: "",
            analysisStatus: "all",
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
          activeModule: "dashboard"

        })

      }

    }),
    {
      name: "crm-storage"
    }
  )
)