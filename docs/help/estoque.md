# Controle de Estoque

Controle de materiais: quantidades, movimentações e alerta do que está acabando.

## O que você pode fazer aqui

- Cadastrar materiais (**Novo Item**): nome, categoria, unidade, estoque inicial e estoque mínimo.
- Dar **entrada** (+) e **saída** (−) de quantidade em cada item.
- Acompanhar o **status automático** de cada item na tabela: OK, Baixo (chegou no mínimo) ou Crítico (zerou).
- Ver os cartões de resumo: Total de Itens, Estoque Baixo e Críticos (zerados).
- Editar nome, categoria, unidade e mínimo de cada item. Excluir itens.

## Passo a passo

### Cadastrar um material
1. Toque em **Novo Item**.
2. Preencha o nome, a quantidade atual (estoque inicial) e o **estoque mínimo** — o alerta dispara quando o item chegar nele.
3. Toque em Cadastrar.

### Dar entrada ou saída
1. Na linha do item, toque no **+** (entrada) ou no **−** (saída).
2. Informe a quantidade.
3. Toque em Confirmar. Na saída, o sistema bloqueia se a quantidade for maior que o disponível.

## Perguntas frequentes

**Como corrijo a quantidade de um item depois de cadastrado?**
Use os botões de entrada/saída na linha do item. A tela de edição altera só nome, categoria, unidade e mínimo — não mexe na quantidade.

**Cadastrei um item e ele nunca aparece como "Baixo".**
O alerta "Baixo" depende do **estoque mínimo** ser maior que zero. Com mínimo 0, o item só muda de status quando zerar (Crítico). Defina um mínimo realista para ser avisado antes de faltar.

**Onde vejo o que está acabando?**
Nesta tela: nos cartões Estoque Baixo e Críticos do topo e na coluna Status da tabela — as linhas ficam destacadas em amarelo (baixo) e vermelho (crítico).

**A saída não deixou confirmar. Por quê?**
Você tentou tirar mais do que existe. A mensagem mostra o disponível — ajuste a quantidade.

**O estoque conversa com os orçamentos?**
Sim: ao marcar um orçamento como **Aprovado**, abre uma janela para dar baixa nos materiais usados naquele serviço. A baixa desconta direto daqui.

**Existe um histórico das entradas e saídas?**
Não — o sistema guarda apenas a quantidade atual de cada item. Se precisar de rastreio (quem tirou, quando e por quê), anote por fora ou combine um padrão com a equipe.
