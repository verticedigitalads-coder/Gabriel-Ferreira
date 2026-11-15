# Configurações

Dados e identidade da sua empresa: logo, cores, PIX e textos padrão que aparecem nos seus documentos.

## O que você pode fazer aqui

A tela tem 4 abas:

- **Empresa** — nome, CNPJ, telefone, e-mail, endereço, Instagram/site, logos e as cores dos seus PDFs (com pré-visualização), e a meta de receita do mês.
- **Documentos** — padrões dos orçamentos e recibos: validade, multiplicador de mão de obra, comissão, observações padrão, texto de apresentação, condições de contrato e a assinatura da empresa.
- **Pagamentos** — métodos de pagamento exibidos no rodapé dos PDFs e os dados PIX: tipo da chave, chave, nome do recebedor e cidade.
- **Dados** — backup, importação de leads por planilha e ações de limpeza.

## Passo a passo

### Configurar a identidade dos seus PDFs
1. Na aba **Empresa**, preencha nome, CNPJ, telefone, e-mail e endereço — tudo isso aparece nos PDFs.
2. Toque em **Enviar imagem**, embaixo do campo da logo, e escolha a imagem no computador ou no celular: o link entra sozinho e já fica salvo. Se já tiver o link de uma imagem, pode colar no campo. Faça o mesmo, se quiser, com a marca d'água de fundo. Embaixo de cada campo aparece a prévia; a da marca d'água mostra como ela fica no PDF (bem clara e em cinza).
3. Escolha a **cor principal** (e a cor de destaque, se quiser) — a pré-visualização mostra como fica.
4. Toque em **Salvar Alterações**.

### Ativar o PIX nos documentos
1. Na aba **Pagamentos**, vá até "Dados PIX".
2. Escolha o tipo da chave, digite a chave, o nome do recebedor (máx. 25 caracteres) e a cidade (máx. 15). Pode digitar a chave com pontos, traços ou espaços: ao salvar, ela fica no formato que o banco usa. Se a chave não bater com o tipo escolhido, o app avisa e não salva.
3. Salve. O QR Code de pagamento passa a poder sair nos orçamentos e recibos.

### Fazer um backup
1. Na aba **Dados**, toque em **Exportar Backup**.
2. Um arquivo .json baixa com leads, orçamentos, recibos e financeiro do seu workspace. Guarde em local seguro.

## Perguntas frequentes

**Coloquei o link da logo e ela não aparece no PDF.**
Olhe embaixo do campo: se aparecer o aviso vermelho "Não conseguimos abrir essa imagem", o link não abre a imagem e o PDF sai sem ela. O campo precisa de um **link direto** para a imagem (.png ou .jpg), sem espaços no nome do arquivo. Link de página (Google Drive, site) não funciona — tem que ser o endereço que abre a imagem sozinha no navegador. Confira também a extensão: o Windows pode esconder o final do nome, e um arquivo que parece "logo.jpg" pode ser "logo.jpg.png". O jeito mais fácil é usar **Enviar imagem**: o link entra certo sozinho.

**Que imagem posso enviar?**
PNG, JPEG ou WebP, de até 15 MB, do computador ou do celular. SVG não é aceito. O app diminui a imagem antes de enviar (a logo até 800 pixels, a marca d'água até 1000) e mantém a transparência do PNG. Ao enviar, os outros dados da aba Empresa que estiverem na tela também são salvos.

**A marca d'água saiu como um quadrado cinza.**
A imagem tem fundo preto ou colorido: no PDF a marca d'água fica bem clara e em cinza, e o fundo aparece junto, como um quadrado. Use um PNG com fundo transparente; assim só o desenho aparece. A prévia embaixo do campo já mostra como vai ficar.

**Preciso escolher a cor de destaque?**
Não — ela é opcional. Deixando vazia, o sistema usa a cor principal em tudo. A cor de destaque muda só detalhes dos PDFs: os números dos itens e o cabeçalho das tabelas.

**O que é o multiplicador padrão de mão de obra?**
Um acréscimo automático nos orçamentos novos. Ex.: 1.1 = +10% sobre os itens; 1 = sem acréscimo. Dá para ajustar em cada orçamento.

**Para que servem as observações padrão?**
São textos que já vêm preenchidos em todo orçamento (ou recibo) novo — condições de pagamento, prazo de instalação etc. Você pode editar em cada documento.

**Para que serve a meta de receita do mês?**
O Dashboard compara a receita provável com ela (barra e %) e avisa quando ela fica abaixo da metade. Deixe 0 para não usar meta.

**Posso automatizar algo nas condições de contrato?**
Sim: escreva `{{validade}}` no texto e o número de dias de validade do orçamento entra sozinho no PDF.

**As ações da aba Dados são seguras?**
Backup e importação, sim. As de limpeza (Limpar Leads, Limpar Financeiro, Resetar Sistema) **apagam dados de verdade e não têm desfazer** — o reset completo exige digitar CONFIRMAR. Faça um backup antes de qualquer limpeza.

**Como importo meus leads de uma planilha?**
Aba Dados → **Importar CSV**. A planilha deve estar em formato CSV com as colunas: nome, telefone, email, servico, status.
