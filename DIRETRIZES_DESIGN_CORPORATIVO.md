# 🎨 Diretrizes de Design Corporativo - CRM Pro

## Visão Geral

Transformação do visual "startup" (arredondado, colorido, espaçado) para interface **corporativa B2B** (densa, profissional, funcional).

---

## 📐 Princípios de Design

### 1. Densidade > Espaço Vazio
- Menos padding excessivo
- Mais informação visível por tela
- Layout compacto mas legível

### 2. Clareza > Estética
- Hierarquia visual clara
- Cores funcionais, não decorativas
- Tipografia profissional

### 3. Funcionalidade > Animação
- Animações discretas
- Feedback imediato
- Performance prioritária

---

## 🎨 Paleta de Cores Corporativa

### Cores Neutras (Base)

```css
--cor-fundo: #F5F5F5;        /* Cinza muito claro */
--cor-surface: #FFFFFF;       /* Branco puro */
--cor-borda: #D1D5DB;         /* Cinza médio */
--cor-texto-principal: #111827;  /* Quase preto */
--cor-texto-secundario: #6B7280; /* Cinza escuro */
--cor-sidebar: #1F2937;       /* Cinza muito escuro */
```

### Cores Funcionais

| Cor | Hex | Uso |
|-----|-----|-----|
| 🔴 Vermelho Crítico | `#DC2626` | Erros, riscos, leads críticos |
| 🟠 Laranja Alerta | `#EA580C` | Prioridade alta, warnings |
| 🟡 Amarelo Atenção | `#CA8A04` | Prioridade média, pendências |
| 🟢 Verde Sucesso | `#16A34A` | Fechados, receitas, sucesso |
| 🔵 Azul Ação | `#2563EB` | Ações primárias, links, info |
| 🟣 Roxo IA | `#7C3AED` | Recursos de IA, premium |

### Estados de Hover

```css
--hover-claro: #F9FAFB;      /* Hover em fundos claros */
--hover-escuro: #E5E7EB;     /* Hover em botões */
--hover-ativo: #DBEAFE;      /* Item selecionado */
```

---

## 🔲 Bordas e Radius

### Radius Máximo: 8px (não exagerado)

```css
/* Componentes */
--radius-sm: 4px;    /* Badges, pequenos */
--radius-md: 6px;    /* Inputs, botões */
--radius-lg: 8px;    /* Cards, modais */
--radius-xl: 10px;   /* Containers grandes */
```

### Comparação

| Elemento | Antes (Startup) | Depois (Corporativo) |
|----------|-----------------|---------------------|
| Card | `rounded-xl` (12px) | `rounded-md` (6px) |
| Botão | `rounded-lg` (8px) | `rounded` (4px) |
| Input | `rounded-lg` (8px) | `rounded-md` (6px) |
| Badge | `rounded-full` | `rounded-sm` (2px) |
| Modal | `rounded-2xl` (16px) | `rounded-lg` (8px) |

---

## 📏 Densidade e Spacing

### Padding Reduzido

| Elemento | Antes | Depois |
|----------|-------|--------|
| Card | `p-6` (24px) | `p-4` (16px) |
| Botão | `px-6 py-3` | `px-4 py-2` |
| Input | `py-2.5` | `py-2` |
| Header | `p-8` | `p-6` |
| Lista item | `p-4` | `p-3` |

### Gap entre Elementos

```css
--gap-card: 16px;     /* Entre cards */
--gap-section: 24px;  /* Entre seções */
--gap-inline: 12px;   /* Entre itens inline */
--gap-compact: 8px;   /* Elementos relacionados */
```

---

## 🔤 Tipografia Profissional

### Fontes

```css
font-family: 'Inter', system-ui, sans-serif;
```

### Hierarquia

| Elemento | Tamanho | Peso | Cor |
|----------|---------|------|-----|
| Título Página | `text-2xl` (24px) | `font-bold` | `#111827` |
| Título Seção | `text-lg` (18px) | `font-semibold` | `#111827` |
| Label | `text-xs` (12px) | `font-medium` | `#6B7280` |
| Dado Numérico | `text-2xl` (24px) | `font-semibold` | `#111827` |
| Texto Corpo | `text-sm` (14px) | `font-normal` | `#374151` |
| Texto Secundário | `text-xs` (12px) | `font-normal` | `#9CA3AF` |

### Regras

- **Números grandes**: Dados importantes em destaque
- **Labels pequenas**: Descrições discretas
- **Contraste alto**: Legibilidade em qualquer ambiente
- **Sem all-caps excessivo**: Apenas em badges pequenos

---

## 🎴 Estrutura de Card Corporativo

