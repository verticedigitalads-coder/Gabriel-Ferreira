import { useStore } from '@/store/useStore';
import { cn } from '@/utils/cn';
import { AlertTriangle } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Kanban,
  FileText,
  DollarSign,
  FileCheck,
  Sparkles,
  Download,
  Upload,
  Settings as SettingsIcon,
  CalendarDays,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
}

const sections: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Gestão',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'operacional', label: 'Operacional', icon: CalendarDays },
      { id: 'kanban', label: 'Kanban', icon: Kanban },
      { id: 'central', label: 'Central', icon: AlertTriangle },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { id: 'leads', label: 'Leads', icon: Users },
      { id: 'orcamentos', label: 'Orçamentos', icon: FileText },
      { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
      { id: 'notas', label: 'Notas', icon: FileCheck },
    ],
  },
  {
    title: 'Inteligência',
    items: [
      { id: 'ia', label: 'IA Assistente', icon: Sparkles },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { id: 'settings', label: 'Configurações', icon: SettingsIcon },
    ],
  },
];

export function Sidebar() {
  const activeModule = useStore(state => state.activeModule);
  const setActiveModule = useStore(state => state.setActiveModule);
  const exportData = useStore(state => state.exportData);
  const importData = useStore(state => state.importData);
  const addToast = useStore(state => state.addToast);

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
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

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = async (event) => {
        const content = event.target?.result as string;

        try {
          if (file.name.endsWith('.json')) {
            await importData(content);
            addToast({ type: 'success', message: 'Backup importado com sucesso!' });
          }

          else if (file.name.endsWith('.csv')) {
            const linhas = content.split('\n').filter(l => l.trim() !== '');
            const cabecalho = linhas[0].split(',');

            const now = new Date().toISOString();
            const { addLead } = useStore.getState();

            for (let index = 1; index < linhas.length; index++) {
              const valores = linhas[index].split(',');
              const obj: any = {};

              cabecalho.forEach((coluna, i) => {
                obj[coluna.trim()] = valores[i]?.trim();
              });

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
          }
        } catch {
          addToast({ type: 'error', message: 'Erro ao importar arquivo' });
        }
      };

      reader.readAsText(file);
    };

    input.click();
  };

  return (
    <aside className="w-64 bg-[#0F172A] text-white flex flex-col h-screen border-r border-[#1E293B]">
  
  {/* Logo */}
<div className="px-5 py-5 border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
  <div className="flex items-center gap-4">
    
    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
      CRM
    </div>

    <div className="leading-tight">
      <h1 className="text-base font-semibold text-white tracking-tight">
        CRM Pro
      </h1>
      <p className="text-xs text-slate-400 font-medium">
        Gestão Comercial Inteligente
      </p>
    </div>

  </div>
</div>

  {/* MENU */}
  <nav className="flex-1 overflow-y-auto py-6 space-y-8">
    {sections.map(section => (
      <div key={section.title}>
        <p className="px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {section.title}
        </p>

        <ul className="space-y-1 px-3">
          {section.items.map(item => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveModule(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:bg-[#1E293B] hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5 opacity-80" />
                  <span className="tracking-tight">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>

  {/* DADOS */}
  <div className="px-5 py-5 border-t border-[#1E293B] bg-[#0B1220]">
    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
      Dados
    </p>

    <div className="space-y-2">
      <button
        onClick={handleExport}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:bg-[#1E293B] hover:text-white rounded-xl transition-colors"
      >
        <Download className="w-4 h-4" />
        Exportar Backup
      </button>

      <button
        onClick={handleImport}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:bg-[#1E293B] hover:text-white rounded-xl transition-colors"
      >
        <Upload className="w-4 h-4" />
        Importar
      </button>
    </div>
  </div>

  {/* STATUS */}
  <div className="px-6 py-4 border-t border-[#1E293B] bg-[#0F172A]">
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      Sistema Online
    </div>
  </div>
</aside>
  );
}