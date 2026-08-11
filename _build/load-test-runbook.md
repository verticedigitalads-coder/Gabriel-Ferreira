# Runbook — Teste de Carga (produção, supervisionado)

> **Preparado em 2026-08-10. Nada foi executado contra produção.**
> Alvo: `https://api.vrtxcrm.com.br` (VPS Hetzner, PM2 `crm-backend`, Nginx 80→3001).
> Scripts: [`load-tests/`](../load-tests/README.md) (k6).

---

## 1. Visão geral

Quatro estágios crescentes + um opcional, cada um abortável (Ctrl+C no k6 **e**
aborto automático por thresholds). Ferramenta: **k6** — executores de taxa fixa
(`constant-arrival-rate`) permitem ficar sob o rate limit, e `abortOnFail` corta
o teste sozinho se latência/erros estourarem.

Fatos do sistema que moldam o teste:

- **Rate limit por IP**: global 100/min, rotas sensíveis 10/min. Desde o commit
  desta preparação, os limites leem `RATE_LIMIT_GLOBAL_MAX` / `RATE_LIMIT_STRICT_MAX`
  do `.env` (defaults 100/10 — comportamento de produção inalterado).
- **Toda rota autenticada valida o JWT no Supabase Auth a cada request**
  (`supabaseAdmin.auth.getUser`). Carga autenticada no VPS = carga no Supabase
  FREE também. Por isso as taxas default são conservadoras.
- **Cada PDF = um `puppeteer.launch()`** (Chromium inteiro por request).
  É o gargalo conhecido — estágio 99, máximo 2 VUs, opcional.
- O frontend lê leads **direto do Supabase** (não passa pelo VPS). O estágio 3
  testa esse caminho real via PostgREST + RLS.

---

## 2. Checklist pré-teste (fazer ANTES, na ordem)

- [ ] **Janela**: madrugada, clientes (FL / Ítalo) fora do ar, você acordado até o fim.
- [ ] **Backup fresco do banco**: dashboard Supabase → Database → Backups →
      confirmar backup do dia (FREE tem backup diário; se quiser um snapshot
      manual, exporte as tabelas críticas via SQL Editor → CSV).
- [ ] **Deploy da mudança de rate limit** (se ainda não subiu): na VPS,
      `cd /opt/crm-backend && git pull origin main && pm2 restart crm-backend`.
      Sem setar as vars, o comportamento é idêntico ao atual.
- [ ] **JWT/credenciais de teste**: usuário do workspace **Teste** (nunca cliente
      real). Preencher `load-tests/.env` (copiado de `config.example.env`).
      - Preferido: `TEST_EMAIL` + `TEST_PASSWORD` + `SUPABASE_URL` + `SUPABASE_ANON_KEY`
        (cada `k6 run` faz login fresco — sem problema de expiração).
      - Alternativa: colar um `K6_JWT` (DevTools → Application → localStorage →
        chave `sb-...-auth-token` → campo `access_token`). Expira em ~1h.
      - Para `ENABLE_ADMIN=1`: o usuário precisa estar em `ADMIN_USER_IDS` na VPS.
- [ ] **k6 instalado** na sua máquina (`k6 version`).
- [ ] **Decisão de rate limit** tomada (seção 3): opção (a) ou (b).
- [ ] **Monitoramento aberto** (seção 4): 2 SSHs + dashboard Supabase + terminal k6.
- [ ] **Escrita**: nenhum cenário escreve no banco — nada a configurar; apenas
      confirme que o JWT usado é do workspace Teste (o RLS faz o resto).

---

## 3. Rate limit — decisão (a) ou (b)

O limite global de 100 req/min por IP mascara a capacidade real: acima disso o
servidor responde 429 sem esforço nenhum.

**(a) Rodar sob o limite (default dos scripts — mais seguro).**
Estágios 1 e 2 já vêm calibrados (30 e ≤90 req/min). Mede **latência sob carga
controlada**, não capacidade máxima. Nenhuma mudança na VPS.