### Exemplo Base

```tsx
<Card className="p-4 border border-gray-200 bg-white shadow-sm">
  {/* Header do Card */}
  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
    <h3 className="text-sm font-semibold text-gray-900">Título</h3>
    <Badge variant="info">Status</Badge>
  </div>
  
  {/* Conteúdo */}
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">Label</span>
      <span className="text-sm font-medium text-gray-900">Valor</span>
    </div>
  </div>
  
  {/* Footer (opcional) */}
  <div className="mt-3 pt-3 border-t border-gray-100">
    <p className="text-xs text-gray-500">Informação adicional</p>
  </div>
</Card>
```

### Variações

#### Stat Card (Dashboard)

```tsx
<div className="bg-white border border-gray-200 rounded-md p-4">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        RECEITA DO MÊS
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">
        R$ 45.230,00
      </p>
      <p className="mt-1 text-xs font-medium text-green-600">
        ↑ 12.5% vs mês anterior
      </p>
    </div>
    <div className="p-2 bg-gray-50 rounded">
      <DollarSign className="w-5 h-5 text-gray-600" />
    </div>
  </div>
</div>
```

#### Card de Lead (Lista)

```tsx
<div className="bg-white border border-gray-200 rounded-md p-3 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
  <div className="flex items-center gap-3">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-semibold text-gray-900 truncate">João Silva</h4>
        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-sm">
          CRÍTICO
        </span>
      </div>
      <p className="text-sm text-gray-500 truncate">Portão de alumínio</p>
      <div className="flex items-center gap-2 mt-2">
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-sm">
          Novo
        </span>
        <span className="text-xs text-red-600 font-medium">
          8d sem contato
        </span>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-semibold text-gray-900">R$ 5.200</p>
      <p className="text-xs text-gray-500">(11) 99123-4567</p>
    </div>
  </div>
</div>
```

---

## 📊 Tabela Profissional

### Estrutura Base

```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50">
        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-4 py-3">
          Cliente
        </th>
        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-4 py-3">
          Serviço
        </th>
        <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wide px-4 py-3">
          Valor
        </th>
        <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wide px-4 py-3">
          Status
        </th>
        <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wide px-4 py-3">
          Ações
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <div>
            <p className="font-medium text-gray-900">João Silva</p>
            <p className="text-xs text-gray-500">joao@email.com</p>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          Portão de alumínio
        </td>
        <td className="px-4 py-3 text-right">
          <span className="font-semibold text-gray-900">R$ 5.200,00</span>
        </td>
        <td className="px-4 py-3 text-center">
          <Badge variant="warning">Orçado</Badge>
        </td>
        <td className="px-4 py-3 text-right">
          <Button variant="ghost" size="sm">Ver</Button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Regras de Tabela

- **Header fixo**: Para listas longas
- **Zebra striping sutil**: `divide-y` para separação
- **Hover discreto**: `hover:bg-gray-50`
- **Padding compacto**: `px-4 py-3`
- **Texto alinhado**: Números à direita, texto à esquerda

---

## 🎛 Sidebar Vertical (Estilo ERP)

### Estrutura

```tsx
<aside className="w-56 bg-gray-900 text-white flex flex-col h-screen border-r border-gray-700">
  {/* Logo Area */}
  <div className="p-4 border-b border-gray-700">
    <h1 className="text-lg font-bold text-white">CRM Pro</h1>
    <p className="text-xs text-gray-400 mt-0.5">Sistema de Gestão</p>
  </div>

  {/* Navigation */}
  <nav className="flex-1 py-2">
    <ul className="space-y-0.5 px-2">
      <li>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium bg-blue-600 text-white">
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </button>
      </li>
      <li>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
          <Users className="w-5 h-5" />
          Leads
        </button>
      </li>
    </ul>
  </nav>

  {/* Footer */}
  <div className="p-3 border-t border-gray-700">
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      <span>Offline</span>
    </div>
  </div>
</aside>
```

### Características

- **Fundo escuro**: `bg-gray-900` (#1F2937)
- **Texto claro**: Contraste alto
- **Ícones consistentes**: 20px (w-5 h-5)
- **Hover sutil**: Mudança de background
- **Item ativo**: Destaque com cor primária

---

## 🔘 Botões Corporativos

### Variantes

```tsx
// Primário (Ação principal)
<Button variant="primary" className="bg-blue-600 hover:bg-blue-700">
  Salvar
</Button>

// Secundário (Ações comuns)
<Button variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700">
  Cancelar
</Button>

// Danger (Destrutivas)
<Button variant="danger" className="bg-red-600 hover:bg-red-700">
  Excluir
</Button>

