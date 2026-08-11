import { useState, useEffect, useRef } from 'react'
import { Pencil, Trash2, Plus, Loader2, MessageCircle, Truck } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, TextArea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Fornecedor, FornecedorCategoria, FornecedorStatus } from '@/types'
import { formatPhone } from '@/utils/formatters'
import { apiFetch } from '@/lib/apiFetch'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<FornecedorCategoria, { label: string; avatarBg: string; badgeClass: string }> = {
  materiais:    { label: 'Materiais',    avatarBg: '#3b82f6', badgeClass: 'bg-blue-500/10 text-blue-400' },
  servicos:     { label: 'Serviços',     avatarBg: '#22c55e', badgeClass: 'bg-green-500/10 text-green-400' },
  equipamentos: { label: 'Equipamentos', avatarBg: '#a855f7', badgeClass: 'bg-purple-500/10 text-purple-400' },
  transporte:   { label: 'Transporte',   avatarBg: '#f97316', badgeClass: 'bg-orange-500/10 text-orange-400' },
  outros:       { label: 'Outros',       avatarBg: '#6b7280', badgeClass: 'bg-gray-500/10 text-gray-400' },
}

const STATUS_CONFIG: Record<FornecedorStatus, { label: string; variant: 'success' | 'info' | 'default' }> = {
  ativo:        { label: 'Ativo',        variant: 'success' },
  preferencial: { label: 'Preferencial', variant: 'info' },
  inativo:      { label: 'Inativo',      variant: 'default' },
}

const CATEGORY_OPTIONS = [
  { value: '',            label: 'Categoria' },
  { value: 'materiais',   label: 'Materiais' },
  { value: 'servicos',    label: 'Serviços' },
  { value: 'equipamentos',label: 'Equipamentos' },
  { value: 'transporte',  label: 'Transporte' },
  { value: 'outros',      label: 'Outros' },
]

const STATUS_OPTIONS = [
  { value: 'ativo',        label: 'Ativo' },
  { value: 'preferencial', label: 'Preferencial' },
  { value: 'inativo',      label: 'Inativo' },
]

function stripDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function formatCnpj(digits: string): string {
  const d = digits.slice(0, 14)
  if (d.length <= 2)  return d
  if (d.length <= 5)  return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8)  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}

interface ReceitaWSResult {
  nome: string
  fantasia: string
  telefone: string
  email: string
  logradouro: string
  numero: string
  municipio: string
  uf: string
  status: string
}

