import { useEffect, useState } from "react"
import { useStore } from "@/store/useStore"
import {
  Package,
  PackagePlus,
  PackageMinus,
  Pencil,
  Trash2,
  X,
  Plus,
} from "lucide-react"

// ─────────────────────────────────────────────
// Helpers de status
// ─────────────────────────────────────────────

type StatusEstoque = 'ok' | 'baixo' | 'critico'

function getStatus(estoque: number, minimo: number): StatusEstoque {
  if (estoque === 0) return 'critico'
  if (minimo > 0 && estoque <= minimo) return 'baixo'
  return 'ok'
}

const STATUS_LABEL: Record<StatusEstoque, string> = {
  ok: 'OK',
  baixo: 'Baixo',
  critico: 'Crítico',
}

const STATUS_COLOR: Record<StatusEstoque, string> = {
  ok: 'var(--success)',
  baixo: 'var(--warning)',
  critico: 'var(--danger)',
}

const STATUS_BG: Record<StatusEstoque, string> = {
  ok: 'var(--success-subtle)',
  baixo: 'var(--warning-subtle)',
  critico: 'var(--danger-subtle)',
}

const CATEGORIAS = ['matéria-prima', 'produto acabado', 'ferramenta', 'consumível']
const UNIDADES = ['un', 'kg', 'm', 'm²', 'litro', 'peça']

// ─────────────────────────────────────────────
// Estilos base
// ─────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  padding: '8px 12px',
  fontSize: 'var(--text-sm)',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--text-secondary)',
  fontSize: 'var(--text-xs)',
  marginBottom: 4,
  fontWeight: 500,
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--accent)',
  color: 'var(--accent-foreground)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '8px 16px',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-secondary)',
  padding: '8px 16px',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
}

const iconBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '4px 6px',
  borderRadius: 'var(--radius-sm)',
  display: 'inline-flex',
  alignItems: 'center',
}

