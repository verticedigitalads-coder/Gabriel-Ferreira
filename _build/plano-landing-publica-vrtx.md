# Landing VRTX — Etapas 1+2+3 (componentização · remover risco · CTA WhatsApp)

## Context

A landing pública do VRTX CRM **é** a tela de auth: `src/App.tsx:275-277` renderiza `<AuthPage />` quando não há sessão, e `src/modules/auth/AuthPage.tsx` (291 linhas) concentra nav, hero, mockup, features, steps, depoimentos, card de login e footer — tudo em um arquivo, com um `<style>` inline `lp-*` e hexes hardcoded.

Três problemas a resolver antes de qualquer trabalho de copy/pricing:

1. **Arquivo monolítico** — impossível iterar copy sem risco de quebrar o login.
2. **Risco comercial/jurídico** — depoimentos inventados (Rafael Marques/Marquemetal, Carla Lima, João Pereira), stats não comprovados (R$ 2M+, 500+ leads, 98% uptime) e a promessa "Comece grátis · Sem cartão · crie seu workspace em segundos". Essa última é uma **promessa quebrada de verdade**: não existe self-service. Quem clica autentica no Google, cai em `App.tsx:238-244`, `ensureWorkspaceForUser()` devolve `null` (`src/lib/supabaseWorkspace.ts:18-21`) e o usuário é deslogado com um `console.warn` — sem nenhuma mensagem na tela. Volta pra landing como se o botão não funcionasse.
3. **Sem caminho de conversão** — o CTA leva a um login que não pode dar certo para quem não é cliente.

Resultado esperado: landing componentizada (sem mudança visual no 1º commit), sem nenhuma claim falsa, com WhatsApp como CTA principal e feedback explícito para conta sem workspace.

**Decisões travadas:** conversão por WhatsApp (sem formulário/self-service); login Google continua, discreto; fonte Inter e tema dark/orange mantidos; nada de backend/RLS/auth/`handleLogin`; preços R$147/R$247 só como constante (não exibir ainda).

---

## Etapa 1 — Componentização (ZERO mudança visual)

Refactor mecânico. O commit precisa render DOM idêntico ao atual.

### Estrutura nova

```
src/modules/auth/
  AuthPage.tsx              ← orquestrador (handleLogin intacto + composição)
  landing/
    landingContent.ts       ← toda a copy, listas, PRICING, WhatsApp, whatsappUrl()
    landingStyles.tsx       ← <LandingStyles/>: o bloco <style> movido verbatim
    useScrollReveal.ts      ← o IntersectionObserver de AuthPage.tsx:13-32
    LandingNav.tsx
    LandingHero.tsx
    HeroMockup.tsx
    LandingFeatures.tsx
    LandingHowItWorks.tsx
    LandingTestimonials.tsx ← nasce aqui, é deletado na Etapa 2
    LandingLoginCta.tsx     ← recebe onLogin
    LandingFooter.tsx
```

### Regras do refactor

- **Copiar/colar, não reescrever.** Mesmos elementos, mesma ordem, mesmos `style={{}}`, mesmos hexes, mesmas classes `lp-*`. Nenhuma troca de hex por token de `tokens.css` nesta etapa (isso é mudança visual latente e blast radius desnecessário).
- `<LandingStyles/>` continua sendo o **primeiro filho** do `<div>` raiz, como hoje (`AuthPage.tsx:36-65`). Renderizar `<style>` sem `href`/`precedence` no React 19 mantém o elemento na posição — não hoisting.
- `useScrollReveal()` fica em `AuthPage` (efeito do pai roda depois da montagem dos filhos → `document.querySelectorAll('.lp-reveal')` continua achando tudo).
- `handleLogin` (`AuthPage.tsx:5-10`) **não muda uma linha**; passa como `onLogin` para `LandingLoginCta`.
- `landingContent.ts` recebe os arrays de dados como estão hoje (incl. `iconBg`/`iconColor`/gradientes). São registros de conteúdo já data-driven — separar texto de cor obrigaria a casar por chave e aumenta risco à toa.

### landingContent.ts — constantes que já nascem prontas para as etapas 2/3

```ts
import { SUPPORT_WHATSAPP_NUMBER } from '@/lib/support';

// TODO(Gabriel): trocar pelo WhatsApp COMERCIAL quando existir.
// Hoje aponta para o mesmo número do suporte (src/lib/support.ts).
export const SALES_WHATSAPP_NUMBER = String(SUPPORT_WHATSAPP_NUMBER);

// Provisório — ainda NÃO exibido na landing (etapa de pricing vem depois).
export const PRICING = {
  basico:   { nome: 'Básico',   precoMensal: 147, disponivel: true },
  completo: { nome: 'Completo', precoMensal: 247, disponivel: false,
              recursos: ['NF-e', 'Estoque', 'Equipe'] },
} as const;

export type WhatsappOrigem = 'nav' | 'hero' | 'cta-final' | 'sem-acesso';

export function whatsappUrl(origem: WhatsappOrigem): string {
  const texto = `Olá! Vim pelo site do VRTX CRM (${origem}) e quero conhecer o sistema.`;
  return `https://wa.me/${SALES_WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}
