import { HISTORICO_TIPO } from '@/types'
import type { HistoricoEntry, LeadTemperature } from '@/types'
import type { StrategicDiagnosis } from './strategicDiagnosisService'
import { generateFullStrategicDiagnosisWithAI } from './strategicDiagnosisService'
import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { useStore } from '@/store/useStore'
import { isValidDateInput } from '@/utils/date'
import { useDebounce } from '@/hooks/useDebounce'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { PageMasthead } from '@/components/editorial/PageMasthead'
import { SectionHeading } from '@/components/editorial/SectionHeading'
import { EmptyState } from '@/components/editorial/EmptyState'
import { Colophon } from '@/components/editorial/Colophon'
import { FAIXA_PRIORIDADE_LEAD, ROTULO_PRIORIDADE_LEAD, TEMPERATURA_LEAD, nivelPrioridade } from '@/modules/leads/visualLead'
import {
  Sparkles,
  Brain,
  FileText,
  Search,
  X,
  AlertTriangle,
  BarChart3,
  Target,
  RefreshCw,
  MessageCircle,
  CalendarClock,
  Rocket,
} from 'lucide-react'
import { analyzeLeadsBatch, generatePriorityReport } from './iaService'

// Redesign D7: número grande do masthead com contagem (padrão ExecucaoContada da D4).
// Componente próprio para a contagem não re-renderizar a tela inteira a cada quadro.
// Devolve só <span>: o PageMasthead já envolve o stat num <p>.
function LeadsAtivosContados({ valor }: { valor: number }) {
  const animado = useCountUp(valor)
  return (
    <>
      <span className="sr-only">{valor}</span>
      <span aria-hidden="true">{String(Math.round(animado)).padStart(2, '0')}</span>
    </>
  )
}

const SECAO = 'border border-[var(--border-strong)] bg-[var(--bg-surface)]'
const CELULA = 'border-r border-b border-[var(--border)] px-3 py-3 md:px-4'

// Cartões da carteira: mesmos rótulos de antes; a cor sai do visualLead (mesma linguagem do resto do app)
const CARTEIRA = [
  { chave: 'criticos', rotulo: 'Críticos', nivel: 'critico' },
  { chave: 'altaPrioridade', rotulo: 'Alta Prioridade', nivel: 'alto' },
  { chave: 'mediaPrioridade', rotulo: 'Média Prioridade', nivel: 'medio' },
  { chave: 'baixaPrioridade', rotulo: 'Baixa Prioridade', nivel: 'baixo' },
] as const

