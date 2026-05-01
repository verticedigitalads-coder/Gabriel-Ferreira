import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, RefreshCw, Info } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import { formatDateBR } from '@/utils/date';

interface Workspace {
  id: string;
  nome: string;
  segment: string;
  created_at: string;
}

interface FormState {
  nome: string;
  segment: 'metalurgica' | 'marcenaria';
  email: string;
  senha: string;
}

const SEGMENT_LABELS: Record<string, string> = {
  metalurgica: 'Metalúrgica',
  marcenaria: 'Marcenaria',
};

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-[var(--radius-md)] shadow-lg text-sm max-w-sm ${
        type === 'success'
          ? 'bg-[var(--success)] text-white'
          : 'bg-[var(--danger)] text-white'
      }`}
    >
      {message}
    </div>
  );
}

export function AdminEmpresas() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState<FormState>({
    nome: '',
    segment: 'metalurgica',
    email: '',
    senha: '',
  });

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/workspaces');
      if (!res.ok) throw new Error('Erro ao carregar empresas');
      const data = await res.json();
      setWorkspaces(data);
    } catch (err) {
      console.error('[AdminEmpresas] fetchWorkspaces:', err);
      setToast({ message: 'Erro ao carregar lista de empresas', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      setToast({ message: 'Nome da empresa é obrigatório', type: 'error' });
      return;
    }
    if (!form.email.trim()) {
      setToast({ message: 'Email do usuário é obrigatório', type: 'error' });
      return;
    }
    if (form.senha.length < 6) {
      setToast({ message: 'Senha deve ter no mínimo 6 caracteres', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/admin/criar-empresa', {
        method: 'POST',
        body: JSON.stringify({
          nome: form.nome.trim(),
          segment: form.segment,
          email: form.email.trim(),
          senha: form.senha,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error || 'Erro ao criar empresa', type: 'error' });
        return;
      }

      setToast({
        message: `Empresa criada! Login: ${data.email} — Workspace ID: ${data.workspace_id.slice(0, 8)}...`,
        type: 'success',
      });
      setForm({ nome: '', segment: 'metalurgica', email: '', senha: '' });
      setShowForm(false);
      await fetchWorkspaces();
    } catch (err) {
      console.error('[AdminEmpresas] handleSubmit:', err);
      setToast({ message: 'Erro de conexão com o servidor', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[var(--accent)]" />
            Empresas Cadastradas
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Gerencie workspaces e acesso de novas empresas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchWorkspaces}
            className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-[var(--radius-md)] text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </button>
        </div>
      </div>

      {/* Card informativo */}
      <div className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-[var(--accent)]" />
        <span>
          Cada empresa tem acesso isolado. Dados de uma empresa nunca são visíveis para outra.
          O isolamento é garantido por Row Level Security (RLS) no banco de dados.
        </span>
      </div>

      {/* Formulário Nova Empresa */}
      {showForm && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-4 md:p-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Nova Empresa</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: GPP Móveis Planejados"
                  className="w-full px-3 py-2 min-h-[44px] rounded-[var(--radius-md)] bg-[var(--bg-input)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Segmento *
                </label>
                <select
                  value={form.segment}
                  onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value as FormState['segment'] }))}
                  className="w-full px-3 py-2 min-h-[44px] rounded-[var(--radius-md)] bg-[var(--bg-input)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="metalurgica">Metalúrgica</option>
                  <option value="marcenaria">Marcenaria</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Email do primeiro usuário *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="usuario@empresa.com"
                  className="w-full px-3 py-2 min-h-[44px] rounded-[var(--radius-md)] bg-[var(--bg-input)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Senha temporária * (mín. 6 caracteres)
                </label>
                <input
                  type="text"
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  placeholder="Min. 6 caracteres"
                  minLength={6}
                  className="w-full px-3 py-2 min-h-[44px] rounded-[var(--radius-md)] bg-[var(--bg-input)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 min-h-[44px] rounded-[var(--radius-md)] text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {submitting ? 'Criando...' : 'Criar Empresa'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 min-h-[44px] rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Workspaces */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {loading ? 'Carregando...' : `${workspaces.length} empresa${workspaces.length !== 1 ? 's' : ''} cadastrada${workspaces.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Building2 className="w-8 h-8 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-tertiary)]">Nenhuma empresa cadastrada</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {workspaces.map((ws) => (
              <div key={ws.id} className="flex items-center justify-between px-4 py-3 gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{ws.nome}</p>
                  <p className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5 truncate">{ws.id}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-surface-2)] text-[var(--text-secondary)] font-medium">
                    {SEGMENT_LABELS[ws.segment] ?? ws.segment}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {formatDateBR(ws.created_at || '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
