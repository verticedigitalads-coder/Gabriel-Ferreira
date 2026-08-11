// ═══════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️  ESTÁGIO 99 — PDF / PUPPETEER — ALTO RISCO  ⚠️⚠️⚠️
//
// CADA request a /api/gerar-orcamento dispara um puppeteer.launch()
// no VPS: um Chromium INTEIRO por PDF (~1-3s de launch + pico de RAM).
// Concorrência alta aqui DERRUBA o servidor.
//
// Proteções embutidas neste script:
//   • Máximo ABSOLUTO de 2 VUs (valores maiores são cortados para 2).
//   • Pausa mínima de 7s entre PDFs por VU (respeita o strictLimiter
//     de 10/min da rota).
//   • Timeout de 60s por request; aborta se p95 > 30s ou falhas > 10%.
//   • Payload 100% fake, sem URLs de imagem externas.
//
// SÓ RODE depois dos estágios 0-2 passarem verdes, com htop e
// pm2 monit abertos na VPS. Ctrl+C aborta na hora.
//
//   k6 run load-tests/k6/99-pdf-DANGER.js                 (1 VU, 5 PDFs)
//   k6 run --env VUS=2 --env ITERATIONS=10 load-tests/k6/99-pdf-DANGER.js
// ═══════════════════════════════════════════════════════════════

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, num } from './lib/config.js';
import { getToken } from './lib/auth.js';

const VUS = Math.min(num('VUS', 1), 2); // hard cap: nunca mais de 2
const ITERATIONS = num('ITERATIONS', 5); // PDFs por VU
const PACE_SECONDS = Math.max(num('PACE_SECONDS', 8), 7); // piso de 7s

export const options = {
  scenarios: {
    pdf_danger: {
      executor: 'per-vu-iterations',
      vus: VUS,
      iterations: ITERATIONS,
      maxDuration: '10m',
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: true }],
    http_req_duration: [{ threshold: 'p(95)<30000', abortOnFail: true }],
  },
};

// Dados fake — nunca dados de cliente real. Sem logo/URLs externas para o
// Puppeteer não fazer fetch de imagem durante o render.
const payload = JSON.stringify({
  template_version: 'v2',
  cliente_nome: 'TESTE DE CARGA — IGNORAR',
  cliente_telefone: '(00) 00000-0000',
  cliente_endereco: 'Endereço de teste, 123',
  empresa_nome: 'Workspace Teste',
  itens: [
    { descricao: 'Item de teste de carga A', quantidade: 1, valorUnitario: 100, valorTotal: 100 },
    { descricao: 'Item de teste de carga B', quantidade: 2, valorUnitario: 50, valorTotal: 100 },
  ],
  subtotal: 200,
  total: 200,
  multiplicador: 1,
});

export function setup() {
  console.warn('⚠️  PDF/Puppeteer: 1 Chromium por request no VPS. Monitore htop e pm2 monit. Ctrl+C aborta.');
  console.warn(`⚠️  Config efetiva: ${VUS} VU(s), ${ITERATIONS} PDFs/VU, pausa de ${PACE_SECONDS}s entre PDFs.`);
  return { token: getToken() };
}

export default function (data) {
  const res = http.post(`${BASE_URL}/api/gerar-orcamento`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
    timeout: '60s',
    responseType: 'none', // descarta o binário do PDF — só interessam status e latência
    tags: { name: 'POST /api/gerar-orcamento' },
  });
  check(res, {
    'pdf 200': (r) => r.status === 200,
    'content-type pdf': (r) =>
      String(r.headers['Content-Type'] || '').includes('application/pdf'),
    'sem 429 (strictLimiter)': (r) => r.status !== 429,
  });
  sleep(PACE_SECONDS);
}
