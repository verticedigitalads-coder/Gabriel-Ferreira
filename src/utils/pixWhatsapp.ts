import { apiFetch } from '@/lib/apiFetch';

interface PixWhatsappParams {
  telefoneCliente: string;
  nomeCliente: string;
  empresaNome: string;
  codigoDocumento: string;
  tipoDocumento: 'orçamento' | 'recibo';
  valorTotal: number;
  chavePix: string;
  nomeRecebedorPix: string;
  cidadePix: string;
}

export async function enviarPixWhatsapp({
  telefoneCliente,
  nomeCliente,
  empresaNome,
  codigoDocumento,
  tipoDocumento,
  valorTotal,
  chavePix,
  nomeRecebedorPix,
  cidadePix,
}: PixWhatsappParams) {
  let pixCopiaECola = '';
  try {
    const resp = await apiFetch('/api/pix-payload', {
      method: 'POST',
      body: JSON.stringify({
        chavePix,
        nomeRecebedor: nomeRecebedorPix || empresaNome,
        cidadeRecebedor: cidadePix || 'Uberaba',
        valor: valorTotal,
        txid: codigoDocumento,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      pixCopiaECola = data.payload || '';
    }
  } catch (e) {
    console.error('[PIX WhatsApp] Erro ao gerar payload:', e);
  }

  const valorFormatado = valorTotal.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const linhas = [
    `Olá ${nomeCliente}! 👋`,
    ``,
    `Segue os dados para pagamento do ${tipoDocumento} *${codigoDocumento}*:`,
    ``,
    `💰 *Valor: ${valorFormatado}*`,
    ``,
  ];

  if (pixCopiaECola) {
    linhas.push(`📱 *PIX Copia e Cola:*`, pixCopiaECola, ``);
  }

  linhas.push(`Chave PIX: ${chavePix}`, ``, `Qualquer dúvida, estamos à disposição!`, `— ${empresaNome}`);

  const mensagem = linhas.join('\n');

  const tel = telefoneCliente.replace(/\D/g, '');
  const telComPais = tel.startsWith('55') ? tel : `55${tel}`;

  const url = `https://wa.me/${telComPais}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}
