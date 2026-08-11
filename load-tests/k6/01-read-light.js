// ═══════════════════════════════════════════════════════════════
// ESTÁGIO 1 — LEITURA LEVE (risco: baixo)
// Taxa FIXA de 30 req/min (default) por 3 min — folga sob o rate
// limit global de 100/min. Mede a latência base dos endpoints de
// leitura, incluindo o caminho autenticado (JWT → Supabase Auth).
//
// Aborta SOZINHO se p95 > 2s ou erros > 5% (dead-man switch).
//
//   k6 run load-tests/k6/01-read-light.js
//   k6 run --env RATE=50 --env DURATION=5m load-tests/k6/01-read-light.js
//   k6 run --env ENABLE_ADMIN=1 ... (inclui GET /api/admin/workspaces;
//                                    exige JWT de usuário admin)
// ═══════════════════════════════════════════════════════════════

import { num } from './lib/config.js';
import { getToken } from './lib/auth.js';
import { readMix } from './lib/requests.js';

export const options = {
  scenarios: {
    read_light: {
      executor: 'constant-arrival-rate',
      rate: num('RATE', 30), // requisições por MINUTO
      timeUnit: '1m',
      duration: __ENV.DURATION || '3m',
      preAllocatedVUs: 5,
      maxVUs: 10,
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
