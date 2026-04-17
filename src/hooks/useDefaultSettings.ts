import { useStore } from '@/store/useStore';

export function useDefaultSettings() {
  const settings = useStore((s) => s.settings);

  return {
    validadePadraoOrcamento: settings?.validadePadraoOrcamento || 15,
    multiplicadorPadrao: settings?.multiplicadorPadrao || 1,
    percentualComissao: settings?.percentualComissao ?? 0,
    observacaoPadraoOrcamento: settings?.observacaoPadraoOrcamento || '',
    observacaoPadraoRecibo: settings?.observacaoPadraoRecibo || '',
    empresaNome: settings?.empresaNome || 'Vértice Digital',
    empresaTelefone: settings?.empresaTelefone || '',
    empresaEmail: settings?.empresaEmail || '',
    empresaEndereco: settings?.empresaEndereco || '',
    empresaCnpj: settings?.empresaCnpj || '',
    empresaLogoUrl: settings?.empresaLogoUrl || '',
    textoApresentacao: settings?.textoApresentacao || '',
    condicoesContrato: settings?.condicoesContrato || '',
    metodosPagamento: settings?.metodosPagamento || 'pix,credito,debito,dinheiro,transferencia',
  };
}
