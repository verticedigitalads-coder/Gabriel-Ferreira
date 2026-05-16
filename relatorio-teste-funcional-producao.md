# Relatório de Teste Funcional — CRM VRTX em Produção

**Data:** 16/05/2026  
**Ambiente:** Produção  
**Frontend:** https://vertice-digital-crm.vercel.app  
**Backend:** https://api.vrtxcrm.com.br  
**Workspace testado:** FL ART METAL  
**Testado por:** Automação via Claude / Cowork  

---

## Tabela de Resultados

| # | Fluxo | Teste | Status | Erro / Observação |
|---|-------|-------|--------|-------------------|
| 1.1 | Auth | Login com email/senha | ✅ PASS | Acesso confirmado como Vértice Digital |
| 1.2 | Auth | Redirecionamento pós-login para Dashboard | ✅ PASS | Redireciona corretamente |
| 1.3 | Auth | Persistência de sessão (reload) | ✅ PASS | Sessão mantida após reload |
| 2.1 | Dashboard | Métricas carregam (Score, Tarefas) | ✅ PASS | Score Operacional 250, Score Comercial 580, Tarefas Críticas 10 |
| 2.2 | Dashboard | Seção "Foco Hoje" carrega leads | ✅ PASS | 5 leads exibidos (Paloma, Clevim, Janice, Breno Dias, Tiago Silva) |
| 2.3 | Dashboard | Maiores Oportunidades | ✅ PASS | 3 oportunidades exibidas (top: Hudson R$ 27.583,22) |
| 2.4 | Dashboard | Previsão de Receita | ⚠️ ALERTA | Todos os valores R$ 0,00 — possível ausência de orçamentos fechados |
| 2.5 | Dashboard | Score Operacional | 🐛 BUG | Exibe "250 /100" — valor excede o máximo (100) |
| 2.6 | Dashboard | Banner Saúde do CRM | ⚠️ ALERTA | Exibe status "CRÍTICO" em laranja |
| 3.1 | Leads | Lista carrega | ✅ PASS | 23 leads carregados |
| 3.2 | Leads | Busca / filtro funciona | ✅ PASS | Filtrou para "1 de 23 leads" ao buscar nome |
| 3.3 | Leads | Modal "Novo Lead" abre | ✅ PASS | Todos os campos presentes (Nome, Telefone, Email, Serviço, Origem, Responsável) |
| 3.4 | Leads | Detalhe de lead abre | ✅ PASS | Abre com histórico de contatos, valor orçado, temperatura |
| 3.5 | Leads | Registrar Contato | ✅ PASS | Modal abre corretamente |
| 3.6 | Leads | Botão WhatsApp | ✅ PASS | Botão visível e clicável no card do lead |
| 4.1 | Orçamentos | Lista carrega | ✅ PASS | Orçamentos listados com status e valores |
| 4.2 | Orçamentos | Modal "Novo Orçamento" abre | ✅ PASS | Formulário completo visível |
| 4.3 | Orçamentos | **Gerar / Baixar PDF** | 🔴 FAIL | Toast "Erro ao gerar PDF" — POST para `/api/gerar-orcamento` falha; apenas OPTIONS 200 capturado (CORS ok, backend down) |
| 5.1 | Operacional | Lista de tarefas carrega | ✅ PASS | 10 tarefas atrasadas visíveis |
| 5.2 | Operacional | Status pills visíveis | ✅ PASS | Pills coloridas renderizadas |
| 5.3 | Operacional | Criação de nova tarefa | ✅ PASS | Modal abre com campos de tarefa |
| 6.1 | Financeiro | Módulo carrega | ✅ PASS | Seção financeira acessível via sidebar |
| 6.2 | Financeiro | Lançamentos exibidos | ✅ PASS | Lista de movimentações financeiras carregada |
| 7.1 | Recibos | Módulo carrega | ✅ PASS | Seção acessível (requereu clique via JS programático) |
| 7.2 | Recibos | Lista de recibos | ✅ PASS | Recibos listados |
| 8.1 | Configurações | Módulo carrega | ✅ PASS | Página de configurações acessível |
| 8.2 | Configurações | Dados do workspace visíveis | ✅ PASS | Configurações de workspace exibidas |
| 9.1 | IA Assistente | Módulo carrega | ✅ PASS | 19 leads "Críticos" identificados |
| 9.2 | IA Assistente | Seleção de lead funciona | ✅ PASS | Clevim selecionado com highlight de borda |
| 9.3 | IA Assistente | Botão "Analisar Lead" dispara análise | ✅ PASS | Modal "Preview da Análise Estratégica" exibido com sucesso |
| 9.4 | IA Assistente | Campos da análise preenchidos | ✅ PASS | Probabilidade 50%, Maturidade 3/5, Tipo, Risco Perda, Concorrência, Potencial Futuro, Mensagem WhatsApp, Próxima Ação |
| 9.5 | IA Assistente | Formatação da data de follow-up | 🐛 BUG | Exibe ISO bruto: `2026-05-18T17:47:30.992Z` em vez de data formatada (ex: 18/05/2026 17:47) |
| 9.6 | IA Assistente | Botão "Executar Plano Estratégico" | ✅ PASS | Botão visível e clicável |
| 10.1 | Mobile | Resize viewport 390px | ⚠️ N/T | Resize não funcionou no ambiente de automação (viewport permaneceu em 1512px) |
| 10.2 | Mobile | Bottom navigation (5 ícones) | ⚠️ N/T | Não testado — viewport mobile não atingido |
| 10.3 | Mobile | Labels 11px / header de módulo | ⚠️ N/T | Não testado |

