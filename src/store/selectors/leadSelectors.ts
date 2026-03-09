import { useStore } from '../useStore'
import type { Lead } from '@/types'

export const useFilteredLeads = () => {

  const leads = useStore(state => state.leads)
  const filters = useStore(state => state.filters)

  return leads
    .filter((lead: Lead) => {

      // STATUS
      if (filters.status !== 'all' && lead.status !== filters.status)
        return false

      // TEMPERATURA
      if (
        filters.temperatura !== 'all' &&
        lead.temperatura !== filters.temperatura
      )
        return false

      // PRIORIDADE
      if (
        filters.prioridadeLevel !== 'all' &&
        lead.prioridadeLevel !== filters.prioridadeLevel
      )
        return false

      // ANALYSIS STATUS
      if (filters.analysisStatus !== 'all') {

        const jaAnalisado = lead.historico?.some(
          h => h.tipo === 'ia_analysis'
        )

        if (
          filters.analysisStatus === 'analisado' &&
          !jaAnalisado
        )
          return false

        if (
          filters.analysisStatus === 'nao_analisado' &&
          jaAnalisado
        )
          return false
      }

      // BUSCA
      if (filters.search) {

        const search = filters.search.toLowerCase()

        if (
          !lead.nome.toLowerCase().includes(search) &&
          !lead.servico.toLowerCase().includes(search) &&
          !lead.telefone.includes(search)
        )
          return false
      }

      return true
    })
    .sort((a: Lead, b: Lead) => b.prioridadeScore - a.prioridadeScore)
}