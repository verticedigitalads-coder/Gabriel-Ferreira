# DPA — Adendo de Tratamento de Dados (Operador)

> **DOCUMENTO DA OPÇÃO 2 — não necessário para o lançamento.**
> Versão revisada com as recomendações do parecer jurídico. Mantenha guardado e
> utilize quando: houver CNPJ, vários clientes, empresas maiores, ou quando um
> cliente exigir formalmente um DPA. A Seção 8 (Responsabilidade) deve ser
> finalizada com advogado.

**Última atualização:** [PREENCHER]

---

## O que é este documento

Este Adendo (DPA) integra os Termos de Uso e rege o tratamento de dados pessoais
quando o **Assinante** (Controlador) insere, no CRM VRTX, dados de seus clientes
finais, e a **VRTX** (Operadora) os processa em seu nome.

---

## 1. Definições

- **Controlador:** o Assinante, que decide finalidades e meios do tratamento.
- **Operadora:** Vértice Digital / Gabriel Ferreira Costa (CRM VRTX).
- **Dados Pessoais:** informações relativas a pessoa natural identificada ou
  identificável, inseridas pelo Controlador.
- **Titular:** o cliente final a quem os dados se referem.
- **Sub-operador:** terceiro contratado pela Operadora para auxiliar no tratamento.

---

## 2. Objeto e instruções

2.1. A Operadora tratará os Dados **exclusivamente** conforme as instruções do
Controlador e a finalidade de prestação do serviço.

2.2. A Operadora **não** utilizará os Dados para finalidades próprias.

---

## 3. Obrigações da Operadora

a) Tratar os Dados apenas conforme a Seção 2;
b) Aplicar medidas técnicas e organizacionais de segurança, incluindo:
   - Isolamento por workspace (Row Level Security)
   - Criptografia em trânsito (HTTPS/SSL)
   - Controle de acesso baseado em função (RBAC)
   - Controle de privilégios e restrição de credenciais
   - Segregação lógica entre contas
   - Registros de atividade (logs) e rotinas de backup, conforme disponíveis
c) Garantir confidencialidade de quem acessa os dados;
d) Auxiliar o Controlador no atendimento aos Titulares;
e) Notificar o Controlador sobre incidentes de segurança, sem demora injustificada,
   em até [PREENCHER: ex. 48 horas] do conhecimento;
f) Eliminar ou devolver os Dados ao término do contrato (Seção 7).

---

## 4. Obrigações do Controlador

a) Possuir base legal válida para o tratamento dos Dados que insere;
b) Informar seus Titulares e, quando aplicável, obter consentimento;
c) Fornecer instruções lícitas;
d) Responder pela qualidade e origem lícita dos Dados;
e) Responder, como controlador, pelas solicitações de seus Titulares e pelo envio
   de mensagens/comunicações aos seus clientes.

---

## 5. Sub-operadores

5.1. O Controlador autoriza os seguintes sub-operadores:

| Sub-operador | Função | Local |
|--------------|--------|-------|
| Supabase | Banco de dados / autenticação | [PREENCHER: região] |
| Vercel | Hospedagem frontend | EUA |
| Hetzner | Servidor (VPS) | Alemanha (UE) |
| Cloudflare | DNS / segurança / tráfego | Internacional |
| Google | Autenticação (OAuth) | EUA |
| OpenAI | Análise por IA (quando acionada) | EUA |
| Evolution API / WhatsApp | Mensageria | [PREENCHER] |
| [Gateway de pagamento] | Pagamentos | [PREENCHER] |

5.2. A Operadora poderá alterar sub-operadores **mediante comunicação prévia ao
Controlador**, sem necessidade de aprovação ou direito de veto, assegurada a
manutenção de padrões equivalentes de segurança. Isso permite a substituição de
provedores (ex.: troca de gateway, banco ou infraestrutura) sem travar a operação.

---

## 6. Transferência internacional

Alguns sub-operadores processam dados fora do Brasil (OpenAI, Vercel, Google nos
EUA; Hetzner na UE; Cloudflare internacional). Ao utilizar o serviço — em especial
o recurso de IA — o Controlador reconhece e instrui essa transferência, necessária
às funcionalidades contratadas.

O recurso de **IA Assistente** transmite nome do lead, valor orçado e histórico de
contatos à OpenAI (EUA) quando a análise é acionada. Esses dados não são
armazenados pela Operadora após o processamento.

---

## 7. Término

7.1. Ao encerrar a relação, a Operadora, conforme escolha do Controlador:
- Disponibilizará os Dados para exportação por **45 dias**, e/ou
- Eliminará os Dados após esse período.

7.2. Obrigações legais de retenção prevalecem sobre a exclusão.

---

## 8. Responsabilidade

8.1. **O Controlador responde** por: base legal; consentimento; qualidade e origem
dos dados; atendimento aos titulares; envio de mensagens; e cumprimento da LGPD em
relação aos dados que insere.

8.2. **A Operadora responde apenas** pelo descumprimento de suas próprias
obrigações previstas neste Adendo.

8.3. **A Operadora não responde** por: dados obtidos ilegalmente pelo Controlador;
ausência de consentimento; compra de listas; spam ou mensagens não autorizadas
enviadas pelo Controlador; ou demais descumprimentos da LGPD imputáveis ao
Controlador.

8.4. A responsabilidade financeira da Operadora, quando aplicável, limita-se ao
**valor pago pelo Controlador nos últimos 12 (doze) meses**.

[PREENCHER / VALIDAR COM ADVOGADO — cláusulas de indenização e regresso.]

---

## 9. Vigência

Vigora enquanto durar a relação contratual e permanece válido para obrigações que,
por sua natureza, devam subsistir após o término.

---

**Vértice Digital — CRM VRTX (Operadora)**
verticedigital.ads@gmail.com — Uberaba, Minas Gerais, Brasil
