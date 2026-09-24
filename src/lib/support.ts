// WhatsApp de SUPORTE (cliente existente), consumido por buildSupportWhatsappUrl()
// no HelpPanel. Separado do WhatsApp COMERCIAL em
// src/modules/auth/landing/landingContent.ts — hoje os dois apontam para o mesmo
// numero, mas trocar um nao deve mexer no outro.
export const SUPPORT_WHATSAPP_NUMBER = 5534998049083;

export function buildSupportWhatsappUrl(lastMessage?: string): string {
  const saudacao = 'Olá! Preciso de ajuda com o CRM VRTX.';
  const texto = lastMessage
    ? `${saudacao}\n\nMinha dúvida: ${lastMessage}`
    : saudacao;
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}
