/**
 * Gera payload PIX no padrão BR Code (EMV) para QR Code estático
 * Referência: Banco Central — Manual de Padrões para Iniciação do Pix
 */

export function pixPayload({ chavePix, nomeRecebedor, cidadeRecebedor, valor, txid }) {
  const normalize = (str) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

  const nome = normalize(nomeRecebedor || 'EMPRESA').slice(0, 25);
  const cidade = normalize(cidadeRecebedor || 'CIDADE').slice(0, 15);
  const identificador = (txid || '***').slice(0, 25);

  const merchantAccountInfo = emvField(
    '26',
    emvField('00', 'br.gov.bcb.pix') + emvField('01', chavePix),
  );

  const transactionAmount = valor ? emvField('54', Number(valor).toFixed(2)) : '';

  let payload =
    emvField('00', '01') +
    merchantAccountInfo +
    emvField('52', '0000') +
    emvField('53', '986') +
    transactionAmount +
    emvField('58', 'BR') +
    emvField('59', nome) +
    emvField('60', cidade) +
    emvField('62', emvField('05', identificador));

  payload += '6304';
  payload += crc16ccitt(payload);

  return payload;
}

function emvField(id, value) {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16ccitt(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
