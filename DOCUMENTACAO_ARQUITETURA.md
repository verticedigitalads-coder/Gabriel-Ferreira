# CRM Pro - Documentação de Arquitetura Técnica

## Visão Geral

Sistema CRM profissional **offline-first** para prestadores de serviço (serralheria, drywall, reformas), desenvolvido com React 18, TypeScript, Zustand, IndexedDB e Tailwind CSS.

---

## 📁 Estrutura de Diretórios

```
src/
├── app/                    # Ponto de entrada da aplicação
├── layout/                 # Componentes de layout (Sidebar, MainLayout)
├── modules/                # Módulos de negócio
│   ├── dashboard/          # Dashboard executivo clicável
│   ├── leads/              # Gestão completa de leads
│   ├── kanban/             # Kanban com drag-and-drop
│   ├── orcamentos/         # Orçamentos com cálculo automático
│   ├── financeiro/         # Controle financeiro
│   ├── notas/              # Controle de notas fiscais
│   └── ia/                 # IA assistente estratégica
├── services/               # Serviços auxiliares (seed data)
├── store/                  # Zustand store global
├── types/                  # Tipos TypeScript
├── lib/                    # Bibliotecas internas
│   ├── db.ts               # IndexedDB operations
│   └── priority.ts         # Sistema de prioridade automática
├── components/             # Componentes UI reutilizáveis
│   └── ui/                 # Componentes base (Button, Card, Modal, etc.)
└── hooks/                  # Hooks personalizados
    ├── useDebounce.ts      # Debounce para filtros
    └── useLeadActions.ts   # Ações comuns de leads
```

---

## 🏗 Princípios Arquiteturais

### Separação de Responsabilidades

1. **UI nunca contém regra pesada** → Componentes são burros, recebem dados e callbacks
2. **Services nunca contêm JSX** → Lógica de negócio pura, testável
3. **Store nunca contém cálculo complexo** → Apenas estado e ações simples

### Padrões Implementados

- **Offline-First**: IndexedDB como banco principal, sincronização futura
- **Code Splitting**: Lazy loading por módulo/rota
- **Memoização**: Selectors do Zustand para cálculos de dashboard
- **Debounce**: Filtros de busca com debounce de 300ms
- **Imutabilidade**: Atualizações de estado sempre criam novos objetos

---

## 📊 Modelo de Dados

### Lead (Entidade Principal)

```typescript
interface Lead {
  id: string;                    // UUID v4
  workspaceId: string;           // Multi-tenant ready
  nome: string;
  telefone: string;
  email: string;
  servico: string;
  status: LeadStatus;            // novo | atendimento | orcado | fechado | perdido
  temperatura: LeadTemperature;  // frio | morno | quente
  prioridadeScore: number;       // 0-20+ (calculado automaticamente)
  prioridadeLevel: PriorityLevel;// baixo | medio | alto | critico
  ultimoContato: string | null;  // ISO date
  proximoContato: string | null; // ISO date
  orcamentoEnviado: boolean;
  valorOrcado: number;
  resumo: string;
  observacoes: string;
  historico: HistoricoEntry[];   // Audit trail completo
  createdAt: string;
  updatedAt: string;
}
```

### Sistema de Prioridade Automática

**Regras de Pontuação:**

| Critério | Pontos |
|----------|--------|
| Temperatura = quente | +5 |
| >7 dias sem contato | +5 |
| >3 dias sem contato | +3 |
| Orçamento enviado | +3 |
| Valor > R$ 5.000 | +2 |
| Valor > R$ 10.000 | +4 |
| Follow-up vencido | +4 |

**Classificação:**
- 0–4 → Baixo (🟢)
- 5–8 → Médio (🟡)
- 9–12 → Alto (🟠)
- 13+ → Crítico (🔴)

**Recalculo automático:** Sempre que qualquer campo do lead é atualizado.

---

## 🧠 IA Assistente Estratégica

### Localização
`src/modules/ia/iaService.ts`

### Funcionalidades

1. **Análise de Risco de Perda**
   - Detecta leads que sumiram após orçamento
   - Identifica inatividade prolongada
   - Classifica em: baixo, medio, alto, critico