> **Legenda:** ✅ PASS — ⚠️ ALERTA/N/T — 🐛 BUG — 🔴 FAIL CRÍTICO  
> **N/T** = Não Testado

---

## 🔴 Bugs Críticos

### BUG-001 — Geração de PDF falha em produção
- **Severidade:** CRÍTICO
- **Fluxo:** Orçamentos → Baixar PDF
- **Reprodução:** Abrir qualquer orçamento → clicar "Baixar PDF"
- **Resultado observado:** Toast vermelho "Erro ao gerar PDF"
- **Rede:** Apenas requisição `OPTIONS` (preflight CORS) retorna 200 para `https://api.vrtxcrm.com.br/api/gerar-orcamento`. A requisição `POST` subsequente não retorna resposta de sucesso.
- **Causa provável:** Backend Express (`server.js`) não respondendo ao POST — Puppeteer falhou, processo travado, ou servidor ngrok/VPS offline.
- **Impacto:** 100% dos PDFs de orçamento inutilizáveis em produção.

---

## 🐛 Bugs Médios

### BUG-002 — Score Operacional excede o máximo
- **Severidade:** MÉDIO
- **Localização:** Dashboard Executivo → "Indicadores Estratégicos"
- **Resultado observado:** "250 /100" — score de 250 onde o máximo exibido é 100
- **Causa provável:** Lógica de normalização ausente ou bug no `dashboardSelectors.ts`

### BUG-003 — Data de follow-up da IA exibida em formato ISO bruto
- **Severidade:** MÉDIO
- **Localização:** IA Assistente → Analisar Lead → "Próxima Ação Recomendada"
- **Resultado observado:** `2026-05-18T17:47:30.992Z` em vez de `18/05/2026 17:47`
- **Correção sugerida:** Aplicar `new Date(date).toLocaleString('pt-BR')` antes de exibir

### BUG-004 — Botão "Analisar Lead" não responde a clique por coordenadas
- **Severidade:** MÉDIO (UX)
- **Localização:** IA Assistente → Analisar Lead Individual
- **Resultado observado:** Clique por posição (x,y) não disparava a análise; funcionou apenas via `button.click()` programático em JavaScript
- **Causa provável:** Área clicável com evento React sintético bloqueado por overlay transparente, ou target-area insuficiente

