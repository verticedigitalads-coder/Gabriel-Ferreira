import { Building2, FileText, Download, Upload, AlertTriangle, Trash2, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';

type Tab = 'empresa' | 'documentos' | 'backup' | 'demo';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'backup', label: 'Backup e Dados', icon: Download },
  { id: 'demo', label: 'Ambiente Demo', icon: Database },
];

export function Settings() {
  const workspaceId = useStore(s => s.workspaceId);
  const settings = useStore(s => s.settings);
  const updateSettings = useStore(s => s.updateSettings);
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

  // ─── Documentos form state ────────────────────────────────
  const [validadePadrao, setValidadePadrao] = useState(15);
  const [multiplicadorPadrao, setMultiplicadorPadrao] = useState(1);
  const [percentualComissao, setPercentualComissao] = useState(0);
  const [obsPadraoOrcamento, setObsPadraoOrcamento] = useState('');
  const [obsPadraoRecibo, setObsPadraoRecibo] = useState('');

  // Popula formulários quando settings carrega
  useEffect(() => {
    if (!settings) return;
    setEmpresaNome(settings.empresaNome || '');
    setEmpresaTelefone(settings.empresaTelefone || '');
    setEmpresaEmail(settings.empresaEmail || '');
    setEmpresaEndereco(settings.empresaEndereco || '');
    setEmpresaCnpj(settings.empresaCnpj || '');
    setEmpresaLogoUrl(settings.empresaLogoUrl || '');
    setValidadePadrao(settings.validadePadraoOrcamento ?? 15);
    setMultiplicadorPadrao(settings.multiplicadorPadrao ?? 1);
    setPercentualComissao(settings.percentualComissao ?? 0);
    setObsPadraoOrcamento(settings.observacaoPadraoOrcamento || '');
    setObsPadraoRecibo(settings.observacaoPadraoRecibo || '');
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
      });
      addToast({ type: 'success', message: 'Configurações de documentos salvas!' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar configurações' });
    } finally {
      setSavingDocs(false);
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

      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
          Configurações
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Painel administrativo do CRM
        </p>
      </div>

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
            </div>
            <Input
              label="CNPJ"
              value={empresaCnpj}
              onChange={e => setEmpresaCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
            />
            <Input
              label="Telefone"
              value={empresaTelefone}
              onChange={e => setEmpresaTelefone(e.target.value)}
              placeholder="(34) 99999-9999"
            />
            <div className="md:col-span-2">
              <Input
                label="E-mail Comercial"
                type="email"
                value={empresaEmail}
                onChange={e => setEmpresaEmail(e.target.value)}
                placeholder="contato@empresa.com.br"
              />
            </div>
            <div className="md:col-span-2">
              <TextArea
                label="Endereço"
                rows={2}
                value={empresaEndereco}
                onChange={e => setEmpresaEndereco(e.target.value)}
                placeholder="Rua, número, bairro, cidade — UF"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Logo URL"
                value={empresaLogoUrl}
                onChange={e => setEmpresaLogoUrl(e.target.value)}
                placeholder="URL da logo (upload de arquivo será futuro)"
              />
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
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Aplicado automaticamente em novos orçamentos. Pode ser ajustado por orçamento. Use 0 para desativar.
              </p>
            </div>

            <div className="md:col-span-2">
              <TextArea
                label="Observação padrão do orçamento"
                rows={3}
                value={obsPadraoOrcamento}
                onChange={e => setObsPadraoOrcamento(e.target.value)}
                placeholder="Ex: Instalação no mesmo dia da entrega. Pagamento 50% na aprovação."
              />
            </div>

            <div className="md:col-span-2">
              <TextArea
                label="Observação padrão do recibo"
                rows={3}
                value={obsPadraoRecibo}
                onChange={e => setObsPadraoRecibo(e.target.value)}
                placeholder="Ex: Recibo emitido após confirmação do pagamento."
              />
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleSaveDocs} disabled={savingDocs}>
              {savingDocs ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </Card>
      )}

      {/* ── TAB BACKUP ──────────────────────────────────────────── */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          <Card className="p-4 md:p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-surface-2)] flex items-center justify-center shrink-0">
                <Download className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Exportar Backup</h3>
                <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                  Exportar todos os dados do CRM em formato JSON
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
                  Importar leads a partir de um arquivo CSV
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={handleImport} className="gap-2">
              <Upload className="w-4 h-4" />
              Importar CSV
            </Button>
          </Card>
        </div>
      )}

      {/* ── TAB DEMO ────────────────────────────────────────────── */}
      {activeTab === 'demo' && (
        <div className="space-y-4">

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
