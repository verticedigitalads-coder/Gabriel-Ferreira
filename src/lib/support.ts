// TODO(Gabriel): PREENCHER com o número real de suporte, só dígitos (DDI+DDD+número).
// Ex: '5534999999999'. Sem isso o botão "Falar com suporte" abre um número inválido.
export const SUPPORT_WHATSAPP_NUMBER = 5534998049083;

export function buildSupportWhatsappUrl(lastMessage?: string): string {
  const saudacao = 'Olá! Preciso de ajuda com o CRM VRTX.';
  const texto = lastMessage
    ? `${saudacao}\n\nMinha dúvida: ${lastMessage}`
    : saudacao;
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}
