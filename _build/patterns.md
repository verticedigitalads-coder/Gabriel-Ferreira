# Patterns Library — CRM System

> Padrões reutilizáveis identificados no sistema.
> Consulte ANTES de escrever código novo — o padrão pode já existir.
> Adicione APENAS quando o padrão foi validado em uso real.

---

## FORMATO DE ENTRADA

### [NOME DO PADRÃO]

**Quando usar:** (trigger claro)
**Onde já foi usado:** (arquivo de referência)
**Estrutura:** (código ou pseudocódigo)
**Não usar quando:** (anti-caso)

---

## Padrão: Zustand Slice

**Quando usar:** Toda vez que criar um novo domínio de estado
**Onde já foi usado:** leadsSlice.ts, orcamentoSlice.ts, financialSlice.ts
**Estrutura:**

```typescript
// src/store/slices/[domain]Slice.ts
export const create[Domain]Slice: StateCreator = (set, get) => ({
  [domain]Data: [],
  [domain]Loading: false,
  [domain]Error: null,

  add[Domain]: async (payload) => {
    const result = await [domain]Service.create(payload)
    set(state => ({ [domain]Data: [...state.[domain]Data, result] }))
  },

  update[Domain]: async (id, payload) => {
    const result = await [domain]Service.update(id, payload)
    set(state => ({
      [domain]Data: state.[domain]Data.map(x => x.id === id ? result : x)
    }))
  },

  delete[Domain]: async (id) => {
    await [domain]Service.delete(id)
    set(state => ({
      [domain]Data: state.[domain]Data.filter(x => x.id !== id)
    }))
  }
})
```

**Não usar quando:** Estado local de componente — use useState direto

---

## Padrão: Service Layer (Supabase)

**Quando usar:** Toda chamada ao Supabase ou API externa
**Onde já foi usado:** leadsService.ts, orcamentoService.ts
**Estrutura:**

```typescript
// src/services/[domain]Service.ts
export const [domain]Service = {
  async create(payload: Omit<[Type], 'id'>): Promise<[Type]> {
    const { data, error } = await supabase
      .from('[tabela]')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: Partial<[Type]>): Promise<[Type]> {
    const { data, error } = await supabase
      .from('[tabela]')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('[tabela]')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
```

**Não usar quando:** Lógica de negócio — service só faz I/O puro

---

## Padrão: Conversão snake_case → camelCase

**Quando usar:** Ao receber dados do Supabase (realtime ou query)
**Onde já foi usado:** orcamentoSlice.ts (tem format()), leadSlice.ts (inconsistente — ver mistakes.md)
**Estrutura:**

```typescript
// Dentro do slice, ao receber dado do Supabase
const format = (raw: any): [Type] => ({
  id: raw.id,
  workspaceId: raw.workspace_id,
  createdAt: raw.created_at,
  // ... todos os campos
})

// Usar em realtime e em queries
set(state => ({
  [domain]Data: [...state.[domain]Data, format(payload.new)]
}))
```

**Não usar quando:** Dados já vêm do store (já estão em camelCase)

---

## Padrão: Fluxo Lead → Orçamento → Fechamento

**Quando usar:** Referência para entender automações encadeadas
**Onde já foi usado:** leadSlice.ts → orcamentoSlice.ts → operacionalSlice.ts
**Estrutura:**

---

## Padrão: Sanitização HTML em PDFs

**Quando usar:** Sempre que interpolar dados do usuário em templates HTML (server.js)
**Onde já foi usado:** server.js (todas as rotas de PDF)
**Estrutura:**

```javascript
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Uso: SEMPRE antes de interpolar
html = html.replace('{{CAMPO}}', escapeHtml(valorDoUsuario));
```

**Não usar quando:** HTML gerado internamente (qrCodePixHtml, assinaturaHtml)

---

## Padrão: Cleanup de Placeholders em PDFs

**Quando usar:** Como último passo antes do Puppeteer renderizar
**Onde já foi usado:** server.js (todas as rotas de PDF)
**Estrutura:**

```javascript
// ÚLTIMO replace antes de page.setContent(html)
html = html.replace(/\{\{[A-Z_]+\}\}/g, '');
```

**Não usar quando:** Nunca pular — é safety net obrigatório

---

## Padrão: Settings por Workspace

**Quando usar:** Configuração que varia entre clientes (nome empresa, cor, chave PIX, etc.)
**Onde já foi usado:** useDefaultSettings.ts, Settings.tsx
**Estrutura:**

