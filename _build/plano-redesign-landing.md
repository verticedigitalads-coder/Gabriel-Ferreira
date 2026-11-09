# Plano — Redesign da landing (fusão deepseek v4.1 + deepseek 2)

Data: 08/11/2026
Referências (só visual, NUNCA copiar texto ou números):
- `_build/design-ref/v4.1/`  → deepseek v4.1 (base tipográfica e ritmo)
- `_build/design-ref/ds2/`   → deepseek 2 (hero com cards, CTA lateral, manifesto, segmentos, dock mobile)
- `_build/design-ref/mimo/public/images/` → forge.jpg, steel.jpg, workshop.jpg (geradas por IA, uso liberado)

`_build/design-ref/` fica no `.gitignore`.

---

## Regras que valem para todas as rodadas

1. A landing É a tela de login. Implementar DENTRO de `src/modules/auth/landing/`.
   Não tocar `handleLogin`, `App.tsx`, `TermsGate`, `src/lib/terms.ts`.
   `AuthPage.tsx` só ganha import/ordem de seções.
2. O botão **"Entrar com Google"** (`#acesso`) continua existindo e funcionando.
3. Nada de projeto, framer-motion ou dependência nova. Animação em CSS
   + o `useScrollReveal` que já existe. `prefers-reduced-motion` desliga tudo.
4. Toda copy em `landingContent.ts`. Componentes só cuidam de layout.
5. **Todo CTA "Falar com a equipe" abre o WhatsApp direto** (`whatsappUrl(origem)`).
   Não existe formulário, modal de formulário nem rolagem até o fim da página.
6. Fontes da referência: Instrument Serif (itálico), Inter Tight, JetBrains Mono.
   Entram via Google Fonts com `display=swap`. Medir impacto no carregamento.
7. CSS vars de `tokens.css`, 44px de toque, sem scroll horizontal em 320px.
8. Nome do produto: **"VRTX CRM"** (nunca "VRTXCRM"). Empresa: **Vértice Digital · Uberaba/MG**.

## LISTA PROIBIDA (está nas referências e NÃO pode entrar)

- Qualquer número de resultado: −72%, 3,2×, +34%, 68%, +18,4%, 1.240+, 1.400+,
  R$ 38mi, R$ 92mi, 18.400+, 97%, 34,8%, "−41%".
- Preço R$ 289 / R$ 297, "VRTX PRO", "até 5 usuários", "usuário adicional R$ 39",
  "plano sob medida", "múltiplas unidades".
- "Teste guiado 14 dias", "sem cartão", "vagas de implantação", "diagnóstico gratuito 20 min",
  "resposta em até 1 dia útil", "implantação em até 7 dias", "dados hospedados no Brasil".
- Depoimentos e clientes inventados (Rafael Martins, Rafael Nunes, Ferro & Forma, Linha Nobre,
  Véritas, Drywall Prime, Prisma, Steel Frame Sul, Serralheria Alves...) como prova social.
- "São Paulo", coordenadas, "LTDA", "Edição 01", "Sistema online", "Equipe disponível".
- E-mails ola@ / contato@ / privacidade@vrtxcrm.com.br. Endereço `app.vrtxcrm.com.br`.
- Funções que o VRTX não tem: alertas por WhatsApp, metas por vendedor, relatórios,
  responsável por lead, vários usuários/permissões, "proposta visualizada", funil de conversão
  em %, origem dos leads, ticket médio.
- Formulários de contato (os das referências fingem envio e descartam o lead).

Dados FICTÍCIOS em cartões ilustrativos são permitidos desde que: marcados como
"ilustrativo", com nomes genéricos e só com campos que o VRTX real tem.

---

## Ordem final das seções e origem de cada uma