2. **Nível de Urgência (1-5)**
   - Baseado em tempo sem contato
   - Considera valor da oportunidade
   - Prazos vencidos aumentam urgência

3. **Estratégia de Abordagem**
   - Gera recomendações específicas por contexto
   - Considera status, valor, tempo sem contato

4. **Mensagem WhatsApp Pronta**
   - Personalizada por status e tempo sem contato
   - Tom adequado para cada situação

5. **Data Ideal de Follow-up**
   - Calculada automaticamente baseada na urgência
   - Ajustada por temperatura e status

### Critérios Estratégicos

```
✅ Se pediu orçamento detalhado → intenção real
⚠️ Se sumiu após envio de valor → risco médio
🔥 Se mencionou prazo curto → urgência alta
⭐ Se pediu visita técnica → alta probabilidade
❌ Se falou "vou ver" sem prazo → risco alto
```

### Regras de Ouro

- ❌ Nunca inventar dados
- ❌ Nunca prometer fechamento
- ✅ Ser conservador nas previsões
- ✅ Priorizar leads com maior probabilidade real
- ✅ Identificar leads para descarte

---

## 🗄 IndexedDB Schema

### Banco: `crm-pro-db` (versão 1)

#### Stores

**workspaces**
```typescript
{
  key: string;        // workspaceId
  value: Workspace
}
```

**leads**
```typescript
{
  key: string;        // leadId
  value: Lead;
  indexes: {
    'by-workspace': string;
    'by-status': string;
    'by-temperatura': string;
    'by-prioridade': number;
  }
}
```

**orcamentos**
```typescript
{
  key: string;        // orcamentoId
  value: Orcamento;
  indexes: {
    'by-workspace': string;
    'by-lead': string;
    'by-status': string;
  }
}
```

**transactions**
```typescript
{
  key: string;        // transactionId
  value: Transaction;
  indexes: {
    'by-workspace': string;
    'by-tipo': string;
    'by-data': string;
  }
}
```

**notas**
```typescript
{
  key: string;        // notaId
  value: Nota;
  indexes: {
    'by-workspace': string;
    'by-status': string;
  }
}
```

---

## 🎨 Diretrizes Visuais

### Paleta de Cores Funcional

| Cor | Significado | Uso |
|-----|-------------|-----|
| 🔴 Vermelho | Crítico/Urgente | Leads críticos, riscos, erros |
| 🟠 Laranja | Alto/Atenção | Prioridade alta, alertas |
| 🟡 Amarelo | Médio/Risco | Prioridade média, warnings |
| 🟢 Verde | Sucesso/Ganho | Leads fechados, receitas |
| 🔵 Azul | Ação/Informação | Leads novos, ações primárias |

### Estilo Corporativo

- **Bordas**: `rounded-md` (4px) - não exageradamente arredondado
- **Sombras**: `shadow-sm` para cards, `shadow-lg` para modais
- **Densidade**: Layout denso, máximo de informação visível
- **Hierarquia**: Números grandes (text-2xl), labels pequenas (text-xs)
- **Feedback**: Hover discreto, active scale 0.98

### Componentes UI

Todos em `src/components/ui/`:

- `Button` - Variantes: primary, secondary, danger, ghost, success
- `Card` / `StatCard` - Cards simples e estatísticos
- `Input` / `TextArea` / `Select` - Formulários
- `Modal` / `SlidePanel` - Overlays
- `Badge` / `StatusBadge` / `TemperatureBadge` / `PriorityBadge`
- `Toast` - Notificações

---

## 📊 Dashboard Executivo

### Cards Principais (8 métricas)

1. **Total de Leads** → Filtra por todos
2. **Leads Atrasados (+3d)** → Filtra por prioridade média+
3. **Leads Críticos (+7d)** → Filtra por prioridade crítica
4. **Leads Quentes** → Filtra por temperatura quente
5. **Orçamentos Enviados** → Filtra por status orcado
6. **Fechados** → Filtra por status fechado
7. **Valor Total Orçado** → Soma de todos valores
8. **Receita do Mês** → Transações do mês atual

### Seções

