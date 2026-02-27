import { useCallback } from 'react';
import { useStore } from '@/store/useStore';

export function useLeadActions() {
  const {
    registerContact,
    markAsOrcado,
    markAsFechado,
    updateLeadStatus,
    deleteLead,
    addToast,
  } = useStore();

  const openWhatsApp = useCallback((telefone: string, nome: string) => {
    const message = encodeURIComponent(`Olá ${nome}, tudo bem?`);
    const cleanPhone = telefone.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    addToast({ type: 'info', message: 'Abrindo WhatsApp...' });
  }, [addToast]);

  const copyPhone = useCallback((telefone: string) => {
    navigator.clipboard.writeText(telefone);
    addToast({ type: 'success', message: 'Telefone copiado!' });
  }, [addToast]);

  return {
    registerContact,
    markAsOrcado,
    markAsFechado,
    updateLeadStatus,
    deleteLead,
    openWhatsApp,
    copyPhone,
  };
}
