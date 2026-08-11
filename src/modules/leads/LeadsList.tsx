import { formatCurrency, formatPhone } from '@/utils/formatters';
import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore'
import { useFilteredLeads } from '@/store/selectors/leadSelectors'
import { useDebounce } from '@/hooks/useDebounce';
import { useLeadActions } from '@/hooks/useLeadActions';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal, SlidePanel } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
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
import { HISTORICO_TIPO } from '@/types';
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
    <div className="flex flex-col md:h-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {filteredLeads.length} de {leads.length} leads
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              onClick={() => setShowAIModal(true)}
              className="gap-1.5"
              style={{ color: 'var(--ia)' }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Criar com IA</span>
              <span className="sm:hidden">IA</span>
            </Button>
            <Button onClick={() => setShowAddModal(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Lead</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          {/* Linha 1: busca + status + limpar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Buscar nome, telefone ou serviço..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[40px] overflow-hidden text-ellipsis"
              />
            </div>

            <div className="shrink-0 w-[140px] sm:w-[160px]">
              <Select
                value={filters.status}
                onChange={e => setFilter({ status: e.target.value as any })}
                options={[
                  { value: 'all', label: 'Status' },
                  { value: 'novo', label: 'Novo' },
                  { value: 'atendimento', label: 'Atendimento' },
                  { value: 'orcado', label: 'Orçado' },
                  { value: 'fechado', label: 'Fechado' },
                  { value: 'perdido', label: 'Perdido' },
                ]}
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} title="Limpar filtros" className="shrink-0">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Linha 2: temperatura + prioridade como chips com scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {([
              { value: 'all',    label: 'Temperatura', emoji: '' },
              { value: 'quente', label: 'Quente',      emoji: '🔥' },
              { value: 'morno',  label: 'Morno',       emoji: '☀️' },
              { value: 'frio',   label: 'Frio',        emoji: '❄️' },
            ] as const).map(opt => {
              const isActive = filters.temperatura === opt.value;
              return (
                <button
                  key={`temp-${opt.value}`}
                  type="button"
                  onClick={() => setFilter({ temperatura: opt.value })}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors min-h-[32px] whitespace-nowrap"
                  style={{
                    background: isActive && opt.value !== 'all'
                      ? (opt.value === 'quente' ? 'var(--danger-subtle)' : opt.value === 'morno' ? 'var(--warning-subtle)' : 'var(--info-subtle)')
                      : isActive ? 'var(--accent-subtle)' : 'transparent',
                    color: isActive && opt.value !== 'all'
                      ? (opt.value === 'quente' ? 'var(--danger)' : opt.value === 'morno' ? 'var(--warning)' : 'var(--info)')
                      : isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                    borderColor: isActive ? 'transparent' : 'var(--border)',
                  }}
                >
                  {opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label}
                </button>
              );
            })}

            <div className="w-px shrink-0 self-stretch" style={{ background: 'var(--border)' }} />

            {([
              { value: 'all',     label: 'Prioridade'  },
              { value: 'critico', label: '🔴 Crítico'  },
              { value: 'alto',    label: '🟠 Alto'     },
              { value: 'medio',   label: '🟡 Médio'    },
              { value: 'baixo',   label: '🟢 Baixo'    },
            ] as const).map(opt => {
              const isActive = filters.prioridadeLevel === opt.value;
              return (
                <button
                  key={`prio-${opt.value}`}
                  type="button"
                  onClick={() => setFilter({ prioridadeLevel: opt.value })}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors min-h-[32px] whitespace-nowrap"
                  style={{
                    background: isActive && opt.value !== 'all' ? 'var(--accent-subtle)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="p-4 md:p-6 md:flex-1 md:overflow-y-auto">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            {hasActiveFilters ? (
              <>
                <div className="text-3xl mb-3 opacity-30">🔍</div>
                <p className="text-sm text-[var(--text-tertiary)] mb-1">
                  Nenhum lead encontrado com esses filtros
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3 gap-1">
                  <X className="w-4 h-4" />
                  Limpar filtros
                </Button>
              </>
            ) : (
              <>
                <div className="text-3xl mb-3 opacity-30">👥</div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Nenhum lead cadastrado
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mb-4">
                  Adicione seu primeiro lead para começar
                </p>
                <Button onClick={() => setShowAddModal(true)} className="gap-1">
                  <Plus className="w-4 h-4" />
                  Novo Lead
                </Button>
              </>
            )}
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
    (h) => h.tipo === HISTORICO_TIPO.IA_ANALYSIS
  );


  const alertaContato =
    diasSemContato !== null && diasSemContato >= 5;

  return (
    <Card
      className="p-4 transition overflow-hidden"
      style={{
        borderTopWidth: '3px',
        borderTopStyle: 'solid',
        borderTopColor:
          lead.prioridadeLevel === 'critico' ? 'var(--danger)' :
          lead.prioridadeLevel === 'alto'    ? 'var(--warning)' :
          lead.prioridadeLevel === 'medio'   ? 'var(--info)' :
          'var(--bg-surface-3)',
        ...(isSelected ? {
          outline: '2px solid var(--accent)',
          outlineOffset: '0px',
          borderRightColor: 'var(--accent)',
          borderBottomColor: 'var(--accent)',
          borderLeftColor: 'var(--accent)',
          boxShadow: '0 0 0 3px var(--accent-subtle)',
        } : {}),
        ...(alertaContato ? {
          borderRightColor: 'rgba(239, 68, 68, 0.3)',
          borderBottomColor: 'rgba(239, 68, 68, 0.3)',
          borderLeftColor: 'rgba(239, 68, 68, 0.3)',
          background: 'var(--danger-subtle)',
        } : {}),
      }}
      hoverable
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 overflow-hidden">
            <h3 className="text-base font-semibold text-[var(--text-primary)] truncate flex-1 min-w-0">
              {lead.nome}
            </h3>

            {jaAnalisado && (
              <span
                className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: 'var(--ia-subtle)', color: 'var(--ia)' }}
              >
                ✦ IA
              </span>
            )}

            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[99px] shrink-0"
              style={{
                background: lead.prioridadeLevel === 'critico' ? 'var(--danger-subtle)' :
                            lead.prioridadeLevel === 'alto'    ? 'var(--warning-subtle)' :
                            lead.prioridadeLevel === 'medio'   ? 'var(--info-subtle)' :
                            'var(--bg-surface-3)',
                color: lead.prioridadeLevel === 'critico' ? 'var(--danger)' :
                       lead.prioridadeLevel === 'alto'    ? 'var(--warning)' :
                       lead.prioridadeLevel === 'medio'   ? 'var(--info)' :
                       'var(--text-secondary)',
                border: `1px solid ${
                  lead.prioridadeLevel === 'critico' ? 'rgba(248,113,113,0.2)' :
                  lead.prioridadeLevel === 'alto'    ? 'rgba(245,158,11,0.2)' :
                  lead.prioridadeLevel === 'medio'   ? 'rgba(96,165,250,0.2)' :
                  'var(--border)'
                }`,
              }}
            >
              {lead.prioridadeLevel === 'critico' ? 'Crítico' :
               lead.prioridadeLevel === 'alto'    ? 'Alto' :
               lead.prioridadeLevel === 'medio'   ? 'Médio' : 'Baixo'}
            </span>
          </div>

          <p className="text-xs text-[var(--text-disabled)] truncate">
            {lead.servico}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={lead.status} />

            {lead.temperatura && (
              <span
                className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background:
                    lead.temperatura === 'quente' ? 'var(--danger-subtle)'  :
                    lead.temperatura === 'morno'  ? 'var(--warning-subtle)' :
                    'var(--info-subtle)',
                  color:
                    lead.temperatura === 'quente' ? 'var(--danger)'  :
                    lead.temperatura === 'morno'  ? 'var(--warning)' :
                    'var(--info)',
                }}
              >
                {lead.temperatura === 'quente' ? '🔥 Quente' :
                 lead.temperatura === 'morno'  ? '☀️ Morno' : '❄️ Frio'}
              </span>
            )}

            {alertaContato && (
              <span className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
                {diasSemContato}d sem contato
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="text-right max-w-[110px]">
            {(lead.valorOrcado ?? 0) > 0
              ? <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">{formatCurrency(lead.valorOrcado ?? 0)}</p>
              : <p className="text-sm text-[var(--text-tertiary)]">Sem valor</p>
            }
            <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
              {formatPhone(lead.telefone)}
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
              variant="secondary"
              size="sm"
              onClick={onRegisterContact}
              title="Registrar Contato"
            >
              <Phone size={16} style={{ color: 'var(--success)' }} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}