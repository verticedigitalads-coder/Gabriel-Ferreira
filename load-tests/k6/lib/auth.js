// Obtém o JWT usado nas rotas protegidas (chamado uma vez, no setup() de cada cenário).
//
// Duas formas, em ordem de prioridade:
//   1. K6_JWT setado → usa direto (cole o access_token do usuário de teste).
//   2. SUPABASE_URL + SUPABASE_ANON_KEY + TEST_EMAIL + TEST_PASSWORD → login
//      password-grant no Supabase Auth e usa o access_token retornado.
//
// ⚠️ O access_token do Supabase expira em ~1h. Para sessões longas, prefira a
// forma 2 (cada `k6 run` faz login fresco no setup).
// ⚠️ Use SEMPRE o usuário do workspace "Teste" — nunca credenciais de cliente real.

import http from 'k6/http';
import { fail } from 'k6';

export function getToken() {
  if (__ENV.K6_JWT) return __ENV.K6_JWT;

  const url = __ENV.SUPABASE_URL;
  const anon = __ENV.SUPABASE_ANON_KEY;
  const email = __ENV.TEST_EMAIL;
  const password = __ENV.TEST_PASSWORD;

  if (!url || !anon || !email || !password) {
    fail(
      'Auth: defina K6_JWT, ou SUPABASE_URL + SUPABASE_ANON_KEY + TEST_EMAIL + TEST_PASSWORD (ver load-tests/config.example.env)',
    );
  }

  const res = http.post(
    `${url}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json', apikey: anon } },
  );

  if (res.status !== 200) {
    fail(`Auth: login falhou (HTTP ${res.status}): ${res.body}`);
  }
  const token = res.json('access_token');
  if (!token) fail('Auth: resposta de login sem access_token');
  return token;
}
