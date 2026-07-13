import { formatCurrency } from '@/utils/formatters';
import { apiFetch } from '@/lib/apiFetch';
import type { Lead } from '@/types';
import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuid } from 'uuid';
import { calcularOrcamento, calcularItemTotal } from '@/domain/orcamento/calcularOrcamento';
import { useWorkspaceSegment } from '@/hooks/useWorkspaceSegment';
import { useDefaultSettings } from '@/hooks/useDefaultSettings';
import {
  Plus,
  FileText,
  Trash2,
  Download,
  Edit,
  User,
  Calendar,
  PackageMinus,
  CheckCircle2,
  QrCode,
  PenTool,
} from 'lucide-react';
import { enviarPixWhatsapp } from '@/utils/pixWhatsapp';
import { SignatureModal } from '@/components/ui/SignatureModal';
import type { Orcamento, OrcamentoItem, OrcamentoStatus, UnidadeOrcamento } from '@/types';

const unitOptionsBySegment: Record<string, { value: string; label: string }[]> = {
  metalurgica: [
    { value: 'unidade', label: 'Unidade' },
    { value: 'peca', label: 'Peça' },
    { value: 'kg', label: 'Kg' },
    { value: 'metro', label: 'Metro' },
  ],
  marcenaria: [
    { value: 'm2', label: 'm²' },
    { value: 'ml', label: 'Metro linear' },
    { value: 'unidade', label: 'Unidade' },
    { value: 'peca', label: 'Peça' },
  ],
};

const statusOptions = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'recusado', label: 'Recusado' },
];

const statusColors: Record<OrcamentoStatus, string> = {
  rascunho: 'bg-[var(--bg-surface-2)]   text-[var(--text-secondary)]',
  enviado:  'bg-[var(--info-subtle)]    text-[var(--info)]',
  aprovado: 'bg-[var(--success-subtle)] text-[var(--success)]',
  recusado: 'bg-[var(--danger-subtle)]  text-[var(--danger)]',
};

