import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Plus, Trash2, X, TrendingUp, List } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Cores para as linhas do gráfico (recharts não suporta CSS vars) ──────────
const LINE_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
]

// ─── Formas de pagamento disponíveis ──────────────────────────────────────────
const FORMAS_PAGAMENTO = ['À vista', 'Boleto 30d', 'Boleto 60d', 'Parcelado', 'Pix', 'Outro']

// ─── Estilos base reutilizáveis ────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  padding: '0 12px',
  height: 44,
  width: '100%',
  fontSize: 'var(--text-sm)',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-secondary)',
  marginBottom: 4,
  fontWeight: 500,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ComparadorPrecos() {
  const materiais        = useStore(s => s.materiais)
  const fornecedores     = useStore(s => s.fornecedores)
  const cotacoes         = useStore(s => s.cotacoesMateriais)
  const loadMateriais    = useStore(s => s.loadMateriais)
  const loadFornecedores = useStore(s => s.loadFornecedores)
  const fetchCotacoes    = useStore(s => s.fetchCotacoesMateriais)
  const addCotacao       = useStore(s => s.addCotacaoMaterial)
  const deleteCotacao    = useStore(s => s.deleteCotacaoMaterial)

  const [activeTab, setActiveTab]   = useState<'lista' | 'historico'>('lista')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando]     = useState(false)

  // campos do formulário
  const [fMaterialId,     setFMaterialId]     = useState('')
  const [fFornecedorId,   setFFornecedorId]   = useState('')
  const [fQuantidade,     setFQuantidade]     = useState('')
  const [fValor,          setFValor]          = useState('')
  const [fFormaPagamento, setFFormaPagamento] = useState('')
  const [fData,           setFData]           = useState('')

  // filtro do gráfico
  const [materialFiltro, setMaterialFiltro] = useState('')

  useEffect(() => {
    loadMateriais()
    loadFornecedores()
    fetchCotacoes()
  }, [])

  // ─── helpers ────────────────────────────────────────────────────────────────
  function resetForm() {
    setFMaterialId(''); setFFornecedorId(''); setFQuantidade('')
    setFValor(''); setFFormaPagamento(''); setFData('')
  }

  function abrirModal() { resetForm(); setModalAberto(true) }
  function fecharModal() { setModalAberto(false); resetForm() }

  async function handleSalvar() {
    if (!fMaterialId || !fFornecedorId || !fValor || !fData) return
    setSalvando(true)
    await addCotacao({
      materialId:      fMaterialId,
      fornecedorId:    fFornecedorId,
      quantidade:      fQuantidade ? Number(fQuantidade) : 1,
      valor:           Number(fValor),
      formaPagamento:  fFormaPagamento || null,
      data:            fData,
    })
    setSalvando(false)
    fecharModal()
  }

  function formatarData(d: string | null) {
    if (!d) return '—'
    try { return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }) } catch { return d }
  }

  function formatarValor(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // ─── dados do gráfico ───────────────────────────────────────────────────────
  const cotacoesFiltradas = materialFiltro
    ? cotacoes.filter((c: any) => c.materialId === materialFiltro)
    : []

  const fornecedoresNoGrafico: string[] = Array.from(
    new Set(cotacoesFiltradas.map((c: any) => c.fornecedorId as string))
  )

  const dadosGrafico = (() => {
    const mapa: Record<string, any> = {}
    cotacoesFiltradas.forEach((c: any) => {
      const key = c.data ?? c.createdAt?.split('T')[0] ?? '?'
      if (!mapa[key]) mapa[key] = { dataLabel: formatarData(key) }
      mapa[key][c.fornecedorNome ?? c.fornecedorId] = c.valor
    })
    return Object.values(mapa).sort((a: any, b: any) =>
      a.dataLabel > b.dataLabel ? 1 : -1
    )
  })()

  const resumoFornecedores = fornecedoresNoGrafico.map(fId => {
    const linhas = cotacoesFiltradas.filter((c: any) => c.fornecedorId === fId)
    const nome   = linhas[0]?.fornecedorNome ?? fId
    const valores = linhas.map((c: any) => c.valor as number)
    const ultima  = [...linhas].sort((a: any, b: any) =>
      (b.data ?? '') > (a.data ?? '') ? 1 : -1
    )[0]
    return {
      nome,
      ultimaCotacao: formatarData(ultima?.data ?? null),
      menorPreco: Math.min(...valores),
      maiorPreco: Math.max(...valores),
    }
  })

  const formValido = !!(fMaterialId && fFornecedorId && fValor && fData)

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '16px', maxWidth: 960 }}>

      {/* Cabeçalho */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 24,
      }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Comparador de Preços
        </h1>
        <button
          onClick={abrirModal}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--accent)', color: 'var(--accent-foreground)',
            border: 'none', borderRadius: 'var(--radius-md)',
            padding: '0 16px', height: 44, fontSize: 'var(--text-sm)',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          Nova Cotação
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {([
          { key: 'lista' as const,     label: 'Lista',     Icon: List },
          { key: 'historico' as const, label: 'Histórico', Icon: TrendingUp },
        ]).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', background: 'none', border: 'none',
              borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === key ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: activeTab === key ? 600 : 400,
              fontSize: 'var(--text-sm)', cursor: 'pointer', marginBottom: -1, minHeight: 44,
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Aba Lista ──────────────────────────────────────────────────────── */}
      {activeTab === 'lista' && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflowX: 'auto',
        }}>
          {cotacoes.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              Nenhuma cotação registrada. Clique em "Nova Cotação" para começar.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Material</th>
                  <th style={thStyle}>Fornecedor</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Qtd</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Valor</th>
                  <th style={thStyle}>Pgto</th>
                  <th style={thStyle}>Data</th>
                  <th style={{ ...thStyle, width: 48 }}></th>
                </tr>
              </thead>
              <tbody>
                {cotacoes.map((c: any) => (
                  <tr key={c.id}>
                    <td style={tdStyle}>{c.materialNome ?? '—'}</td>
                    <td style={tdStyle}>{c.fornecedorNome ?? '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{c.quantidade}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                      {formatarValor(c.valor)}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{c.formaPagamento ?? '—'}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{formatarData(c.data)}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => deleteCotacao(c.id)}
                        title="Excluir"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--danger)', padding: 6, borderRadius: 'var(--radius-sm)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          minHeight: 32, minWidth: 32,
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Aba Histórico ─────────────────────────────────────────────────── */}
      {activeTab === 'historico' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ maxWidth: 320 }}>
            <label style={labelStyle}>Filtrar por material</label>
            <select
              value={materialFiltro}
              onChange={e => setMaterialFiltro(e.target.value)}
              style={inputStyle}
            >
              <option value="">Selecione um material</option>
              {materiais.map((m: any) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>

          {!materialFiltro ? (
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: 40,
              textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)',
            }}>
              Selecione um material para visualizar o histórico de preços.
            </div>
          ) : cotacoesFiltradas.length === 0 ? (
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: 40,
              textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)',
            }}>
              Nenhuma cotação para este material.
            </div>
          ) : (
            <>
              {/* LineChart */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '20px 8px 20px 0',
              }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosGrafico} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="dataLabel"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => `R$ ${Number(v).toLocaleString('pt-BR')}`}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13,
                      }}
                      formatter={(value: any) => [
                        `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)', paddingTop: 12 }} />
                    {fornecedoresNoGrafico.map((fId, idx) => {
                      const nome = cotacoesFiltradas.find((c: any) => c.fornecedorId === fId)?.fornecedorNome ?? fId
                      return (
                        <Line
                          key={fId}
                          type="monotone"
                          dataKey={nome}
                          stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela resumo */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', overflowX: 'auto',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Fornecedor</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Última cotação</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Menor preço</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Maior preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumoFornecedores.map(r => (
                      <tr key={r.nome}>
                        <td style={tdStyle}>{r.nome}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {r.ultimaCotacao}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>
                          {formatarValor(r.menorPreco)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }}>
                          {formatarValor(r.maiorPreco)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Modal Nova Cotação ─────────────────────────────────────────────── */}
      {modalAberto && (
        <div
          onClick={fecharModal}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 480,
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
            }}>
              <h2 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Nova Cotação
              </h2>
              <button
                onClick={fecharModal}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  minHeight: 44, minWidth: 44, borderRadius: 'var(--radius-md)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Material *</label>
                <select value={fMaterialId} onChange={e => setFMaterialId(e.target.value)} style={inputStyle}>
                  <option value="">Selecione...</option>
                  {materiais.map((m: any) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Fornecedor *</label>
                <select value={fFornecedorId} onChange={e => setFFornecedorId(e.target.value)} style={inputStyle}>
                  <option value="">Selecione...</option>
                  {fornecedores.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Quantidade</label>
                  <input
                    type="number" min="1" placeholder="1"
                    value={fQuantidade} onChange={e => setFQuantidade(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Valor (R$) *</label>
                  <input
                    type="number" min="0" step="0.01" placeholder="0,00"
                    value={fValor} onChange={e => setFValor(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Forma de pagamento</label>
                <select value={fFormaPagamento} onChange={e => setFFormaPagamento(e.target.value)} style={inputStyle}>
                  <option value="">Selecione...</option>
                  {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Data *</label>
                <input
                  type="date" value={fData} onChange={e => setFData(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '0 20px 20px' }}>
              <button
                onClick={fecharModal}
                style={{
                  background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', borderRadius: 'var(--radius-md)',
                  padding: '0 16px', height: 44, fontSize: 'var(--text-sm)', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando || !formValido}
                style={{
                  background: formValido ? 'var(--accent)' : 'var(--bg-surface-3)',
                  color: formValido ? 'var(--accent-foreground)' : 'var(--text-disabled)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  padding: '0 20px', height: 44, fontSize: 'var(--text-sm)',
                  fontWeight: 600, cursor: formValido ? 'pointer' : 'not-allowed',
                }}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