**(b) Janela temporária de limite elevado (mede capacidade real).**

Abrir (na VPS, via SSH):
```bash
cd /opt/crm-backend
echo 'RATE_LIMIT_GLOBAL_MAX=600' >> .env
# opcional, SÓ se for testar PDF acima de 10/min (não recomendado):
# echo 'RATE_LIMIT_STRICT_MAX=20' >> .env
pm2 restart crm-backend
# confirmar janela aberta (header RateLimit-Limit deve mostrar 600):
curl -sI https://api.vrtxcrm.com.br/ | grep -i ratelimit
```

Reverter (OBRIGATÓRIO ao final, mesmo se o teste for abortado):
```bash
cd /opt/crm-backend
sed -i '/^RATE_LIMIT_GLOBAL_MAX=/d; /^RATE_LIMIT_STRICT_MAX=/d' .env
pm2 restart crm-backend
# confirmar limites de volta (100):
curl -sI https://api.vrtxcrm.com.br/ | grep -i ratelimit
```

Com a janela aberta, controle a taxa no k6 (`--env MAX_RATE=...`) — a janela
tira a trava do servidor, mas quem dosa a carga é você.

---

## 4. Monitoramento durante o teste (4 janelas)

| Janela | Onde | Comando / o quê |
|--------|------|------------------|
| 1 | SSH na VPS | `htop` — CPU, RAM, load average |
| 2 | SSH na VPS | `pm2 monit` (CPU/mem do processo) e, se precisar, `pm2 logs crm-backend --lines 50` |
| 3 | Navegador | Dashboard Supabase → Reports → Database (conexões, CPU) e Auth (requests) |
| 4 | Local | Saída do k6: p95, `http_req_failed`, req/s |

No k6, as métricas que importam: `http_req_duration` (p95/p99), `http_req_failed`
(inclui 429!), `dropped_iterations` (k6 não conseguiu manter a taxa — sinal de
saturação), e as tags por endpoint no sumário final.

---

## 5. Execução estágio a estágio

Antes: carregar o `.env` na sessão PowerShell (snippet no [`load-tests/README.md`](../load-tests/README.md)).
Entre estágios: **2-3 min de pausa** observando o VPS voltar ao repouso.

### Estágio 0 — Smoke (~30s)
```powershell
k6 run load-tests\k6\00-smoke.js
```
Verde se: 0 erros, p95 < 1s. Se o smoke falhar, PARE — algo básico está errado
(rede, servidor, config), não adianta subir carga.

### Estágio 1 — Leitura leve (3 min, 30 req/min)
```powershell
k6 run load-tests\k6\01-read-light.js
# com o endpoint admin na mix (exige JWT admin):
k6 run --env ENABLE_ADMIN=1 load-tests\k6\01-read-light.js
```
Verde se: 0 erros, p95 estável (anote o valor — é sua latência base), CPU do
VPS < ~40%, conexões Supabase estáveis.

### Estágio 2 — Rampa (8 min, 30→90 req/min default)
```powershell
k6 run load-tests\k6\02-read-ramp.js
# SÓ com a janela (b) aberta, ex. capacidade até 300 req/min:
k6 run --env MAX_RATE=300 load-tests\k6\02-read-ramp.js
```
Observe em qual degrau o p95 começa a subir — esse é o dado principal do teste.
Verde se: p95 < 2s no platô, sem 429, CPU < ~70%. Se aparecer 429 sem janela
aberta: você encostou no limite — é esperado acima de ~90 req/min; reduza ou abra a janela.

### Estágio 3 (opcional) — Supabase direto (3 min, 30 req/min)
```powershell
k6 run load-tests\k6\03-supabase-read.js
```
Testa o caminho real do frontend (PostgREST + RLS). Olhe o dashboard Supabase
durante: conexões e CPU do banco. Verde se: p95 estável, 0 erros, conexões longe do teto.

