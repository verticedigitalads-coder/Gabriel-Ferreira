import { Building2, FileText, Download, Upload, AlertTriangle, Trash2, Database, QrCode, PenTool, CreditCard } from 'lucide-react';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { FieldHint } from '@/components/ui/FieldHint';

type Tab = 'empresa' | 'documentos' | 'pagamentos' | 'dados';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'empresa',    label: 'Empresa',    icon: Building2 },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
  { id: 'dados',      label: 'Dados',      icon: Database },
];

export function Settings() {
  const workspaceId = useStore(s => s.workspaceId);
  const settings = useStore(s => s.settings);
  const updateSettings = useStore(s => s.updateSettings);
  const updateSetting = useStore(s => s.updateSetting);
  const initialize = useStore(s => s.initialize);
  const addToast = useStore(s => s.addToast);
  const addLead = useStore(s => s.addLead);

  const [activeTab, setActiveTab] = useState<Tab>('empresa');
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [savingDocs, setSavingDocs] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [confirmReset, setConfirmReset] = useState('');

  // ─── Empresa form state ───────────────────────────────────
  const [empresaNome, setEmpresaNome] = useState('');
  const [empresaTelefone, setEmpresaTelefone] = useState('');
  const [empresaEmail, setEmpresaEmail] = useState('');
  const [empresaEndereco, setEmpresaEndereco] = useState('');
  const [empresaCnpj, setEmpresaCnpj] = useState('');
  const [empresaLogoUrl, setEmpresaLogoUrl] = useState('');
  const [empresaLogoBgUrl, setEmpresaLogoBgUrl] = useState('');
  const [empresaInstagram, setEmpresaInstagram] = useState('');
  const [corPrimaria, setCorPrimaria] = useState('#ff6a00');
  const [corDestaque, setCorDestaque] = useState('');

  // ─── Documentos form state ────────────────────────────────
  const [validadePadrao, setValidadePadrao] = useState(15);
  const [multiplicadorPadrao, setMultiplicadorPadrao] = useState(1);
  const [percentualComissao, setPercentualComissao] = useState(0);
  const [obsPadraoOrcamento, setObsPadraoOrcamento] = useState('');
  const [obsPadraoRecibo, setObsPadraoRecibo] = useState('');
  const [textoApresentacao, setTextoApresentacao] = useState('');
  const [condicoesContrato, setCondicoesContrato] = useState('');
  const [metodosPagamento, setMetodosPagamento] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState('');
  const [nomeRecebedorPix, setNomeRecebedorPix] = useState('');
  const [cidadePix, setCidadePix] = useState('');
  const [savingPagamentos, setSavingPagamentos] = useState(false);

  // Popula formulários quando settings carrega
  useEffect(() => {
    if (!settings) return;
    setEmpresaNome(settings.empresaNome || '');
    setEmpresaTelefone(settings.empresaTelefone || '');
    setEmpresaEmail(settings.empresaEmail || '');
    setEmpresaEndereco(settings.empresaEndereco || '');
    setEmpresaCnpj(settings.empresaCnpj || '');
    setEmpresaLogoUrl(settings.empresaLogoUrl || '');
    setEmpresaLogoBgUrl(settings.empresaLogoBgUrl || '');
    setEmpresaInstagram(settings.empresaInstagram || '');
    setCorPrimaria(settings.corPrimaria || '#ff6a00');
    setCorDestaque(settings.corDestaque || '');
    setValidadePadrao(settings.validadePadraoOrcamento ?? 15);
    setMultiplicadorPadrao(settings.multiplicadorPadrao ?? 1);
    setPercentualComissao(settings.percentualComissao ?? 0);
    setObsPadraoOrcamento(settings.observacaoPadraoOrcamento || '');
    setObsPadraoRecibo(settings.observacaoPadraoRecibo || '');
    setTextoApresentacao(settings.textoApresentacao || '');
    setCondicoesContrato(settings.condicoesContrato || '');
    setMetodosPagamento(settings.metodosPagamento || '');
    setChavePix(settings.chavePix || '');
    setTipoChavePix(settings.tipoChavePix || '');
    setNomeRecebedorPix(settings.nomeRecebedorPix || '');
    setCidadePix(settings.cidadePix || '');
  }, [settings]);

  // ─── Salvar Empresa ───────────────────────────────────────
  const handleSaveEmpresa = async () => {
    setSavingEmpresa(true);
    try {
      await updateSettings({
        empresaNome,
        empresaTelefone,
        empresaEmail,
        empresaEndereco,
        empresaCnpj,
        empresaLogoUrl,
        empresaLogoBgUrl,
        empresaInstagram,
        corPrimaria,
        corDestaque,
      });
      addToast({ type: 'success', message: 'Dados da empresa salvos!' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar dados da empresa' });
    } finally {
      setSavingEmpresa(false);
    }
  };

  // ─── Salvar Documentos ────────────────────────────────────
  const handleSaveDocs = async () => {
    setSavingDocs(true);
    try {
      await updateSettings({
        validadePadraoOrcamento: validadePadrao,
        multiplicadorPadrao,
        percentualComissao,
        observacaoPadraoOrcamento: obsPadraoOrcamento,
        observacaoPadraoRecibo: obsPadraoRecibo,
        textoApresentacao,
        condicoesContrato,
        metodosPagamento,
        chavePix,
        tipoChavePix: tipoChavePix as any,
        nomeRecebedorPix,
        cidadePix,
      });
      addToast({ type: 'success', message: 'Configurações de documentos salvas!' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar configurações' });
    } finally {
      setSavingDocs(false);
    }
  };

  // ─── Salvar Pagamentos ────────────────────────────────────────
  const handleSavePagamentos = async () => {
    setSavingPagamentos(true);
    try {
      await updateSettings({
        metodosPagamento,
        chavePix,
        tipoChavePix,
      } as any);
      addToast({ type: 'success', message: 'Configurações de pagamento salvas!' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar pagamentos' });
    } finally {
      setSavingPagamentos(false);
    }
  };

  // ─── Exportar Backup via Supabase ─────────────────────────
  const handleExport = async () => {
    if (!workspaceId) return;
    try {
      const [leadsRes, orcRes, txRes, notasRes, recibosRes, tasksRes, fornRes] =
        await Promise.all([
          supabase.from('leads').select('*').eq('workspace_id', workspaceId),
          supabase.from('orcamentos').select('*').eq('workspace_id', workspaceId),
          supabase.from('transactions').select('*').eq('workspace_id', workspaceId),
          supabase.from('notas').select('*').eq('workspace_id', workspaceId),
          supabase.from('recibos').select('*').eq('workspace_id', workspaceId),
          supabase.from('operacional_tasks').select('*').eq('workspace_id', workspaceId),
          supabase.from('fornecedores').select('*').eq('workspace_id', workspaceId),
        ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        workspaceId,
        leads: leadsRes.data || [],
        orcamentos: orcRes.data || [],
        transactions: txRes.data || [],
        notas: notasRes.data || [],
        recibos: recibosRes.data || [],
        operacionalTasks: tasksRes.data || [],
        fornecedores: fornRes.data || [],
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'Backup exportado com sucesso!' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao exportar backup' });
    }
  };

  // ─── Importar Arquivo ─────────────────────────────────────
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        try {
          if (file.name.endsWith('.csv')) {
            const linhas = content.split('\n').filter(l => l.trim() !== '');
            const cabecalho = linhas[0].split(',');
            for (let i = 1; i < linhas.length; i++) {
              const valores = linhas[i].split(',');
              const obj: any = {};
              cabecalho.forEach((col, idx) => { obj[col.trim()] = valores[idx]?.trim(); });
              await addLead({
                nome: obj.nome || '',
                telefone: obj.telefone || '',
                email: obj.email || '',
                servico: obj.servico || '',
                status: obj.status || 'novo',
                temperatura: obj.temperatura || 'frio',
                ultimoContato: obj.ultimoContato || null,
                proximoContato: obj.proximoContato || null,
                orcamentoEnviado: obj.status === 'orcado' || obj.status === 'fechado',
                valorOrcado: Number(obj.valorOrcado) || 0,
                resumo: '',
                observacoes: obj.observacoes || '',
              });
            }
            addToast({ type: 'success', message: 'Leads CSV importados com sucesso!' });
          } else {
            addToast({ type: 'error', message: 'Apenas arquivos CSV são suportados para importação' });
          }
        } catch {
          addToast({ type: 'error', message: 'Erro ao importar arquivo' });
        }
      };
      reader.readAsText(file);
    };

    input.click();
  };

  // ─── Demo: Gerar seed ─────────────────────────────────────
  const handleGenerateSeed = async () => {
    if (!window.confirm('Gerar dados de exemplo?')) return;
    if (!workspaceId) return;
    setLoadingDemo(true);
    try {
      await initialize(workspaceId);
      addToast({ type: 'success', message: 'Dados de exemplo gerados!' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao gerar dados' });
    } finally {
      setLoadingDemo(false);
    }
  };

  // ─── Demo: Limpar Leads ───────────────────────────────────
  const handleClearLeads = async () => {
    if (!workspaceId) return;
    if (!window.confirm('Deseja apagar TODOS os leads? Esta ação não pode ser desfeita.')) return;
    setLoadingDemo(true);
    try {
      const { error } = await supabase.from('leads').delete().eq('workspace_id', workspaceId);
      if (error) throw error;
      await initialize(workspaceId);
      addToast({ type: 'success', message: 'Leads removidos.' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao limpar leads' });
    } finally {
      setLoadingDemo(false);
    }
  };

  // ─── Demo: Limpar Financeiro ──────────────────────────────
  const handleClearFinancial = async () => {
    if (!workspaceId) return;
    if (!window.confirm('Deseja apagar ORÇAMENTOS, TRANSAÇÕES, NOTAS e RECIBOS? Esta ação não pode ser desfeita.')) return;
    setLoadingDemo(true);
    try {
      await supabase.from('recibos').delete().eq('workspace_id', workspaceId);
      await supabase.from('orcamentos').delete().eq('workspace_id', workspaceId);
      await supabase.from('transactions').delete().eq('workspace_id', workspaceId);
      await supabase.from('notas').delete().eq('workspace_id', workspaceId);
      await initialize(workspaceId);
      addToast({ type: 'success', message: 'Dados financeiros removidos.' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao limpar financeiro' });
    } finally {
      setLoadingDemo(false);
    }
  };

  // ─── Demo: Reset Completo ─────────────────────────────────
  const handleFullReset = async () => {
    if (!workspaceId) return;
    if (confirmReset !== 'CONFIRMAR') {
      addToast({ type: 'error', message: 'Digite CONFIRMAR para prosseguir' });
      return;
    }
    setLoadingDemo(true);
    try {
      await supabase.from('recibos').delete().eq('workspace_id', workspaceId);
      await supabase.from('notas').delete().eq('workspace_id', workspaceId);
      await supabase.from('orcamentos').delete().eq('workspace_id', workspaceId);
      await supabase.from('transactions').delete().eq('workspace_id', workspaceId);
      await supabase.from('contas_receber').delete().eq('workspace_id', workspaceId);
      await supabase.from('operacional_tasks').delete().eq('workspace_id', workspaceId);
      await supabase.from('cotacoes_materiais').delete().eq('workspace_id', workspaceId);
      await supabase.from('consumo_materiais').delete().eq('workspace_id', workspaceId);
      await supabase.from('materiais').delete().eq('workspace_id', workspaceId);
      await supabase.from('fornecedores').delete().eq('workspace_id', workspaceId);
      await supabase.from('leads').delete().eq('workspace_id', workspaceId);
      await initialize(workspaceId);
      setConfirmReset('');
      addToast({ type: 'success', message: 'Sistema resetado com sucesso.' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao resetar sistema' });
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">

      <p className="text-sm text-[var(--text-tertiary)]">
        Painel administrativo do CRM
      </p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors min-h-[44px]',
                isActive
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB EMPRESA ─────────────────────────────────────────── */}
      {activeTab === 'empresa' && (
        <Card className="p-4 md:p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Dados da Empresa</h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            Estas informações aparecem nos PDFs de orçamentos e recibos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nome da Empresa"
                value={empresaNome}
                onChange={e => setEmpresaNome(e.target.value)}
                placeholder="Ex: Vértice Digital Ltda"
              />
              <FieldHint>Nome da sua empresa, exibido no cabeçalho de todos os orçamentos e recibos.</FieldHint>
            </div>
            <div>
              <Input
                label="CNPJ"
                value={empresaCnpj}
                onChange={e => setEmpresaCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
              <FieldHint>CNPJ da empresa, exibido nos documentos oficiais (orçamentos e recibos) enviados ao cliente.</FieldHint>
            </div>
            <div>
              <Input
                label="Telefone"
                value={empresaTelefone}
                onChange={e => setEmpresaTelefone(e.target.value)}
                placeholder="(34) 99999-9999"
              />
              <FieldHint>Telefone de contato exibido no cabeçalho e no rodapé dos PDFs, para o cliente falar com você.</FieldHint>
            </div>
            <div className="md:col-span-2">
              <Input
                label="E-mail Comercial"
                type="email"
                value={empresaEmail}
                onChange={e => setEmpresaEmail(e.target.value)}
                placeholder="contato@empresa.com.br"
              />
              <FieldHint>E-mail exibido no rodapé dos PDFs de orçamento e recibo.</FieldHint>
            </div>
            <div className="md:col-span-2">
              <Input
                label="Instagram / site (opcional)"
                value={empresaInstagram}
                onChange={e => setEmpresaInstagram(e.target.value)}
                placeholder="@suaempresa ou www.site.com.br"
              />
              <FieldHint>Seu Instagram ou site, exibido no rodapé dos PDFs ao lado do telefone. Opcional.</FieldHint>
            </div>
            <div className="md:col-span-2">
              <TextArea
                label="Endereço"
                rows={2}
                value={empresaEndereco}
                onChange={e => setEmpresaEndereco(e.target.value)}
                placeholder="Rua, número, bairro, cidade — UF"
              />
              <FieldHint>Endereço completo da empresa, exibido no cabeçalho dos orçamentos e recibos.</FieldHint>
            </div>
            <div className="md:col-span-2">
              <Input
                label="Logo Principal URL"
                value={empresaLogoUrl}
                onChange={e => setEmpresaLogoUrl(e.target.value)}
                placeholder="URL da logo (upload de arquivo será futuro)"
              />
              <FieldHint>Sua logo, exibida no topo de todos os PDFs. Cole o link direto da imagem (.png ou .jpg), sem espaços no nome do arquivo.</FieldHint>
            </div>
            <div className="md:col-span-2">
              <Input
                label="Logo de fundo / Mascote URL"
                value={empresaLogoBgUrl}
                onChange={e => setEmpresaLogoBgUrl(e.target.value)}
                placeholder="URL da logo de fundo (watermark no PDF)"
              />
              <FieldHint>Aparece como marca d'água (bem clara) atrás do conteúdo dos PDFs. Use uma imagem grande — ela é exibida com transparência.</FieldHint>
            </div>

            <div className="md:col-span-2 border-t border-[var(--border)] pt-4 mt-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Identidade Visual</h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                Cor principal da empresa
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={corPrimaria}
                  onChange={e => setCorPrimaria(e.target.value)}
                  className="rounded-lg border border-[var(--border)] cursor-pointer p-1 bg-transparent"
                  style={{ minHeight: '48px', minWidth: '48px', width: '48px', height: '48px' }}
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={corPrimaria}
                    onChange={e => setCorPrimaria(e.target.value)}
                    placeholder="#ff6a00"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] font-mono"
                  />
                </div>
                <div
                  className="w-20 h-10 rounded-md border border-[var(--border)]"
                  style={{ backgroundColor: corPrimaria }}
                />
              </div>
              <FieldHint>Cor usada na barra do topo, nos destaques e na caixa de total dos PDFs de orçamento e recibo.</FieldHint>
              <div className="flex gap-2 mt-2 flex-wrap">
                {[
                  { cor: '#ff6a00', label: 'Laranja' },
                  { cor: '#2e7d32', label: 'Verde' },
                  { cor: '#1565c0', label: 'Azul' },
                  { cor: '#c62828', label: 'Vermelho' },
                  { cor: '#4a148c', label: 'Roxo' },
                  { cor: '#37474f', label: 'Grafite' },
                  { cor: '#bf360c', label: 'Terracota' },
                ].map(p => (
                  <button
                    key={p.cor}
                    type="button"
                    onClick={() => setCorPrimaria(p.cor)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-colors ${
                      corPrimaria === p.cor
                        ? 'border-[var(--accent)] text-[var(--text-primary)]'
                        : 'border-[var(--border)] text-[var(--text-tertiary)]'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.cor }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                Cor de destaque (opcional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={corDestaque || corPrimaria}
                  onChange={e => setCorDestaque(e.target.value)}
                  className="rounded-lg border border-[var(--border)] cursor-pointer p-1 bg-transparent"
                  style={{ minHeight: '48px', minWidth: '48px', width: '48px', height: '48px' }}
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={corDestaque}
                    onChange={e => setCorDestaque(e.target.value)}
                    placeholder="Vazia = usa a cor principal"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] font-mono"
                  />
                </div>
                <div
                  className="w-20 h-10 rounded-md border border-[var(--border)]"
                  style={{ backgroundColor: corDestaque || corPrimaria }}
                />
              </div>
              <FieldHint>Cor dos detalhes nos PDFs: números dos itens e cabeçalho das tabelas. Se deixar vazio, usamos a cor principal.</FieldHint>
              <div className="flex gap-2 mt-2 flex-wrap items-center">
                {[
                  { cor: '#E67E22', label: 'Cenoura' },
                  { cor: '#F39C12', label: 'Âmbar' },
                  { cor: '#16A085', label: 'Verde-mar' },
                  { cor: '#C0392B', label: 'Rubi' },
                  { cor: '#8E44AD', label: 'Ametista' },
                ].map(p => (
                  <button
                    key={p.cor}
                    type="button"
                    onClick={() => setCorDestaque(p.cor)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-colors ${
                      corDestaque === p.cor
                        ? 'border-[var(--accent)] text-[var(--text-primary)]'
                        : 'border-[var(--border)] text-[var(--text-tertiary)]'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.cor }} />
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCorDestaque('')}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-colors ${
                    corDestaque === ''
                      ? 'border-[var(--accent)] text-[var(--text-primary)]'
                      : 'border-[var(--border)] text-[var(--text-tertiary)]'
                  }`}
                >
                  Usar cor principal
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="border border-[var(--border)] rounded-lg overflow-hidden" style={{ maxWidth: 280 }}>
                <div style={{ background: corPrimaria, height: 24 }} />
                <div className="p-3 text-center">
                  <p className="text-xs font-bold text-[var(--text-primary)]">{empresaNome || 'Nome da Empresa'}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{empresaTelefone || '(00) 00000-0000'}</p>
                </div>
                <div className="px-3 pb-2">
                  <div style={{ borderBottom: `2px solid ${corPrimaria}` }} className="mb-2" />
                  <div
                    className="flex items-center gap-2 px-2 py-1 rounded"
                    style={{ background: corPrimaria }}
                  >
                    <span
                      className="inline-flex items-center justify-center text-white text-[9px] font-bold rounded-full"
                      style={{ background: corDestaque || corPrimaria, width: 16, height: 16 }}
                    >
                      1
                    </span>
                    <span className="text-white text-[10px] font-semibold">Item do orçamento</span>
                  </div>
                </div>
                <div className="px-3 pb-3">
                  <div
                    className="text-center text-white text-xs font-bold py-2 rounded"
                    style={{ background: corPrimaria }}
                  >
                    R$ 0.000,00
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleSaveEmpresa} disabled={savingEmpresa}>
              {savingEmpresa ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </Card>
      )}

      {/* ── TAB DOCUMENTOS ──────────────────────────────────────── */}
      {activeTab === 'documentos' && (
        <Card className="p-4 md:p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Padrões de Documentos</h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            Valores padrão aplicados automaticamente ao criar orçamentos e recibos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                Validade padrão do orçamento
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={validadePadrao}
                  onChange={e => setValidadePadrao(Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text-tertiary)]">dias</span>
              </div>
              <FieldHint>Quantos dias o orçamento fica válido antes de vencer. Preenchido automaticamente ao criar um orçamento novo (pode mudar em cada um).</FieldHint>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                Multiplicador padrão de mão de obra
              </label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={multiplicadorPadrao}
                onChange={e => setMultiplicadorPadrao(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <FieldHint>Acréscimo automático sobre a mão de obra em orçamentos novos. Ex: 1.1 aumenta 10%; 1 = sem acréscimo. Pode ajustar em cada orçamento.</FieldHint>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                Comissão da planejadora (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={percentualComissao}
                onChange={e => setPercentualComissao(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <FieldHint>Aplicado automaticamente em novos orçamentos. Pode ser ajustado por orçamento. Use 0 para desativar.</FieldHint>
            </div>

            <div className="md:col-span-2">
              <TextArea
                label="Observação padrão do orçamento"
                rows={3}
                value={obsPadraoOrcamento}
                onChange={e => setObsPadraoOrcamento(e.target.value)}
                placeholder="Ex: Instalação no mesmo dia da entrega. Pagamento 50% na aprovação."
              />
              <FieldHint>Texto que já vem preenchido nas observações sempre que você cria um orçamento novo. Aparece no PDF do orçamento.</FieldHint>
            </div>

            <div className="md:col-span-2">
              <TextArea
                label="Observação padrão do recibo"
                rows={3}
                value={obsPadraoRecibo}
                onChange={e => setObsPadraoRecibo(e.target.value)}
                placeholder="Ex: Recibo emitido após confirmação do pagamento."
              />
              <FieldHint>Texto que já vem preenchido nas observações sempre que você emite um recibo novo. Aparece no PDF do recibo.</FieldHint>
            </div>

            <div className="md:col-span-2 border-t border-[var(--border)] pt-4 mt-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Template do PDF</h3>
            </div>

            <div className="md:col-span-2">
              <TextArea
                label="Texto de apresentação (Relatório inicial)"
                rows={4}
                value={textoApresentacao}
                onChange={e => setTextoApresentacao(e.target.value)}
                placeholder="Para a nossa empresa, é um prazer apresentar esta proposta..."
              />
              <FieldHint>Aparece no início do PDF como introdução ao cliente.</FieldHint>
            </div>

            <div className="md:col-span-2">
              <TextArea
                label="Condições de contrato"
                rows={6}
                value={condicoesContrato}
                onChange={e => setCondicoesContrato(e.target.value)}
                placeholder={'1. Neste orçamento já estão considerados os valores de mão de obra...\n2. A validade deste orçamento é de 7 dias...'}
              />
              <FieldHint>Uma condição por linha. Use {'{{validade}}'} para inserir os dias de validade automaticamente. Aparece no rodapé do PDF.</FieldHint>
            </div>

            <div className="md:col-span-2 border-t border-[var(--border)] pt-4 mt-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[var(--accent)]" />
                Dados PIX (QR Code nos documentos)
              </h3>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Tipo da Chave</label>
              <select
                value={tipoChavePix}
                onChange={e => setTipoChavePix(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[44px]"
              >
                <option value="">Selecione...</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Chave Aleatória</option>
              </select>
              <FieldHint>Tipo da sua chave PIX. Usado para montar o QR Code de pagamento nos PDFs.</FieldHint>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Chave PIX</label>
              <input
                type="text"
                value={chavePix}
                onChange={e => setChavePix(e.target.value)}
                placeholder="Ex: 12345678900, email@empresa.com..."
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[44px]"
              />
              <FieldHint>Sua chave PIX. Gera o QR Code de pagamento nos orçamentos e recibos. Deixe em branco para não exibir.</FieldHint>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Nome do Recebedor (max 25 caracteres)</label>
              <input
                type="text"
                value={nomeRecebedorPix}
                onChange={e => setNomeRecebedorPix(e.target.value.slice(0, 25))}
                maxLength={25}
                placeholder="Ex: FL ART METAL"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[44px]"
              />
              <FieldHint>Nome que aparece pro cliente ao escanear o QR Code no banco dele. Máximo 25 caracteres (limite do padrão PIX).</FieldHint>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Cidade (max 15 caracteres)</label>
              <input
                type="text"
                value={cidadePix}
                onChange={e => setCidadePix(e.target.value.slice(0, 15))}
                maxLength={15}
                placeholder="Ex: Uberaba"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[44px]"
              />
              <FieldHint>Cidade da empresa, exigida pelo padrão PIX para gerar o QR Code. Máximo 15 caracteres.</FieldHint>
            </div>

            <div className="md:col-span-2 border-t border-[var(--border)] pt-4 mt-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[var(--accent)]" />
                Assinatura da Empresa
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                Esta assinatura será incluída automaticamente nos orçamentos e recibos.
              </p>
              {settings.assinaturaEmpresa ? (
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-lg border border-[var(--border)] inline-block">
                    <img
                      src={settings.assinaturaEmpresa}
                      alt="Assinatura da empresa"
                      className="h-16 w-auto"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => updateSetting('assinaturaEmpresa', '')}
                      className="text-xs text-[var(--danger)] hover:underline"
                    >
                      Remover assinatura
                    </button>
                  </div>
                </div>
              ) : (
                <SignaturePad
                  onSave={(dataUrl) => updateSetting('assinaturaEmpresa', dataUrl)}
                  height={150}
                />
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleSaveDocs} disabled={savingDocs}>
              {savingDocs ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </Card>
      )}

      {/* ── TAB PAGAMENTOS ──────────────────────────────────────── */}
      {activeTab === 'pagamentos' && (
        <div className="space-y-4">

          {/* Métodos de pagamento exibidos no PDF */}
          <Card className="p-4 md:p-6 space-y-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Métodos de Pagamento — PDF
            </h2>
            <p className="text-sm text-[var(--text-tertiary)]">
              Exibidos no rodapé dos PDFs de orçamentos e recibos. Toque para ativar ou desativar cada um.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'pix', label: 'PIX' },
                { key: 'credito', label: 'Crédito' },
                { key: 'debito', label: 'Débito' },
                { key: 'dinheiro', label: 'Dinheiro' },
                { key: 'transferencia', label: 'Transferência' },
                { key: 'boleto', label: 'Boleto' },
              ].map(m => {
                const ativo = metodosPagamento.split(',').includes(m.key);
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      const lista = metodosPagamento.split(',').filter(Boolean);
                      if (ativo) {
                        setMetodosPagamento(lista.filter(x => x !== m.key).join(','));
                      } else {
                        setMetodosPagamento([...lista, m.key].join(','));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm border min-h-[44px] transition-colors ${
                      ativo
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border-[var(--border)]'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Chave PIX */}
          <Card className="p-4 md:p-6 space-y-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Chave PIX
            </h2>
            <p className="text-sm text-[var(--text-tertiary)]">
              Exibida nos documentos para pagamentos via PIX. Deixe em branco para não exibir.
            </p>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                Tipo da chave
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: 'cpf_cnpj', label: 'CPF/CNPJ' },
                    { value: 'telefone', label: 'Telefone' },
                    { value: 'email',    label: 'E-mail' },
                    { value: 'aleatoria', label: 'Aleatória' },
                  ] as const
                ).map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipoChavePix(t.value)}
                    className={`px-3 py-1.5 rounded-full text-sm border min-h-[44px] transition-colors ${
                      tipoChavePix === t.value
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border-[var(--border)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <FieldHint>Tipo da sua chave PIX. Usado para montar o QR Code de pagamento nos PDFs.</FieldHint>
            </div>

            <Input
              label="Chave PIX"
              value={chavePix}
              onChange={e => setChavePix(e.target.value)}
              placeholder={
                tipoChavePix === 'cpf_cnpj'  ? '00.000.000/0000-00 ou 000.000.000-00' :
                tipoChavePix === 'telefone'   ? '+55 (34) 99999-9999' :
                tipoChavePix === 'email'      ? 'pix@empresa.com.br' :
                'Chave aleatória UUID'
              }
            />

            <div className="pt-2">
              <Button onClick={handleSavePagamentos} disabled={savingPagamentos}>
                {savingPagamentos ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB DADOS ───────────────────────────────────────────── */}
      {activeTab === 'dados' && (
        <div className="space-y-4">
          <Card className="p-4 md:p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-surface-2)] flex items-center justify-center shrink-0">
                <Download className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Exportar Backup</h3>
                <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                  Baixa um arquivo .json com todos os leads, orçamentos, recibos e financeiro do seu workspace — útil para guardar uma cópia de segurança.
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar Backup
            </Button>
          </Card>

          <Card className="p-4 md:p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-surface-2)] flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Importar Leads via CSV</h3>
                <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                  Importa leads em massa a partir de uma planilha CSV. Colunas esperadas: nome, telefone, email, servico, status.
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={handleImport} className="gap-2">
              <Upload className="w-4 h-4" />
              Importar CSV
            </Button>
          </Card>

          {/* Aviso */}
          <div className="flex items-start gap-3 p-4 rounded-lg border border-[var(--warning)] bg-[var(--bg-surface)]">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--warning)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Atenção:</span>{' '}
              Estas ações afetam dados reais. Use com cuidado.
            </p>
          </div>

          {/* Gerar seed */}
          <Card className="p-4 md:p-6 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Gerar Dados Demo</h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              Popula o sistema com dados de exemplo para demonstração.
            </p>
            <Button variant="secondary" onClick={handleGenerateSeed} disabled={loadingDemo} className="gap-2">
              <Database className="w-4 h-4" />
              Gerar Dados Demo
            </Button>
          </Card>

          {/* Limpar Leads */}
          <Card className="p-4 md:p-6 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Limpar Leads</h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              Remove todos os leads do workspace. Orçamentos e financeiro não são afetados.
            </p>
            <Button variant="secondary" onClick={handleClearLeads} disabled={loadingDemo} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Limpar Leads
            </Button>
          </Card>

          {/* Limpar Financeiro */}
          <Card className="p-4 md:p-6 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Limpar Financeiro</h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              Remove orçamentos, transações, notas e recibos. Leads não são afetados.
            </p>
            <Button variant="secondary" onClick={handleClearFinancial} disabled={loadingDemo} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Limpar Financeiro
            </Button>
          </Card>

          {/* Reset Completo */}
          <div className="rounded-md border border-[var(--danger)] bg-[var(--bg-surface)] p-4 md:p-6 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--danger)]" />
              <h3 className="text-sm font-semibold text-[var(--danger)]">
                Resetar Sistema Completo
              </h3>
            </div>
            <p className="text-sm text-[var(--text-tertiary)]">
              Apaga <strong className="text-[var(--text-primary)]">todos</strong> os dados do workspace permanentemente.
              Esta ação não pode ser desfeita.
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                Digite{' '}
                <span className="font-mono text-[var(--danger)]">CONFIRMAR</span>
                {' '}para prosseguir:
              </label>
              <input
                type="text"
                value={confirmReset}
                onChange={e => setConfirmReset(e.target.value)}
                placeholder="CONFIRMAR"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--bg-surface-2)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]"
              />
            </div>
            <Button
              onClick={handleFullReset}
              disabled={loadingDemo || confirmReset !== 'CONFIRMAR'}
              className="gap-2 bg-[var(--danger)] hover:opacity-90"
            >
              <AlertTriangle className="w-4 h-4" />
              Resetar Sistema Completo
            </Button>
          </div>

        </div>
      )}

    </div>
  );
}
