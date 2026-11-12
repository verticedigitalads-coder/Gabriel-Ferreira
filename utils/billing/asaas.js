// Adaptador do Asaas. Fluxo escolhido na R2 (Etapa A no sandbox, 11/11/2026):
// assinatura CREDIT_CARD criada SEM dados do cartão; o cliente paga a 1ª cobrança na
// fatura do Asaas (invoiceUrl), o cartão fica gravado na assinatura e as próximas são
// debitadas sozinhas (confirmado pelo suporte do Asaas em 11/11/2026). O `callback`
// da assinatura passa para todas as cobranças geradas (a fatura volta sozinha ao app).
// fetch nativo; sem retry automático em POST (risco de cobrança duplicada).

const TIMEOUT_CRIACAO = 60000;
const TIMEOUT_LEITURA = 15000;

// Status de cobrança que contam como pagos (no cartão, CONFIRMED já é pago; o
// RECEIVED chega ~32 dias depois). RECEIVED_IN_CASH = baixa manual no painel.
const PAGOS = new Set(['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']);

// Eventos que cortam o acesso e cancelam a renovação. PAYMENT_PARTIALLY_REFUNDED
// fica de fora (só consulta); chargeback cancela e ganhar a disputa não reativa.
const ESTORNO = new Set([
  'PAYMENT_REFUNDED',
  'PAYMENT_REFUND_IN_PROGRESS',
  'PAYMENT_CHARGEBACK_REQUESTED',
]);

export class ErroGateway extends Error {
  constructor(status, codigo) {
    super(`asaas ${status} ${codigo || ''}`.trim());
    this.status = status;
    this.codigo = codigo || null;
  }
}

async function chamar(metodo, caminho, corpo, timeoutMs = TIMEOUT_LEITURA) {
  const base = process.env.ASAAS_API_URL;
  const chave = process.env.ASAAS_API_KEY;
  if (!base || !chave) throw new ErroGateway(500, 'asaas_nao_configurado');
  let resp;
  try {
    resp = await fetch(base + caminho, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'vrtx-crm',
        access_token: chave,
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new ErroGateway(504, err?.name === 'TimeoutError' ? 'timeout' : 'rede');
  }
  const texto = await resp.text();
  let json = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    json = null;
  }
  if (!resp.ok) throw new ErroGateway(resp.status, json?.errors?.[0]?.code);
  return json;
}

// Todas as cobranças da assinatura: limit máximo (100) seguindo o hasMore até o fim.
// Com a página padrão (10), a última paga sairia da lista depois de alguns meses.
export async function listarCobrancas(assinaturaId, timeoutMs) {
  const todas = [];
  for (let offset = 0; ; offset += 100) {
    const pagina = await chamar(
      'GET',
      `/subscriptions/${assinaturaId}/payments?limit=100&offset=${offset}`,
      undefined,
      timeoutMs,
    );
    const dados = pagina?.data || [];
    todas.push(...dados);
    if (!pagina?.hasMore || dados.length === 0) return todas;
  }
}

const vencimento = (c) => c.originalDueDate || c.dueDate || null;

// Cliente do workspace (externalReference = workspace_id): reaproveita o id gravado,
// senão o que já existir no Asaas (queda no meio de um checkout anterior), senão cria.
// Celular e CPF/CNPJ só passam por aqui; nada é gravado no nosso banco.
async function garantirCliente({ clienteId, workspaceId, nome, email, cpfCnpj, celular }) {
  const dados = { name: nome, cpfCnpj, email, mobilePhone: celular, externalReference: workspaceId };
  let id = clienteId;
  if (!id) {
    const achados = await chamar('GET', `/customers?externalReference=${encodeURIComponent(workspaceId)}&limit=1`);
    id = achados?.data?.[0]?.id || null;
  }
  if (id) {
    await chamar('PUT', `/customers/${id}`, dados, TIMEOUT_CRIACAO);
    return id;
  }
  const novo = await chamar('POST', '/customers', { ...dados, notificationDisabled: false }, TIMEOUT_CRIACAO);
  return novo.id;
}

// E-mail e SMS ligados; WhatsApp e ligação de voz desligados (o padrão do Asaas liga
// ligação no atraso). Confere com um GET: se não bater, lança e a assinatura não é criada.
async function configurarNotificacoes(clienteId) {
  const lista = await chamar('GET', `/customers/${clienteId}/notifications`);
  await chamar(
    'PUT',
    '/notifications/batch',
    {
      customer: clienteId,
      notifications: (lista?.data || []).map((n) => ({
        id: n.id,
        enabled: true,
        emailEnabledForCustomer: true,
        smsEnabledForCustomer: true,
        phoneCallEnabledForCustomer: false,
        whatsappEnabledForCustomer: false,
        emailEnabledForProvider: n.emailEnabledForProvider,
        smsEnabledForProvider: n.smsEnabledForProvider,
      })),
    },
    TIMEOUT_CRIACAO,
  );
  const conferido = await chamar('GET', `/customers/${clienteId}/notifications`);
  const ok = (conferido?.data || []).every(
    (n) =>
      n.enabled &&
      n.emailEnabledForCustomer &&
      n.smsEnabledForCustomer &&
      !n.phoneCallEnabledForCustomer &&
      !n.whatsappEnabledForCustomer,
  );
  if (!ok) throw new ErroGateway(502, 'notificacoes_divergentes');
}

