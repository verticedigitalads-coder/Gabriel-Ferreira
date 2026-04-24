import { HISTORICO_TIPO } from '@/types'
import type { HistoricoEntry } from '@/types'
import type { StrategicDiagnosis } from './strategicDiagnosisService'
import { generateFullStrategicDiagnosisWithAI } from './strategicDiagnosisService'
import { useState, useMemo, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { StatusBadge, TemperatureBadge, PriorityBadge } from '@/components/ui/Badge'
import {
  Sparkles,
  Brain,
  FileText,
  Search,
  X,
} from 'lucide-react'
import { analyzeLeadsBatch, generatePriorityReport } from './iaService'

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

    await updateLead(selectedLead.id, {
  temperatura:
    analysis.temperaturaSugerida === 'fria'
      ? 'frio'
      : analysis.temperaturaSugerida === 'morna'
      ? 'morno'
      : 'quente',

  status: analysis.statusSugerido,
  resumo: analysis.resumoExecutivo,
  proximoContato: analysis.dataIdealFollowUp,
  observacoes: analysis.estrategiaDeAbordagem,

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

    if (analysis.nivelDeUrgencia >= 3) {
      await addOperacionalTask({
        leadId: selectedLead.id,
        titulo: `Follow-up - ${selectedLead.nome}`,
        data: analysis.dataIdealFollowUp,
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

    addToast({ type: 'success', message: 'Estratégia aplicada com sucesso!' })
    setShowPreview(false)
    setAnalysis(null)
    setSelectedLeadId('')
  }

  const handleGenerateReport = () => {
    const report = generatePriorityReport(activeLeads)
    setPriorityReport(report)
    setShowReport(true)
  }

  return (
    <div className="h-full flex flex-col">

      {/* HEADER */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-surface)] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">IA Assistente</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Análise estratégica inteligente de leads
            </p>
          </div>
        </div>

        <Button onClick={handleGenerateReport} variant="secondary">
          <FileText className="w-4 h-4 mr-2" />
          Gerar Relatório
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* CARDS PRIORIDADE */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-red-500">
            <p className="text-xs text-[var(--text-tertiary)] uppercase">Críticos</p>
            <p className="text-2xl font-bold text-red-600">
              {batchAnalysis.criticos.length}
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-orange-500">
            <p className="text-xs text-[var(--text-tertiary)] uppercase">Alta Prioridade</p>
            <p className="text-2xl font-bold text-orange-600">
              {batchAnalysis.altaPrioridade.length}
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-yellow-500">
            <p className="text-xs text-[var(--text-tertiary)] uppercase">Média Prioridade</p>
            <p className="text-2xl font-bold text-yellow-600">
              {batchAnalysis.mediaPrioridade.length}
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-500">
            <p className="text-xs text-[var(--text-tertiary)] uppercase">Baixa Prioridade</p>
            <p className="text-2xl font-bold text-green-600">
              {batchAnalysis.baixaPrioridade.length}
            </p>
          </Card>
        </div>

        {/* CARD EXPLICATIVO */}
        <Card className="p-4 border-[var(--border)]">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Como funciona a Análise Estratégica da IA
              </p>
              <ul className="text-xs text-[var(--text-secondary)] mt-2 space-y-1">
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
        </Card>

        {/* ANALISAR LEAD */}
        <Card className="p-6">
  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
    Analisar Lead Individual
  </h2>

 {/* 🔎 BUSCA + FILTROS */}
<div className="flex flex-wrap items-center gap-3 mb-6">

  <div className="flex-1 min-w-[200px] max-w-md relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
    <input
      type="text"
      placeholder="Buscar por nome, telefone ou serviço..."
      value={searchInput}
      onChange={e => setSearchInput(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
    />
  </div>

  <Select
    value={filters.status}
    onChange={e => setFilter({ status: e.target.value as any })}
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
    options={[
      { value: 'all', label: 'Todos Leads' },
      { value: 'nao_analisado', label: '🧠 Não Analisados' },
      { value: 'analisado', label: '🧠 Já Analisados' },
    ]}
  />

  {hasActiveFilters && (
    <Button
      variant="ghost"
      size="sm"
      onClick={clearFilters}
      className="gap-1"
    >
      <X className="w-4 h-4" />
      Limpar
    </Button>
  )}
</div>

  {/* 🔎 PRÉ-VISUALIZAÇÃO FIXA NO TOPO */}
{selectedLead && (
  <div className="p-4 bg-[var(--bg-surface-2)] rounded-md border border-[var(--border)] mb-4 space-y-4">

    {(() => {
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

      return (
        <>
          {/* CABEÇALHO */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  {selectedLead.nome}
                </h3>

                {iaAnalises.length > 0 && (
                  <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    🧠 Estratégia Ativa
                  </span>
                )}
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                {selectedLead.servico}
              </p>
            </div>

            <PriorityBadge
              level={selectedLead.prioridadeLevel}
              score={selectedLead.prioridadeScore}
            />
          </div>

          {/* STATUS */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[var(--text-secondary)]">Status:</span>
              <p><StatusBadge status={selectedLead.status} /></p>
            </div>

            <div>
              <span className="text-[var(--text-secondary)]">Temperatura:</span>
              <p><TemperatureBadge temperatura={selectedLead.temperatura} /></p>
            </div>
          </div>

          {/* EVOLUÇÃO ESTRATÉGICA */}
          {ultima && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md space-y-2">
              <p className="text-xs font-semibold text-purple-800">
                📊 Evolução Estratégica
              </p>

              <div className="text-xs space-y-1">

                <p>
                  🎯 Probabilidade atual: <strong>{probAtual}%</strong>
                </p>

                {variacaoProb !== null && (
                  <p className={`font-medium ${
                    variacaoProb > 0
                      ? 'text-green-600'
                      : variacaoProb < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {variacaoProb > 0 && '▲'}
                    {variacaoProb < 0 && '▼'}
                    {variacaoProb === 0 && '→'}
                    {' '}
                    {Math.abs(variacaoProb)}% desde última análise
                  </p>
                )}

                <p>
                  ⚠️ Risco atual: <strong>{riscoAtual}</strong>
                </p>

                {riscoMudou && (
                  <p className="text-orange-600 font-medium">
                    🔄 Risco alterado desde última análise
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ALERTA DE CONFLITO */}
          {conflitoEstrategico && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              ⚠ Inconsistência estratégica detectada: 
              Probabilidade alta com temperatura fria.
            </div>
          )}

          {/* BOTÃO */}
          <div className="pt-3 border-t">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isAnalyzing ? 'Analisando...' : 'Analisar Lead'}
            </Button>
          </div>
        </>
      )
    })()}
  </div>
)}

  {/* 📋 LISTA SCROLLÁVEL EMBAIXO */}
  <div className="border-t pt-4">

    <p className="text-xs text-[var(--text-tertiary)] mb-2 uppercase tracking-wide">
      Selecionar Lead
    </p>

    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">

      {filteredLeads.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] text-center py-6">
          Nenhum lead encontrado
        </p>
      ) : (
        filteredLeads.map(lead => (
          <div
            key={lead.id}
            onClick={() => setSelectedLeadId(lead.id)}
            className={`p-3 rounded-md cursor-pointer border transition
              ${
                lead.id === selectedLeadId
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                  : 'border-[var(--border)] hover:bg-[var(--bg-surface-2)]'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {lead.nome}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] truncate">
                  {lead.servico}
                </p>
              </div>

              <PriorityBadge level={lead.prioridadeLevel} />
            </div>
          </div>
        ))
      )}

    </div>
  </div>

</Card>
      </div>

      {/* MODAIS */}

      <Modal
  isOpen={showPreview}
  onClose={() => setShowPreview(false)}
  title="Preview da Análise Estratégica"
  size="xl"
>
  {analysis && (
    <div className="p-6 space-y-6">

      {/* 🔷 DIAGNÓSTICO ESTRATÉGICO */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-[var(--bg-surface-2)] p-4 rounded-lg border border-[var(--border)]">

        <div>
          <p className="text-[var(--text-secondary)]">Probabilidade</p>
          <p className="font-bold text-lg">
            {analysis.probabilidadeConversao}%
          </p>
        </div>

        <div>
          <p className="text-[var(--text-secondary)]">Maturidade</p>
          <p className="font-bold">
            {analysis.maturidade}/5
          </p>
        </div>

        <div>
          <p className="text-[var(--text-secondary)]">Tipo</p>
          <p className="font-medium">
            {analysis.tipoLead || 'Oportunidade ativa'}
          </p>
        </div>

        <div>
          <p className="text-[var(--text-secondary)]">Risco de Perda</p>
          <p className="font-medium capitalize">
            {analysis.riscoDePerda}
          </p>
        </div>

        <div>
          <p className="text-[var(--text-secondary)]">Risco Concorrência</p>
          <p className="font-medium capitalize">
            {analysis.riscoConcorrencia}
          </p>
        </div>

        <div>
          <p className="text-[var(--text-secondary)]">Potencial Futuro</p>
          <p className="font-medium">
            {analysis.potencialFuturo}
          </p>
        </div>

      </div>

      {/* 🔷 RESUMO EXECUTIVO */}
      <div className="bg-[var(--bg-surface-2)] p-4 rounded-lg border border-[var(--border)]">
        <p className="font-semibold text-[var(--text-primary)] mb-2">
          📊 Interpretação Estratégica
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          {analysis.resumoExecutivo}
        </p>
      </div>

      {/* 🔷 ESTRATÉGIA */}
      <div className="bg-[var(--bg-surface-2)] p-4 rounded-lg border border-[var(--border)]">
        <p className="font-semibold text-[var(--text-primary)] mb-2">
          🎯 Estratégia Recomendada
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          {analysis.estrategiaDeAbordagem}
        </p>
      </div>

      {/* 🔷 MENSAGEM WHATSAPP */}
      {analysis.mensagemSugeridaWhatsApp && (
        <div className="bg-green-50 p-4 rounded-lg border">
          <p className="font-semibold text-green-800 mb-2">
            💬 Mensagem WhatsApp
          </p>

          <textarea
            readOnly
            value={analysis.mensagemSugeridaWhatsApp}
            className="w-full text-sm p-3 border border-[var(--border)] rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)]"
            rows={4}
          />

          <div className="flex justify-end mt-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                navigator.clipboard.writeText(
                  analysis.mensagemSugeridaWhatsApp
                )
              }
            >
              Copiar Mensagem
            </Button>
          </div>
        </div>
      )}

      {/* 🔷 PRÓXIMA AÇÃO */}
      <div className="bg-[var(--warning-subtle)] p-4 rounded-lg border border-[var(--border)]">
        <p className="font-semibold text-[var(--warning)] mb-2">
          📅 Próxima Ação Recomendada
        </p>

        <p className="text-sm">
          Data ideal de follow-up:
          <span className="font-bold ml-2">
            {analysis.dataIdealFollowUp}
          </span>
        </p>

        {analysis.nivelDeUrgencia >= 3 && (
          <p className="text-sm text-red-600 mt-1">
            ⚠ Será criada uma tarefa automática de follow-up.
          </p>
        )}
      </div>

      {/* 🔷 BOTÃO FINAL */}
      <div className="pt-4 border-t">
        <Button
          onClick={handleApply}
          className="w-full text-base"
        >
          🚀 Executar Plano Estratégico
        </Button>

        <p className="text-xs text-[var(--text-tertiary)] text-center mt-2">
          Atualizará status, temperatura e poderá criar ação operacional.
        </p>
      </div>

    </div>
  )}
</Modal>

    </div>
  )
}