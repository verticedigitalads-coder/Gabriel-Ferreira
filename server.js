import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

/* ==========================================
🔥 ROTA OPENAI
========================================== */

app.post("/api/chat", async (req, res) => {

  try {

    const response = await fetch("https://api.openai.com/v1/chat/completions", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
      },

      body: JSON.stringify(req.body)

    });

    const data = await response.json();

    res.json(data);

  } catch (error) {

    console.error("Erro OpenAI:", error);

    res.status(500).json({ error: "Erro ao chamar OpenAI" });

  }

});

/* ==========================================
🧾 GERAR ORÇAMENTO PDF
========================================== */

app.post("/api/gerar-orcamento", async (req, res) => {

  try {

    const dados = req.body;

    /* ==========================================
    🔥 LER TEMPLATE
    ========================================== */

    const templatePath = path.resolve("./templates/orcamento.html");

    let html = fs.readFileSync(templatePath, "utf8");

    /* ==========================================
    🔥 CARREGAR IMAGENS
    ========================================== */

    const logoBase64 = fs.readFileSync("./assets/logo.png", { encoding: "base64" });
const leftBase64 = fs.readFileSync("./assets/logo-left.png", { encoding: "base64" });
const rightBase64 = fs.readFileSync("./assets/logo-right.png", { encoding: "base64" });

const logo = `data:image/png;base64,${logoBase64}`;
const soldador_left = `data:image/png;base64,${leftBase64}`;
const soldador_right = `data:image/png;base64,${rightBase64}`;

    /* ==========================================
    🔥 FORMATAÇÃO BRL
    ========================================== */

    const formatBRL = (valor) => {

      return Number(valor || 0).toLocaleString("pt-BR", {

        minimumFractionDigits: 2,
        maximumFractionDigits: 2

      });

    };

    /* ==========================================
    🔥 GERAR ITENS
    ========================================== */

    let itensHTML = "";

    if (dados.itens && Array.isArray(dados.itens)) {

      dados.itens.forEach(item => {

        itensHTML += `
          <tr>
            <td>${item.descricao || ""}</td>
            <td class="right">${item.quantidade || 0}</td>
            <td class="right">R$ ${formatBRL(item.valorUnitario)}</td>
            <td class="right">R$ ${formatBRL(item.valorTotal)}</td>
          </tr>
        `;

      });

    }

    /* ==========================================
    🔥 OBSERVAÇÃO PADRÃO
    ========================================== */

    const observacaoPadrao = `
Prazo estimado conforme alinhado com o cliente.
Garantia conforme Código de Defesa do Consumidor.
Não incluso serviços adicionais não descritos neste orçamento.
`;

    const observacoesFinal =
      dados.observacoes && dados.observacoes.trim() !== ""
        ? dados.observacoes
        : observacaoPadrao;

    /* ==========================================
    🔥 SUBSTITUIR PLACEHOLDERS
    ========================================== */

    html = html.replaceAll("{{logo}}", logo);

    html = html.replace("{{soldador_left}}", soldador_left);

    html = html.replace("{{soldador_right}}", soldador_right);

    html = html.replace(
      "{{orcamento_id}}",
      `ORC-${(dados.id || Date.now()).toString().slice(0, 8).toUpperCase()}`
    );

    html = html.replace("{{data}}", new Date().toLocaleDateString("pt-BR"));

    html = html.replace("{{cliente_nome}}", dados.cliente_nome || "");

    html = html.replace("{{cliente_telefone}}", dados.cliente_telefone || "");

    html = html.replace("{{cliente_endereco}}", dados.cliente_endereco || "");

    html = html.replace("{{itens}}", itensHTML);

    html = html.replace("{{subtotal}}", formatBRL(dados.subtotal));

    html = html.replace("{{desconto}}", formatBRL(dados.desconto));

    html = html.replace("{{total}}", formatBRL(dados.total));

    html = html.replace("{{observacoes}}", observacoesFinal);

    html = html.replace("{{validade}}", dados.validade || 15);

    /* ==========================================
    🔥 GERAR PDF
    ========================================== */

    const browser = await puppeteer.launch({ headless: "new" });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const fileName = `orcamento-${Date.now()}.pdf`;

    const filePath = path.resolve(`./orcamentos/${fileName}`);

    await page.pdf({

      path: filePath,

      format: "A4",

      printBackground: true

    });

    await browser.close();

    /* ==========================================
    🔥 DOWNLOAD
    ========================================== */

    res.download(filePath, fileName);

  } catch (error) {

    console.error("Erro ao gerar orçamento:", error);

    res.status(500).json({ error: "Erro ao gerar PDF" });

  }

});

app.listen(3001, "0.0.0.0", () => {
  console.log("🔥 Backend rodando em http://192.168.18.11:3001");
});