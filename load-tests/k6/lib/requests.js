// Requests de LEITURA compartilhadas pelos estágios 01 (leve) e 02 (rampa).
// Nenhuma request aqui escreve no banco.

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, bool } from './config.js';

export function healthCheck() {
  const res = http.get(`${BASE_URL}/`, { tags: { name: 'GET /' } });
  check(res, { 'health 200': (r) => r.status === 200 });
  return res;
}

// POST /api/pix-payload: computação pura no backend + validação do JWT no
// Supabase Auth. Não toca banco, não chama serviço externo além do Auth.
export function pixPayload(token) {
  const res = http.post(
    `${BASE_URL}/api/pix-payload`,
    JSON.stringify({
      chavePix: 'teste-carga@exemplo.com',
      nomeRecebedor: 'TESTE DE CARGA',
      cidadeRecebedor: 'UBERABA',
      valor: 1.0,
      txid: 'LOADTEST',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      tags: { name: 'POST /api/pix-payload' },
    },
  );
  check(res, { 'pix-payload 200': (r) => r.status === 200 });
  return res;
}

// GET /api/admin/workspaces: leitura real no banco (Supabase) via backend.
// Exige JWT de usuário presente em ADMIN_USER_IDS na VPS — senão retorna 403.
export function adminWorkspaces(token) {
  const res = http.get(`${BASE_URL}/api/admin/workspaces`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: 'GET /api/admin/workspaces' },
  });
  check(res, { 'admin/workspaces 200': (r) => r.status === 200 });
  return res;
}

// Mix de leitura: alterna health e pix-payload por iteração; inclui
// admin/workspaces no rodízio apenas se ENABLE_ADMIN=1 (exige JWT admin).
export function readMix(token) {
  const n = bool('ENABLE_ADMIN') ? 3 : 2;
  switch (__ITER % n) {
    case 0:
      return healthCheck();
    case 1:
      return pixPayload(token);
    default:
      return adminWorkspaces(token);
  }
}
