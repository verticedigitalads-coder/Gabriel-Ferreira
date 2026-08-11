// ═══════════════════════════════════════════════════════════════
// ESTÁGIO 3 (OPCIONAL) — LEITURA DIRETA NO SUPABASE (risco: médio)
// O frontend lê leads DIRETO do Supabase (PostgREST + RLS), sem passar
// pelo VPS — este cenário testa esse caminho real e o comportamento do
// Supabase FREE sob leitura concorrente.
//
// ⚠️ Use o JWT do usuário do workspace "Teste": o RLS limita o SELECT
// ao workspace do token, então só dados de teste são lidos.
// ⚠️ Taxa baixa (default 30 req/min): Supabase FREE tem limites de
// conexão/recursos — o objetivo é observar, não derrubar.
//
// Só SELECT. Nenhuma escrita.
//
//   k6 run load-tests/k6/03-supabase-read.js
//   k6 run --env RATE=60 --env DURATION=5m load-tests/k6/03-supabase-read.js
// ═══════════════════════════════════════════════════════════════

import http from 'k6/http';
import { check, fail } from 'k6';
import { num } from './lib/config.js';
import { getToken } from './lib/auth.js';

const SUPABASE_URL = __ENV.SUPABASE_URL;
const ANON = __ENV.SUPABASE_ANON_KEY;

export const options = {
  scenarios: {
    supabase_read: {
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
  if (!SUPABASE_URL || !ANON) {
    fail('Defina SUPABASE_URL e SUPABASE_ANON_KEY para este cenário');
  }
  return { token: getToken() };
}

export default function (data) {
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/leads?select=id,nome,status&limit=50`,
    {
      headers: { apikey: ANON, Authorization: `Bearer ${data.token}` },
      tags: { name: 'GET rest/v1/leads' },
    },
  );
  check(res, {
    'leads 200': (r) => r.status === 200,
    'resposta é array': (r) => Array.isArray(r.json()),
  });
}