```

Reusa `SUPPORT_WHATSAPP_NUMBER` (`src/lib/support.ts:3`) em vez de duplicar o número — regra 2 do CLAUDE.md. O padrão `https://wa.me/${n}?text=${encodeURIComponent(...)}` é o mesmo já usado em `src/lib/support.ts:10`, `src/utils/pixWhatsapp.ts:71` e `src/hooks/useLeadActions.ts:15`.

### Validação da Etapa 1 (mais forte que "olhar e achar parecido")

Antes de editar, com `npm run dev` e a landing aberta em aba anônima, no console:
`copy(document.getElementById('root').innerHTML)` → salvar em `<scratchpad>/landing-antes.html`.
Depois do refactor, repetir → `landing-depois.html`, e `diff` os dois. **Diff vazio = etapa 1 correta.**

**Commit 1:** `refactor(landing): extrair AuthPage em componentes + landingContent`

---

## Etapa 2 — Remover claims falsas

Só remoção/reescrita de conteúdo. Nada de estrutura nova.

| O quê | Onde (hoje) | Ação |
|---|---|---|
| 3 depoimentos fictícios | `AuthPage.tsx:203-231` | **Deletar a seção inteira** + `LandingTestimonials.tsx` + os dados no content + link "Depoimentos" no nav (`:77`) e no footer (`:282`) |
| Stats do hero R$2M+ / 500+ / 98% | `:100-107` | Deletar o bloco (não substituir por número fraco) |
| Badge "⚡ Comece grátis · Sem cartão" | `:237` | Deletar |
| "crie seu workspace em segundos e teste todas as funcionalidades" | `:239` | Reescrever: onboarding é feito pela equipe |
| CTA "Começar agora — Grátis →" | `:97` | Tirar a promessa de grátis (vira WhatsApp na Etapa 3) |
| "Do cadastro ao primeiro orçamento em menos de 10 minutos" | `:184` | Reescrever sem promessa de tempo |
| Step 1 "Entre com Google, configure logo... poucos cliques" | `:188` | Reescrever: "Fale com a equipe — configuramos seu workspace, logo, dados PIX e modelo de orçamento" |
| Step 2 "importação em lote ou captura via formulário" | `:189` | Remover as duas funções não confirmadas; manter cadastro manual + priorização por IA |
| Dot "Ao vivo" no mockup | `:118` (+ CSS `.lp-live-dot`/`@keyframes lp-pulse` em `:53-54`) | Remover o indicador e o CSS órfão |
| URL na barra do mockup | `:117` | `vertice-digital-crm.vercel.app` → `app.vrtxcrm.com.br` |
| "💾 Backup diário" | `:265` | Remover (não verificável no código) |
| "🛡️ LGPD compliant" | `:266` | Virar "Termos e Política de Privacidade" linkado — tem lastro real (`/termos`, `/privacidade`, `TermsGate`) |

**Fica** (tudo verificável no código): priorização por IA (`src/modules/ia/iaService.ts`), PDF com PIX + assinatura (`server.js`, `templates/orcamento-v2.html`, `SignaturePad.tsx`), dashboard executivo (`dashboardSelectors.ts`), painel operacional, financeiro, multi-workspace (RLS), "🔒 SSL criptografado", mockup do dashboard (é a UI real, com dados de exemplo).

**Commit 2:** `fix(landing): remover depoimentos ficticios, stats nao comprovados e promessa de self-service`

---

## Etapa 3 — CTA WhatsApp + feedback de conta sem acesso

### 3a. CTAs

- **Nav:** primário "Falar no WhatsApp" (`whatsappUrl('nav')`) + ghost "Entrar" → `#login`.
- **Hero:** primário "Falar no WhatsApp" (`whatsappUrl('hero')`) + ghost "Ver funcionalidades" → `#features`.
- **Card `#login`:** primário "Falar no WhatsApp" (`whatsappUrl('cta-final')`); abaixo do divisor, "Já sou cliente" + o botão Google atual (`.lp-google`, `onLogin`) em posição discreta. O mailto "Falar com vendas" (`:252-254`) sai do card e vira link do footer.
- Todo `<a>` de WhatsApp: `target="_blank" rel="noopener noreferrer"` + `color` explícito.

