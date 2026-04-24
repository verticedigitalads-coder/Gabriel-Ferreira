import { criarOrcamentoFromLead } from '@/services/automation/orcamentoAutomation';
import { useCallback } from 'react';
import { useStore } from '@/store/useStore';

export function useLeadActions() {
  const { updateLead, deleteLead, addToast, addOrcamento } = useStore();

  const openWhatsApp = useCallback(
    (telefone: string, nome: string) => {
      const message = encodeURIComponent(`Olá ${nome}, tudo bem?`);
      const cleanPhone = telefone.replace(/\D/g, '');
      const phone = cleanPhone.startsWith('55')
        ? cleanPhone
        : `55${cleanPhone}`;
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      addToast({ type: 'info', message: 'Abrindo WhatsApp...' });
    },
    [addToast],
  );

  const copyPhone = useCallback(
    (telefone: string) => {
      navigator.clipboard.writeText(telefone);
      addToast({ type: 'success', message: 'Telefone copiado!' });
    },
    [addToast],
  );

  const registerContact = useCallback(
    async (leadId: string) => {
      await updateLead(leadId, { ultimoContato: new Date().toISOString() });
      addToast({ type: 'success', message: 'Contato registrado' });
    },
    [updateLead, addToast],
  );

  const handleMarkAsOrcado = useCallback(
    async (lead: any, valor: number) => {
      if (!lead) return;

      // 1️⃣ Atualiza com valor
      await updateLead(lead.id, {
        status: 'orcado',
        valorOrcado: valor,
      });

      // 2️⃣ Cria lead atualizado manualmente
      const leadAtualizado = {
        ...lead,
        valorOrcado: valor,
      };

      const orcamento = criarOrcamentoFromLead(leadAtualizado);

      if (!orcamento) return;

      await addOrcamento({
        ...orcamento,
        lead_id: lead.id, // 🔥 ESSENCIAL
      });

      addToast({
        type: 'success',
        message: 'Orçamento criado automaticamente',
      });
    },
    [updateLead, addOrcamento, addToast],
  );

  return {
    deleteLead,
    openWhatsApp,
    copyPhone,
    handleMarkAsOrcado,
    registerContact,
  };
}
