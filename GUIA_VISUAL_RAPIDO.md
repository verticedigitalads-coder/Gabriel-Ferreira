# 🎨 Guia Visual Rápido - CRM Pro Corporativo

## Paleta de Cores

### Cores Primárias

```
🔵 AZUL AÇÃO      #2563EB  → Botões primários, links, foco
🟢 VERDE SUCESSO  #16A34A  → Fechados, receitas, confirmações
🔴 VERMELHO       #DC2626  → Crítico, erros, perdas
🟠 LARANJA        #EA580C  → Alta prioridade, alerts
🟡 AMARELO        #CA8A04  → Média prioridade, warnings
🟣 ROXO IA        #7C3AED  → Recursos de IA
```

### Cores Neutras

```
⬛ Sidebar        #1F2937  → Menu lateral
⬜ Superfície     #FFFFFF  → Cards, modais
⬛ Texto          #111827  → Títulos
⬜ Cinza Médio    #6B7280  → Labels
⬜ Cinza Claro    #9CA3AF  → Texto secundário
⬜ Fundo          #F5F5F5  → Background
```

---

## Tipografia

### Hierarquia

```
TÍTULO PÁGINA     24px (text-2xl)   Bold
TÍTULO SEÇÃO      18px (text-lg)    Semibold
LABEL             12px (text-xs)    Medium, Uppercase
DADO NUMÉRICO     24px (text-2xl)   Bold
TEXTO CORPO       14px (text-sm)    Normal
TEXTO SECUNDÁRIO  12px (text-xs)    Normal
```

### Exemplo Prático

```
DASHBOARD EXECUTIVO          ← 24px Bold
Atualizado em 15 de janeiro  ← 14px Normal

TOTAL DE LEADS               ← 12px Medium Uppercase
118                          ← 24px Bold
↑ 12.5%                      ← 12px Normal
```

---

## Componentes

### Button

```tsx
// Primário (Ação principal)
<Button variant="primary">Salvar</Button>
// → Azul #2563EB, branco, shadow-sm

// Secundário (Cancela)
<Button variant="secondary">Cancelar</Button>
// → Cinza claro, texto escuro, border

// Danger (Destrutiva)
<Button variant="danger">Excluir</Button>
// → Vermelho #DC2626, branco

// Ghost (Ícones)
<Button variant="ghost"><Edit /></Button>
// → Transparente, hover cinza
```

**Tamanhos:**
- **sm:** 12px, px-2.5 py-1.5 → Ações em tabela
- **md:** 14px, px-4 py-2 → Padrão
- **lg:** 16px, px-6 py-2.5 → CTAs

---

### Card

```tsx
<Card className="p-4">
  <h3 className="text-sm font-semibold">Título</h3>
  <p className="text-2xl font-bold">118</p>
  <p className="text-xs text-gray-500">Total de leads</p>
</Card>
```