### Estágio 99 (opcional, ALTO RISCO) — PDF/Puppeteer
Pré-condições: estágios 0-2 verdes, htop e pm2 monit abertos, você pronto no Ctrl+C.
```powershell
k6 run load-tests\k6\99-pdf-DANGER.js                       # 1 VU, 5 PDFs, 8s de pausa
k6 run --env VUS=2 --env ITERATIONS=10 load-tests\k6\99-pdf-DANGER.js   # máximo permitido
```
O script corta VUS para no máximo 2 e impõe pausa ≥7s entre PDFs. Espere picos
de CPU/RAM a cada request (Chromium). Verde se: cada PDF < ~10s, RAM volta ao
patamar entre PDFs, PM2 sem restart. **Qualquer sinal de RAM não voltando ao
patamar entre PDFs: aborte.**

---

## 6. Sinais de ABORT (qualquer um → Ctrl+C imediato)

- p95 crescendo continuamente sem estabilizar (fila se formando).
- Erros 5xx ou de conexão na saída do k6.
- CPU do VPS sustentada em ~100% (htop).
- RAM do VPS subindo sem voltar (especialmente no estágio 99).
- `pm2 status` mostrando **restart** do processo (↑ na coluna restarts).
- Dashboard Supabase: conexões no teto, erros de pool, CPU do banco alta.
- `dropped_iterations` crescendo no k6 (servidor não acompanha a taxa).

Os estágios 1-3 e 99 também abortam **sozinhos** (thresholds `abortOnFail`).

---

## 7. Botão de pânico

1. **`Ctrl+C` no terminal do k6.** Toda a carga vem do k6 — parar o processo
   cessa a carga instantaneamente. Não há nada "agendado" no servidor.
2. Confirmar recuperação do VPS:
   ```bash
   curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' https://api.vrtxcrm.com.br/   # espera: 200, < 1s
   pm2 status          # uptime sem restart novo
   htop                # load average caindo de volta ao normal
   ```
3. Abrir o app no navegador e navegar (login, lista de leads) — experiência normal?
4. Se o processo tiver caído/reiniciado: `pm2 logs crm-backend --lines 100` para
   entender o motivo **antes** de considerar novo estágio.
5. Se abriu a janela de rate limit: **reverter já** (seção 3), mesmo com teste abortado.

---

## 8. Pós-teste

- [ ] Reverter a janela de rate limit (se aberta) + confirmar via header (seção 3).
- [ ] `pm2 status` limpo (sem restarts) e app navegável.
- [ ] Salvar o sumário final de cada `k6 run` (copiar/colar do terminal) com
      data, estágio e parâmetros usados.
- [ ] Anotar: latência base (estágio 1), degrau onde degradou (estágio 2),
      comportamento do Supabase (estágio 3), tempo médio por PDF (estágio 99).
- [ ] Registrar conclusões em `_build/current-state.md`.

---

## 9. Avisos específicos deste sistema

- **429 no meio do teste contamina os números**: `http_req_failed` inclui 429;
  se o abort disparar por 429, o resultado não mede capacidade — ajuste taxa/janela
  e repita o estágio.
- **Supabase Auth é parte da carga**: cada request autenticada faz uma chamada
  `auth.getUser` ao Supabase. Se o Auth do FREE tier ficar lento, a latência das
  rotas autenticadas sobe mesmo com o VPS folgado — compare com o `GET /` (sem
  auth) no sumário por endpoint para separar as duas coisas.
- **PDF é o gargalo estrutural**: um Chromium por request, sem fila nem pool.
  O estágio 99 mede o custo unitário com segurança; qualquer conclusão tipo
  "aguenta N PDFs simultâneos" exigiria mudança de arquitetura (fila), não mais teste.
- **Nenhum cenário escreve no banco.** Leitura direta (estágio 3) usa RLS com o
  JWT do workspace Teste — dados de clientes reais não são tocados nem lidos.
