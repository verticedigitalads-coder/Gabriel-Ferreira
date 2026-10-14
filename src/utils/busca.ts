const semAcento = (texto: string) =>
  texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function clienteCorrespondeBusca(
  busca: string,
  cliente: { nome?: string | null; telefone?: string | null; endereco?: string | null },
): boolean {
  const termo = semAcento(busca.trim());
  if (!termo) return true;

  if (semAcento(cliente.nome ?? '').includes(termo)) return true;
  if (semAcento(cliente.endereco ?? '').includes(termo)) return true;

  // Telefone só entra quando o termo não tem letra: "rua 12" não deve casar com telefone
  const digitos = termo.replace(/\D/g, '');
  const soNumero = digitos.length > 0 && !/[a-z]/.test(termo);
  return soNumero && (cliente.telefone ?? '').replace(/\D/g, '').includes(digitos);
}