1. **Painel de Emergência** → Leads críticos no topo (máx 5)
2. **Follow-ups Hoje/Amanhã** → Próximos contatos
3. **Últimos Leads** → Recém-adicionados (5)
4. **Funil Simplificado** → Distribuição por status
5. **Distribuição por Temperatura** → Quente/Morno/Frio

### Recalculo Automático

Todos os dados recalculam automaticamente quando:
- Lead é adicionado/atualizado/excluído
- Transação é registrada
- Filtros são aplicados

---

## 🔁 Fluxo Operacional Ideal

### Para 118 Leads Atuais

#### Passo 1: Organização Inicial (Dia 1)

1. **Importar/Adicionar todos os leads**
   - Usar seed data ou importação em lote
   - Garantir campos obrigatórios preenchidos

2. **Rodar IA Assistente em lote**
   - Gerar relatório de priorização
   - Identificar críticos e alta prioridade

3. **Classificar por prioridade**
   - Críticos: Contato imediato
   - Alta: Contato em 24h
   - Média: Contato em 48h
   - Baixa: Manter no radar

#### Passo 2: Ação Diária

**Manhã (30 min):**
1. Abrir Dashboard
2. Ver Painel de Emergência
3. Contatar leads críticos (máx 5)

**Tarde (1 hora):**
1. Filtrar por "Alta Prioridade"
2. Follow-ups agendados do dia
3. Registrar contatos no histórico

**Fim do dia (15 min):**
1. Agendar follow-ups para amanhã
2. Atualizar status/orçamentos
3. Verificar métricas do dia

#### Passo 3: Rotina Semanal

**Segunda-feira:**
- Revisar todos leads críticos
- Planejar follow-ups da semana
- Gerar relatório de priorização

**Quarta-feira:**
- Foco em leads "Orçados" pendentes
- Reabordar leads esfriados

**Sexta-feira:**
- Fechar negócios pendentes
- Agendar follow-ups da próxima semana
- Exportar backup

---

## 🤖 Integração com GPT-4 (Futura)

### Arquitetura Segura

```
Frontend (React)
    ↓
[Chamada para /api/ai/analyze-lead]
    ↓
Backend Seguro (Node/Serverless)
    ↓
[API Key armazenada no servidor]
    ↓
OpenAI API (GPT-4)
    ↓
Retorna análise estruturada
    ↓
Frontend mostra preview
    ↓
Usuário confirma/rejeita
```

### Prompt Base para IA

```
Você é um estrategista comercial B2B especializado em serviços locais.

Analise este lead e retorne JSON:
{
  "temperaturaSugerida": "fria|morna|quente",
  "statusSugerido": "novo|atendimento|orcado|fechado|perdido",
  "riscoDePerda": "baixo|medio|alto|critico",
  "nivelDeUrgencia": 1-5,
  "estrategiaDeAbordagem": "string",
  "mensagemSugeridaWhatsApp": "string",
  "resumoExecutivo": "string",
  "dataIdealFollowUp": "YYYY-MM-DD",
  "justificativa": "string"
}

Critérios:
- Tempo sem contato > 7 dias = risco alto
- Orçamento enviado sem retorno = risco médio
- Valor > 10000 = atenção especial
- Prazo vencido = urgência máxima

Seja conservador. Nunca prometa fechamento.
```

### Fallback Offline

Quando sem API ou offline, o sistema usa heurística local (`iaService.ts`) que replica 80% da lógica da IA.

---

## 📦 Backup & Exportação

### Exportar JSON

```typescript
// Via store
const data = await exportData();
// Retorna JSON completo do workspace
```

**Estrutura do Backup:**
```json
{
  "version": "1.0.0",
  "exportedAt": "2025-01-15T10:30:00Z",
  "workspaceId": "default-workspace",
  "leads": [...],
  "orcamentos": [...],
  "transactions": [...],
  "notas": [...]
}
```

### Importar JSON

1. Valida estrutura antes de importar
2. Mostra preview dos dados
3. Confirma sobrescrita
4. Importa para IndexedDB
5. Recarrega aplicação

---

## ⚡ Otimizações Implementadas

