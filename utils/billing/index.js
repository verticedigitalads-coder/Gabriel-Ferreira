// Camada de cobrança (plano em _build/plano-assinatura.md). O server.js só fala
// com esta camada; o adaptador de cada gateway fica no seu arquivo.
import * as asaas from './asaas.js';

export const GATEWAYS = { asaas };

// Gateway das assinaturas NOVAS. O webhook é roteado pelo :gateway da URL, então
// assinaturas antigas continuam no gateway delas se um dia isto mudar.
export function gatewayAtual() {
  return GATEWAYS[process.env.BILLING_GATEWAY || 'asaas'];
}

// Espelha PRICING.basico.precoMensal (src/modules/auth/landing/landingContent.ts):
// mudou lá, muda aqui.
export const VALOR_MENSAL = 147;

export const soDigitos = (v) => String(v ?? '').replace(/\D/g, '');

// CPF (11) ou CNPJ (14) com dígito verificador. Não grava nem loga o número.
export function validarCpfCnpj(valor) {
  const d = soDigitos(valor);
  if (!(d.length === 11 || d.length === 14) || /^(\d)\1+$/.test(d)) return false;
  const dv = (base, pesos) => {
    const soma = pesos.reduce((s, p, i) => s + Number(base[i]) * p, 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  if (d.length === 11) {
    const p1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    const p2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    return dv(d, p1) === Number(d[9]) && dv(d, p2) === Number(d[10]);
  }
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const p2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  return dv(d, p1) === Number(d[12]) && dv(d, p2) === Number(d[13]);
}

// Celular brasileiro: DDD (sem zero) + 9 + 8 dígitos. Repassado ao gateway, não gravado.
export function validarCelular(valor) {
  return /^[1-9]{2}9\d{8}$/.test(soDigitos(valor));
}

// Offset de America/Sao_Paulo num instante (ex.: "-03:00"), sem fixar o número.
function offsetSaoPaulo(instante) {
  const nome = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    timeZoneName: 'longOffset',
  })
    .formatToParts(instante)
    .find((p) => p.type === 'timeZoneName').value; // "GMT-03:00" ou "GMT"
  return nome === 'GMT' ? '+00:00' : nome.replace('GMT', '');
}

// Hoje em America/Sao_Paulo, yyyy-MM-dd (vencimento da 1ª cobrança).
export function hojeSaoPaulo(agora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(agora);
}

// "Pago até": vencimento original da última cobrança paga + 1 mês (31/01 → 28/02),
// às 23:59:59.999 em America/Sao_Paulo. Sem data válida → null (quem chama não mexe
// no periodo_fim).
export function periodoFimDe(vencimento) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(vencimento || '');
  if (!m) return null;
  let ano = Number(m[1]);
  let mes = Number(m[2]) + 1;
  let dia = Number(m[3]);
  if (mes > 12) {
    mes = 1;
    ano += 1;
  }
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  if (dia > ultimoDia) dia = ultimoDia;
  const data = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  const offset = offsetSaoPaulo(new Date(`${data}T12:00:00Z`));
  return new Date(`${data}T23:59:59.999${offset}`).toISOString();
}