```typescript
// Hook: src/hooks/useDefaultSettings.ts
const settings = useDefaultSettings();
// Retorna objeto com todos os settings + defaults

// Salvar: via updateSetting('chave', valor) no Settings.tsx
// Banco: tabela workspace_settings (key-value por workspace_id)
```

**Não usar quando:** Dados que pertencem a uma entidade específica (lead, orçamento) — usar coluna na tabela

---

## Padrão: Dependência de efeitos ligados a auth (session vs. user.id)

**Quando usar:** Todo `useEffect` que reage ao estado de autenticação do
Supabase (`session` vindo de `onAuthStateChange`/`getSession`).
**Onde já foi usado:** App.tsx (efeito de verificação de termos — bug
corrigido em 17/07/2026; efeito de bootstrap de workspace — hardening
preventivo na mesma data).
**Estrutura:**

```typescript
// ERRADO — objeto session ganha nova identidade em TODO evento do
// onAuthStateChange, incluindo TOKEN_REFRESHED (disparado ao refocar aba)
useEffect(() => {
  if (!session) { /* ... */ return; }
  fazAlgo(session.user.id);
}, [session]);

// CERTO — só reage quando o USUÁRIO de fato muda (login/logout/troca)
useEffect(() => {
  if (!session) { /* ... */ return; }
  fazAlgo(session.user.id);
}, [session?.user?.id]);
```

Sintoma quando violado: app desmonta/reseta ao trocar de aba — formulários
em edição perdidos, toasts/notificações redisparadas como num primeiro
acesso. Já ocorreu 2x (bootstrap em jun/2026, gate de termos em jul/2026).

Teste de aceitação padrão para qualquer mudança em `App.tsx`/auth/gate:
preencher metade de um formulário → trocar de aba 30s → voltar →
formulário intacto, sem toasts redisparados.

**Não usar quando:** O efeito precisa mesmo do token/objeto `session`
atualizado (ex: passar pra uma chamada de API que exige o JWT mais recente)
— nesse caso ler `session` direto do closure dentro do efeito, mas ainda
assim manter a *decisão de re-executar* (array de deps) baseada em
`user.id`, não no objeto inteiro.

---

## Padrão: Prompt para Claude Code

**Quando usar:** Toda tarefa de código gerada pelo chat
**Estrutura:**

```markdown
# PROMPT PARA CLAUDE CODE

@CLAUDE.md @_build/current-state.md

[TÍTULO]

## TAREFA 1 — [Nome]
### Arquivo: [caminho]
ANTES: [código atual]
DEPOIS: [código corrigido]

## REGRAS
- ...
- AO FINALIZAR: atualizar _build/current-state.md
```

**Não usar quando:** Perguntas exploratórias ou de diagnóstico sem implementação

---

## Gotcha: `h1{font-size:...}` em index.css vence classes Tailwind `text-*`

**Quando desconfiar:** uma classe `text-sm`/`text-base`/`text-lg`/`md:text-*` aplicada a um `<h1>` parece não fazer efeito nenhum (fonte sempre no mesmo tamanho, responsivo ou não).
**Causa:** `src/index.css` define `h1{font-size:1.5rem;...}` **fora de qualquer `@layer`**. O Tailwind v4 (`@import 'tailwindcss'`) gera suas utilidades dentro de `@layer theme, base, components, utilities`. Nas CSS Cascade Layers, uma regra **sem layer** sempre vence qualquer regra **com layer**, não importa a especificidade — então esse `h1{}` bate qualquer `.text-*` aplicada a um `<h1>`, mesmo `!important`-free vs. sem-`!important`.
**Confirmado em:** `src/layout/HeaderGlobal.tsx` (fix v2.36.5, `_build/current-state.md`) — o `<h1>` do header sempre renderizou 24px, mesmo antes desse fix, apesar de já ter `text-base md:text-lg` no código desde antes.
**Como contornar:** usar o modifier `!important` do Tailwind v4 (sufixo `!`, ex. `text-sm!`) — `!important` sempre vence uma declaração normal, independente de layer. Verificar sempre com `getComputedStyle` (classe no HTML não é prova de efeito real).
**Não vale para:** `h2`-`h6` (a regra do index.css só define `h1`; os demais headings usam `font-size:inherit` e respondem normalmente às classes Tailwind).