**Características:**
- Background branco
- Border cinza claro (#E5E7EB)
- Radius 6px (rounded-md)
- Sombra leve (shadow-sm)
- Hover: shadow-md

---

### Badge

```tsx
// Status
<span className="bg-blue-100 text-blue-700">Novo</span>
<span className="bg-green-100 text-green-700">Fechado</span>
<span className="bg-yellow-100 text-yellow-700">Orçado</span>
<span className="bg-red-100 text-red-700">Perdido</span>

// Prioridade
<span className="bg-red-600 text-white font-bold">CRÍTICO</span>
<span className="bg-orange-600 text-white font-bold">ALTO</span>
<span className="bg-yellow-600 text-white font-bold">MÉDIO</span>
<span className="bg-green-600 text-white font-bold">BAIXO</span>
```

**Regras:**
- Radius mínimo (2px)
- Font-semibold ou bold
- Uppercase para prioridade
- Emoji antes do label (temperatura)

---

### Input

```tsx
<Input
  label="Nome do Cliente"
  placeholder="Digite o nome..."
  error="Campo obrigatório"
/>
```

**Características:**
- Label: 14px Semibold, margin-bottom 1.5rem
- Input: 14px, border cinza, radius 6px
- Focus: Ring azul 2px
- Error: Border vermelha, texto 12px

---

### Modal

```
┌──────────────────────────────┐
│ Título do Modal        ✕     │ ← Header gray-50, bold
├──────────────────────────────┤
│                              │
│   Conteúdo                   │
│                              │
│            [Cancelar] [Salvar]│ ← Footer actions
└──────────────────────────────┘
```

**Características:**
- Radius 8px
- Header com border inferior
- Background cinza claro no header
- Sombra XL

---

## Layout

### Sidebar (ERP Style)

```
┌─────────────────────┐
│ CRM Pro             │ ← Dark (#1F2937)
│ Sistema de Gestão   │
├─────────────────────┤
│ ▶ Dashboard         │ ← Ativo: Azul
│   Leads             │ ← Inativo: Gray
│   Kanban            │
│   Orçamentos        │
│   Financeiro        │
│   Notas             │
│   IA Assistente     │
├─────────────────────┤
│ Dados               │
│   Exportar Backup   │
│   Importar Backup   │
├─────────────────────┤
│ ● Offline-First     │ ← Status
└─────────────────────┘
```

**Largura:** 224px (w-56)
**Background:** #1F2937
**Texto:** Branco / Cinza claro

---

### Dashboard Grid

```
Desktop (lg)
┌──────┬──────┬──────┬──────┐
│ Card │ Card │ Card │ Card │
├──────┴──────┴──────┴──────┤
│ Painel Emergência         │
├───────────────────────────┤
│ ┌─────────┬─────────────┐ │
│ │Follow-up│  Funil      │ │
│ ├─────────┼─────────────┤ │
│ │Últimos  │ Temperatura │ │
│ └─────────┴─────────────┘ │
└───────────────────────────┘
```

**Grid:**
- Mobile: 1 coluna
- Tablet: 2 colunas
- Desktop: 4 colunas

**Gap:**
- Entre cards: 16px
- Entre seções: 24px

---

## Estados

### Hover

```css
Button: bg-blue-700 (escurece 10%)
Card: border-gray-300 + shadow-md
Link: underline
ListItem: bg-gray-50
```

### Focus

```css
Input: ring-2 ring-blue-600
Button: ring-2 ring-offset-1
Link: outline-2 outline-blue-600
```

### Active

```css
Button: scale-[0.98] (feedback tátil)
```

### Disabled

```css
Todos: opacity-50 cursor-not-allowed
```

---

## Ícones (Lucide)

**Tamanhos:**
- Sidebar: w-5 h-5 (20px)
- Button sm: w-4 h-4 (16px)
- Button md: w-4 h-4 (16px)
- Badge: w-3 h-3 (12px)

**Cores:**
- Ações: #2563EB (azul)
- Sucesso: #16A34A (verde)
- Perigo: #DC2626 (vermelho)
- Info: #6B7280 (cinza)

---

## Espaçamento

### Padding

```
Card: p-4 (16px)
Button: px-4 py-2 (16px 8px)
Input: px-3 py-2 (12px 8px)
Section: p-6 (24px)
```

### Gap

```
Inline: gap-2 (8px)
Card: gap-4 (16px)
Section: gap-6 (24px)
```

### Margin

```
Label-Input: mb-1.5 (6px)
Section: mb-6 (24px)
Paragraph: mb-4 (16px)
```

---

## Responsividade

### Breakpoints

```css
Mobile:  < 640px   (1 coluna)
Tablet:  640-1024px (2 colunas)
Desktop: > 1024px  (4 colunas)
```

### Sidebar

```
Mobile:  Oculta (hamburguer)
Tablet:  Reduzida (64px)
Desktop: Completa (224px)
```

---

## Exemplo Completo

```tsx
// Card de Lead Corporativo
<Card className="p-3 hover:shadow-md cursor-pointer">
  <div className="flex items-center gap-3">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-semibold text-gray-900">
          João Silva
        </h4>
        <span className="bg-red-600 text-white px-2 py-0.5 rounded-sm text-xs font-bold uppercase">
          CRÍTICO
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Portão de alumínio
      </p>
      <div className="flex items-center gap-2 mt-2">
        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-sm text-xs font-semibold">
          Novo
        </span>
        <span className="text-xs text-red-600 font-medium">
          8d sem contato
        </span>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold text-gray-900">
        R$ 5.200
      </p>
      <p className="text-xs text-gray-500">
        (11) 99123-4567
      </p>
    </div>
  </div>
</Card>
```

---

## ✅ Checklist Visual

### Ao criar novo componente:

- [ ] Radius máximo 8px?
- [ ] Sombra leve (shadow-sm)?
- [ ] Cores funcionais (não decorativas)?
- [ ] Font-weight adequado?
- [ ] Padding compacto?
- [ ] Hover definido?
- [ ] Focus visível?
- [ ] Contraste suficiente?

### Ao revisar tela:

- [ ] Hierarquia clara?
- [ ] Espaços consistentes?
- [ ] Cores com propósito?
- [ ] Tipografia legível?
- [ ] Estados definidos?
- [ ] Responsivo?

---

**Guia criado:** Janeiro 2025
**Versão:** 1.0
**Status:** Referência oficial
