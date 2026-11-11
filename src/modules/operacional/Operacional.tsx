import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRef, useState, type ReactNode } from 'react';
import { useStore } from '@/store/useStore';
import { format, parseISO, differenceInCalendarDays, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Trash2, Plus } from 'lucide-react';

import OperacionalCalendar from './components/OperacionalCalendar';
import { statusConfig } from './statusConfig';
import OperacionalMonthCalendar from './components/OperacionalMonthCalendar';
import { LinhaProducao } from './components/LinhaProducao';
import { FilaPrioridade } from './components/FilaPrioridade';
import { ServicosAcompanhamento } from './components/ServicosAcompanhamento';
import { StatusPills } from './components/StatusPills';
import { FAIXA_PRIORIDADE, ROTULO_PRIORIDADE } from './components/faixaPrioridade';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { Colophon } from '@/components/editorial/Colophon';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/utils/cn';

// ── Redesign D2: peças visuais (só UI; os números chegam prontos) ──

const SECAO = 'border border-[var(--border-strong)] bg-[var(--bg-surface)]';

// As 4 automações reais que criam tarefa no Operacional:
// leadSlice.ts:46-54 (quente), :57-65 (morno), :68-76 (frio), :257-263 (fechado).
const AUTOMACOES = [
  { gatilho: 'Lead quente', acao: 'Criar orçamento' },
  { gatilho: 'Lead morno', acao: 'Entrar em contato' },
  { gatilho: 'Lead frio', acao: 'Reativar lead' },
  { gatilho: 'Negócio fechado', acao: 'Executar serviço' },
];

// Semana real (seg–dom, como o calendário): "09 — 15 nov / 2026"
function rotuloSemana(agora: Date) {
  const ini = startOfWeek(agora, { weekStartsOn: 1 });
  const fim = addDays(ini, 6);
  const dia = (d: Date) => format(d, 'dd');
  const mes = (d: Date) => format(d, 'MMM', { locale: ptBR });
  const ano = (d: Date) => format(d, 'yyyy');
  if (ano(ini) !== ano(fim)) return `${dia(ini)} ${mes(ini)} / ${ano(ini)} — ${dia(fim)} ${mes(fim)} / ${ano(fim)}`;
  if (mes(ini) !== mes(fim)) return `${dia(ini)} ${mes(ini)} — ${dia(fim)} ${mes(fim)} / ${ano(fim)}`;
  return `${dia(ini)} — ${dia(fim)} ${mes(fim)} / ${ano(fim)}`;
}

// Componente separado para a contagem não re-renderizar a tela inteira a cada quadro.
function ServicosContados({ valor }: { valor: number }) {
  const animado = useCountUp(valor);
  return (
    <p
      className="tnum leading-[0.8] text-[56px] md:text-[72px] text-[var(--text-primary)]"
      style={{ fontWeight: 'var(--font-bold)', letterSpacing: '-0.06em' }}
    >
      <span className="sr-only">{valor}</span>
      <span aria-hidden="true">{String(Math.round(animado)).padStart(2, '0')}</span>
    </p>
  );
}

// Quantas atrasadas aparecem antes do "Ver todas (N)".
const LIMITE_ATRASADAS = 5;