async function fetchCnpjData(cnpj14: string): Promise<ReceitaWSResult | null> {
  try {
    const res = await apiFetch(`/api/cnpj/${cnpj14}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.erro) return null
    return data as ReceitaWSResult
  } catch {
    return null
  }
}

// ─── FornecedorForm ────────────────────────────────────────────────────────────

interface FornecedorFormProps {
  onClose: () => void
  initialData?: Fornecedor
}

function FornecedorForm({ onClose, initialData }: FornecedorFormProps) {

  const addFornecedor    = useStore(state => state.addFornecedor)
  const updateFornecedor = useStore(state => state.updateFornecedor)

  const isEditing = !!initialData

  const [cnpjDisplay,       setCnpjDisplay]       = useState('')
  const [nome,              setNome]              = useState('')
  const [nomeFantasia,      setNomeFantasia]      = useState('')
  const [categoria,         setCategoria]         = useState<FornecedorCategoria | ''>('')
  const [status,            setStatus]            = useState<FornecedorStatus>('ativo')
  const [telefone,          setTelefone]          = useState('')
  const [email,             setEmail]             = useState('')
  const [logradouro,        setLogradouro]        = useState('')
  const [numeroEndereco,    setNumeroEndereco]    = useState('')
  const [cidade,            setCidade]            = useState('')
  const [estado,            setEstado]            = useState('')
  const [prazoEntrega,      setPrazoEntrega]      = useState('')
  const [condicaoPagamento, setCondicaoPagamento] = useState('')
  const [observacoes,       setObservacoes]       = useState('')

  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [cnpjError,   setCnpjError]   = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Preencher campos ao editar
  useEffect(() => {
    if (initialData) {
      setCnpjDisplay(initialData.cnpj ? formatCnpj(stripDigits(initialData.cnpj)) : '')
      setNome(initialData.nome ?? '')
      setNomeFantasia(initialData.nomeFantasia ?? '')
      setCategoria((initialData.categoria ?? '') as FornecedorCategoria | '')
      setStatus((initialData.status ?? 'ativo') as FornecedorStatus)
      setTelefone(initialData.telefone ? formatPhone(stripDigits(initialData.telefone)) : '')
      setEmail(initialData.email ?? '')
      setLogradouro(initialData.logradouro ?? '')
      setNumeroEndereco(initialData.numeroEndereco ?? '')
      setCidade(initialData.cidade ?? '')
      setEstado(initialData.estado ?? '')
      setPrazoEntrega(initialData.prazoEntrega != null ? String(initialData.prazoEntrega) : '')
      setCondicaoPagamento(initialData.condicaoPagamento ?? '')
      setObservacoes(initialData.observacoes ?? '')
    }
  }, [initialData])

  // Cleanup debounce na desmontagem
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = stripDigits(e.target.value)
    setCnpjDisplay(formatCnpj(digits))
    setCnpjError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (digits.length === 14) {
      debounceRef.current = setTimeout(async () => {
        setCnpjLoading(true)
        const result = await fetchCnpjData(digits)
        setCnpjLoading(false)

        if (!result) {
          setCnpjError('CNPJ não encontrado. Preencha os dados manualmente.')
          return
        }

        if (result.nome)       setNome(result.nome)
        if (result.fantasia)   setNomeFantasia(result.fantasia)
        if (result.telefone)   setTelefone(formatPhone(stripDigits(result.telefone)))
        if (result.email)      setEmail(result.email)
        if (result.logradouro) setLogradouro(result.logradouro)
        if (result.numero)     setNumeroEndereco(result.numero)
        if (result.municipio)  setCidade(result.municipio)
        if (result.uf)         setEstado(result.uf)
      }, 800)
    }
  }

  function handleTelefoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = stripDigits(e.target.value)
    setTelefone(formatPhone(digits))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return

    setSaving(true)

    const payload: Partial<Fornecedor> = {
      nome:             nome.trim(),
      nomeFantasia:     nomeFantasia.trim() || undefined,
      cnpj:             stripDigits(cnpjDisplay) || undefined,
      categoria:        (categoria || undefined) as FornecedorCategoria | undefined,
      status:           status,
      telefone:         telefone.trim() || undefined,
      email:            email.trim() || undefined,
      logradouro:       logradouro.trim() || undefined,
      numeroEndereco:   numeroEndereco.trim() || undefined,
      cidade:           cidade.trim() || undefined,
      estado:           estado.trim() || undefined,
      prazoEntrega:     prazoEntrega ? parseInt(prazoEntrega, 10) : undefined,
      condicaoPagamento:condicaoPagamento.trim() || undefined,
      observacoes:      observacoes.trim() || undefined,
    }

    if (isEditing && initialData) {
      await updateFornecedor(initialData.id, payload)
    } else {
      await addFornecedor(payload)
    }

    setSaving(false)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">

      {/* CNPJ */}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
          CNPJ
        </label>
        <div className="relative">
          <input
            value={cnpjDisplay}
            onChange={handleCnpjChange}
            placeholder="00.000.000/0000-00"
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder:text-[var(--text-tertiary)]"
          />
          {cnpjLoading && (
            <Loader2 className="animate-spin absolute right-3 top-2.5 w-4 h-4 text-[var(--text-tertiary)]" />
          )}
        </div>
        {cnpjError && (
          <p className="text-xs text-[var(--danger)] mt-1">{cnpjError}</p>
        )}
      </div>

      {/* Razão Social + Nome Fantasia */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Razão Social *"
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Razão social da empresa"
          required
        />
        <Input
          label="Nome Fantasia"
          value={nomeFantasia}
          onChange={e => setNomeFantasia(e.target.value)}
          placeholder="Nome fantasia"
        />
      </div>

      {/* Categoria + Status */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Categoria"
          value={categoria}
          onChange={e => setCategoria(e.target.value as FornecedorCategoria | '')}
          options={CATEGORY_OPTIONS}
        />
        <Select
          label="Status"
          value={status}
          onChange={e => setStatus(e.target.value as FornecedorStatus)}
          options={STATUS_OPTIONS}
        />
      </div>

      {/* Telefone + Email */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Telefone"
          value={telefone}
          onChange={handleTelefoneChange}
          placeholder="(00) 00000-0000"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="contato@empresa.com"
        />
      </div>

      {/* Logradouro + Número */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input
            label="Logradouro"
            value={logradouro}
            onChange={e => setLogradouro(e.target.value)}
            placeholder="Rua, Avenida..."
          />
        </div>
        <Input
          label="Número"
          value={numeroEndereco}
          onChange={e => setNumeroEndereco(e.target.value)}
          placeholder="Nº"
        />
      </div>

      {/* Cidade + Estado */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input
            label="Cidade"
            value={cidade}
            onChange={e => setCidade(e.target.value)}
            placeholder="Cidade"
          />
        </div>
        <Input
          label="Estado"
          value={estado}
          onChange={e => setEstado(e.target.value)}
          placeholder="UF"
          maxLength={2}
        />
      </div>

      {/* Prazo de entrega + Condição de pagamento */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Prazo de entrega (dias)"
          type="number"
          min={0}
          value={prazoEntrega}
          onChange={e => setPrazoEntrega(e.target.value)}
          placeholder="Ex: 7"
        />
        <Input
          label="Condição de pagamento"
          value={condicaoPagamento}
          onChange={e => setCondicaoPagamento(e.target.value)}
          placeholder="Ex: 30/60 dias"
        />
      </div>

      {/* Observações */}
      <TextArea
        label="Observações"
        value={observacoes}
        onChange={e => setObservacoes(e.target.value)}
        placeholder="Observações sobre o fornecedor..."
        rows={3}
      />

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Adicionar'}
        </Button>
      </div>

    </form>
  )
}

// ─── Fornecedores (page) ──────────────────────────────────────────────────────

export default function Fornecedores() {

  const fornecedores    = useStore(state => state.fornecedores)
  const deleteFornecedor = useStore(state => state.deleteFornecedor)

  const [showModal,        setShowModal]        = useState(false)
  const [editingFornecedor,setEditingFornecedor] = useState<Fornecedor | null>(null)
  const [confirmOpen,      setConfirmOpen]      = useState(false)
  const [selectedId,       setSelectedId]       = useState<string | null>(null)

  function openCreate() {
    setEditingFornecedor(null)
    setShowModal(true)
  }

  function openEdit(f: Fornecedor) {
    setEditingFornecedor(f)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingFornecedor(null)
  }

  function confirmDelete(id: string) {
    setSelectedId(id)
    setConfirmOpen(true)
  }

  async function handleDelete() {
    if (selectedId) await deleteFornecedor(selectedId)
    setConfirmOpen(false)
    setSelectedId(null)
  }

  return (
    <div className="flex flex-col md:h-full">

      {/* Header */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between max-w-5xl">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Fornecedores
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
              Gestão de fornecedores e parceiros
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 flex items-center">
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Lista */}
      <div className="p-6 md:flex-1 md:overflow-y-auto">
        <div className="space-y-3 max-w-5xl">

          {fornecedores.length === 0 && (
            <div className="text-center py-16">
              <Truck className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)] opacity-40" />
              <p className="text-[var(--text-tertiary)] text-sm">
                Nenhum fornecedor cadastrado.
              </p>
              <p className="text-[var(--text-tertiary)] text-xs mt-1">
                Clique em "Novo Fornecedor" para começar.
              </p>
            </div>
          )}

          {fornecedores.map((f: Fornecedor) => {

            const displayName = f.nomeFantasia || f.nome
            const initial     = displayName.charAt(0).toUpperCase()
            const avatarBg    = f.categoria
              ? CATEGORY_CONFIG[f.categoria]?.avatarBg
              : '#6b7280'
            const catConfig   = f.categoria ? CATEGORY_CONFIG[f.categoria] : null
            const statusCfg   = STATUS_CONFIG[(f.status ?? 'ativo') as FornecedorStatus]
            const cleanPhone  = stripDigits(f.telefone ?? '')

            return (
              <div
                key={f.id}
                className="border border-[var(--border)] rounded-lg p-4 bg-[var(--bg-surface)] shadow-sm flex items-center gap-4 hover:border-[var(--border-strong)] transition-colors"
              >

                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                  style={{ backgroundColor: avatarBg }}
                >
                  {initial}
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--text-primary)] truncate">
                      {displayName}
                    </span>
                    {catConfig && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold ${catConfig.badgeClass}`}>
                        {catConfig.label}
                      </span>
                    )}
                    <Badge variant={statusCfg.variant}>
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {(f.cidade || f.estado) && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {[f.cidade, f.estado].filter(Boolean).join(' — ')}
                    </p>
                  )}
                </div>

                {/* Telefone + WhatsApp */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {f.telefone && (
                    <>
                      <span className="text-sm text-[var(--text-secondary)] hidden sm:block">
                        {f.telefone}
                      </span>
                      {cleanPhone.length >= 10 && (
                        <a
                          href={`https://wa.me/55${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-green-500 hover:text-green-400 transition-colors"
                          title="Abrir no WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(f)}
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmDelete(f.id)}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

              </div>
            )
          })}

        </div>
      </div>

      {/* Modal de cadastro/edição */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        size="lg"
      >
        <FornecedorForm
          onClose={closeModal}
          initialData={editingFornecedor ?? undefined}
        />
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Excluir fornecedor"
        description="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        onCancel={() => { setConfirmOpen(false); setSelectedId(null) }}
        onConfirm={handleDelete}
      />

    </div>
  )
}
