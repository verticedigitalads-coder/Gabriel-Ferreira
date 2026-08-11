# Teste de carga — CRM Vértice Digital

Scripts k6 para teste de carga **supervisionado** contra o backend de produção.
**Leia o runbook antes de rodar qualquer coisa: [`_build/load-test-runbook.md`](../_build/load-test-runbook.md).**

## Por que k6 (e não autocannon)

- Executores `constant-arrival-rate` / `ramping-arrival-rate` fixam a taxa em
  **req/min** — essencial para ficar sob o rate limit de 100/min (autocannon
  controla conexões, não taxa).
- `thresholds` com `abortOnFail` = **aborto automático** quando p95 ou taxa de
  erro estouram (dead-man switch, além do Ctrl+C).
- Estágios crescentes nativos, sumário com percentis, binário único no Windows.

## Instalação (Windows)

```powershell
winget install k6 --source winget
# ou: choco install k6
k6 version
```

## Configuração

```powershell
# 1. Copie o exemplo e preencha (NUNCA commite o .env preenchido):
Copy-Item load-tests\config.example.env load-tests\.env

# 2. Carregue as variáveis na sessão do PowerShell:
Get-Content load-tests\.env | Where-Object { $_ -match '^\s*[^#\s]' } | ForEach-Object {
  $name, $value = $_ -split '=', 2
  if ($value) { Set-Item -Path "env:$($name.Trim())" -Value $value.Trim() }
}
```

O k6 enxerga variáveis de ambiente do SO via `__ENV`; qualquer valor também
pode ser sobrescrito pontualmente com `--env NOME=valor` na linha de comando.

## Estágios (rodar NESTA ordem, um por vez)

| # | Script | Risco | O que faz |
|---|--------|-------|-----------|
| 0 | `k6/00-smoke.js` | quase zero | 1-2 VUs, 30s, só `GET /` |
| 1 | `k6/01-read-light.js` | baixo | 30 req/min fixo, mix de leitura autenticada |
| 2 | `k6/02-read-ramp.js` | médio | rampa até 90 req/min (ou `MAX_RATE` com janela aberta) |
| 3 | `k6/03-supabase-read.js` | médio, opcional | SELECT de leads direto no Supabase (RLS, workspace Teste) |
| 99 | `k6/99-pdf-DANGER.js` | **ALTO** | PDF/Puppeteer, máx 2 VUs, pacing ≥7s — ver avisos no arquivo |

```powershell
k6 run load-tests\k6\00-smoke.js
k6 run load-tests\k6\01-read-light.js
k6 run load-tests\k6\02-read-ramp.js
# opcionais / alto risco — só com o runbook aberto e monitoramento ligado:
k6 run load-tests\k6\03-supabase-read.js
k6 run load-tests\k6\99-pdf-DANGER.js
```

**Botão de pânico: `Ctrl+C` no terminal do k6** — toda a carga vem do k6;
parar o processo cessa a carga imediatamente. Passos de verificação pós-aborto
estão no runbook.

## Regras

- Nenhum cenário faz escrita (INSERT/UPDATE/DELETE). O estágio 3 é só SELECT
  com RLS limitado ao workspace do JWT — use o usuário do workspace **Teste**.
- Nunca commitar `load-tests/.env` (já coberto pelo `.gitignore`).
- Janela recomendada: madrugada, com você monitorando (htop + pm2 monit + dashboard Supabase).
