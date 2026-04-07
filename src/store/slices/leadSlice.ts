import { criarOrcamentoFromLead } from '@/services/automation/orcamentoAutomation';
import { createLead } from '@/services/database/lead.service';
import { supabase } from '@/lib/supabase';
import { formatLead } from '@/store/formatters';
import type { Lead, LeadStatus } from '@/types';

export const createLeadSlice = (_set: any, get: any) => ({
  leads: [],

  // ================= ADD LEAD =================

  addLead: async (data: Partial<Lead>) => {
    const { workspaceId } = get();

    const nomeNormalizado =
      data.nome && data.nome.trim() !== '' ? data.nome : 'Novo Lead';

    const inserted = await createLead(
      {
        ...data,
        nome: nomeNormalizado,
        workspaceId,
      },
      workspaceId,
    );

    if (!inserted) return;

    _set((state: any) => ({
      leads: [formatLead(inserted), ...state.leads],
    }));

    const { addOperacionalTask } = get();

    // 🔥 NORMALIZAÇÃO (evita null da IA)
    const nome = nomeNormalizado;
    const temperatura = inserted.temperatura || 'frio';

    const hoje = new Date().toISOString().split('T')[0];

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
        data: hoje,
        tipo: 'followup',
        prioridade: 'media',
        leadId: inserted.id,
      });
    }

    // 🔥 LEAD FRIO → NUTRIÇÃO
    if (temperatura === 'frio') {
      await addOperacionalTask({
        titulo: `Reativar lead - ${nome}`,
        data: hoje,
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

    const payload: any = {
      updated_at: now,
    };

    if (updates.nome !== undefined) payload.nome = updates.nome;
    if (updates.telefone !== undefined) payload.telefone = updates.telefone;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.endereco !== undefined) payload.endereco = updates.endereco;
    if (updates.servico !== undefined) payload.servico = updates.servico;
    if (updates.resumo !== undefined) payload.resumo = updates.resumo;
    if (updates.observacoes !== undefined)
      payload.observacoes = updates.observacoes;
    if (updates.valorOrcado !== undefined)
      payload.valor_orcado = updates.valorOrcado;
    if (updates.orcamentoEnviado !== undefined)
      payload.orcamento_enviado = updates.orcamentoEnviado;
    if (updates.ultimoContato !== undefined)
      payload.ultimo_contato = updates.ultimoContato || null;
    if (updates.proximoContato !== undefined)
      payload.proximo_contato = updates.proximoContato || null;

    const { error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar lead:', error);
      return;
    }
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
      .eq('id', leadId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      return;
    }
  },

  // ================= DELETE LEAD =================

  deleteLead: async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) {
      console.error('Erro ao deletar lead:', error);
      return;
    }
  },
  // ================= MARCAR ORÇADO =================

  handleMarkAsOrcado: async (id: string, valor: number) => {
    const now = new Date().toISOString();

    // 🔥 1. Atualiza o lead
    const payload: any = {
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
      .select()
      .single();

    if (error || !updatedLead) {
      console.error('Erro ao marcar como orçado:', error);
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
    const orcamentoGerado = criarOrcamentoFromLead(leadReal);

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
      .select()
      .single();

    if (error) {
      console.error('Erro ao marcar como fechado:', error);
      return;
    }

    const { addOperacionalTask } = get();

    await addOperacionalTask({
      titulo: `Executar serviço - ${updatedLead.nome}`,
      data: new Date().toISOString().split('T')[0],
      tipo: 'execucao',
      prioridade: 'media',
      leadId: updatedLead.id,
    });
  },
});
