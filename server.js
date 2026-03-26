import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();

/* ==========================================
🌐 CORS (NGROK + LOCAL)
========================================== */

app.use(cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

/* ==========================================
📁 SERVIR IMAGENS (LOGOS / ASSETS)
========================================== */

app.use('/dist', express.static(path.resolve('./dist')));

/* ==========================================
🔥 ROTA OPENAI
========================================== */

app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro OpenAI:', error);
    res.status(500).json({ error: 'Erro ao chamar OpenAI' });
  }
});

/* ==========================================
🧾 GERAR ORÇAMENTO PDF (TEMPLATE REAL)
========================================== */

app.post('/api/gerar-orcamento', async (req, res) => {
  try {
    const dados = req.body;

    console.log('📥 Dados recebidos:', dados);

    /* ==========================================
    📄 CARREGAR TEMPLATE HTML
    ========================================== */

    const templatePath = path.resolve('./orcamento.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    /* ==========================================
    💰 FORMATADOR BRL
    ========================================== */

    const formatar = (v) =>
      Number(v || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      });

    /* ==========================================
    🧱 ITENS
    ========================================== */

    const itensHTML = (dados.itens || [])
      .map(
        (item) => `
        <tr>
          <td>${item.descricao}</td>
          <td class="right">${item.quantidade}</td>
          <td class="right">R$ ${formatar(item.valorUnitario)}</td>
          <td class="right">R$ ${formatar(item.valorTotal)}</td>
        </tr>
      `,
      )
      .join('');

    /* ==========================================
    🖼️ IMAGENS (SUPORTE LOCAL + URL)
    ========================================== */

    const logo =
      dados.logo || 'http://localhost:3001/dist/android-chrome-512x512.png';

    const soldadorLeft =
      dados.soldador_left ||
      'http://localhost:3001/dist/android-chrome-192x192.png';

    const soldadorRight =
      dados.soldador_right ||
      'http://localhost:3001/dist/android-chrome-192x192.png';

    /* ==========================================
    🔁 SUBSTITUIÇÕES TEMPLATE
    ========================================== */

    html = html
      .replace(/{{cliente_nome}}/g, dados.cliente_nome)
      .replace(/{{cliente_telefone}}/g, dados.cliente_telefone || '-')
      .replace(/{{cliente_endereco}}/g, dados.cliente_endereco || '-')
      .replace(/{{orcamento_id}}/g, dados.id || '---')
      .replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{{itens}}/g, itensHTML)
      .replace(/{{subtotal}}/g, formatar(dados.subtotal))
      .replace(/{{desconto}}/g, formatar(dados.desconto))
      .replace(/{{total}}/g, formatar(dados.total))
      .replace(/{{observacoes}}/g, dados.observacoes || '')
      .replace(/{{validade}}/g, dados.validade || 7)

      // 🔥 IMAGENS DINÂMICAS
      .replace(/{{logo}}/g, logo)
      .replace(/{{soldador_left}}/g, soldadorLeft)
      .replace(/{{soldador_right}}/g, soldadorRight);

    /* ==========================================
    🧠 GERAR PDF (PUPPETEER)
    ========================================== */

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    /* ==========================================
    📤 RESPONSE
    ========================================== */

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.send(pdf);
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);

    return res.status(500).json({
      error: 'Erro ao gerar PDF',
    });
  }
});

/* ==========================================
🚀 START SERVER
========================================== */

app.listen(3001, '0.0.0.0', () => {
  console.log('🔥 Backend rodando em http://localhost:3001');
});
