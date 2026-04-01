import { fileURLToPath } from 'url';
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: './.env' });

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 caminho absoluto real
const assetsPath = path.join(__dirname, 'assets');
const logoBase64 = fs.readFileSync(path.join(assetsPath, 'logo_header.png'), {
  encoding: 'base64',
});

const logoBgBase64 = fs.readFileSync(path.join(assetsPath, 'logo_bg.png'), {
  encoding: 'base64',
});

const logoPath = `data:image/png;base64,${logoBase64}`;
const logoBgPath = `data:image/png;base64,${logoBgBase64}`;
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

app.use('/assets', express.static(assetsPath));

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

    const templatePath = path.resolve(
      process.cwd(),
      'templates',
      'orcamento.html',
    );

    console.log('📄 Caminho completo:', templatePath);

    if (!fs.existsSync(templatePath)) {
      console.error('❌ TEMPLATE NÃO ENCONTRADO');
      return res.status(500).json({
        error: 'Template HTML não encontrado',
        path: templatePath,
      });
    }

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

    if (!dados) {
      throw new Error('Dados não recebidos no backend');
    }

    if (!Array.isArray(dados.itens)) {
      console.warn('⚠️ itens inválidos, corrigindo...');
      dados.itens = [];
    }

    const itensHTML = dados.itens
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

    const baseUrl = 'http://127.0.0.1:3001';

    const logoHeader = `${baseUrl}/assets/logo-header.png`; // NOVO
    const logoWatermark = `${baseUrl}/assets/logo-bg.png`; // NOVO

    // 🔥 recalcular automaticamente se vier null
    const subtotalCalculado = Array.isArray(dados.itens)
      ? dados.itens.reduce((acc, item) => acc + Number(item.valorTotal || 0), 0)
      : 0;

    const subtotal = Number(dados.subtotal) || subtotalCalculado;
    const total = Number(dados.total) || subtotal;

    console.log('📁 Assets path:', assetsPath);
    console.log('📁 Existe?', fs.existsSync(assetsPath));

    /* ==========================================
🔢 GERAR NÚMERO SEQUENCIAL (PADRÃO ERP)
========================================== */

    const anoAtual = new Date().getFullYear();

    // 🔥 BUSCAR ÚLTIMO ORÇAMENTO DO ANO
    const ultimoNumero = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/orcamentos?select=numero&numero=like.ORC-${anoAtual}-%25&order=numero.desc&limit=1`,
      {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
      },
    );

    let sequencial = 1;

    if (ultimoNumero.length > 0) {
      const ultimo = ultimoNumero[0].numero;

      const partes = ultimo.split('-');
      const numeroAtual = parseInt(partes[2]);

      sequencial = numeroAtual + 1;
    }

    // 🔥 FORMATA 001, 002, 003...
    const sequencialFormatado = String(sequencial).padStart(3, '0');

    const numeroFormatado =
      dados.numero || `ORC-${anoAtual}-${sequencialFormatado}`;

    /* ==========================================
    🔁 SUBSTITUIÇÕES TEMPLATE
    ========================================== */

    html = html
      .replace(/{{cliente_nome}}/g, dados.cliente_nome)
      .replace(/{{cliente_telefone}}/g, dados.cliente_telefone || '-')
      .replace(/{{cliente_endereco}}/g, dados.cliente_endereco || '-')
      .replace(/{{orcamento_id}}/g, numeroFormatado)
      .replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{{itens}}/g, itensHTML)
      .replace(/{{subtotal}}/g, formatar(subtotal))
      .replace(/{{desconto}}/g, formatar(dados.desconto))
      .replace(/{{total}}/g, formatar(total))
      .replace(/{{observacoes}}/g, dados.observacoes || '')
      .replace(/{{validade}}/g, dados.validade || 7);

    // 🔥 IMAGENS DINÂMICAS
    html = html.replace('{{logo}}', logoPath);
    html = html.replace('{{logo_bg}}', logoBgPath);

    console.log('LOGO:', logoPath);
    console.log('LOGO BG:', logoBgPath);
    /* ==========================================
    🧠 GERAR PDF (PUPPETEER)
    ========================================== */

    const browser = await puppeteer.launch({
      args: ['--allow-file-access-from-files'],
    });

    const page = await browser.newPage();

    // 🔥 DEFINE TAMANHO DA PÁGINA (IMPORTANTE)
    await page.setViewport({
      width: 1240,
      height: 1754,
    });

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // 🔥 FORÇA CARREGAMENTO DE IMAGENS
    await page.evaluate(async () => {
      const imgs = Array.from(document.images);

      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }),
      );
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