export function IAAssistente() {
  const leads = useStore(state => state.leads)
  const filters = useStore(state => state.filters)
  const setFilter = useStore(state => state.setFilter)
  const clearFilters = useStore(state => state.clearFilters)
  const updateLead = useStore(state => state.updateLead)
  const addToast = useStore(state => state.addToast)
  const addOperacionalTask = useStore(state => state.addOperacionalTask)

  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<StrategicDiagnosis | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [_showReport, setShowReport] = useState(false)
  const [_priorityReport, setPriorityReport] = useState<string>('')

  // 🔎 Busca com debounce
  const [searchInput, setSearchInput] = useState<string>(filters.search)
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    setFilter({ search: debouncedSearch })
  }, [debouncedSearch, setFilter])

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.temperatura !== 'all' ||
    filters.search !== ''

  // 🔥 Leads ativos (não fechados, não perdidos, não analisados)
  const activeLeads = useMemo(() => {
    return leads
      .filter(l =>
        l.status !== 'fechado' &&
        l.status !== 'perdido' 
      )
      .sort((a, b) => b.prioridadeScore - a.prioridadeScore)
  }, [leads])

  // 🔎 Filtro cumulativo completo
  const filteredLeads = useMemo(() => {
  return activeLeads.filter(lead => {

    const matchesSearch =
      filters.search === '' ||
      lead.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.servico.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.telefone.includes(filters.search);

    const matchesStatus =
      filters.status === 'all' ||
      lead.status === filters.status;

    const matchesTemperatura =
      filters.temperatura === 'all' ||
      lead.temperatura === filters.temperatura;

    // 🔥 NOVO FILTRO
    if (filters.analysisStatus !== 'all') {
      const jaAnalisado = lead.historico?.some(
        (h: HistoricoEntry) => h.tipo === HISTORICO_TIPO.IA_ANALYSIS
      );

      if (
        filters.analysisStatus === 'analisado' &&
        !jaAnalisado
      ) {
        return false;
      }

      if (
        filters.analysisStatus === 'nao_analisado' &&
        jaAnalisado
      ) {
        return false;
      }
    }

    return matchesSearch && matchesStatus && matchesTemperatura;

  });
}, [activeLeads, filters]);

  const selectedLead = leads.find(l => l.id === selectedLeadId)

  const batchAnalysis = useMemo(() => {
    return analyzeLeadsBatch(activeLeads)
  }, [activeLeads])

  const handleAnalyze = async () => {
    if (!selectedLead) return
    setIsAnalyzing(true)

    try {
      const diagnosis = await generateFullStrategicDiagnosisWithAI(selectedLead)
      setAnalysis(diagnosis)
      setShowPreview(true)
    } catch (error) {
      console.error(error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApply = async () => {
    if (!selectedLead || !analysis) return

    const observacoesExistentes = selectedLead.observacoes?.trim()
    const blocoPlano = `[Plano IA - ${new Date().toLocaleDateString('pt-BR')}]\n${analysis.estrategiaDeAbordagem}`
    const observacoesAtualizadas = observacoesExistentes
      ? `${observacoesExistentes}\n\n---\n${blocoPlano}`
      : blocoPlano

    const leadOk = await updateLead(selectedLead.id, {
  resumo: analysis.resumoExecutivo,
  proximoContato: analysis.dataIdealFollowUp,
  observacoes: observacoesAtualizadas,

  historico: [
    ...(selectedLead.historico || []),
    {
      id: crypto.randomUUID(),
      tipo: HISTORICO_TIPO.IA_ANALYSIS,
      descricao: `Análise estratégica aplicada (Probabilidade ${analysis.probabilidadeConversao}%)`,
      createdAt: new Date().toISOString(),
      meta: {
        probabilidade: analysis.probabilidadeConversao,
        risco: analysis.riscoDePerda,
        maturidade: analysis.maturidade,
        estrategia: analysis.estrategiaDeAbordagem,
      },
    },
  ],
})
    // Falhou: o leadSlice já mostrou o erro; a prévia fica aberta e nenhuma tarefa é criada
    if (!leadOk) return

    let tarefaOk = true
    if (analysis.nivelDeUrgencia >= 3) {
      // A tarefa exige yyyy-MM-dd; o diagnóstico manda ISO em UTC, então vira o dia local.
      const v = analysis.dataIdealFollowUp
      tarefaOk = await addOperacionalTask({
        leadId: selectedLead.id,
        titulo: `Follow-up - ${selectedLead.nome}`,
        data: isValidDateInput(v) ? v : format(new Date(v), 'yyyy-MM-dd'),
        prioridade:
          analysis.riscoDePerda === 'critico'
            ? 'alta'
            : analysis.riscoDePerda === 'alto'
            ? 'media'
            : 'baixa',
        tipo: 'followup',
        descricao: analysis.mensagemSugeridaWhatsApp,
      })
    }

    // O lead já foi gravado: fecha o preview mesmo se a tarefa falhar (o slice já mostrou o erro),
    // para não aplicar de novo e duplicar o bloco "[Plano IA]" nas observações.
    addToast(
      tarefaOk
        ? { type: 'success', message: 'Estratégia aplicada com sucesso!' }
        : { type: 'warning', message: 'Estratégia aplicada! A tarefa de follow-up não foi criada. Crie no Operacional.' }
    )
    setShowPreview(false)
    setAnalysis(null)
    setSelectedLeadId('')
  }

  const handleGenerateReport = () => {
    const report = generatePriorityReport(activeLeads)
    setPriorityReport(report)
    setShowReport(true)
  }

  // Redesign D7: voltar ao painel do Colophon (fora do bloco de cima, que não mudou)
  const setActiveModule = useStore(state => state.setActiveModule)

  return (
    <div className="flex flex-col md:h-full">

      <div className="space-y-5 md:space-y-6 md:flex-1 md:overflow-y-auto">

        {/* ================= 00 ABERTURA ================= */}
        <PageMasthead
          tone="ia"
          kicker="Inteligência · IA Assistente"
          title="IA"
          italic="Assistente"
          description="Análise estratégica inteligente de leads"
          ghost="IA"
          stat={<LeadsAtivosContados valor={activeLeads.length} />}
          statLabel="Leads ativos"
        />

        {/* ONBOARDING — visível enquanto nenhum lead foi analisado */}
        {!leads.some(l => l.historico?.some((h: HistoricoEntry) => h.tipo === HISTORICO_TIPO.IA_ANALYSIS)) && (
          <div className="border border-[var(--ia)] bg-[var(--ia-subtle)] px-5 py-4 md:px-6">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-2xl leading-none text-[var(--ia)]">✦</span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Bem-vindo ao IA Assistente
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                  Analise seus leads automaticamente para identificar oportunidades, riscos e ações recomendadas. Selecione um lead abaixo e clique em "Analisar" para começar.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="ed-mono px-2 py-1" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
                    Oportunidades
                  </span>
                  <span className="ed-mono px-2 py-1" style={{ background: 'var(--warning-subtle)', color: 'var(--warning)' }}>
                    Riscos
                  </span>
                  <span className="ed-mono px-2 py-1" style={{ background: 'var(--info-subtle)', color: 'var(--info)' }}>
                    Ações recomendadas
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 01 CARTEIRA ================= */}
        <section className="space-y-3">
          <SectionHeading
            index="01"
            label="Carteira"
            right={
              <Button onClick={handleGenerateReport} variant="secondary" size="sm" className="rounded-none">
                <FileText className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            }
          />

          <div className={cn(SECAO, 'grid grid-cols-2 md:grid-cols-4')}>
            {CARTEIRA.map((c, i) => (
              <div
                key={c.chave}
                className={cn(
                  'relative border-[var(--border)] px-4 py-3.5 md:px-5',
                  i % 2 === 1 && 'border-l',
                  i === 2 && 'md:border-l',
                  i >= 2 && 'border-t md:border-t-0'
                )}
              >
                <span aria-hidden="true" className="absolute inset-y-3 left-0 w-[3px]" style={{ background: FAIXA_PRIORIDADE_LEAD[c.nivel] }} />
                <p className="ed-mono text-[var(--text-tertiary)]">{c.rotulo}</p>
                <p
                  className="tnum mt-1.5 text-[28px] leading-none"
                  style={{ fontWeight: 'var(--font-bold)', letterSpacing: '-0.03em', color: ROTULO_PRIORIDADE_LEAD[c.nivel].cor }}
                >
                  {batchAnalysis[c.chave].length}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= 02 ANALISAR LEAD (sessão + sugestões) ================= */}
        <section className="space-y-3">
          <SectionHeading index="02" label="Analisar Lead Individual" />

          {/* 🔎 BUSCA + FILTROS — acima da sessão, como antes: no celular o Analisar fica colado na lista */}
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
              <div className="relative sm:col-span-3 xl:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Buscar por nome, telefone ou serviço..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 border border-[var(--border-strong)] text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <Select
                value={filters.status}
                onChange={e => setFilter({ status: e.target.value as any })}
                className="min-h-[44px] rounded-none"
                options={[
                  { value: 'all', label: 'Todos Status' },
                  { value: 'novo', label: 'Novo' },
                  { value: 'atendimento', label: 'Em Atendimento' },
                  { value: 'orcado', label: 'Orçado' },
                ]}
              />

              <Select
                value={filters.temperatura}
                onChange={e => setFilter({ temperatura: e.target.value as any })}
                className="min-h-[44px] rounded-none"
                options={[
                  { value: 'all', label: 'Todas Temperaturas' },
                  { value: 'quente', label: '🔥 Quente' },
                  { value: 'morno', label: '☀️ Morno' },
                  { value: 'frio', label: '❄️ Frio' },
                ]}
              />

              {/* 🔥 NOVO FILTRO ESTRATÉGICO */}
              <Select
                value={filters.analysisStatus}
                onChange={e =>
                  setFilter({ analysisStatus: e.target.value as any })
                }
                className="min-h-[44px] rounded-none"
                options={[
                  { value: 'all', label: 'Todos Leads' },
                  { value: 'nao_analisado', label: '🧠 Não Analisados' },
                  { value: 'analisado', label: '🧠 Já Analisados' },
                ]}
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1 rounded-none"
              >
                <X className="w-4 h-4" />
                Limpar
              </Button>
            )}
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-12">

            {/* SESSÃO — o lead escolhido e o que a IA já registrou; o Analisar fica onde seria a caixa de texto */}
            <section className={cn(SECAO, 'lg:col-span-7')}>
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3 md:px-6">
                <Sparkles aria-hidden="true" className="w-3.5 h-3.5 text-[var(--ia)]" />
                <p className="ed-mono text-[var(--text-secondary)]">Sessão</p>
                <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 bg-[var(--ia)]" />
              </div>

              {!selectedLead ? (
                <div className="p-5 md:p-6">
                  <EmptyState title="Nenhum lead selecionado" note="Escolha um lead nas sugestões" />
                </div>
              ) : (
                (() => {
      const iaAnalises = selectedLead.historico?.filter(
        (h: HistoricoEntry) => h.tipo === HISTORICO_TIPO.IA_ANALYSIS
      ) || []

      const ultima = iaAnalises[iaAnalises.length - 1]
      const anterior = iaAnalises[iaAnalises.length - 2]

      const probAtual = ultima?.meta?.probabilidade ?? null
      const probAnterior = anterior?.meta?.probabilidade ?? null

      const riscoAtual = ultima?.meta?.risco ?? null
      const riscoAnterior = anterior?.meta?.risco ?? null

      const variacaoProb =
        probAtual !== null && probAnterior !== null
          ? probAtual - probAnterior
          : null

      const riscoMudou =
        riscoAtual && riscoAnterior && riscoAtual !== riscoAnterior

      const conflitoEstrategico =
        probAtual !== null &&
        probAtual >= 60 &&
        selectedLead.temperatura === 'frio'

      // Só visual: rótulo da prioridade (mesmo fallback "baixo" do PriorityBadge) e ícone da temperatura
      const rotulo = ROTULO_PRIORIDADE_LEAD[nivelPrioridade(selectedLead.prioridadeLevel)]
      const temp = TEMPERATURA_LEAD[selectedLead.temperatura as LeadTemperature]

                  return (
                    <>
                      <div className="space-y-3 px-5 py-4 md:px-6">

                        {/* LADO DO USUÁRIO — o lead escolhido */}
                        <div className="ml-auto max-w-[92%] border border-[var(--border-accent)] bg-[var(--accent-subtle)] px-4 py-3 sm:max-w-[85%]">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h3
                              className="min-w-0 text-[length:var(--text-md)] leading-snug text-[var(--text-primary)] [overflow-wrap:anywhere]"
                              style={{ fontWeight: 'var(--font-semibold)' }}
                            >
                              {selectedLead.nome}
                            </h3>

                            {iaAnalises.length > 0 && (
                              <span className="inline-flex items-center gap-1 bg-[var(--ia-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--ia)]">
                                <Brain aria-hidden="true" className="w-3 h-3" />
                                Estratégia Ativa
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[var(--text-tertiary)]">
                            {selectedLead.servico}
                          </p>

                          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            <span className="ed-mono" style={{ color: rotulo.cor }}>
                              {rotulo.texto} ({selectedLead.prioridadeScore})
                            </span>
                            <StatusBadge status={selectedLead.status} />
                            {temp && (
                              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                <temp.Icone aria-hidden="true" className="w-3.5 h-3.5" style={{ color: temp.cor }} />
                                {temp.rotulo}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* LADO DA IA — o que já está registrado no histórico do lead */}
                        {(ultima || conflitoEstrategico) && (
                          <div className="mr-auto max-w-[92%] space-y-2 border-l-2 border-[var(--ia)] bg-[var(--ia-subtle)] px-4 py-3 sm:max-w-[85%]">
                            <p className="ed-mono text-[var(--ia)]">IA</p>

                            {/* EVOLUÇÃO ESTRATÉGICA */}
                            {ultima && (
                              <div className="space-y-1.5">
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ia)]">
                                  <BarChart3 aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                                  Evolução Estratégica
                                </p>

                                <div className="text-xs space-y-1 text-[var(--text-secondary)]">
                                  <p className="flex items-center gap-1.5">
                                    <Target aria-hidden="true" className="w-3.5 h-3.5 shrink-0 text-[var(--text-tertiary)]" />
                                    <span>Probabilidade atual: <strong className="tnum text-[var(--text-primary)]">{probAtual}%</strong></span>
                                  </p>

                                  {variacaoProb !== null && (
                                    <p className="tnum font-medium" style={{ color: variacaoProb > 0 ? 'var(--success)' : variacaoProb < 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                                      {variacaoProb > 0 && '▲'}
                                      {variacaoProb < 0 && '▼'}
                                      {variacaoProb === 0 && '→'}
                                      {' '}
                                      {Math.abs(variacaoProb)}% desde última análise
                                    </p>
                                  )}

                                  <p className="flex items-center gap-1.5">
                                    <AlertTriangle aria-hidden="true" className="w-3.5 h-3.5 shrink-0 text-[var(--text-tertiary)]" />
                                    <span>Risco atual: <strong className="text-[var(--text-primary)]">{riscoAtual}</strong></span>
                                  </p>

                                  {riscoMudou && (
                                    <p className="flex items-center gap-1.5 font-medium text-[var(--warning)]">
                                      <RefreshCw aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                                      Risco alterado desde última análise
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* ALERTA DE CONFLITO */}
                            {conflitoEstrategico && (
                              <div className="flex items-start gap-2 border px-3 py-2 text-xs" style={{ background: 'var(--danger-subtle)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                                <AlertTriangle aria-hidden="true" className="mt-px w-3.5 h-3.5 shrink-0" />
                                <span>Inconsistência estratégica detectada: Probabilidade alta com temperatura fria.</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* BOTÃO — onde o protótipo tinha a caixa de texto */}
                      <div className="border-t border-[var(--border)] px-5 py-3 md:px-6" style={{ position: 'relative', zIndex: 10 }}>
                        <Button
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                          className="w-full gap-2 rounded-none bg-[var(--ia)] hover:opacity-90 text-white"
                        >
                          <Sparkles aria-hidden="true" className="w-4 h-4" />
                          {isAnalyzing ? 'Analisando...' : 'Analisar Lead'}
                        </Button>
                      </div>
                    </>
                  )
                })()
              )}
            </section>

            {/* SUGESTÕES — a lista de leads de hoje (mesma ordem, busca e filtros); tocar escolhe o lead */}
            <section className={cn(SECAO, 'lg:col-span-5')}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[var(--border)] px-5 py-3 md:px-6">
                <Sparkles aria-hidden="true" className="w-3.5 h-3.5 text-[var(--ia)]" />
                <p className="ed-mono text-[var(--ia)]">Sugestões</p>
                <p className="ed-mono text-[var(--text-tertiary)]">· Selecionar Lead</p>
              </div>

              {filteredLeads.length === 0 ? (
                <div className="p-5 md:p-6">
                  <EmptyState title="Nenhum lead encontrado" note="Leads fechados e perdidos não entram aqui" />
                </div>
              ) : (
                <ul className="max-h-80 overflow-y-auto">
                  {filteredLeads.map(lead => {
                    const nivel = nivelPrioridade(lead.prioridadeLevel)
                    const rotuloLinha = ROTULO_PRIORIDADE_LEAD[nivel]
                    return (
                      <li key={lead.id} className="border-b border-[var(--border)] last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setSelectedLeadId(lead.id)}
                          className={cn(
                            'relative flex w-full min-h-[44px] items-center gap-3 px-5 py-3 text-left transition-colors md:px-6',
                            lead.id === selectedLeadId
                              ? 'bg-[var(--accent-subtle)] shadow-[inset_0_0_0_1px_var(--accent)]'
                              : 'hover:bg-[var(--bg-surface-2)]'
                          )}
                        >
                          <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px]" style={{ background: FAIXA_PRIORIDADE_LEAD[nivel] }} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium leading-snug text-[var(--text-primary)] [overflow-wrap:anywhere]">
                              {lead.nome}
                            </span>
                            <span className="block truncate text-xs text-[var(--text-tertiary)]">
                              {lead.servico}
                            </span>
                          </span>
                          <span className="ed-mono shrink-0" style={{ color: rotuloLinha.cor }}>{rotuloLinha.texto}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        </section>

        {/* ================= 03 COMO FUNCIONA ================= */}
        <section className="space-y-3">
          <SectionHeading index="03" label="Como funciona a Análise Estratégica da IA" />
          <div className={cn(SECAO, 'px-5 py-4 md:px-6')}>
            <div className="flex items-start gap-3">
              <Brain aria-hidden="true" className="w-5 h-5 shrink-0 text-[var(--ia)] mt-0.5" />
              <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                <li>• Avalia risco de perda baseado em tempo sem contato</li>
                <li>• Calcula probabilidade real de conversão (%)</li>
                <li>• Mede maturidade do lead (1 a 5)</li>
                <li>• Identifica risco de concorrência</li>
                <li>• Classifica potencial futuro</li>
                <li>• Define urgência operacional automaticamente</li>
                <li>• Gera abordagem estratégica personalizada</li>
                <li><strong>Mostra preview antes de aplicar alterações</strong></li>
              </ul>
            </div>
          </div>
        </section>

        <Colophon label="VRTX CRM · IA Assistente" onBack={() => setActiveModule('dashboard')} />

      </div>

      {/* MODAIS */}

      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Preview da Análise Estratégica"
        size="xl"
      >
        {analysis && (
          <div className="p-4 space-y-4 md:p-6 md:space-y-5">

            {!analysis.aiUsed && (
              <div className="p-4 bg-[var(--warning-subtle)] border border-[var(--warning)] flex gap-3">
                <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[var(--warning)]">
                    Análise simplificada — IA indisponível
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Não foi possível confirmar o refinamento com a IA agora. Os dados abaixo usam o diagnóstico heurístico local; revise antes de aplicar.
                  </p>
                </div>
              </div>
            )}

            {/* 🔷 DIAGNÓSTICO ESTRATÉGICO */}
            <div className="grid grid-cols-2 md:grid-cols-3 border-l border-t border-[var(--border)] bg-[var(--bg-surface-2)] text-sm">

              <div className={CELULA}>
                <p className="ed-mono text-[var(--text-tertiary)]">Probabilidade</p>
                <p className="tnum mt-1 text-2xl leading-none text-[var(--ia)]" style={{ fontWeight: 'var(--font-bold)' }}>
                  {analysis.probabilidadeConversao}%
                </p>
              </div>

              <div className={CELULA}>
                <p className="ed-mono text-[var(--text-tertiary)]">Maturidade</p>
                <p className="tnum mt-1 font-bold">
                  {analysis.maturidade}/5
                </p>
              </div>

              <div className={CELULA}>
                <p className="ed-mono text-[var(--text-tertiary)]">Tipo</p>
                <p className="mt-1 font-medium">
                  {analysis.tipoLead || 'Oportunidade ativa'}
                </p>
              </div>

              <div className={CELULA}>
                <p className="ed-mono text-[var(--text-tertiary)]">Risco de Perda</p>
                <p className="mt-1 font-medium capitalize">
                  {analysis.riscoDePerda}
                </p>
              </div>

              <div className={CELULA}>
                <p className="ed-mono text-[var(--text-tertiary)]">Risco Concorrência</p>
                <p className="mt-1 font-medium capitalize">
                  {analysis.riscoConcorrencia}
                </p>
              </div>

              <div className={CELULA}>
                <p className="ed-mono text-[var(--text-tertiary)]">Potencial Futuro</p>
                <p className="mt-1 font-medium capitalize">
                  {analysis.potencialFuturo}
                </p>
              </div>

            </div>

            {/* 🔷 RESUMO EXECUTIVO */}
            <div className="bg-[var(--bg-surface-2)] p-4 border border-[var(--border)]">
              <p className="flex items-center gap-2 font-semibold text-[var(--text-primary)] mb-2">
                <BarChart3 aria-hidden="true" className="w-4 h-4 shrink-0 text-[var(--ia)]" />
                Interpretação Estratégica
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {analysis.resumoExecutivo}
              </p>
            </div>

            {/* 🔷 ESTRATÉGIA */}
            <div className="bg-[var(--bg-surface-2)] p-4 border border-[var(--border)]">
              <p className="flex items-center gap-2 font-semibold text-[var(--text-primary)] mb-2">
                <Target aria-hidden="true" className="w-4 h-4 shrink-0 text-[var(--ia)]" />
                Estratégia Recomendada
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {analysis.estrategiaDeAbordagem}
              </p>
            </div>

            {/* 🔷 MENSAGEM WHATSAPP */}
            {analysis.mensagemSugeridaWhatsApp && (
              <div className="p-4 border border-[var(--border)]" style={{ background: 'var(--success-subtle)' }}>
                <p className="flex items-center gap-2 font-semibold mb-2" style={{ color: 'var(--success)' }}>
                  <MessageCircle aria-hidden="true" className="w-4 h-4 shrink-0" />
                  Mensagem WhatsApp
                </p>

                <textarea
                  readOnly
                  value={analysis.mensagemSugeridaWhatsApp}
                  className="w-full text-sm p-3 border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)]"
                  rows={4}
                />

                <div className="flex justify-end mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-none"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(analysis.mensagemSugeridaWhatsApp)
                        addToast({ type: 'success', message: 'Mensagem copiada!' })
                      } catch {
                        addToast({ type: 'error', message: 'Não foi possível copiar. Selecione o texto e copie.' })
                      }
                    }}
                  >
                    Copiar Mensagem
                  </Button>
                </div>
              </div>
            )}

            {/* 🔷 PRÓXIMA AÇÃO */}
            <div className="bg-[var(--warning-subtle)] p-4 border border-[var(--border)]">
              <p className="flex items-center gap-2 font-semibold text-[var(--warning)] mb-2">
                <CalendarClock aria-hidden="true" className="w-4 h-4 shrink-0" />
                Próxima Ação Recomendada
              </p>

              <p className="text-sm">
                Data ideal de follow-up:
                <span className="tnum font-bold ml-2">
                  {analysis.dataIdealFollowUp
                    ? new Date(analysis.dataIdealFollowUp).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </p>

              {analysis.nivelDeUrgencia >= 3 && (
                <p className="flex items-center gap-1.5 text-sm mt-1" style={{ color: 'var(--danger)' }}>
                  <AlertTriangle aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                  Será criada uma tarefa automática de follow-up.
                </p>
              )}
            </div>

            {/* 🔷 BOTÃO FINAL */}
            <div className="pt-4 border-t border-[var(--border)]">
              <Button
                onClick={handleApply}
                className="w-full gap-2 text-base rounded-none"
              >
                <Rocket aria-hidden="true" className="w-4 h-4" />
                Executar Plano Estratégico
              </Button>

              <p className="text-xs text-[var(--text-tertiary)] text-center mt-2">
                Atualizará resumo, próximo contato e observações, e poderá criar ação operacional.
              </p>
            </div>

          </div>
        )}
      </Modal>

    </div>
  )
}