### 3b. Feedback de conta sem workspace

`AccessNotice.tsx` — banner logo abaixo do nav: ícone, "Sua conta ainda não tem acesso ao VRTX CRM. Fale com nossa equipe para começar.", botão "Falar no WhatsApp" (`whatsappUrl('sem-acesso')`) e um X para fechar. Toque mínimo 44px.

`AuthPage` ganha props **opcionais** (`<AuthPage />` sem props continua válido):
```tsx
export function AuthPage({ notice, onDismissNotice }: {
  notice?: 'sem-acesso' | 'erro-init' | null;
  onDismissNotice?: () => void;
} = {}) 
```

**`src/App.tsx` — mudança 100% aditiva:**
1. `const [authNotice, setAuthNotice] = useState<'sem-acesso' | 'erro-init' | null>(null);` junto aos states existentes (`:173-178`).
2. Em `init()` (`:231`), logo após `if (!session) return;`: `setAuthNotice(null)` (limpa aviso velho num novo login).
3. Antes do `signOut` de `:242`: `setAuthNotice('sem-acesso')`.
4. Antes do `signOut` de `:254` (catch genérico): `setAuthNotice('erro-init')` — hoje esse caminho mostraria "sua conta não tem acesso" para uma falha de rede, que é mensagem errada.
5. `:276` → `return <AuthPage notice={authNotice} onDismissNotice={() => setAuthNotice(null)} />;`

**A lógica de autorização e os dois `signOut()` ficam exatamente como estão.** Funciona porque `App` não desmonta no `signOut`: o state sobrevive ao `session → null` e a landing remonta já com o aviso. Não uso `ToastContainer` — ele só está montado dentro de `MainLayout.tsx:135`, invisível nesse caminho.

**Commit 3:** `feat(landing): CTA WhatsApp + aviso para conta sem workspace`

---

## Armadilhas de CSS (verificar, não consertar)

`src/index.css` tem regras globais **fora de `@layer`**, que por isso vencem qualquer utility do Tailwind v4:

- `a { color: var(--cor-primaria) }` (`index.css:207`, `--cor-primaria: #2563eb`) — todo `<a>` novo **precisa de `color` explícito**, senão vira azul no meio da landing dark. As seções atuais já fazem isso (`color:'inherit'` ou hex direto); manter o padrão.
- `a:hover { text-decoration: underline }` (`:212`, especificidade 0-1-1) **vence** `.lp-btn { text-decoration:none }` (0-1-0) — os botões-link já sublinham no hover hoje. Corrigir **na Etapa 3**, dentro do `<style>` da própria landing: `.lp-btn:hover{text-decoration:none}`. Nunca na Etapa 1 (quebraria o "zero mudança visual").
- `:root` duplicado (`index.css:23-67` depois do `@import` de `tokens.css`) e `::selection` claro: **não mexer** — blast radius amplo, já documentado em `_build/current-state.md:15`.

`main.tsx:16-41` roteia `/termos` e `/privacidade` por `pathname` antes de montar `<App/>` — nada nesta tarefa toca isso; os links continuam `<a href="/termos">`.

---

## Verificação

Por etapa: `npx tsc --noEmit` e `npm run build` limpos.

1. **Etapa 1 — diff de DOM** (acima): `landing-antes.html` vs `landing-depois.html`, diff vazio.
2. **Login real (obrigatório, você executa):** aba anônima → `npm run dev` → "Entrar" → Google → workspace carrega → CRM abre. É o teste que não pode falhar.
3. **Conta sem workspace:** login em aba anônima com uma conta Google **secundária** que não tenha linha em `workspace_members` → o banner aparece na landing antes/junto do logout. Sem 2ª conta: stub local temporário `return null` em `ensureWorkspaceForUser()` (`src/lib/supabaseWorkspace.ts:5`), testar, reverter — **nunca commitar**.
4. **CTA WhatsApp:** os 4 links abrem `wa.me/5534998049083` com o texto certo e `origem` distinta (nav/hero/cta-final/sem-acesso).
5. **Rotas legais:** `localhost:5173/termos` e `/privacidade` renderizam.
6. **Varredura final:** `grep -ri "Rafael Marques\|Carla Lima\|João Pereira\|Comece grátis\|Sem cartão\|R\$ 2M\|98%" src/modules/auth/` → zero resultados.
7. **Mobile:** DevTools 375px — nav, hero, banner e card de login sem overflow horizontal, toques ≥44px.

Ao final: atualizar `_build/current-state.md` (nova estrutura `landing/`, claims removidas, feedback de conta sem workspace, TODO do WhatsApp comercial).