// Ghost (Ações secundárias)
<Button variant="ghost" className="hover:bg-gray-100 text-gray-600">
  <Edit className="w-4 h-4" />
</Button>

// Success (Confirmação)
<Button variant="success" className="bg-green-600 hover:bg-green-700">
  Confirmar
</Button>
```

### Tamanhos

| Size | Padding | Font | Uso |
|------|---------|------|-----|
| sm | `px-2.5 py-1.5` | `text-xs` | Ações em tabelas |
| md | `px-4 py-2` | `text-sm` | Padrão |
| lg | `px-6 py-3` | `text-base` | CTAs principais |

### Estados

```css
/* Normal */
bg-blue-600 text-white

/* Hover */
hover:bg-blue-700

/* Focus */
focus:ring-2 focus:ring-blue-500 focus:ring-offset-1

/* Active */
active:scale-[0.98]

/* Disabled */
disabled:opacity-50 disabled:cursor-not-allowed
```

---

## 🏷️ Badges e Status

### Status Badge

```tsx
<span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-blue-100 text-blue-700">
  Novo
</span>
```

### Cores por Status

| Status | Background | Texto |
|--------|-----------|-------|
| Novo | `bg-blue-100` | `text-blue-700` |
| Em Atendimento | `bg-purple-100` | `text-purple-700` |
| Orçado | `bg-yellow-100` | `text-yellow-700` |
| Fechado | `bg-green-100` | `text-green-700` |
| Perdido | `bg-gray-100` | `text-gray-700` |

### Priority Badge

```tsx
<span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold bg-red-500 text-white">
  CRÍTICO
</span>
```

---

## 📱 Responsividade

### Breakpoints

```css
/* Mobile */
< 640px: 1 coluna, menu hamburguer

/* Tablet */
640px - 1024px: 2 colunas, sidebar reduzida

/* Desktop */
> 1024px: Layout completo, sidebar fixa
```

### Grid Dashboard

```tsx
/* Mobile */
grid-cols-1 gap-3

/* Tablet */
md:grid-cols-2 gap-4

/* Desktop */
lg:grid-cols-4 gap-4
```

---

## 🎯 Checklist de Aplicação

### Components UI

- [ ] `Button` - Radius 4px, padding reduzido
- [ ] `Card` - Radius 6px, sombra leve
- [ ] `Input` - Radius 6px, border cinza
- [ ] `Select` - Igual input
- [ ] `Modal` - Radius 8px, header com border
- [ ] `Badge` - Radius 2px, cores funcionais
- [ ] `Toast` - Radius 6px, ícones profissionais

### Layout

- [ ] `Sidebar` - Fundo escuro, texto claro
- [ ] `MainLayout` - Background cinza claro
- [ ] `Header` - Padding reduzido, border inferior

### Modules

- [ ] `Dashboard` - Cards densos, números grandes
- [ ] `Leads` - Lista compacta, badges visíveis
- [ ] `Kanban` - Cards compactos, colunas definidas
- [ ] `Financeiro` - Tabela profissional, cores funcionais

---

## 📋 Referências Visuais

### Sistemas Corporativos

- SAP Fiori
- Oracle NetSuite
- Microsoft Dynamics 365
- Salesforce Classic

### Características Comuns

1. **Densidade de informação**
2. **Cores funcionais** (não decorativas)
3. **Tipografia clara**
4. **Hierarquia visual forte**
5. **Feedback imediato**
6. **Consistência em todos módulos**

---

## ⚠️ O Que Evitar

### ❌ Não Fazer

- Gradientes exagerados
- Sombras muito fortes
- Radius > 10px
- Emojis em ambiente principal
- Animações lentas
- Espaço em branco excessivo
- Cores neon ou muito saturadas
- Fontes decorativas

### ✅ Fazer

- Cores sólidas e funcionais
- Sombras sutis (shadow-sm)
- Radius 4-8px
- Ícones profissionais (Lucide)
- Animações rápidas (< 200ms)
- Layout denso e informativo
- Paleta neutra + cores de destaque
- Inter como fonte principal

---

## 🔄 Migração Gradual

### Fase 1: Components Base
1. Atualizar `Button`
2. Atualizar `Card`
3. Atualizar `Input`

### Fase 2: Layout
1. Atualizar `Sidebar`
2. Atualizar cores globais
3. Ajustar spacing

### Fase 3: Modules
1. Dashboard
2. Leads
3. Demais módulos

### Fase 4: Refinamento
1. Testar em diferentes telas
2. Ajustar contrastes
3. Validar com usuários

---

**Documento criado:** Janeiro 2025
**Versão:** 1.0
**Status:** Pronto para implementação