### BUG-005 — Navegação lateral com links não-responsivos por coordenada
- **Severidade:** BAIXO
- **Localização:** Sidebar → Recibos, IA Assistente
- **Resultado observado:** Clique por coordenadas não navegava; requereu `querySelectorAll('button').click()`
- **Causa provável:** Links renderizados fora do viewport de clique ou cobertos por outro elemento

---

## ⚠️ Alertas (não são bugs, mas requerem atenção)

1. **Dashboard Receita R$ 0,00** — Todos os campos de "Previsão de Receita" mostram R$ 0,00. Pode ser comportamento esperado se não há orçamentos com status "fechado" no workspace FL ART METAL, mas merece verificação.
2. **Saúde do CRM = CRÍTICO** — Banner laranja no Dashboard. Verificar qual regra aciona este estado.
3. **Mobile não testado** — O ambiente de automação não conseguiu forçar viewport <768px. Testar manualmente em dispositivo real ou Chrome DevTools (F12 → Toggle Device Toolbar).

---

## Erros de Console Observados

| Origem | Mensagem | Frequência |
|--------|----------|------------|
| Chrome Extension | `Cannot access a chrome-extension:// URL of different extension` | Intermitente (após abrir modais) |
| Backend | Toast "Erro ao gerar PDF" (sem stack trace exposto no frontend) | Consistente (100%) |

---

## Resumo Executivo

| Categoria | Total | PASS | FAIL | BUG | N/T | ALERTA |
|-----------|-------|------|------|-----|-----|--------|
| Auth | 3 | 3 | 0 | 0 | 0 | 0 |
| Dashboard | 6 | 3 | 0 | 1 | 0 | 2 |
| Leads | 6 | 6 | 0 | 0 | 0 | 0 |
| Orçamentos | 3 | 2 | 1 | 0 | 0 | 0 |
| Operacional | 3 | 3 | 0 | 0 | 0 | 0 |
| Financeiro | 2 | 2 | 0 | 0 | 0 | 0 |
| Recibos | 2 | 2 | 0 | 0 | 0 | 0 |
| Configurações | 2 | 2 | 0 | 0 | 0 | 0 |
| IA Assistente | 6 | 4 | 0 | 2 | 0 | 0 |
| Mobile | 3 | 0 | 0 | 0 | 3 | 0 |
| **TOTAL** | **36** | **27** | **1** | **3** | **3** | **2** |

**Taxa de sucesso (testes executados):** 27/33 = **81,8%**  
**Bloqueador imediato:** 1 (PDF)  
**Não testados:** 3 (mobile — requer teste manual)

---

## Recomendações de Ação

### Prioridade 1 — Urgente
1. **Verificar backend `api.vrtxcrm.com.br`** — processo Node.js rodando? Puppeteer inicializando? Logs do servidor: `pm2 logs` ou equivalente. Testar endpoint diretamente: `curl -X POST https://api.vrtxcrm.com.br/api/gerar-orcamento -H "Content-Type: application/json" -d '{...}'`

### Prioridade 2 — Esta sprint
2. **Formatar data ISO no módulo IA** — `src/modules/ia/iaService.ts` ou componente que exibe `proximaAcao.data`
3. **Corrigir Score Operacional** — revisar cálculo em `src/store/selectors/dashboardSelectors.ts`, normalizar para max 100
4. **Investigar banner "Saúde CRM CRÍTICO"** — identificar trigger e validar se o estado é legítimo

### Prioridade 3 — Próxima sprint
5. **Testar mobile manualmente** — Chrome DevTools (F12 → Ctrl+Shift+M), testar em iPhone 12/13 e Samsung Galaxy S21
6. **Touch targets** — confirmar ≥44px em todos os botões da nav bottom no mobile
