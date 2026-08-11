// ═══════════════════════════════════════════════════════════════
// ESTÁGIO 2 — LEITURA MODERADA / RAMPA (risco: médio)
// Taxa sobe em degraus de 2 min: MAX_RATE/3 → 2·MAX_RATE/3 → MAX_RATE
// → platô. Observe em qual degrau a latência começa a degradar.
//
// Default MAX_RATE=90 req/min fica SOB o rate limit global (100/min).
// Só suba MAX_RATE acima de ~90 se a janela temporária de rate limit
// estiver ABERTA na VPS (runbook, opção b) — senão o teste vira uma
// chuva de 429 e não mede nada.
//
// Aborta SOZINHO se p95 > 2s ou erros > 5%. 429 conta como erro:
// se o abort disparar por 429, você bateu no rate limit — reveja
// MAX_RATE ou abra a janela.
//
//   k6 run load-tests/k6/02-read-ramp.js
//   k6 run --env MAX_RATE=300 load-tests/k6/02-read-ramp.js   (SÓ com janela aberta)
// ═══════════════════════════════════════════════════════════════

import { num } from './lib/config.js';
import { getToken } from './lib/auth.js';
import { readMix } from './lib/requests.js';

const MAX_RATE = num('MAX_RATE', 90); // req/min no topo da rampa
const STEP = __ENV.STEP_DURATION || '2m';

export const options = {
  scenarios: {
    read_ramp: {
      executor: 'ramping-arrival-rate',
      startRate: num('START_RATE', 15),
      timeUnit: '1m',
      preAllocatedVUs: 10,
      maxVUs: num('MAX_VUS', 30),
      stages: [
        { target: Math.ceil(MAX_RATE / 3), duration: STEP },
        { target: Math.ceil((2 * MAX_RATE) / 3), duration: STEP },
        { target: MAX_RATE, duration: STEP },
        { target: MAX_RATE, duration: STEP }, // platô para observar estabilidade
      ],
    },
  },
  thresholds: {
    http_req_failed: [
      { threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '30s' },
    ],
    http_req_duration: [
      { threshold: 'p(95)<2000', abortOnFail: true, delayAbortEval: '30s' },
    ],
  },
};

export function setup() {
  return { token: getToken() };
}

export default function (data) {
  readMix(data.token);
}
