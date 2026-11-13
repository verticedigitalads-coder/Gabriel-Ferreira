import { formatCurrency, formatPhone } from '@/utils/formatters';
import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore'
import { useFilteredLeads } from '@/store/selectors/leadSelectors'
import { useDebounce } from '@/hooks/useDebounce';
import { useLeadActions } from '@/hooks/useLeadActions';
import { useCountUp } from '@/hooks/useCountUp';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Modal, SlidePanel } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/editorial/EmptyState';
import { Colophon } from '@/components/editorial/Colophon';
import { LeadForm } from './LeadForm';
import { LeadDetail } from './LeadDetail';
import {
  FAIXA_PRIORIDADE_LEAD,
  ROTULO_PRIORIDADE_LEAD,
  TEMPERATURA_LEAD,
  nivelPrioridade,
} from './visualLead';
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
import type { Lead, LeadTemperature } from '@/types';
import { cn } from '@/utils/cn';

// Redesign D3: número grande com contagem. Componente próprio para a contagem
// não re-renderizar a lista inteira a cada quadro (padrão da D2).
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

const CHIP = 'ed-mono shrink-0 flex items-center gap-1.5 border px-3 min-h-[44px] whitespace-nowrap transition-colors';

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

  // ── Redesign D3: só pele. A lógica acima é a mesma de antes. ──
  const setActiveModule = useStore(state => state.setActiveModule);

  return (
    <div className="flex flex-col md:h-full">
      {/* Topo compacto: total com contagem, botões e filtros */}
      <section className="relative border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 pt-4 pb-4 md:px-6 md:pt-5">
        <span aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] w-32 bg-[var(--accent)]" />

        <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
          <div className="min-w-0 border-l-2 border-[var(--accent)] pl-3">
            <TotalContado valor={leads.length} />
            <p className="ed-mono mt-2 text-[var(--text-tertiary)]">
              {filteredLeads.length} de {leads.length} leads
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              onClick={() => setShowAIModal(true)}
              className="gap-1.5 rounded-none"
              style={{ color: 'var(--ia)' }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Criar com IA</span>
              <span className="sm:hidden">IA</span>
            </Button>
            <Button onClick={() => setShowAddModal(true)} className="gap-1.5 rounded-none text-[var(--bg-app)]">
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
                className="w-full pl-9 pr-3 py-2 border border-[var(--border-strong)] bg-[var(--bg-app)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:border-[var(--accent)] min-h-[44px] overflow-hidden text-ellipsis"
              />
            </div>

            <div className="shrink-0 w-[140px] sm:w-[160px]">
              <Select
                value={filters.status}
                onChange={e => setFilter({ status: e.target.value as any })}
                className="rounded-none min-h-[44px] bg-[var(--bg-app)]"
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
              <Button variant="ghost" size="sm" onClick={clearFilters} title="Limpar filtros" className="shrink-0 min-w-[44px] rounded-none">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Linha 2: temperatura + prioridade como chips com scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {([
              { value: 'all',    label: 'Temperatura' },
              { value: 'quente', label: 'Quente' },
              { value: 'morno',  label: 'Morno' },
              { value: 'frio',   label: 'Frio' },
            ] as const).map(opt => {
              const isActive = filters.temperatura === opt.value;
              const temp = opt.value !== 'all' ? TEMPERATURA_LEAD[opt.value] : null;
              return (
                <button
                  key={`temp-${opt.value}`}
                  type="button"
                  onClick={() => setFilter({ temperatura: opt.value })}
                  className={CHIP}
                  style={{
                    color: isActive ? (temp ? temp.cor : 'var(--accent)') : 'var(--text-tertiary)',
                    borderColor: isActive ? (temp ? temp.cor : 'var(--accent)') : 'var(--border)',
                    background: isActive && !temp ? 'var(--accent-subtle)' : 'transparent',
                  }}
                >
                  {temp && <temp.Icone aria-hidden="true" className="w-3.5 h-3.5" style={{ color: temp.cor }} />}
                  {opt.label}
                </button>
              );
            })}

            <div className="w-px shrink-0 self-stretch" style={{ background: 'var(--border)' }} />

            {([
              { value: 'all',     label: 'Prioridade' },
              { value: 'critico', label: 'Crítico' },
              { value: 'alto',    label: 'Alto' },
              { value: 'medio',   label: 'Médio' },
              { value: 'baixo',   label: 'Baixo' },
            ] as const).map(opt => {
              const isActive = filters.prioridadeLevel === opt.value;
              return (
                <button
                  key={`prio-${opt.value}`}
                  type="button"
                  onClick={() => setFilter({ prioridadeLevel: opt.value })}
                  className={CHIP}
                  style={{
                    background: isActive && opt.value !== 'all' ? 'var(--accent-subtle)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  {opt.value !== 'all' && (
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0" style={{ background: ROTULO_PRIORIDADE_LEAD[opt.value].cor }} />
                  )}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* List */}
      <div className="pt-4 md:pt-5 md:flex-1 md:overflow-y-auto">
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center gap-4">
            {hasActiveFilters ? (
              <>
                <div className="w-full">
                  <EmptyState title="Nenhum lead encontrado com esses filtros" note="Ajuste a busca ou os filtros" />
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 rounded-none">
                  <X className="w-4 h-4" />
                  Limpar filtros
                </Button>
              </>
            ) : (
              <>
                <div className="w-full">
                  <EmptyState title="Nenhum lead cadastrado" note="Adicione seu primeiro lead para começar" />
                </div>
                <Button onClick={() => setShowAddModal(true)} className="gap-1 rounded-none text-[var(--bg-app)]">
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

        <div className="mt-6">
          <Colophon label="VRTX CRM · Gestão de Leads" onBack={() => setActiveModule('dashboard')} />
        </div>
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

  // Só visual: o nível já vem calculado (formatLead → src/lib/priority.ts).
  // Temperatura fora das 3 conhecidas cai em Frio, como o texto de antes.
  const nivel = nivelPrioridade(lead.prioridadeLevel);
  const temperatura = lead.temperatura
    ? (TEMPERATURA_LEAD[lead.temperatura as LeadTemperature] ?? TEMPERATURA_LEAD.frio)
    : null;

  return (
    <div
      className={cn(
        'relative overflow-hidden border px-4 pt-4 pb-3 cursor-pointer transition-colors',
        alertaContato ? 'bg-[var(--danger-subtle)]' : 'bg-[var(--bg-surface)]',
        isSelected
          ? 'border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-subtle)]'
          : alertaContato
            ? 'border-[var(--danger-subtle)] hover:border-[var(--border-strong)]'
            : 'border-[var(--border)] hover:border-[var(--border-strong)]',
      )}
      onClick={onClick}
    >
      {/* Faixa da prioridade: crítico, alto, médio, baixo */}
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px]" style={{ background: FAIXA_PRIORIDADE_LEAD[nivel] }} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <h3 className="text-[length:var(--text-lg)]! font-bold! tracking-tight text-[var(--text-primary)] truncate flex-1 min-w-0">
              {lead.nome}
            </h3>

            {jaAnalisado && (
              <span
                className="ed-mono shrink-0 px-1.5 py-0.5"
                style={{ background: 'var(--ia-subtle)', color: 'var(--ia)' }}
              >
                ✦ IA
              </span>
            )}

            <span className="ed-mono shrink-0" style={{ color: ROTULO_PRIORIDADE_LEAD[nivel].cor }}>
              {ROTULO_PRIORIDADE_LEAD[nivel].texto}
            </span>
          </div>

          <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
            {lead.servico}
          </p>

          <div className="flex items-center flex-wrap gap-2 mt-2.5">
            <StatusBadge status={lead.status} />

            {temperatura && (
              <span className="ed-mono shrink-0 flex items-center gap-1.5 border border-[var(--border)] px-2 py-0.5 text-[var(--text-secondary)]">
                <temperatura.Icone aria-hidden="true" className="w-3 h-3" style={{ color: temperatura.cor }} />
                {temperatura.rotulo}
              </span>
            )}

            {alertaContato && (
              <span className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
                {diasSemContato}d sem contato
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="min-w-0 sm:text-right">
            {(lead.valorOrcado ?? 0) > 0
              ? <p className="tnum text-base font-bold text-[var(--text-primary)]">{formatCurrency(lead.valorOrcado ?? 0)}</p>
              : <p className="ed-serif text-[length:var(--text-md)] text-[var(--text-tertiary)]">Sem valor</p>
            }
            <p className="ed-mono mt-0.5 truncate text-[var(--text-tertiary)]">
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
              className="min-w-[44px] rounded-none border-[var(--border)]"
            >
              <MessageCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={onRegisterContact}
              title="Registrar Contato"
              className="min-w-[44px] rounded-none"
            >
              <Phone size={16} style={{ color: 'var(--success)' }} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