// ─────────────────────────────────────────────
// Badge de status
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusEstoque }) {
  return (
    <span style={{
      background: STATUS_BG[status],
      color: STATUS_COLOR[status],
      borderRadius: 9999,
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      display: 'inline-block',
    }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

// ─────────────────────────────────────────────
// Modal backdrop
// ─────────────────────────────────────────────

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Modal de cadastro / edição
// ─────────────────────────────────────────────

interface ModalCadastroProps {
  material?: any
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

function ModalCadastro({ material, onClose, onSave }: ModalCadastroProps) {
  const [nome, setNome] = useState(material?.nome ?? '')
  const [categoria, setCategoria] = useState(material?.categoria ?? '')
  const [unidade, setUnidade] = useState(material?.unidade ?? '')
  const [estoque, setEstoque] = useState(String(material?.estoque ?? ''))
  const [estoqueMinimo, setEstoqueMinimo] = useState(String(material?.estoqueMinimo ?? ''))
  const [loading, setLoading] = useState(false)

  const isEdit = !!material

  const handleSave = async () => {
    if (!nome.trim()) return
    setLoading(true)
    await onSave({
      nome: nome.trim(),
      categoria: categoria || null,
      unidade: unidade || null,
      estoque: Number(estoque) || 0,
      estoqueMinimo: Number(estoqueMinimo) || 0,
    })
    setLoading(false)
    onClose()
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-modal)',
        width: 420,
        padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>
            {isEdit ? 'Editar Item' : 'Novo Item'}
          </h2>
          <button style={iconBtn} onClick={onClose}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nome *</label>
            <input style={inputStyle} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Tinta acrílica" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select style={inputStyle} value={categoria} onChange={e => setCategoria(e.target.value)}>
                <option value="">Selecionar</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Unidade</label>
              <select style={inputStyle} value={unidade} onChange={e => setUnidade(e.target.value)}>
                <option value="">Selecionar</option>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {!isEdit && (
            <div>
              <label style={labelStyle}>Estoque inicial</label>
              <input style={inputStyle} type="number" min="0" value={estoque} onChange={e => setEstoque(e.target.value)} placeholder="0" />
            </div>
          )}

          <div>
            <label style={labelStyle}>Estoque mínimo</label>
            <input style={inputStyle} type="number" min="0" value={estoqueMinimo} onChange={e => setEstoqueMinimo(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button style={btnGhost} onClick={onClose}>Cancelar</button>
          <button
            style={{ ...btnPrimary, opacity: loading || !nome.trim() ? 0.7 : 1 }}
            onClick={handleSave}
            disabled={loading || !nome.trim()}
          >
            {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ─────────────────────────────────────────────
// Modal de movimentação
// ─────────────────────────────────────────────

interface ModalMovimentacaoProps {
  material: any
  onClose: () => void
  onConfirm: (tipo: 'entrada' | 'saida', quantidade: number, motivo: string) => Promise<void>
}

function ModalMovimentacao({ material, onClose, onConfirm }: ModalMovimentacaoProps) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>(material._tipoInicial ?? 'entrada')
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleConfirm = async () => {
    const qtd = Number(quantidade)
    if (!qtd || qtd <= 0) { setErro('Informe uma quantidade válida.'); return }
    if (tipo === 'saida' && qtd > material.estoque) {
      setErro(`Estoque insuficiente. Disponível: ${material.estoque}`)
      return
    }
    setErro('')
    setLoading(true)
    await onConfirm(tipo, qtd, motivo)
    setLoading(false)
    onClose()
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-modal)',
        width: 380,
        padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>
              Movimentação
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '4px 0 0 0' }}>
              {material.nome} — estoque atual:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{material.estoque}</strong>
            </p>
          </div>
          <button style={iconBtn} onClick={onClose}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {(['entrada', 'saida'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTipo(t); setErro('') }}
              style={{
                border: `1px solid ${tipo === t ? 'var(--accent)' : 'var(--border)'}`,
                background: tipo === t ? 'var(--accent-subtle)' : 'var(--bg-surface-2)',
                color: tipo === t ? 'var(--accent)' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 8px',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {t === 'entrada'
                ? <><PackagePlus size={15} /> Entrada</>
                : <><PackageMinus size={15} /> Saída</>
              }
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Quantidade *</label>
            <input
              style={inputStyle}
              type="number"
              min="1"
              value={quantidade}
              onChange={e => { setQuantidade(e.target.value); setErro('') }}
              placeholder="0"
            />
          </div>
          <div>
            <label style={labelStyle}>Motivo (opcional)</label>
            <input
              style={inputStyle}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ex: Compra fornecedor X"
            />
          </div>
        </div>

        {erro && (
          <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', marginTop: 10, marginBottom: 0 }}>{erro}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button style={btnGhost} onClick={onClose}>Cancelar</button>
          <button
            style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function Estoque() {
  const materiais = useStore(state => state.materiais)
  const loadMateriais = useStore(state => state.loadMateriais)
  const addMaterial = useStore(state => state.addMaterial)
  const updateMaterial = useStore(state => state.updateMaterial)
  const deleteMaterial = useStore(state => state.deleteMaterial)
  const movimentarEstoque = useStore(state => state.movimentarEstoque)

  const [modalCadastro, setModalCadastro] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [movimentando, setMovimentando] = useState<any>(null)

  useEffect(() => {
    loadMateriais()
  }, [])

  // métricas
  const totalItens = materiais.length
  const itensBaixo = materiais.filter((m: any) => getStatus(m.estoque, m.estoqueMinimo ?? 0) === 'baixo').length
  const itensCriticos = materiais.filter((m: any) => m.estoque === 0).length

  const handleSaveCadastro = async (data: any) => {
    if (editando) {
      await updateMaterial(editando.id, data)
    } else {
      await addMaterial(data)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este item do estoque?')) return
    await deleteMaterial(id)
  }

  const handleMovimentar = async (tipo: 'entrada' | 'saida', quantidade: number, motivo: string) => {
    if (!movimentando) return
    await movimentarEstoque(movimentando.id, tipo, quantidade, motivo)
  }

  return (
    <div style={{ padding: '24px 28px', background: 'var(--bg-app)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Package size={22} color="var(--accent)" />
          <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Controle de Estoque
          </h1>
        </div>
        <button
          style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => { setEditando(null); setModalCadastro(true) }}
        >
          <Plus size={15} />
          Novo Item
        </button>
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 500, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total de Itens
          </p>
          <p style={{ color: 'var(--text-primary)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>{totalItens}</p>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${itensBaixo > 0 ? 'var(--warning)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 500, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Estoque Baixo
          </p>
          <p style={{ color: itensBaixo > 0 ? 'var(--warning)' : 'var(--text-primary)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>
            {itensBaixo}
          </p>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${itensCriticos > 0 ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 500, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Críticos (zerado)
          </p>
          <p style={{ color: itensCriticos > 0 ? 'var(--danger)' : 'var(--text-primary)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>
            {itensCriticos}
          </p>
        </div>

      </div>

      {/* Tabela */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 100px 100px 90px 120px',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface-2)',
        }}>
          {['Nome', 'Categoria', 'Unidade', 'Estoque', 'Mínimo', 'Status', 'Ações'].map(h => (
            <span key={h} style={{
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Empty state */}
        {materiais.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
            Nenhum item cadastrado. Clique em "Novo Item" para começar.
          </div>
        )}

        {/* Rows */}
        {materiais.map((m: any, idx: number) => {
          const status = getStatus(m.estoque, m.estoqueMinimo ?? 0)
          const isLast = idx === materiais.length - 1

          return (
            <div
              key={m.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 100px 100px 90px 120px',
                padding: '12px 16px',
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
                alignItems: 'center',
                background: status === 'critico'
                  ? 'rgba(248,113,113,0.04)'
                  : status === 'baixo'
                    ? 'rgba(245,158,11,0.04)'
                    : 'transparent',
              }}
            >
              <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                {m.nome}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                {m.categoria || '—'}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                {m.unidade || '—'}
              </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                {m.estoque}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                {m.estoqueMinimo ?? 0}
              </span>
              <StatusBadge status={status} />
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <button
                  style={{ ...iconBtn, color: 'var(--success)' }}
                  title="Entrada de estoque"
                  onClick={() => setMovimentando({ ...m, _tipoInicial: 'entrada' })}
                >
                  <PackagePlus size={15} />
                </button>
                <button
                  style={{ ...iconBtn, color: 'var(--warning)' }}
                  title="Saída de estoque"
                  onClick={() => setMovimentando({ ...m, _tipoInicial: 'saida' })}
                >
                  <PackageMinus size={15} />
                </button>
                <button
                  style={{ ...iconBtn, color: 'var(--text-secondary)' }}
                  title="Editar"
                  onClick={() => { setEditando(m); setModalCadastro(true) }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  style={{ ...iconBtn, color: 'var(--danger)' }}
                  title="Excluir"
                  onClick={() => handleDelete(m.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}

      </div>

      {/* Modal Cadastro */}
      {modalCadastro && (
        <ModalCadastro
          material={editando}
          onClose={() => { setModalCadastro(false); setEditando(null) }}
          onSave={handleSaveCadastro}
        />
      )}

      {/* Modal Movimentação */}
      {movimentando && (
        <ModalMovimentacao
          material={movimentando}
          onClose={() => setMovimentando(null)}
          onConfirm={handleMovimentar}
        />
      )}

    </div>
  )
}
