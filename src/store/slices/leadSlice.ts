import { criarOrcamentoFromLead } from '@/services/automation/orcamentoAutomation';
import { createLead } from '@/services/database/lead.service';
import { supabase } from '@/lib/supabase';
import { formatLead } from '@/store/formatters';
import type { Lead, LeadStatus, OperacionalTask } from '@/types';
import { format } from 'date-fns';

// TODO: tipar com StateCreator<StoreState> quando exportar StoreState (dependência circular)
export const createLeadSlice = (_set: any, get: any) => ({
  leads: [],

  // ================= ADD LEAD =================

  addLead: async (data: Partial<Lead>) => {
    const { workspaceId } = get();

    // Sem espaço sobrando nas pontas: o nome vai para o título da tarefa e para
    // as mensagens ("Olá Fulano, tudo bem?")
    const nomeNormalizado = data.nome?.trim() || 'Novo Lead';

    const inserted = await createLead(
      {
        ...data,
        nome: nomeNormalizado,
        workspaceId,
      },
      workspaceId,
    );

    if (!inserted) return;

    const leadFormatado = formatLead(inserted);

    _set((state: any) => ({
      leads: [leadFormatado, ...state.leads],
    }));

    const { addOperacionalTask } = get();

    // 🔥 NORMALIZAÇÃO (evita null da IA)
    const nome = nomeNormalizado;
    const temperatura = inserted.temperatura || 'frio';

    const hoje = format(new Date(), 'yyyy-MM-dd');
    // Tarefas de contato (morno e frio) vão para o próximo contato do lead;
    // sem próximo contato, hoje. Mesmo "yyyy-MM-dd" de hoje (toDateInput).
    const dataContato = leadFormatado.proximoContato || hoje;

    // ================= AUTOMAÇÃO =================

    // 🔥 LEAD QUENTE → CRIAR TAREFA DE ORÇAMENTO
    if (temperatura === 'quente') {
      await addOperacionalTask({
        titulo: `Criar orçamento - ${nome}`,
        data: hoje,
        tipo: 'orcamento',
        prioridade: 'alta',
        leadId: inserted.id,
      });
    }

    // 🔥 LEAD MORNO → FOLLOW-UP
    if (temperatura === 'morno') {
      await addOperacionalTask({
        titulo: `Entrar em contato - ${nome}`,
        data: dataContato,
        tipo: 'followup',
        prioridade: 'media',
        leadId: inserted.id,
      });
    }

    // 🔥 LEAD FRIO → NUTRIÇÃO
    if (temperatura === 'frio') {
      await addOperacionalTask({
        titulo: `Reativar lead - ${nome}`,
        data: dataContato,
        tipo: 'followup',
        prioridade: 'baixa',
        leadId: inserted.id,
      });
    }

    return inserted;
  },

  // ================= UPDATE LEAD =================

  updateLead: async (id: string, updates: Partial<Lead>) => {
    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      updated_at: now,
    };

    // Textos sem espaço sobrando nas pontas (o meio não muda)
    if (updates.nome !== undefined) payload.nome = updates.nome?.trim() ?? updates.nome;
    if (updates.telefone !== undefined)
      payload.telefone = updates.telefone?.trim() ?? updates.telefone;
    if (updates.email !== undefined) payload.email = updates.email?.trim() ?? updates.email;
    if (updates.endereco !== undefined)
      payload.endereco = updates.endereco?.trim() ?? updates.endereco;
    if (updates.servico !== undefined)
      payload.servico = updates.servico?.trim() ?? updates.servico;
    if (updates.resumo !== undefined) payload.resumo = updates.resumo?.trim() ?? updates.resumo;
    if (updates.observacoes !== undefined)
      payload.observacoes = updates.observacoes?.trim() ?? updates.observacoes;
    if (updates.valorOrcado !== undefined)
      payload.valor_orcado = updates.valorOrcado;
    if (updates.orcamentoEnviado !== undefined)
      payload.orcamento_enviado = updates.orcamentoEnviado;
    if (updates.ultimoContato !== undefined)
      payload.ultimo_contato = updates.ultimoContato || null;
    if (updates.proximoContato !== undefined)
      payload.proximo_contato = updates.proximoContato || null;
    if (updates.historico !== undefined) payload.historico = updates.historico;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.temperatura !== undefined)
      payload.temperatura = updates.temperatura;

    const { error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', id)
      .eq('workspace_id', get().workspaceId)
      .select()
      .single();

    if (error) {
      console.error('[LeadSlice] Erro ao atualizar lead:', error);
      get().addToast({ type: 'error', message: 'Erro ao atualizar lead' });
      return false;
    }

    return true;
  },

  // ================= UPDATE STATUS =================

  updateLeadStatus: async (leadId: string, status: LeadStatus) => {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('leads')
      .update({
        status,
        updated_at: now,
      })
      .eq('id', leadId)
      .eq('workspace_id', get().workspaceId);

    if (error) {
      console.error('[LeadSlice] Erro ao atualizar status:', error);
      get().addToast({ type: 'error', message: 'Erro ao atualizar status' });
      return false;
    }

    return true;
  },

  // ================= DELETE LEAD =================

  deleteLead: async (id: string) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('workspace_id', get().workspaceId);

    if (error) {
      console.error('[LeadSlice] Erro ao deletar lead:', error);
      get().addToast({ type: 'error', message: 'Erro ao deletar lead' });
      return false;
    }

    return true;
  },
  // ================= MARCAR ORÇADO =================

  handleMarkAsOrcado: async (id: string, valor: number) => {
    const now = new Date().toISOString();

    // 🔥 1. Atualiza o lead
    const payload: Record<string, unknown> = {
      status: 'orcado',
      orcamento_enviado: true,
      data_orcamento: now,
      updated_at: now,
    };

    if (valor !== undefined) payload.valor_orcado = valor;

    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', id)
      .eq('workspace_id', get().workspaceId)
      .select()
      .single();

    if (error || !updatedLead) {
      console.error('[LeadSlice] Erro ao marcar como orçado:', error);
      get().addToast({ type: 'error', message: 'Erro ao marcar como orçado' });
      return;
    }

    const { addOrcamento } = get();

    // 🔥 2. Usa o LEAD REAL (não fake)
    const leadReal = {
      ...updatedLead,
      workspaceId: updatedLead.workspace_id,
      nome: updatedLead.nome?.trim() || 'Novo Lead',
      valorOrcado: valor,
    };

    // 🔥 3. Gera orçamento automático correto
    const orcamentoGerado = criarOrcamentoFromLead(leadReal, get().settings);

    if (!orcamentoGerado) {
      console.warn('⚠️ Falha ao gerar orçamento automático');
      return;
    }

    // 🔥 4. SALVA o orçamento completo (não manual)
    await addOrcamento(orcamentoGerado);
  },

  // ================= MARCAR FECHADO =================

  markAsFechado: async (id: string) => {
    const now = new Date().toISOString();

    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update({
        status: 'fechado',
        updated_at: now,
      })
      .eq('id', id)
      .eq('workspace_id', get().workspaceId)
      .select()
      .single();

    if (error) {
      console.error('[LeadSlice] Erro ao marcar como fechado:', error);
      get().addToast({ type: 'error', message: 'Erro ao marcar como fechado' });
      return;
    }

    const { addOperacionalTask, operacionalTasks, addToast } = get();

    // 🔥 Ir e voltar de Fechado não duplica: só cria se não houver execução aberta
    const execucaoAberta = operacionalTasks.some(
      (t: OperacionalTask) =>
        t.leadId === id && t.tipo === 'execucao' && !t.concluido,
    );

    if (execucaoAberta) {
      addToast({
        type: 'info',
        message: 'Negócio fechado! Já existe tarefa de execução aberta.',
      });
      return;
    }

    const task = await addOperacionalTask({
      titulo: `Executar serviço - ${updatedLead.nome}`,
      data: format(new Date(), 'yyyy-MM-dd'),
      tipo: 'execucao',
      prioridade: 'media',
      leadId: updatedLead.id,
    });

    if (task) {
      addToast({
        type: 'success',
        message: 'Negócio fechado! Tarefa de execução criada.',
      });
    }
  },
});
