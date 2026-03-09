import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore'
import { useFilteredLeads } from '@/store/selectors/leadSelectors'
import { useDebounce } from '@/hooks/useDebounce';
import { useLeadActions } from '@/hooks/useLeadActions';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal, SlidePanel } from '@/components/ui/Modal';
import { StatusBadge, TemperatureBadge, PriorityBadge } from '@/components/ui/Badge';
import { LeadForm } from './LeadForm';
import { LeadDetail } from './LeadDetail';
import { parseISO, differenceInDays } from 'date-fns';
import {
  Plus,
  Search,
  Phone,
  MessageCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { AILeadModal } from './AILeadModal';
import type { Lead } from '@/types';

export function LeadsList() {
  const leads = useStore(state => state.leads);
  const filters = useStore(state => state.filters);
  const setFilter = useStore(state => state.setFilter);
  const clearFilters = useStore(state => state.clearFilters);
  const selectedLeadId = useStore(state => state.selectedLeadId);
  const selectLead = useStore(state => state.selectLead);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    setFilter({ search: debouncedSearch });
  }, [debouncedSearch, setFilter]);

  const filteredLeads = useFilteredLeads();

  const selectedLead = useMemo(
    () => leads.find(l => l.id === selectedLeadId),
    [leads, selectedLeadId]
  );

  const { openWhatsApp, registerContact } = useLeadActions();

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.temperatura !== 'all' ||
    filters.prioridadeLevel !== 'all' ||
    filters.search !== '';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
            <p className="text-sm text-slate-500">
              {filteredLeads.length} de {leads.length} leads
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowAIModal(true)}
              className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Sparkles className="w-4 h-4" />
              Criar com IA
            </Button>
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, telefone ou serviço..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <Select
            value={filters.status}
            onChange={e => setFilter({ status: e.target.value as any })}
            options={[
              { value: 'all', label: 'Todos Status' },
              { value: 'novo', label: 'Novo' },
              { value: 'atendimento', label: 'Em Atendimento' },
              { value: 'orcado', label: 'Orçado' },
              { value: 'fechado', label: 'Fechado' },
              { value: 'perdido', label: 'Perdido' },
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

          <Select
            value={filters.prioridadeLevel}
            onChange={e => setFilter({ prioridadeLevel: e.target.value as any })}
            options={[
              { value: 'all', label: 'Todas Prioridades' },
              { value: 'critico', label: '🔴 Crítico' },
              { value: 'alto', label: '🟠 Alto' },
              { value: 'medio', label: '🟡 Médio' },
              { value: 'baixo', label: '🟢 Baixo' },
            ]}
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="w-4 h-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Nenhum lead encontrado</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              Adicionar primeiro lead
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map(lead => (
              <LeadRow
                key={lead.id}
                lead={lead}
                onClick={() => selectLead(lead.id)}
                onWhatsApp={() => openWhatsApp(lead.telefone, lead.nome)}
                onRegisterContact={() => registerContact(lead.id)}
                isSelected={lead.id === selectedLeadId}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Novo Lead"
        size="lg"
      >
        <LeadForm onClose={() => setShowAddModal(false)} />
      </Modal>

      <AILeadModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
      />

      <SlidePanel
        isOpen={!!selectedLead}
        onClose={() => selectLead(null)}
        title="Detalhes do Lead"
      >
        {selectedLead && (
          <LeadDetail lead={selectedLead} onClose={() => selectLead(null)} />
        )}
      </SlidePanel>
    </div>
  );
}

interface LeadRowProps {
  lead: Lead;
  onClick: () => void;
  onWhatsApp: () => void;
  onRegisterContact: () => void;
  isSelected: boolean;
}

function LeadRow({ lead, onClick, onWhatsApp, onRegisterContact, isSelected }: LeadRowProps) {
  const diasSemContato = lead.ultimoContato
    ? differenceInDays(new Date(), parseISO(lead.ultimoContato))
    : null;

  const jaAnalisado = lead.historico?.some(
    (h) => h.tipo === 'ia_analysis'
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const alertaContato =
    diasSemContato !== null && diasSemContato >= 5;

  return (
    <Card
      className={`p-4 transition ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
      } ${alertaContato ? 'border-red-300 bg-red-50/40' : ''}`}
      hoverable
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">
              {lead.nome}
            </h3>

            {jaAnalisado && (
              <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                IA Analisado
              </span>
            )}

            <PriorityBadge level={lead.prioridadeLevel} />
          </div>

          <p className="text-sm text-slate-500 truncate">
            {lead.servico}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={lead.status} />
            <TemperatureBadge temperatura={lead.temperatura} />

            {alertaContato && (
              <span className="text-xs text-red-600 font-medium">
                {diasSemContato}d sem contato
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          {lead.valorOrcado > 0 && (
            <p className="text-sm font-semibold text-slate-900">
              {formatCurrency(lead.valorOrcado)}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            {lead.telefone}
          </p>
        </div>

        <div
          className="flex items-center gap-2"
          onClick={e => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onWhatsApp}
            title="Abrir WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-green-600" />
          </Button>

          <Button
            size="sm"
            onClick={onRegisterContact}
            title="Registrar Contato"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}