| # | Seção | Visual de | Conteúdo (verdadeiro) |
|---|---|---|---|
| 1 | Nav fixa | v4.1 Nav | Links: Produto · Automações · Segmentos · Preço · Dúvidas. "Entrar" (link → `#acesso`). Botão laranja "Falar com a equipe" + caixa de seta → WhatsApp (`nav`). |
| 2 | Hero | Tipografia v4.1 + cards flutuantes e CTA lateral da ds2 | Título: "O próximo **orçamento** pode ser o seu próximo grande **negócio**." Subtítulo: o atual. À direita/abaixo: bloco CTA grande estilo ds2 ("Falar com a equipe ↗") → WhatsApp (`hero`). Cards flutuantes: 1 orçamento ilustrativo (itens, total, "PIX no PDF"), 1 lista de leads com badge de prioridade (Crítico/Alto/Médio). Sem métricas. Fileira de fatos verdadeiros no lugar das métricas: "PDF com sua logo · QR Code PIX · Prioridade automática". |
| 3 | Faixa laranja | v4.1 ticker | Serralheria · Marcenaria · Metalúrgica · Drywall · Vidraçaria · Esquadrias (rolagem CSS infinita). |
| 4 | O problema real (seção CLARA) | v4.1 Manifesto | "Vender por orçamento é uma operação. Não uma pasta de orçamentos no WhatsApp." Comparação Antes x Com VRTX: Antes = caderno, orçamento perdido no WhatsApp, follow-up de memória, recebimento sem controle. Com VRTX = cada cliente num lugar, orçamento em PDF com sua marca, quem esfriou aparece primeiro, contas a receber organizadas. REMOVER o card "custo invisível" com números. |
| 5 | Interlúdio | ds2 Manifesto | "A obra não espera. A venda também não." + CTA WhatsApp (`manifesto`). |
| 6 | Depoimentos | v4.1 Proof (estilo citação grande) | FL Art Metal (Fabrício Lima) e Ítalo Colares Drywall (Ítalo Colares) — frases que já estão em `TESTIMONIALS`. Sem números, sem logos inventados. |
| 7 | Produto em abas | ds2 ProductSection (moldura de navegador + abas) | Abas: Dashboard · Leads · Orçamentos · Operacional · Financeiro. Cada aba mostra **print real do desktop** (`public/landing/desk-*.webp`), não dashboard inventado. Uma frase curta verdadeira por aba. |
| 8 | Três frentes | ds2 Features (trio de cards claro/escuro) | Leads com prioridade automática · Orçamento em PDF com logo, PIX e assinatura · Operacional (agenda, status Em produção/Pronto/Instalado). |
| 9 | Automações | v4.1 Process (stepper lateral) | As 4 automações reais que já estão em `automacoes` (lead novo → tarefa; fechou → "Executar serviço"; aprovou → recibo; recebido → Financeiro). |
| 10 | No celular | manter `LandingCelular`, reestilizar no novo visual | Mesmos 3 prints e legendas. |
| 11 | Segmentos | ds2 Segments (lista grande com imagem no hover) | Serralherias · Marcenarias · Metalúrgicas · Drywall & Gesso. Imagens: forge.jpg, workshop.jpg, steel.jpg (converter p/ webp ≤ 150KB cada). Frase curta por segmento, sem promessa. |
| 12 | Preço | v4.1 Offer (um card) | R$ 147/mês por empresa (de `PRICING.basico`). Lista: as 8 linhas de `precos.inclui`. Selos SÓ se confirmados nos Termos §5 (ver pendências). CTA WhatsApp (`precos`). Sem card "sob medida". |
| 13 | Dúvidas (FAQ) | v4.1 Faq (accordion) | Ver respostas abaixo. CTA "Conversar com a equipe" → WhatsApp (`faq`). |
| 14 | Fechamento + login | v4.1 Closing + card de acesso atual | "O próximo grande negócio já está no seu pipeline." Botão WhatsApp (`cta-final`). Ao lado, o card **"Já é cliente? Entrar com Google"** (o atual `#acesso`, mesmo `onLogin`). SEM formulário. |
| 15 | Rodapé | v4.1 Footer (wordmark gigante) | Wordmark "VRTX CRM". Vértice Digital · Uberaba/MG. WhatsApp (34) 98850-1702. Privacidade · Termos. © 2026 VRTX CRM · Vértice Digital. |
| — | Dock mobile | ds2 MobileDock | Barra fixa no rodapé do celular, aparece após rolar o hero, some perto do fechamento/rodapé. Botão "Falar com a equipe" → WhatsApp (`dock`). |

Adicionar ao tipo `WhatsappOrigem`: `'manifesto' | 'faq' | 'dock'`.

---

## FAQ — respostas verdadeiras (pode ajustar o tom)

1. **Serve só para serralheria?** — Não. Foi feito para quem vende por orçamento:
   serralheria, marcenaria, metalúrgica, drywall, vidraçaria, esquadrias e serviços sob medida.
2. **O orçamento sai com a minha marca?** — Sim. PDF com sua logo, seus dados e, se quiser,
   o QR Code PIX para o cliente pagar.
3. **Preciso abandonar o WhatsApp?** — Não. Você continua conversando pelo WhatsApp; o VRTX
   guarda o cliente, o orçamento e o próximo contato para nada se perder.
4. **Funciona no celular?** — Sim. Abre no navegador do celular e pode ser instalado como
   aplicativo, sem baixar da loja.
5. **Consigo trazer meus clientes de uma planilha?** — Sim, dá para importar leads por planilha
   (CSV). A equipe ajuda na configuração inicial.
6. **Como começo?** — Fala com a equipe no WhatsApp. A gente configura seu acesso, sua logo e
   seus dados de PIX.
7. **Meus dados ficam separados dos outros clientes?** — Sim. Cada empresa tem seu espaço
   isolado e a conexão é criptografada.
8. **Tem fidelidade?** — ⚠️ SÓ ENTRA depois de confirmar o texto dos Termos §5.

---

## Prints de desktop necessários (rodada 3)

Workspace Vértice, só dados de demonstração, janela 1440×900, DPR 2:
`desk-dashboard`, `desk-leads` (Kanban), `desk-orcamentos`, `desk-operacional`, `desk-financeiro`
→ salvar PNG em `public/landing/`; o agente converte para webp.

---

## Rodadas (1 commit cada, sem push até o aceite)

- **R1** — Fontes + Nav + Hero + Faixa laranja + Dock mobile.
- **R2** — Problema real (clara) + Interlúdio + Depoimentos + Três frentes.
- **R3** — Produto em abas (prints reais) + Automações (stepper) + No celular reestilizado.
- **R4** — Segmentos (imagens) + Preço + FAQ + Fechamento/login + Rodapé.
- **R5** — Revisão: remover componentes antigos órfãos, Lighthouse mobile, varredura da LISTA PROIBIDA
  no `innerText`, teste de login real.

Cada rodada termina com: tsc, build, screenshots 1440/390/320, grep da lista proibida no
texto renderizado, e PARA antes do commit.

## Pendências do Gabriel

- [ ] Termos §5: diz "garantia de 7 dias" e "sem fidelidade"? (decide selos do preço e FAQ 8)
- [ ] 5 prints de desktop (rodada 3)