export function Operacional() {
  const tasks = useStore((state) => state.operacionalTasks) || [];
  const addTask = useStore((state) => state.addOperacionalTask);
  const handleCreateTask = (date: string) => {
    addTask({
      titulo: 'Nova tarefa',
      data: date,
      prioridade: 'media',
      concluido: false,
    });
  };
  const updateTask = useStore((state: any) => state.updateOperacionalTask);
  const deleteTask = useStore((state: any) => state.deleteOperacionalTask);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editData, setEditData] = useState('');
  const [editPrioridade, setEditPrioridade] = useState<'baixa' | 'media' | 'alta'>('media');
  const [editStatus, setEditStatus] = useState('pendente');
  const [editDescricao, setEditDescricao] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // 🔥 TOGGLE SEMANA / MÊS
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showAllAtrasadas, setShowAllAtrasadas] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState('');
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta'>(
    'media',
  );

  const hoje = format(new Date(), 'yyyy-MM-dd');

  const tarefasHoje = tasks.filter((t) => t.data === hoje);
  const tarefasHojePendentes = tarefasHoje.filter((t) => !t.concluido);
  const tarefasHojeConcluidas = tarefasHoje.filter((t) => t.concluido);
  // Mesmo critério do Dashboard ("N atrasadas") e do sino: aberta e data < hoje.
  // Mais antiga primeiro. data nula não entra (null < 'yyyy-MM-dd' é false).
  const tarefasAtrasadas = tasks
    .filter((t) => !t.concluido && t.data < hoje)
    .sort((a, b) => a.data.localeCompare(b.data));
  const tarefasAtrasadasVisiveis = showAllAtrasadas
    ? tarefasAtrasadas
    : tarefasAtrasadas.slice(0, LIMITE_ATRASADAS);
  const tarefasSemana = tasks.filter((t) => t.data > hoje);

  const confirmEdit = async () => {
    if (!taskToEdit) return;

    const ok = await updateTask(taskToEdit.id, {
      titulo: editTitle,
      data: editData,
      prioridade: editPrioridade,
      status: editStatus,
      descricao: editDescricao,
    });

    if (!ok) return;

    setShowEditModal(false);
    setTaskToEdit(null);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    setLoadingDelete(true);

    const ok = await deleteTask(taskToDelete.id);

    setLoadingDelete(false);

    if (!ok) return;

    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const handleAdd = async () => {
    if (!titulo || !data) return;

    const ok = await addTask({
      titulo,
      data,
      prioridade,
      concluido: false,
    });

    if (!ok) return;

    setTitulo('');
    setData('');
    setPrioridade('media');
    setShowNewTaskForm(false);
  };

  // ── Redesign D2: derivados de exibição (o bloco acima ficou igual) ──

  // Serviço = tarefa "Executar serviço" (tipo execucao, criada ao fechar negócio) ainda aberta.
  const servicos = tasks.filter((t) => t.tipo === 'execucao' && !t.concluido);
  const tarefasAbertas = tasks.filter((t) => !t.concluido).length;
  const [etapaFiltro, setEtapaFiltro] = useState<string | null>(null);
  const servicosRef = useRef<HTMLElement>(null);
  const atrasadasRef = useRef<HTMLElement>(null);
  const hojeRef = useRef<HTMLElement>(null);
  const setActiveModule = useStore((state) => state.setActiveModule);

  // Mesmo corpo do onEdit que antes aparecia duas vezes (Semana e Mês); agora também na Fila.
  const abrirEdicao = (task: any) => {
    setTaskToEdit(task);
    setEditTitle(task.titulo || '');
    setEditData(task.data || '');
    setEditPrioridade(task.prioridade || 'media');
    setEditStatus(task.status || 'pendente');
    setEditDescricao(task.descricao || '');
    setShowEditModal(true);
  };

  const rolarAte = (el: HTMLElement | null) =>
    el?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });

  // Atalhos da abertura e etapa da Linha usam a mesma rolagem ('auto' com reduced-motion).
  // Etapa da Linha de produção: filtra a lista de Serviços e rola até ela; de novo, limpa.
  const escolherEtapa = (etapa: string) => {
    if (etapaFiltro === etapa) {
      setEtapaFiltro(null);
      return;
    }
    setEtapaFiltro(etapa);
    rolarAte(servicosRef.current);
  };

  // Numeração contínua só das seções que aparecem (Atrasadas é condicional).
  // Os children do JSX são avaliados na ordem do código, então a sequência sai certa.
  let secao = 0;
  const proxima = () => String(++secao).padStart(2, '0');

  const linhaAbertura = `${tarefasAbertas} ${tarefasAbertas === 1 ? 'tarefa aberta' : 'tarefas abertas'} · ${tarefasAtrasadas.length} ${tarefasAtrasadas.length === 1 ? 'atrasada' : 'atrasadas'}`;

  const faixa = (task: any) => FAIXA_PRIORIDADE[task.prioridade] ?? FAIXA_PRIORIDADE.media;

  // Toggle Semana | Mês: mesmo viewMode. No celular vai numa linha abaixo do título
  // (ao lado não cabe a 320px); a partir de md, à direita do título.
  const botoesVisao = (
    <>
      <button
        onClick={() => setViewMode('week')}
        aria-pressed={viewMode === 'week'}
        className={cn(
          'ed-mono min-h-[44px] border px-3 transition-colors',
          viewMode === 'week'
            ? 'relative z-10 border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]'
            : 'border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        )}
      >
        Semana
      </button>

      <button
        onClick={() => setViewMode('month')}
        aria-pressed={viewMode === 'month'}
        className={cn(
          'ed-mono -ml-px min-h-[44px] border px-3 transition-colors',
          viewMode === 'month'
            ? 'relative z-10 border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]'
            : 'border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        )}
      >
        Mês
      </button>
    </>
  );

  // Card de tarefa pendente. "Hoje" chama sem info/extra (renderiza como antes);
  // "Atrasadas" passa a linha "há N dias" (info) e o botão "Mover para hoje" (extra).
  const renderTaskCard = (task: any, info?: ReactNode, extra?: ReactNode) => (
    <div
      key={task.id}
      className="relative mb-2 grid grid-cols-[minmax(0,1fr)_auto] border border-[var(--border)] bg-[var(--bg-surface)] py-3 pl-4 pr-1"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px]" style={{ background: faixa(task) }} />
      <div className="min-w-0">
        <div className="font-medium text-[var(--text-primary)]">{task.titulo}</div>
        {info}
        <div className="ed-mono mt-0.5" style={{ color: faixa(task) }}>
          {ROTULO_PRIORIDADE[task.prioridade] ?? task.prioridade}
        </div>
      </div>

      <div className="flex items-start ml-1">
        <button
          onClick={() => updateTask(task.id, { concluido: true })}
          className="text-[var(--text-tertiary)] hover:text-[var(--success)] transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Marcar como concluída"
        >
          <CheckCircle2 size={16} />
        </button>

        <button
          onClick={() => {
            setTaskToDelete(task);
            setShowDeleteModal(true);
          }}
          className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Excluir"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Pills de status de produção: largura toda do card (no celular, 2×2) */}
      <div className="col-span-2 pr-3">
        <StatusPills className="mt-2" status={task.status} onChange={(s) => updateTask(task.id, { status: s })} />
        {extra}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8 max-w-6xl mx-auto">

      {/* ================= 00 ABERTURA ================= */}
      <section className={cn(SECAO, 'relative overflow-hidden')}>
        <span
          aria-hidden="true"
          className="ed-serif ed-ghost pointer-events-none select-none absolute -right-4 -top-12 leading-none text-[160px] md:-top-16 md:text-[220px]"
        >
          OP
        </span>
        <span aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] w-32 bg-[var(--accent)]" />

        <div className="relative flex flex-wrap items-end justify-between gap-5 px-5 pt-5 pb-6 md:px-7 md:pt-6 md:pb-7">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-[var(--accent)]" />
              <p className="ed-mono text-[var(--accent)]">{rotuloSemana(new Date())}</p>
            </div>
            <div className="mt-4 border-l-2 border-[var(--accent)] pl-4">
              <ServicosContados valor={servicos.length} />
              <p className="ed-mono mt-2 text-[var(--text-tertiary)]">serviços em acompanhamento</p>
            </div>
            <p className="ed-mono mt-4 text-[var(--text-secondary)]">{linhaAbertura}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowNewTaskForm(true)}
              className="flex items-center gap-2 px-4 min-h-[44px] bg-[var(--accent)] font-semibold text-[var(--bg-app)] hover:bg-[var(--accent-hover)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Tarefa
            </button>
            {/* Atalhos para quem abre no celular: as seções ficam mais abaixo */}
            <button
              onClick={() => rolarAte(hojeRef.current)}
              className="ed-mono min-h-[44px] border border-[var(--border)] px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Hoje ({tarefasHojePendentes.length})
            </button>
            {tarefasAtrasadas.length > 0 && (
              <button
                onClick={() => rolarAte(atrasadasRef.current)}
                className="ed-mono min-h-[44px] border border-[var(--danger)] px-3 text-[var(--danger)] hover:bg-[var(--danger-subtle)] transition-colors"
              >
                Atrasadas ({tarefasAtrasadas.length})
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ================= NOVA TAREFA ================= */}
      {showNewTaskForm && (
        <div className="space-y-3 border border-[var(--border-accent)] bg-[var(--bg-surface)] p-4 md:p-5">
          <h2 className="ed-mono text-[var(--text-primary)]">Nova Tarefa</h2>

          <input
            type="text"
            placeholder="Título da tarefa"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="border border-[var(--border)] p-2 w-full bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] min-h-[44px]"
          />

          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="border border-[var(--border)] p-2 w-full bg-[var(--bg-surface-2)] text-[var(--text-primary)] min-h-[44px]"
          />

          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as any)}
            className="border border-[var(--border)] p-2 w-full bg-[var(--bg-surface-2)] text-[var(--text-primary)] min-h-[44px]"
          >
            <option value="baixa">Prioridade Baixa</option>
            <option value="media">Prioridade Média</option>
            <option value="alta">Prioridade Alta</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 bg-[var(--accent)] font-semibold text-[var(--bg-app)] py-3 md:py-2 hover:bg-[var(--accent-hover)] min-h-[44px]"
            >
              Adicionar Tarefa
            </button>
            <button
              onClick={() => setShowNewTaskForm(false)}
              className="px-4 min-h-[44px] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-2)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteModal}
        title="Excluir tarefa"
        description="Tem certeza que deseja excluir esta tarefa?"
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={loadingDelete}
      />

      {/* ================= 01 LINHA DE PRODUÇÃO ================= */}
      <LinhaProducao index={proxima()} servicos={servicos} etapa={etapaFiltro} onEtapa={escolherEtapa} />

      {/* ================= 02 AGENDA (SEMANA / MÊS) ================= */}
      <section className={SECAO}>
        <div className="px-5 pt-5 md:px-6">
          <SectionHeading
            index={proxima()}
            label={viewMode === 'week' ? 'Agenda da semana' : 'Agenda do mês'}
            right={<div className="hidden md:flex">{botoesVisao}</div>}
          />
          <div className="mt-3 grid grid-cols-2 md:hidden">{botoesVisao}</div>
        </div>

        {viewMode === 'week' ? (
          <OperacionalCalendar
            onDelete={(task: any) => {
              setTaskToDelete(task);
              setShowDeleteModal(true);
            }}
            onEdit={abrirEdicao}
          />
        ) : (
          <OperacionalMonthCalendar
            onDelete={(task: any) => {
              setTaskToDelete(task);
              setShowDeleteModal(true);
            }}
            onEdit={abrirEdicao}
            onCreate={handleCreateTask} // 🔥 NOVO
          />
        )}
      </section>

      {/* ================= 03 FILA DE PRIORIDADE ================= */}
      <FilaPrioridade index={proxima()} onEdit={abrirEdicao} />

      {/* ================= ATRASADAS ================= */}
      {tarefasAtrasadas.length > 0 && (
        <section ref={atrasadasRef} className="scroll-mt-4">
          <SectionHeading
            index={proxima()}
            label="Atrasadas"
            right={
              <span className="ed-mono border border-[var(--danger)] px-2 text-[var(--danger)]">
                {tarefasAtrasadas.length}
              </span>
            }
          />

          <div className="mt-3">
            {tarefasAtrasadasVisiveis.map((task) => {
              const dias = differenceInCalendarDays(parseISO(hoje), parseISO(task.data));
              return renderTaskCard(
                task,
                <div className="ed-mono mt-0.5 text-[var(--danger)]">
                  Atrasada há {dias} {dias === 1 ? 'dia' : 'dias'}
                </div>,
                <button
                  onClick={() => updateTask(task.id, { data: hoje })}
                  className="mt-2 px-4 min-h-[44px] border border-[var(--accent)] text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
                >
                  Mover para hoje
                </button>,
              );
            })}

            {tarefasAtrasadas.length > LIMITE_ATRASADAS && (
              <button
                onClick={() => setShowAllAtrasadas((v) => !v)}
                className="px-4 min-h-[44px] border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-2)]"
              >
                {showAllAtrasadas ? 'Mostrar menos' : `Ver todas (${tarefasAtrasadas.length})`}
              </button>
            )}
          </div>
        </section>
      )}

      {/* ================= HOJE ================= */}
      <section ref={hojeRef} className="scroll-mt-4">
        <SectionHeading index={proxima()} label="Hoje" />

        <div className="mt-3">
          {tarefasHoje.length === 0 && (
            <p className="text-[var(--text-tertiary)] text-sm">Nenhuma tarefa para hoje</p>
          )}

          {tarefasHojePendentes.map((task) => renderTaskCard(task))}

          {tarefasHojeConcluidas.length > 0 && (
            <div className="mt-4">
              <h3 className="ed-mono mb-2 text-[var(--text-tertiary)]">Concluídas hoje</h3>
              {tarefasHojeConcluidas.map((task) => (
                <div
                  key={task.id}
                  className="relative mb-2 flex items-center justify-between border border-[var(--border)] bg-[var(--bg-surface)] py-3 pl-4 pr-1 opacity-60"
                >
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px]" style={{ background: faixa(task) }} />
                  <div>
                    <div className="font-medium text-[var(--text-tertiary)] line-through italic">
                      {task.titulo}
                    </div>
                    <div className="ed-mono mt-0.5" style={{ color: faixa(task) }}>
                      {ROTULO_PRIORIDADE[task.prioridade] ?? task.prioridade}
                    </div>
                  </div>
                  <button
                    onClick={() => updateTask(task.id, { concluido: false })}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Desfazer conclusão"
                  >
                    ↩
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= PRÓXIMOS DIAS ================= */}
      <section>
        <SectionHeading index={proxima()} label="Próximos Dias" />

        <div className="mt-3">
          {tarefasSemana.length === 0 && (
            <p className="text-[var(--text-tertiary)] text-sm">Nenhuma tarefa agendada</p>
          )}

          {tarefasSemana.map((task) => (
            <div key={task.id} className="relative mb-2 border border-[var(--border)] bg-[var(--bg-surface-2)] py-3 pl-4 pr-3">
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px]" style={{ background: faixa(task) }} />
              <div className="ed-mono text-[var(--text-tertiary)]">
                {format(parseISO(task.data), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <div className="font-medium text-[var(--text-primary)]">{task.titulo}</div>
                <span
                  className="text-xs px-2 py-0.5 font-medium"
                  style={{
                    background: statusConfig[task.status || 'pendente']?.bg,
                    color:      statusConfig[task.status || 'pendente']?.color,
                  }}
                >
                  {statusConfig[task.status || 'pendente']?.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 07 SERVIÇOS EM ACOMPANHAMENTO ================= */}
      <ServicosAcompanhamento
        ref={servicosRef}
        index={proxima()}
        servicos={servicos}
        etapa={etapaFiltro}
        onLimpar={() => setEtapaFiltro(null)}
      />

      {/* ================= AUTOMAÇÕES (sem número: não é bloco de trabalho) ================= */}
      <section>
        {/* O accent da SectionHeading não quebra linha: abaixo de 640px ele vai na linha de baixo */}
        <SectionHeading index="·" label="Automações" accent="tarefas que o VRTX cria sozinho" className="hidden sm:flex" />
        <SectionHeading index="·" label="Automações" className="sm:hidden" />
        <p className="ed-serif mt-1 uppercase text-[length:var(--text-md)] text-[var(--accent)] sm:hidden">
          tarefas que o VRTX cria sozinho
        </p>
        <ul className="mt-3 grid gap-px border border-[var(--border-strong)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
          {AUTOMACOES.map((a, i) => (
            <li key={a.gatilho} className="flex items-baseline gap-3 bg-[var(--bg-surface)] px-5 py-4">
              <span className="ed-mono shrink-0 text-[var(--accent)]">{String(i + 1).padStart(2, '0')}</span>
              <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">{a.gatilho}</span> → {a.acao}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <Colophon label="VRTX CRM · Painel Operacional" onBack={() => setActiveModule('dashboard')} />

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar tarefa"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Título</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full border border-[var(--border)] p-2 rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)] min-h-[44px]"
              placeholder="Título da tarefa"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Data</label>
            <input
              type="date"
              value={editData}
              onChange={(e) => setEditData(e.target.value)}
              className="w-full border border-[var(--border)] p-2 rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)] min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Prioridade</label>
              <select
                value={editPrioridade}
                onChange={(e) => setEditPrioridade(e.target.value as any)}
                className="w-full border border-[var(--border)] p-2 rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)] min-h-[44px]"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full border border-[var(--border)] p-2 rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)] min-h-[44px]"
              >
                <option value="pendente">Pendente</option>
                <option value="em_producao">Em produção</option>
                <option value="pronto">Pronto</option>
                <option value="instalado">Instalado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Descrição (opcional)</label>
            <textarea
              value={editDescricao}
              onChange={(e) => setEditDescricao(e.target.value)}
              rows={3}
              className="w-full border border-[var(--border)] p-2 rounded bg-[var(--bg-surface-2)] text-[var(--text-primary)] min-h-[44px] resize-none"
              placeholder="Detalhes da tarefa..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 min-h-[44px] bg-[var(--bg-surface-3)] text-[var(--text-secondary)] rounded"
            >
              Cancelar
            </button>

            <button
              onClick={confirmEdit}
              className="px-4 py-2 min-h-[44px] bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)]"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