export function Orcamentos() {
  const leads = useStore((state) => state.leads) as Lead[];
  const orcamentos = useStore((state) => state.orcamentos);
  const deleteOrcamento = useStore((state) => state.deleteOrcamento);
  const salvarAssinaturaCliente = useStore((state) => state.salvarAssinaturaCliente);
  const addToast = useStore((state) => state.addToast);
  const defaultSettings = useDefaultSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [orcToDelete, setOrcToDelete] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<Orcamento | null>(
    null,
  );

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [selectedOrcamentoForSign, setSelectedOrcamentoForSign] = useState<Orcamento | null>(null);

  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const sortedOrcamentos = useMemo(() => {
    return [...orcamentos].sort(
      (a, b) =>
        new Date(b.createdAt || b.created_at || 0).getTime() -
        new Date(a.createdAt || a.created_at || 0).getTime(),
    );
  }, [orcamentos]);


  const leadsMap = useMemo(() => {
    const map: Record<string, string> = {};
    leads.forEach((l) => (map[l.id] = l.nome));
    return map;
  }, [leads]);

  const getLeadName = (orc: Orcamento) =>
    orc.clienteNome || leadsMap[orc.leadId] || 'Cliente';

  const orcamentosPorCliente = useMemo(() => {
    const grupos: Record<string, { nome: string; orcamentos: Orcamento[] }> = {};
    sortedOrcamentos.forEach((orc) => {
      const key = orc.leadId || 'sem-cliente';
      const nome = getLeadName(orc);
      if (!grupos[key]) grupos[key] = { nome, orcamentos: [] };
      grupos[key].orcamentos.push(orc);
    });
    return grupos;
  }, [sortedOrcamentos, leadsMap]);

  const totalSelecionado = useMemo(
    () =>
      sortedOrcamentos
        .filter((o) => selecionados.has(o.id))
        .reduce((sum, o) => sum + (o.total || 0), 0),
    [selecionados, sortedOrcamentos],
  );

  const handleGerarPDFAgrupado = async () => {
    const orcsSelecionados = sortedOrcamentos.filter((o) => selecionados.has(o.id));
    if (orcsSelecionados.length === 0) return;

    const primeiro = orcsSelecionados[0];
    const lead = leads.find((l: Lead) => l.id === primeiro.leadId);

    try {
      const response = await apiFetch('/api/gerar-orcamento-agrupado', {
        method: 'POST',
        body: JSON.stringify({
          orcamentos: orcsSelecionados.map((orc) => ({
            numero: orc.numero,
            itens: orc.itens,
            subtotal: orc.subtotal,
            multiplicador: orc.multiplicador ?? 1,
            desconto: orc.desconto,
            total: orc.total,
            observacoes: orc.observacoes,
            ambiente: orc.ambiente || '',
          })),
          cliente_nome: primeiro.clienteNome || lead?.nome || 'Cliente',
          cliente_telefone: primeiro.clienteTelefone || lead?.telefone || '',
          cliente_endereco: primeiro.clienteEndereco || lead?.endereco || '',
          mostrar_total_geral: true,
          template_version: 'v2',
          empresa_nome: defaultSettings.empresaNome,
          empresa_telefone: defaultSettings.empresaTelefone,
          empresa_email: defaultSettings.empresaEmail,
          empresa_endereco: defaultSettings.empresaEndereco,
          empresa_cnpj: defaultSettings.empresaCnpj,
          empresa_logo_url: defaultSettings.empresaLogoUrl,
          empresa_logo_bg_url: defaultSettings.empresaLogoBgUrl,
          texto_apresentacao: defaultSettings.textoApresentacao,
          condicoes_contrato: defaultSettings.condicoesContrato,
          metodos_pagamento: defaultSettings.metodosPagamento,
          cor_primaria: defaultSettings.corPrimaria || '#ff6a00',
          cor_destaque: defaultSettings.corDestaque || '',
          empresa_instagram: defaultSettings.empresaInstagram || '',
          chave_pix: defaultSettings.chavePix || '',
          nome_recebedor_pix: defaultSettings.nomeRecebedorPix || '',
          cidade_pix: defaultSettings.cidadePix || '',
        }),
      });

      if (!response.ok) {
        addToast({ type: 'error', message: 'Erro ao gerar PDF agrupado' });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposta-${primeiro.clienteNome || lead?.nome || 'cliente'}-${orcsSelecionados.length}-orcamentos.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      addToast({ type: 'success', message: `PDF gerado com ${orcsSelecionados.length} orçamento(s)!` });
      setModoSelecao(false);
      setSelecionados(new Set());
    } catch (error) {
      console.error('Erro:', error);
      addToast({ type: 'error', message: 'Erro na conexão com o servidor' });
    }
  };

  const handleEdit = (orc: Orcamento) => {
    setEditingOrcamento(orc);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setOrcToDelete(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orcToDelete) return;

    await deleteOrcamento(orcToDelete);

    setConfirmOpen(false);
    setOrcToDelete(null);
  };

  const generatePDF = async (orc: Orcamento) => {
    try {
      const lead = leads.find((l) => l.id === orc.leadId);

      const clienteNome = orc.clienteNome || lead?.nome || 'Cliente';
      const clienteTelefone = orc.clienteTelefone || lead?.telefone || '';
      const clienteEndereco = orc.clienteEndereco || lead?.endereco || '';

      const response = await apiFetch('/api/gerar-orcamento', {
        method: 'POST',
        body: JSON.stringify({
          id: orc.id,
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone,
          cliente_endereco: clienteEndereco,
          itens: orc.itens,
          subtotal: orc.subtotal,
          multiplicador: orc.multiplicador ?? 1,
          desconto: orc.desconto,
          total: orc.total,
          observacoes: orc.observacoes,
          validade: orc.validadeEmDias ?? defaultSettings.validadePadraoOrcamento,
          template_version: 'v2',
          empresa_nome: defaultSettings.empresaNome,
          empresa_telefone: defaultSettings.empresaTelefone,
          empresa_email: defaultSettings.empresaEmail,
          empresa_endereco: defaultSettings.empresaEndereco,
          empresa_cnpj: defaultSettings.empresaCnpj,
          empresa_logo_url: defaultSettings.empresaLogoUrl,
          empresa_logo_bg_url: defaultSettings.empresaLogoBgUrl,
          texto_apresentacao: defaultSettings.textoApresentacao,
          condicoes_contrato: defaultSettings.condicoesContrato,
          metodos_pagamento: defaultSettings.metodosPagamento,
          cor_primaria: defaultSettings.corPrimaria || '#ff6a00',
          cor_destaque: defaultSettings.corDestaque || '',
          empresa_instagram: defaultSettings.empresaInstagram || '',
          chave_pix: defaultSettings.chavePix || '',
          nome_recebedor_pix: defaultSettings.nomeRecebedorPix || '',
          cidade_pix: defaultSettings.cidadePix || '',
          assinatura_empresa: defaultSettings.assinaturaEmpresa || null,
          assinatura_cliente: orc.assinaturaCliente || null,
          data_assinatura: orc.dataAssinatura || null,
        }),
      });

      if (!response.ok) {
        addToast({ type: 'error', message: 'Erro ao gerar PDF' });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `orcamento-${orc.numero}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);

      addToast({ type: 'success', message: 'PDF gerado com sucesso!' });
    } catch (error) {
      console.error('Erro:', error);
      addToast({ type: 'error', message: 'Erro na conexão com o servidor' });
    }
  };

  const renderOrcCard = (orc: Orcamento) => {
    const isSelecionado = selecionados.has(orc.id);
    return (
      <Card
        key={orc.id}
        className={`p-4${modoSelecao && isSelecionado ? ' ring-2 ring-[var(--accent)]' : ''}`}
        hoverable
      >
        <div className="flex items-center gap-4">
          {modoSelecao && (
            <input
              type="checkbox"
              checked={isSelecionado}
              onChange={() => {
                setSelecionados((prev) => {
                  const next = new Set(prev);
                  if (next.has(orc.id)) next.delete(orc.id);
                  else next.add(orc.id);
                  return next;
                });
              }}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent)', flexShrink: 0 }}
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {getLeadName(orc)}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[orc.status as OrcamentoStatus]}`}
              >
                {statusOptions.find((s) => s.value === orc.status)?.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--text-disabled)]">
              <span className="font-mono">{orc.numero}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {orc.createdAt
                  ? format(parseISO(orc.createdAt), 'dd/MM/yyyy', { locale: ptBR })
                  : '-'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[var(--text-primary)]">
              {formatCurrency(orc.total)}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {orc.itens.length} {orc.itens.length === 1 ? 'item' : 'itens'}
            </p>
            {(orc.valorComissao ?? 0) > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--warning)' }}>
                Comissão: {formatCurrency(orc.valorComissao ?? 0)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Sempre visíveis: PDF + PIX */}
            <Button variant="ghost" size="sm" onClick={() => generatePDF(orc)} title="Baixar PDF" aria-label="Baixar PDF" className="gap-1">
              <Download className="w-4 h-4" />
              <span className="sm:hidden text-[10px]">PDF</span>
            </Button>
            {defaultSettings.chavePix && (leads.find(l => l.id === orc.leadId)?.telefone || orc.clienteTelefone) && (
              <Button
                variant="ghost"
                size="sm"
                title="Enviar PIX via WhatsApp"
                aria-label="Enviar PIX via WhatsApp"
                className="gap-1"
                onClick={() => {
                  const lead = leads.find(l => l.id === orc.leadId);
                  enviarPixWhatsapp({
                    telefoneCliente: orc.clienteTelefone || lead?.telefone || '',
                    nomeCliente: orc.clienteNome || lead?.nome || 'Cliente',
                    empresaNome: defaultSettings.empresaNome,
                    codigoDocumento: orc.numero || `ORC-${orc.id?.slice(0, 8)}`,
                    tipoDocumento: 'orçamento',
                    valorTotal: orc.total || 0,
                    chavePix: defaultSettings.chavePix || '',
                    nomeRecebedorPix: defaultSettings.nomeRecebedorPix || '',
                    cidadePix: defaultSettings.cidadePix || '',
                  });
                }}
              >
                <QrCode className="w-4 h-4 text-[var(--success)]" />
                <span className="sm:hidden text-[10px]">PIX</span>
              </Button>
            )}

            {/* Desktop: Editar, Excluir, Assinatura */}
            <div className="hidden sm:flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(orc)} title="Editar orçamento" aria-label="Editar orçamento">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(orc.id)} title="Excluir orçamento" aria-label="Excluir orçamento">
                <Trash2 className="w-4 h-4 text-[var(--danger)]" />
              </Button>
              {!orc.assinaturaCliente ? (
                <Button
                  variant="ghost"
                  size="sm"
                  title="Coletar assinatura do cliente"
                  aria-label="Coletar assinatura do cliente"
                  onClick={() => {
                    setSelectedOrcamentoForSign(orc);
                    setSignatureModalOpen(true);
                  }}
                >
                  <PenTool className="w-4 h-4 text-amber-500" />
                </Button>
              ) : (
                <span className="flex items-center gap-1 text-xs text-[var(--success)] px-2" title="Orçamento assinado">
                  <PenTool className="w-3 h-3" />
                  Assinado
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-secondary)]">
            {orcamentos.length} orçamentos
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant={modoSelecao ? 'primary' : 'secondary'}
              onClick={() => {
                setModoSelecao(!modoSelecao);
                setSelecionados(new Set());
              }}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              {modoSelecao ? 'Cancelar seleção' : 'PDF Agrupado'}
            </Button>
            <Button
              onClick={() => {
                setEditingOrcamento(null);
                setShowModal(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Orçamento
            </Button>
          </div>
        </div>

        <ConfirmDialog
          isOpen={confirmOpen}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmOpen(false)}
          description="Tem certeza que deseja excluir este orçamento?"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedOrcamentos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3 opacity-30">📄</div>
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
              Nenhum orçamento criado
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">
              Crie seu primeiro orçamento para um lead
            </p>
            <Button onClick={() => setShowModal(true)} className="gap-1">
              <Plus className="w-4 h-4" />
              Novo Orçamento
            </Button>
          </div>
        ) : !modoSelecao ? (
          <div className="space-y-3">
            {sortedOrcamentos.map((orc) => renderOrcCard(orc))}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(orcamentosPorCliente).map(([clienteKey, grupo]) => (
              <div key={clienteKey}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--text-secondary)]" />
                    <span className="font-semibold text-[var(--text-primary)]">
                      {grupo.nome}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-surface-2)] px-2 py-0.5 rounded-full">
                      {grupo.orcamentos.length} orçamento{grupo.orcamentos.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">
                    Total:{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatCurrency(grupo.orcamentos.reduce((s, o) => s + (o.total || 0), 0))}
                    </span>
                  </span>
                </div>
                <div className="space-y-2">
                  {grupo.orcamentos.map((orc) => renderOrcCard(orc))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barra de seleção agrupada */}
      {modoSelecao && selecionados.size > 0 && (
        <div
          className="border-t p-4 flex items-center justify-between gap-3"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              {selecionados.size}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              selecionado{selecionados.size !== 1 ? 's' : ''}
            </span>
            <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(totalSelecionado)}
            </span>
          </div>
          <Button onClick={handleGerarPDFAgrupado} className="gap-2 shrink-0">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Gerar PDF Agrupado</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingOrcamento ? 'Editar Orçamento' : 'Novo Orçamento'}
        size="xl"
      >
        <OrcamentoForm
          orcamento={editingOrcamento}
          onClose={() => setShowModal(false)}
        />
      </Modal>

      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => {
          setSignatureModalOpen(false);
          setSelectedOrcamentoForSign(null);
        }}
        onConfirm={async (assinatura) => {
          if (selectedOrcamentoForSign) {
            const ok = await salvarAssinaturaCliente(selectedOrcamentoForSign.id, assinatura);
            if (ok) addToast({ type: 'success', message: 'Assinatura salva com sucesso!' });
            else addToast({ type: 'error', message: 'Erro ao salvar assinatura' });
          }
        }}
        nomeCliente={selectedOrcamentoForSign?.clienteNome || leads.find(l => l.id === selectedOrcamentoForSign?.leadId)?.nome || 'Cliente'}
        codigoDocumento={selectedOrcamentoForSign?.numero || ''}
        valorTotal={(selectedOrcamentoForSign?.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// BaixaEstoqueModal — seleção de materiais para baixa ao aprovar orçamento
// ─────────────────────────────────────────────

interface BaixaItem {
  itemId: string;
  descricao: string;
  quantidadeOrc: number;
  checked: boolean;
  materialId: string;
  quantidadeBaixar: number;
}

interface BaixaEstoqueModalProps {
  orcamentoNumero: string;
  itens: OrcamentoItem[];
  materiais: any[];
  onCancel: () => void;
  onConfirm: (baixas: BaixaItem[]) => Promise<void>;
}

function BaixaEstoqueModal({ orcamentoNumero, itens, materiais, onCancel, onConfirm }: BaixaEstoqueModalProps) {
  const [rows, setRows] = useState<BaixaItem[]>(() =>
    itens.map(item => ({
      itemId: item.id,
      descricao: item.descricao,
      quantidadeOrc: item.quantidade,
      checked: true,
      materialId: '',
      quantidadeBaixar: item.quantidade,
    }))
  );
  const [loading, setLoading] = useState(false);

  const updateRow = (itemId: string, changes: Partial<BaixaItem>) => {
    setRows(prev => prev.map(r => r.itemId === itemId ? { ...r, ...changes } : r));
  };

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(rows.filter(r => r.checked && r.materialId && r.quantidadeBaixar > 0));
    setLoading(false);
  };

  const cellStyle: React.CSSProperties = {
    padding: '8px 10px',
    borderBottom: '1px solid var(--border)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    verticalAlign: 'middle',
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '4px 8px',
    fontSize: 'var(--text-sm)',
    width: '100%',
    outline: 'none',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100,
      }}
    >
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-modal)',
        width: 660,
        maxWidth: '95vw',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <PackageMinus size={20} color="var(--warning)" />
            <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Baixa no Estoque — {orcamentoNumero}
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Selecione quais itens deseja baixar do estoque ao aprovar este orçamento.
          </p>
        </div>

        {/* Tabela */}
        <div style={{ overflow: 'auto', flex: 1, padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Item do Orçamento', 'Qtd', 'Material no Estoque', 'Qtd a Baixar'].map(h => (
                  <th key={h} style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.itemId}>
                  <td style={{ ...cellStyle, width: 32 }}>
                    <input
                      type="checkbox"
                      checked={row.checked}
                      onChange={e => updateRow(row.itemId, { checked: e.target.checked })}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent)', width: 16, height: 16 }}
                    />
                  </td>
                  <td style={{ ...cellStyle, maxWidth: 180 }}>
                    <span style={{ color: row.checked ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                      {row.descricao || '(sem descrição)'}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, width: 50, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {row.quantidadeOrc}
                  </td>
                  <td style={{ ...cellStyle, width: 200 }}>
                    <select
                      value={row.materialId}
                      disabled={!row.checked}
                      onChange={e => updateRow(row.itemId, { materialId: e.target.value })}
                      style={{ ...inputStyle, opacity: row.checked ? 1 : 0.4 }}
                    >
                      <option value="">Não vincular</option>
                      {materiais.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.nome} (estoque: {m.estoque})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ ...cellStyle, width: 110 }}>
                    <input
                      type="number"
                      min="0"
                      value={row.quantidadeBaixar}
                      disabled={!row.checked}
                      onChange={e => updateRow(row.itemId, { quantidadeBaixar: Number(e.target.value) })}
                      style={{ ...inputStyle, opacity: row.checked ? 1 : 0.4 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              padding: '8px 16px',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-foreground)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 16px',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 size={15} />
            {loading ? 'Confirmando...' : 'Confirmar Baixa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────

interface OrcamentoFormProps {
  orcamento: Orcamento | null;
  onClose: () => void;
}

function OrcamentoForm({ orcamento, onClose }: OrcamentoFormProps) {
  const leads = useStore((state: any) => state.leads);
  const addOrcamento = useStore((state) => state.addOrcamento);
  const updateOrcamento = useStore((state) => state.updateOrcamento);
  const updateLead = useStore((state) => state.updateLead);
  const materiais = useStore((state) => state.materiais);
  const movimentarEstoque = useStore((state) => state.movimentarEstoque);
  const addToast = useStore((state: any) => state.addToast);

  const { percentualComissao: percentualPadrao } = useDefaultSettings();

  const [leadId, setLeadId] = useState(orcamento?.leadId || '');
  const [status, setStatus] = useState<OrcamentoStatus>(
    orcamento?.status || 'rascunho',
  );
  const [itens, setItens] = useState<OrcamentoItem[]>(orcamento?.itens || []);
  const [desconto, setDesconto] = useState(orcamento?.desconto || 0);
  const [multiplicador, setMultiplicador] = useState(
    orcamento?.multiplicador || 1,
  );
  const [percentualComissao, setPercentualComissao] = useState(
    orcamento?.percentualComissao ?? percentualPadrao,
  );

  const [validadeEmDias, setValidadeEmDias] = useState(
    orcamento?.validadeEmDias || 15,
  );
  const [observacoes, setObservacoes] = useState(orcamento?.observacoes || '');

  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  const segment = useWorkspaceSegment();
  const isMarcenaria = segment === 'marcenaria';

  const { subtotal, total, maoDeObra, comissao } = calcularOrcamento({
    itens,
    multiplicador,
    desconto,
    percentualComissao,
  });

  const activeLeads = leads.filter((l: Lead) => l.status !== 'perdido');

  const addItem = () => {
    setItens([
      ...itens,
      {
        id: uuid(),
        descricao: '',
        quantidade: 1,
        valorUnitario: 0,
        valorTotal: 0,
        unitType: isMarcenaria ? 'm2' : 'unidade',
        ...(isMarcenaria ? { ambiente: '', largura: 0, altura: 0 } : {}),
      },
    ]);
  };

  const updateItem = (id: string, field: string, value: string | number) => {
    setItens(
      itens.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (['quantidade', 'valorUnitario', 'largura', 'altura', 'unitType'].includes(field)) {
          updated.valorTotal = calcularItemTotal(updated);
        }
        return updated;
      }),
    );
  };

  const removeItem = (id: string) => {
    setItens(itens.filter((item) => item.id !== id));
  };

  const saveOrcamento = async (data: any) => {
    let savedOrcId = orcamento?.id;

    if (orcamento) {
      await updateOrcamento(orcamento.id, data);
    } else {
      const inserted = await addOrcamento(data);
      savedOrcId = inserted?.id;
    }

    if (data.leadId && data.total > 0) {
      const lead = leads.find((l: Lead) => l.id === data.leadId);
      if (lead) {
        await updateLead(data.leadId, {
          valorOrcado: data.total,
          orcamentoEnviado: data.status === 'enviado' || data.status === 'aprovado',
        });
      }
    }

    // Criar pré-recibo automaticamente ao aprovar
    if (data.status === 'aprovado' && savedOrcId) {
      const addRecibo = useStore.getState().addRecibo;
      const recibosExistentes = useStore.getState().recibos;
      const jaExiste = recibosExistentes.some((r: any) => r.orcamentoId === savedOrcId);

      if (!jaExiste) {
        await addRecibo({
          orcamentoId: savedOrcId,
          leadId: data.leadId,
          clienteNome: data.clienteNome || 'Cliente',
          clienteTelefone: data.clienteTelefone || '',
          clienteEndereco: data.clienteEndereco || '',
          descricao: `Serviços ref. orçamento ${orcamento?.numero || ''}`,
          itens: data.itens,
          valorTotal: data.total,
          status: 'pendente',
        });
      }
    }

    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const leadSelecionado = leads.find((l: Lead) => l.id === leadId);

    const clienteNome = leadSelecionado?.nome || 'Cliente';
    const clienteTelefone = leadSelecionado?.telefone || '';
    const clienteEndereco = leadSelecionado?.endereco || '';

    const data = {
      leadId,
      clienteNome,
      clienteTelefone,
      clienteEndereco,
      itens,
      desconto,
      multiplicador,
      percentualComissao,
      valorComissao: comissao,
      status,
      observacoes,
      validadeEmDias,
      subtotal,
      total,
    };

    // Interceptar somente quando TRANSICIONANDO para 'aprovado'
    const transicionandoParaAprovado =
      status === 'aprovado' && orcamento?.status !== 'aprovado';

    if (transicionandoParaAprovado) {
      setPendingData(data);
      setShowBaixaModal(true);
      return;
    }

    await saveOrcamento(data);
  };


  return (
    <>
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
          CLIENTE
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Lead/Cliente *"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            options={[
              { value: '', label: 'Selecione um lead' },
              ...activeLeads.map((l: any) => ({
                value: l.id,
                label: `${l.nome} - ${l.servico}`,
              })),
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrcamentoStatus)}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Itens */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
            ITENS
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={addItem} className="gap-1">
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        {/* Header da tabela — visível apenas em desktop */}
        {itens.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)] border-b border-[var(--border)]">
            <span className="flex-1">DESCRIÇÃO</span>
            <span className="w-20 text-center">QTD</span>
            <span className="w-28 text-center">UNIT</span>
            <span className="w-24 text-right">TOTAL</span>
            <span className="w-8"></span>
          </div>
        )}

        <div className="space-y-2 p-2">
          {itens.map((item, index) => (
            <div
              key={item.id}
              className="p-3 bg-[var(--bg-surface-2)] rounded-md space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-secondary)] w-6">{index + 1}.</span>
                <Input
                  placeholder="Descrição"
                  value={item.descricao}
                  onChange={(e) =>
                    updateItem(item.id, 'descricao', e.target.value)
                  }
                  className="flex-1"
                />
                {isMarcenaria && (
                  <Input
                    placeholder="Ambiente"
                    value={item.ambiente || ''}
                    onChange={(e) =>
                      updateItem(item.id, 'ambiente', e.target.value)
                    }
                    className="w-32"
                  />
                )}
                <select
                  value={item.unitType || 'unidade'}
                  onChange={(e) =>
                    updateItem(item.id, 'unitType', e.target.value as UnidadeOrcamento)
                  }
                  className="h-10 px-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] w-28"
                >
                  {(unitOptionsBySegment[segment] || unitOptionsBySegment.metalurgica).map(
                    (opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    )
                  )}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="w-4 h-4 text-[var(--danger)]" />
                </Button>
              </div>
              <div className="flex items-center gap-2 pl-8">
                {item.unitType === 'm2' && (
                  <>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Largura (m)"
                      value={item.largura || ''}
                      onChange={(e) =>
                        updateItem(item.id, 'largura', Number(e.target.value))
                      }
                      className="w-28"
                    />
                    <span className="text-[var(--text-tertiary)]">×</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Altura (m)"
                      value={item.altura || ''}
                      onChange={(e) =>
                        updateItem(item.id, 'altura', Number(e.target.value))
                      }
                      className="w-28"
                    />
                  </>
                )}
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={item.quantidade}
                  onChange={(e) =>
                    updateItem(item.id, 'quantidade', Number(e.target.value))
                  }
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Valor unit."
                  value={item.valorUnitario}
                  onChange={(e) =>
                    updateItem(item.id, 'valorUnitario', Number(e.target.value))
                  }
                  className="w-28"
                />
                <span className="text-sm font-medium w-24 text-right">
                  {formatCurrency(item.valorTotal)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totais */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md p-4 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Subtotal:</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>

        {/* 🔥 MÃO DE OBRA (AQUI) */}
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Mão de obra:</span>
          <span className="font-medium text-[var(--accent)]">
            {formatCurrency(maoDeObra)}
          </span>
        </div>

        {/* Multiplicador */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">Multiplicador</span>
          <div className="flex items-center gap-2">
            {[
              { label: 'Sem', value: 1 },
              { label: '+10%', value: 1.1 },
              { label: '+15%', value: 1.15 },
              { label: '+20%', value: 1.2 },
            ].map(opt => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setMultiplicador(opt.value)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border min-h-[36px] transition-colors"
                style={{
                  background: multiplicador === opt.value ? 'var(--accent)' : 'var(--bg-surface-2)',
                  color: multiplicador === opt.value ? '#fff' : 'var(--text-secondary)',
                  borderColor: multiplicador === opt.value ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {opt.label}
              </button>
            ))}
            <Input
              type="number"
              step="0.1"
              value={multiplicador}
              onChange={(e) => setMultiplicador(Number(e.target.value))}
              className="w-20 text-right text-sm"
            />
          </div>
        </div>

        {/* Comissão planejadora */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--text-secondary)]">Comissão (%):</span>
          <Input
            type="number"
            step="0.5"
            min="0"
            max="100"
            value={percentualComissao}
            onChange={(e) => setPercentualComissao(Number(e.target.value))}
            className="w-32 text-right py-2 bg-[var(--bg-app)] text-[var(--text-primary)] border-[var(--border)]"
          />
        </div>

        {percentualComissao > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Comissão planejadora ({percentualComissao}%):</span>
              <span className="font-medium" style={{ color: 'var(--warning)' }}>
                {formatCurrency(comissao)}
              </span>
            </div>
            <p className="text-xs text-right" style={{ color: 'var(--text-tertiary)' }}>
              Embutida no total — não aparece no PDF do cliente
            </p>
          </>
        )}

        {/* Desconto */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--text-secondary)]">Desconto:</span>
          <Input
            type="number"
            value={desconto}
            onChange={(e) => setDesconto(Number(e.target.value))}
            className="w-32 text-right py-2 bg-[var(--bg-app)] text-[var(--text-primary)] border-[var(--border)]"
          />
        </div>

        {/* Total */}
        <div className="flex justify-between items-center border-t border-[var(--border)] pt-3">
          <span className="text-base font-bold text-[var(--text-primary)]">TOTAL</span>
          <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Validade (dias)"
          type="number"
          value={validadeEmDias}
          onChange={(e) => setValidadeEmDias(Number(e.target.value))}
        />
      </div>

      <TextArea
        label="Observações"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        rows={3}
        placeholder="Ex: Instalação no mesmo dia. Não incluso serviço de pedreiro..."
      />

      <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (!orcamento) {
              setStatus('rascunho');
            }
            onClose();
          }}
          className="flex-1 min-h-[48px] text-sm"
        >
          {orcamento ? 'Cancelar' : 'Salvar Rascunho'}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!leadId || itens.length === 0}
          className="flex-1 min-h-[48px] text-sm"
        >
          {orcamento ? 'Salvar' : 'Enviar'}
        </Button>
      </div>
    </form>

    {showBaixaModal && pendingData && (
      <BaixaEstoqueModal
        orcamentoNumero={orcamento?.numero || ''}
        itens={itens}
        materiais={materiais}
        onCancel={() => {
          setShowBaixaModal(false);
          setPendingData(null);
        }}
        onConfirm={async (baixas) => {
          for (const b of baixas) {
            await movimentarEstoque(b.materialId, 'saida', b.quantidadeBaixar, `Aprovação ${orcamento?.numero || 'orçamento'}`);
          }
          await saveOrcamento(pendingData);
          addToast({
            type: 'success',
            message: `Orçamento aprovado! ${baixas.length} item(s) baixado(s) do estoque.`,
          });
        }}
      />
    )}
    </>
  );
}
