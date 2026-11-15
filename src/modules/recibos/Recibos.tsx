import { formatCurrency } from '@/utils/formatters';
import { formatDateBR } from '@/utils/date';
import { apiFetch } from '@/lib/apiFetch';
import { useDefaultSettings } from '@/hooks/useDefaultSettings';
import type { Recibo, ReciboStatus } from '@/types';
import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/editorial/EmptyState';
import { Colophon } from '@/components/editorial/Colophon';
import { useCountUp } from '@/hooks/useCountUp';
import {
  CheckCircle2,
  Download,
  Edit,
  X,
  Plus,
  CalendarDays,
  User,
  QrCode,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { enviarPixWhatsapp } from '@/utils/pixWhatsapp';
import { clienteCorrespondeBusca } from '@/utils/busca';

const statusColors: Record<ReciboStatus, string> = {
  pendente:  'bg-[var(--warning-subtle)] text-[var(--warning)]',
  emitido:   'bg-[var(--success-subtle)] text-[var(--success)]',
  cancelado: 'bg-[var(--bg-surface-2)]  text-[var(--text-disabled)]',
};

const statusLabel: Record<ReciboStatus, string> = {
  pendente: 'Pendente',
  emitido: 'Emitido',
  cancelado: 'Cancelado',
};

// Redesign D5: faixa de 3px do card pelo status
const faixaStatus: Record<ReciboStatus, string> = {
  pendente: 'var(--warning)',
  emitido: 'var(--success)',
  cancelado: 'var(--border-strong)',
};

// Redesign D5: tutorial só com o que o app faz hoje (docs/help/recibos.md). Completo sem recibos;
// com recibos, vira uma faixa de uma linha.
const PASSOS = [
  { n: '01', titulo: 'Aprova um orçamento', curto: 'Aprovar', texto: 'Gera o recibo como pendente, com os mesmos itens e o valor total.' },
  { n: '02', titulo: 'Emite o recibo', curto: 'Emitir', texto: 'Ganha o número oficial (REC-ANO-001…) e a data de emissão.' },
  { n: '03', titulo: 'Baixa o PDF e envia', curto: 'Baixar o PDF', texto: 'Marque PIX no PDF para sair com o QR Code. O botão PIX manda o copia e cola pelo WhatsApp.' },
];

// Número grande do topo (padrão de Leads, D3). Componente próprio para a contagem não
// re-renderizar a tela a cada quadro; com "reduzir movimento", sai direto o valor final.
function TotalContado({ valor }: { valor: number }) {
  const animado = useCountUp(valor);
  return (
    <p
      className="tnum leading-[0.8] text-[44px] md:text-[56px] text-[var(--text-primary)]"
      style={{ fontWeight: 'var(--font-bold)', letterSpacing: '-0.06em' }}
    >
      <span className="sr-only">{valor}</span>
      <span aria-hidden="true">{String(Math.round(animado)).padStart(2, '0')}</span>
    </p>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export function Recibos() {
  const recibos = useStore((state) => state.recibos) as Recibo[];
  const leads = useStore((state) => state.leads);
  const orcamentos = useStore((state) => state.orcamentos);
  const emitirRecibo = useStore((state) => state.emitirRecibo);
  const updateRecibo = useStore((state) => state.updateRecibo);
  const addToast = useStore((state) => state.addToast);
  const defaultSettings = useDefaultSettings();

  const [showModal, setShowModal] = useState(false);
  const [editingRecibo, setEditingRecibo] = useState<Recibo | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [incluirPixPorRecibo, setIncluirPixPorRecibo] = useState<Record<string, boolean>>({});
  const [busca, setBusca] = useState('');

  const sortedRecibos = useMemo(
    () =>
      [...recibos].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      ),
    [recibos],
  );

  const recibosFiltrados = useMemo(
    () =>
      sortedRecibos.filter((r) => {
        const lead = leads.find((l) => l.id === r.leadId);
        return clienteCorrespondeBusca(busca, {
          nome: r.clienteNome,
          telefone: r.clienteTelefone || lead?.telefone,
          endereco: r.clienteEndereco || lead?.endereco,
        });
      }),
    [sortedRecibos, leads, busca],
  );

  const handleEdit = (r: Recibo) => {
    setEditingRecibo(r);
    setShowModal(true);
  };

  const handleNovo = () => {
    setEditingRecibo(null);
    setShowModal(true);
  };

  const handleEmitir = async (r: Recibo) => {
    await emitirRecibo(r.id);
    addToast({ type: 'success', message: `Recibo emitido com sucesso!` });
  };

  const generateReciboPDF = async (recibo: Recibo) => {
    try {
      // O servidor usa o orçamento para montar as mesmas linhas do PDF dele
      const orc = orcamentos.find((o) => o.id === recibo.orcamentoId);
      const response = await apiFetch('/api/gerar-recibo', {
        method: 'POST',
        body: JSON.stringify({
          template_version: 'v2',
          numero_recibo: recibo.numeroRecibo,
          cliente_nome: recibo.clienteNome,
          cliente_telefone: recibo.clienteTelefone || '',
          cliente_endereco: recibo.clienteEndereco || '',
          descricao: recibo.descricao,
          itens: recibo.itens,
          valor_total: recibo.valorTotal,
          orcamento_ref: orc
            ? {
                subtotal: orc.subtotal,
                multiplicador: orc.multiplicador ?? 1,
                desconto: orc.desconto ?? 0,
                valor_comissao: orc.valorComissao ?? 0,
                total: orc.total,
              }
            : null,
          observacoes: recibo.observacoes || '',
          data_emissao: recibo.dataEmissao
            ? parseISO(recibo.dataEmissao).toLocaleDateString('pt-BR')
            : new Date().toLocaleDateString('pt-BR'),
          empresa_nome: defaultSettings.empresaNome,
          empresa_telefone: defaultSettings.empresaTelefone,
          empresa_email: defaultSettings.empresaEmail,
          empresa_endereco: defaultSettings.empresaEndereco,
          empresa_cnpj: defaultSettings.empresaCnpj,
          empresa_logo_url: defaultSettings.empresaLogoUrl,
          empresa_logo_bg_url: defaultSettings.empresaLogoBgUrl,
          cor_primaria: defaultSettings.corPrimaria || '#ff6a00',
          cor_destaque: defaultSettings.corDestaque || '',
          empresa_instagram: defaultSettings.empresaInstagram || '',
          chave_pix: defaultSettings.chavePix || '',
          nome_recebedor_pix: defaultSettings.nomeRecebedorPix || '',
          cidade_pix: defaultSettings.cidadePix || '',
          incluir_pix: !!incluirPixPorRecibo[recibo.id],
          assinatura_empresa: defaultSettings.assinaturaEmpresa || null,
        }),
      });

      if (!response.ok) {
        addToast({ type: 'error', message: 'Erro ao gerar PDF do recibo' });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${recibo.numeroRecibo || 'pendente'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      addToast({ type: 'success', message: 'PDF do recibo gerado!' });
    } catch (error) {
      console.error('[Recibos] Erro ao gerar PDF:', error);
      addToast({ type: 'error', message: 'Erro na conexão com o servidor' });
    }
  };

  const handleCancelarClick = (id: string) => {
    setCancelTargetId(id);
    setConfirmOpen(true);
  };

  const handleConfirmCancelar = async () => {
    if (!cancelTargetId) return;
    await updateRecibo(cancelTargetId, { status: 'cancelado' });
    addToast({ type: 'success', message: 'Recibo cancelado.' });
    setConfirmOpen(false);
    setCancelTargetId(null);
  };

  // Redesign D5: card "Orçamentos aprovados" (leva a Orçamentos) e voltar ao painel
  const setActiveModule = useStore((state) => state.setActiveModule);
  const aprovados = orcamentos.filter((o) => o.status === 'aprovado').length;

  return (
    <div className="flex flex-col md:h-full">
      {/* Topo compacto (padrão de Leads): total com contagem, Novo Recibo e busca */}
      <section className="relative border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 pt-4 pb-4 md:px-6 md:pt-5">
        <span aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] w-32 bg-[var(--accent)]" />

        <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
          <div className="min-w-0 border-l-2 border-[var(--accent)] pl-3">
            <TotalContado valor={recibos.length} />
            <p className="font-mono mt-2 text-[length:var(--text-xs)] text-[var(--text-tertiary)]">
              {busca.trim() ? `${recibosFiltrados.length} de ` : ''}
              {recibos.length} {recibos.length === 1 ? 'recibo' : 'recibos'}
            </p>
          </div>
          <Button onClick={handleNovo} className="gap-2 min-h-[44px] rounded-none">
            <Plus className="w-4 h-4" />
            Novo Recibo
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <Input
            type="text"
            placeholder="Buscar nome, telefone ou endereço..."
            aria-label="Buscar recibos"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 min-h-[44px] rounded-none"
          />
        </div>

        <ConfirmDialog
          isOpen={confirmOpen}
          onConfirm={handleConfirmCancelar}
          onCancel={() => {
            setConfirmOpen(false);
            setCancelTargetId(null);
          }}
          description="Tem certeza que deseja cancelar este recibo?"
        />
      </section>

      <div className="pt-4 md:pt-5 md:flex-1 md:min-h-0 md:overflow-y-auto space-y-4">
        {/* Lista */}
        {sortedRecibos.length === 0 ? (
          <EmptyState title="Nenhum recibo ainda" note="Recibos são gerados automaticamente ao aprovar um orçamento" />
        ) : recibosFiltrados.length === 0 ? (
          <div className="space-y-4">
            <EmptyState title="Nenhum recibo encontrado" note="Ajuste a busca" />
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => setBusca('')} className="rounded-none">
                Limpar busca
              </Button>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {recibosFiltrados.map((r) => (
              <li key={r.id} className="relative border border-[var(--border)] bg-[var(--bg-surface)]">
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-[3px]"
                  style={{ background: faixaStatus[r.status] }}
                />
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 pl-4 pr-2 sm:pr-3">
                  {/* Número, status, cliente e data */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        {r.numeroRecibo || 'Pendente'}
                      </span>
                      <span
                        className={`font-mono text-[length:var(--text-xs)] font-medium px-2 py-0.5 ${statusColors[r.status]}`}
                      >
                        {statusLabel[r.status]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <User className="w-3.5 h-3.5 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
                      <span className="text-[length:var(--text-lg)] leading-tight font-semibold text-[var(--text-primary)] break-words min-w-0">
                        {r.clienteNome}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-1">
                      <CalendarDays className="w-3 h-3 text-[var(--text-tertiary)]" aria-hidden="true" />
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {r.dataEmissao
                          ? formatDateBR(r.dataEmissao || '')
                          : formatDateBR(r.createdAt || '')}
                      </span>
                    </div>
                  </div>

                  {/* Valor + ações */}
                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
                    <span className="tnum text-base font-bold mr-auto sm:mr-2" style={{ color: 'var(--success)' }}>
                      {formatCurrency(r.valorTotal)}
                    </span>

                    {/* Emitir — só pendente */}
                    {r.status === 'pendente' && (
                      <Button
                        size="sm"
                        variant="success"
                        className="gap-1 min-h-[44px] px-3 rounded-none"
                        onClick={() => handleEmitir(r)}
                        title="Emitir recibo"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Emitir</span>
                      </Button>
                    )}

                    {/* Incluir QR PIX no PDF — só emitido e com chave PIX configurada */}
                    {r.status === 'emitido' && defaultSettings.chavePix && (
                      <label
                        className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-2 cursor-pointer select-none"
                        title="Incluir QR Code PIX no recibo"
                      >
                        <input
                          type="checkbox"
                          checked={!!incluirPixPorRecibo[r.id]}
                          onChange={(e) =>
                            setIncluirPixPorRecibo((prev) => ({
                              ...prev,
                              [r.id]: e.target.checked,
                            }))
                          }
                          style={{ cursor: 'pointer', accentColor: 'var(--accent)', width: 16, height: 16 }}
                        />
                        <span className="text-xs text-[var(--text-tertiary)]">PIX no PDF</span>
                      </label>
                    )}

                    {/* PDF — só emitido */}
                    {r.status === 'emitido' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1 min-h-[44px] min-w-[44px] px-3 rounded-none"
                        onClick={() => generateReciboPDF(r)}
                        title="Gerar PDF"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </Button>
                    )}

                    {/* PIX WhatsApp — só emitido com chave PIX e telefone */}
                    {r.status === 'emitido' && defaultSettings.chavePix && r.clienteTelefone && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1 min-h-[44px] min-w-[44px] px-3 rounded-none"
                        title="Enviar PIX via WhatsApp"
                        onClick={() => enviarPixWhatsapp({
                          telefoneCliente: r.clienteTelefone || '',
                          nomeCliente: r.clienteNome || 'Cliente',
                          empresaNome: defaultSettings.empresaNome,
                          codigoDocumento: r.numeroRecibo || `REC-${r.id?.slice(0, 8)}`,
                          tipoDocumento: 'recibo',
                          valorTotal: r.valorTotal || 0,
                          chavePix: defaultSettings.chavePix || '',
                          nomeRecebedorPix: defaultSettings.nomeRecebedorPix || '',
                          cidadePix: defaultSettings.cidadePix || '',
                        })}
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="hidden sm:inline">PIX</span>
                      </Button>
                    )}

                    {/* Editar — só pendente */}
                    {r.status === 'pendente' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="min-h-[44px] min-w-[44px] px-3 rounded-none"
                        onClick={() => handleEdit(r)}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Cancelar — se não cancelado (a ajuda chama de "botão X") */}
                    {r.status !== 'cancelado' && (
                      <Button
                        size="sm"
                        variant="danger"
                        className="min-h-[44px] min-w-[44px] px-3 rounded-none"
                        onClick={() => handleCancelarClick(r.id)}
                        title="Cancelar recibo"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                {r.descricao && (
                  <p className="text-xs text-[var(--text-tertiary)] mx-4 mb-3 border-t border-[var(--border)] pt-2">
                    {r.descricao}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Tutorial (depois da lista, como no protótipo): completo sem recibos; com recibos, uma faixa de uma linha */}
        {recibos.length === 0 ? (
          <ol className="grid gap-px sm:grid-cols-3 border border-[var(--border-strong)] bg-[var(--border)]">
            {PASSOS.map((p) => (
              <li key={p.n} className="bg-[var(--bg-surface)] px-4 py-4">
                <p className="font-mono text-[length:var(--text-xs)] font-semibold text-[var(--accent)]">{p.n}</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{p.titulo}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">{p.texto}</p>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 font-mono text-[length:var(--text-xs)] text-[var(--text-tertiary)]">
            {PASSOS.map((p, i) => (
              <li key={p.n} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">→</span>}
                <span className="font-semibold text-[var(--accent)]">{p.n}</span>
                {p.curto}
              </li>
            ))}
          </ol>
        )}

        {/* Orçamentos aprovados: atalho para Orçamentos */}
        <button
          type="button"
          onClick={() => setActiveModule('orcamentos')}
          className="flex w-full min-h-[44px] items-center gap-3 border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-left transition-colors hover:border-[var(--border-accent)]"
        >
          <span className="tnum text-[length:var(--text-2xl)] font-bold leading-none text-[var(--text-primary)]">{aprovados}</span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[var(--text-primary)]">Orçamentos aprovados</span>
            <span className="block text-xs text-[var(--text-tertiary)]">Aprove um orçamento para gerar o recibo</span>
          </span>
          <ArrowUpRight className="ml-auto w-4 h-4 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
        </button>

        <Colophon label="VRTX CRM · Recibos" onBack={() => setActiveModule('dashboard')} />
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRecibo ? 'Editar Recibo' : 'Novo Recibo'}
        size="md"
      >
        <ReciboForm
          recibo={editingRecibo}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// Formulário
// ─────────────────────────────────────────────

interface ReciboFormProps {
  recibo: Recibo | null;
  onClose: () => void;
}

function ReciboForm({ recibo, onClose }: ReciboFormProps) {
  const leads = useStore((state) => state.leads) as any[];
  const orcamentos = useStore((state) => state.orcamentos) as any[];
  const addRecibo = useStore((state) => state.addRecibo);
  const updateRecibo = useStore((state) => state.updateRecibo);
  const addToast = useStore((state) => state.addToast);

  const hoje = format(new Date(), 'yyyy-MM-dd');

  const [leadId, setLeadId] = useState(recibo?.leadId || '');
  const [orcamentoId, setOrcamentoId] = useState(recibo?.orcamentoId || '');
  const [clienteNome, setClienteNome] = useState(recibo?.clienteNome || '');
  const [descricao, setDescricao] = useState(recibo?.descricao || '');
  const [valorTotal, setValorTotal] = useState(recibo?.valorTotal ?? 0);
  const [dataEmissao, setDataEmissao] = useState(
    recibo?.dataEmissao || hoje,
  );
  const [observacoes, setObservacoes] = useState(recibo?.observacoes || '');

  // Ao selecionar lead, preencher clienteNome automaticamente
  const handleLeadChange = (id: string) => {
    setLeadId(id);
    if (id) {
      const lead = leads.find((l) => l.id === id);
      if (lead) setClienteNome(lead.nome);

      // Preencher orcamentoId com o último orçamento aprovado do lead (se existir)
      const orcAprovado = orcamentos
        .filter((o) => o.leadId === id && o.status === 'aprovado')
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )[0];

      if (orcAprovado) {
        setOrcamentoId(orcAprovado.id);
        setValorTotal(orcAprovado.total ?? 0);
        setDescricao(`Serviços ref. orçamento ${orcAprovado.numero || ''}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteNome.trim()) {
      addToast({ type: 'error', message: 'Nome do cliente é obrigatório.' });
      return;
    }

    if (!descricao.trim()) {
      addToast({ type: 'error', message: 'Descrição é obrigatória.' });
      return;
    }

    if (!orcamentoId && !recibo) {
      addToast({ type: 'error', message: 'Selecione um lead com orçamento aprovado.' });
      return;
    }

    if (recibo) {
      await updateRecibo(recibo.id, {
        clienteNome,
        descricao,
        valorTotal,
        dataEmissao,
        observacoes,
      });
      addToast({ type: 'success', message: 'Recibo atualizado!' });
    } else {
      await addRecibo({
        orcamentoId,
        leadId: leadId || null,
        clienteNome,
        descricao,
        valorTotal,
        dataEmissao,
        observacoes,
        status: 'pendente',
        itens: [],
      });
      addToast({ type: 'success', message: 'Recibo criado!' });
    }

    onClose();
  };

  // Leads com orçamento aprovado (para novo recibo)
  const leadsComOrcamento = useMemo(() => {
    const idsComOrc = new Set(
      orcamentos
        .filter((o) => o.status === 'aprovado')
        .map((o) => o.leadId),
    );
    return leads.filter((l) => idsComOrc.has(l.id));
  }, [leads, orcamentos]);

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
      {/* Seleção de lead (só para novo recibo) */}
      {!recibo && (
        <Select
          label="Lead / Cliente *"
          value={leadId}
          onChange={(e) => handleLeadChange(e.target.value)}
          options={[
            { value: '', label: 'Selecione um lead' },
            ...leadsComOrcamento.map((l: any) => ({
              value: l.id,
              label: `${l.nome} — ${l.servico || ''}`,
            })),
          ]}
        />
      )}

      <Input
        maiuscula="palavras"
        label="Nome do Cliente *"
        value={clienteNome}
        onChange={(e) => setClienteNome(e.target.value)}
        placeholder="Ex: João da Silva"
      />

      <TextArea
        maiuscula="frase"
        label="Descrição dos Serviços *"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        rows={3}
        placeholder="Ex: Serviços de instalação conforme orçamento..."
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor Total (R$)"
          type="number"
          step="0.01"
          min="0"
          value={valorTotal}
          onChange={(e) => setValorTotal(Number(e.target.value))}
        />
        <Input
          label="Data de Emissão"
          type="date"
          value={dataEmissao}
          onChange={(e) => setDataEmissao(e.target.value)}
        />
      </div>

      <TextArea
        maiuscula="frase"
        label="Observações"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        rows={2}
        placeholder="Informações adicionais..."
      />

      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <Button type="button" variant="secondary" onClick={onClose} className="min-h-[44px]">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" className="min-h-[44px]">
          {recibo ? 'Salvar' : 'Criar Recibo'}
        </Button>
      </div>
    </form>
  );
}