// Cobrança em aberto mais antiga (pelo vencimento original). preferirVencida: a
// vencida vem antes da pendente (Regularizar).
async function cobrancaEmAberto(assinaturaId, preferirVencida) {
  const abertas = (await listarCobrancas(assinaturaId))
    .filter((c) => !c.deleted && (c.status === 'OVERDUE' || c.status === 'PENDING'))
    .sort((a, b) => String(vencimento(a)).localeCompare(String(vencimento(b))));
  const escolhida = preferirVencida
    ? abertas.find((c) => c.status === 'OVERDUE') || abertas[0]
    : abertas[0];
  return escolhida?.invoiceUrl || null;
}

// Assinatura viva (não removida e ACTIVE) → url da cobrança em aberto; senão null.
export async function urlAssinaturaViva(assinaturaId) {
  try {
    const a = await chamar('GET', `/subscriptions/${assinaturaId}`);
    if (a?.deleted || a?.status !== 'ACTIVE') return null;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
  return cobrancaEmAberto(assinaturaId, false);
}

export async function criarCheckout({
  workspaceId,
  nomeEmpresa,
  email,
  cpfCnpj,
  celular,
  valor,
  vencimentoHoje,
  urlRetorno,
  clienteId,
}) {
  const cliente = await garantirCliente({ clienteId, workspaceId, nome: nomeEmpresa, email, cpfCnpj, celular });
  await configurarNotificacoes(cliente);

  // Queda depois de criar a assinatura e antes de gravar o id: reaproveita a ativa.
  const ativas = await chamar(
    'GET',
    `/subscriptions?externalReference=${encodeURIComponent(workspaceId)}&status=ACTIVE&limit=1`,
  );
  let assinaturaId = ativas?.data?.[0]?.id || null;
  if (!assinaturaId) {
    const nova = await chamar(
      'POST',
      '/subscriptions',
      {
        customer: cliente,
        billingType: 'CREDIT_CARD',
        value: valor,
        nextDueDate: vencimentoHoje,
        cycle: 'MONTHLY',
        description: 'VRTX CRM — assinatura mensal',
        externalReference: workspaceId,
        interest: { value: 0 },
        fine: { value: 0, type: 'FIXED' },
        callback: { successUrl: urlRetorno, autoRedirect: true },
      },
      TIMEOUT_CRIACAO,
    );
    assinaturaId = nova.id;
  }
  const url = await cobrancaEmAberto(assinaturaId, false);
  if (!url) throw new ErroGateway(502, 'sem_cobranca_em_aberto');
  return { clienteId: cliente, assinaturaId, url };
}

export function linkRegularizar({ assinaturaId }) {
  return cobrancaEmAberto(assinaturaId, true);
}

// Remove a assinatura (o Asaas apaga as cobranças pendentes e vencidas; as pagas
// ficam). Já removida (404) não é erro.
export async function cancelar({ assinaturaId, timeoutMs = TIMEOUT_CRIACAO }) {
  try {
    await chamar('DELETE', `/subscriptions/${assinaturaId}`, undefined, timeoutMs);
  } catch (err) {
    if (err.status !== 404) throw err;
  }
}

// Fonte da verdade (webhook e sincronizar). Devolve o status no vocabulário da tabela
// e o vencimento original da última cobrança paga; o "pago até" é calculado pela
// camada (periodoFimDe), fora do adaptador.
export async function consultar({ assinaturaId, timeoutMs }) {
  const a = await chamar('GET', `/subscriptions/${assinaturaId}`, undefined, timeoutMs);
  const cobrancas = (await listarCobrancas(assinaturaId, timeoutMs)).filter((c) => !c.deleted);
  const pagas = cobrancas
    .filter((c) => PAGOS.has(c.status))
    .sort((x, y) => String(vencimento(x)).localeCompare(String(vencimento(y))));
  const ultimaPaga = pagas[pagas.length - 1] || null;
  const removida = a?.deleted === true || a?.status !== 'ACTIVE';
  const nuncaPaga = pagas.length === 0;

  let status;
  if (nuncaPaga) status = 'pendente'; // inclui a removida sem pagamento (checkout abandonado)
  else if (removida) status = 'cancelada';
  else if (cobrancas.some((c) => c.status === 'OVERDUE')) status = 'atrasada';
  else status = 'ativa';

  return {
    status,
    removida,
    nuncaPaga,
    vencimentoUltimaPaga: ultimaPaga ? vencimento(ultimaPaga) : null,
    semVencimento: !!ultimaPaga && !vencimento(ultimaPaga),
    pagoNoDebito: ultimaPaga?.billingType === 'DEBIT_CARD',
  };
}

// Token do header asaas-access-token contra ASAAS_WEBHOOK_TOKEN (comparação constante
// no tempo, recebida do server.js). Sem token configurado, recusa tudo.
export function validarWebhook(req, comparar) {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado) return false;
  return comparar(req.headers['asaas-access-token'], esperado);
}

export function extrairEvento(corpo) {
  const tipo = typeof corpo?.event === 'string' ? corpo.event : null;
  return {
    eventoId: typeof corpo?.id === 'string' ? corpo.id : null,
    tipo,
    assinaturaId: corpo?.payment?.subscription || corpo?.subscription?.id || null,
    externalReference: corpo?.payment?.externalReference || corpo?.subscription?.externalReference || null,
    estorno: ESTORNO.has(tipo),
    vencida: tipo === 'PAYMENT_OVERDUE',
  };
}

// Payload que vai para assinatura_eventos sem o creditCardToken (com o token dá para
// cobrar o cartão usando a nossa chave; não guardar).
export function payloadParaGuardar(corpo) {
  return JSON.parse(
    JSON.stringify(corpo ?? {}, (chave, valor) => (chave === 'creditCardToken' ? undefined : valor)),
  );
}