### 1. Debounce em Filtros
```typescript
const debouncedSearch = useDebounce(searchInput, 300);
```

### 2. Memoização de Dashboard
```typescript
const stats = useDashboardStats(); // Selector memoizado
```

### 3. Code Splitting
```typescript
const Dashboard = lazy(() => import('@/modules/dashboard/Dashboard'));
```

### 4. IndexedDB Persistência
- Todas operações são assíncronas
- Transações para operações em lote
- Indexes para queries rápidas

### 5. Lazy Loading PDF
- Geração de PDF sob demanda
- Não carrega biblioteca pesada inicialmente

---

## 🔮 Preparação para SaaS

### Multi-Tenant Ready

Todas entidades possuem `workspaceId`:
```typescript
interface Lead {
  workspaceId: string; // ← Pronto para multi-empresas
  // ...
}
```

### Migração Futura para Supabase

**Atual:**
```typescript
import * as db from '@/lib/db'; // IndexedDB
await db.saveLead(lead);
```

**Futuro:**
```typescript
import { supabase } from '@/lib/supabase';
await supabase.from('leads').insert(lead);
```

### Serviços Desacoplados

- `src/lib/db.ts` → Storage layer abstrato
- `src/store/useStore.ts` → Apenas estado UI
- `src/modules/*/service.ts` → Lógica de negócio

---

## 📈 Pontos de Risco Arquitetural

### 1. IndexedDB Limitações
- **Risco**: Navegadores diferentes podem ter comportamentos variados
- **Mitigação**: Testar em Chrome, Firefox, Edge
- **Fallback**: Exportar JSON regularmente

### 2. Estado Global Grande
- **Risco**: 118+ leads podem deixar o store lento
- **Mitigação**: Selectors memoizados, virtualização futura
- **Monitorar**: Performance do re-render

### 3. Cálculos de Prioridade
- **Risco**: Recalcular tudo a cada mudança pode ser pesado
- **Mitigação**: Calcular apenas lead afetado
- **Otimização**: Web Worker para cálculos em lote

### 4. IA Offline vs Online
- **Risco**: Heurística local pode divergir da IA real
- **Mitigação**: Manter consistência nas regras base
- **Transição**: Flag de feature para switch gradual

---

## 🚀 Próximos Passos (Roadmap)

### Fase 1 (Completa ✅)
- [x] Leads CRUD
- [x] Dashboard recalculando
- [x] Prioridade automática
- [x] Persistência IndexedDB
- [x] IA Assistente estratégica

### Fase 2 (Em andamento)
- [x] Kanban com drag-and-drop
- [x] Persistência de movimentações
- [ ] Virtualização de listas longas

### Fase 3
- [ ] Orçamento com cálculo correto
- [ ] Geração de PDF profissional
- [ ] Template de orçamento personalizado

### Fase 4
- [x] Financeiro integrado
- [x] Receita vinculada ao fechamento
- [ ] Relatórios financeiros avançados

### Fase 5
- [x] IA com preview e confirmação
- [ ] Integração API OpenAI segura
- [ ] Prompt customizável por usuário

### Fase 6 (SaaS)
- [ ] Autenticação multi-usuário
- [ ] Migração para Supabase
- [ ] Sync em tempo real
- [ ] Planos e assinaturas

---

## 📞 Suporte e Manutenção

### Logs e Debug

```typescript
// Habilitar debug mode
localStorage.setItem('crm-debug', 'true');

// Logs aparecem no console
```

### Recuperação de Dados

1. **Dados corrompidos**: Importar último backup
2. **Lead excluído acidentalmente**: Restaurar do backup
3. **Bug crítico**: Exportar dados, reinstalar, importar

### Atualizações

- Backup automático antes de atualizações maiores
- Versionamento de schema do IndexedDB
- Migration scripts para mudanças de estrutura

---

## 📄 Licença e Uso

Sistema desenvolvido para uso interno. Pronto para evolução para SaaS B2B.

**Stack:** React 18, TypeScript, Zustand, IndexedDB, Tailwind CSS, DnD Kit

**Autor:** Arquiteto de Software Sênior especializado em CRM B2B

**Data:** Janeiro 2025
