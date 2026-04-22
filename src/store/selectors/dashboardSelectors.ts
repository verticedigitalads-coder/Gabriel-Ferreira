import { useStore } from '../useStore'
import type { DashboardStats } from '@/types'

export const useDashboardStats = (): DashboardStats => {

  const leads = useStore(state => state.leads)
  const transactions = useStore(state => state.transactions)
  const metaMensal = useStore(state => state.metaMensal)
  const tasks = useStore(state => state.operacionalTasks)

  const hojeDate = new Date()
  hojeDate.setHours(0,0,0,0)

  const receitasMes = transactions
    .filter(t => t.tipo === 'receita')
    .reduce((sum,t) => sum + (t.valor ?? 0),0)

  const fechados = leads.filter(l => l.status === 'fechado')

  const receitaPotencial = leads
    .filter(l => l.status === 'orcado')
    .reduce((sum,l) => sum + (l.valorOrcado ?? 0),0)

  const receitaProvavel = leads
    .filter(l => l.status === 'orcado')
    .reduce((sum,l)=>{

      let peso = 0

      if(l.temperatura === 'quente') peso = 0.7
      if(l.temperatura === 'morno') peso = 0.4
      if(l.temperatura === 'frio') peso = 0.15

      return sum + ((l.valorOrcado ?? 0) * peso)

    },0)

  const receitaConservadora = receitaPotencial * 0.3

  const tarefasHoje = tasks.filter(t=>{
    const dataTask = new Date(t.data)
    dataTask.setHours(0,0,0,0)
    return dataTask.getTime() === hojeDate.getTime() && !t.concluido
  })

  const tarefasAtrasadas = tasks.filter(t=>{
    const dataTask = new Date(t.data)
    dataTask.setHours(0,0,0,0)
    return dataTask.getTime() < hojeDate.getTime() && !t.concluido
  })

  const tarefasCriticas = tasks.filter(t=>{
    const dataTask = new Date(t.data)
    dataTask.setHours(0,0,0,0)
    return dataTask.getTime() <= hojeDate.getTime() && !t.concluido
  })

  const scoreOperacional =
    (tarefasHoje.length * 10) +
    (tarefasAtrasadas.length * 25)

  const scoreComercial = leads.reduce((acc,lead)=>{

    let score = 0

    if(lead.status === 'orcado') score += 20
    if(lead.status === 'fechado') score += 30

    if(lead.temperatura === 'quente') score += 25
    if(lead.temperatura === 'morno') score += 10

    if(lead.valorOrcado && lead.valorOrcado > 20000) score += 30
    else if(lead.valorOrcado && lead.valorOrcado > 10000) score += 20
    else if(lead.valorOrcado && lead.valorOrcado > 5000) score += 10

    return acc + score

  },0)

  return {

    totalLeads: leads.length,
    leadsAtrasados: 0,
    leadsCriticos: 0,

    orcamentosEnviados: leads.filter(l=>l.orcamentoEnviado).length,

    fechados: fechados.length,

    valorTotalOrcado: leads.reduce((sum,l)=> sum + (l.valorOrcado ?? 0),0),

    receitaMes: receitasMes,

    leadsQuentes: leads.filter(l=>l.temperatura === 'quente').length,
    leadsNovos: leads.filter(l=>l.status === 'novo').length,
    leadsMornos: leads.filter(l=>l.temperatura === 'morno').length,
    leadsFrios: leads.filter(l=>l.temperatura === 'frio').length,

    valorFechado: fechados.reduce((sum,l)=> sum + (l.valorOrcado ?? 0),0),

    taxaConversao:
      leads.length > 0
        ? (fechados.length / leads.length) * 100
        : 0,

    receitaPotencial,
    receitaProvavel,
    receitaConservadora,

    metaMensal,

    tarefasHoje: tarefasHoje.length,
    tarefasAtrasadas: tarefasAtrasadas.length,
    tarefasSemana: tasks.length,

    scoreOperacional,
    scoreComercial,

    tarefasCriticas: tarefasCriticas.length

  }

}