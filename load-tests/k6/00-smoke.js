// ═══════════════════════════════════════════════════════════════
// ESTÁGIO 0 — SMOKE (risco: quase zero)
// 1-2 VUs, 30s, só GET / (health, sem auth). ~30-60 requests no total.
// Confirma que k6, rede, Nginx e o processo Node respondem antes de
// qualquer estágio maior.
//
//   k6 run load-tests/k6/00-smoke.js
//   k6 run --env VUS=2 --env DURATION=30s load-tests/k6/00-smoke.js
// ═══════════════════════════════════════════════════════════════

import { sleep } from 'k6';
import { num } from './lib/config.js';
import { healthCheck } from './lib/requests.js';

// Smoke nunca passa de 2 VUs, independente do que vier por env.
const VUS = Math.min(num('VUS', 1), 2);

export const options = {
  vus: VUS,
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  healthCheck();
  sleep(1);
}
