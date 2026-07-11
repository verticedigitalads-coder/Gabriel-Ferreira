import { fileURLToPath } from 'url';
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pixPayload } from './utils/pixPayload.js';

dotenv.config({ path: './.env' });

// ===== Sanitização de HTML =====
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper: converte URL de imagem externa para base64 (evita falhas de carregamento no Puppeteer VPS)
async function urlToBase64(url) {
  if (!url || url.startsWith('data:')) return url;
  try {
    const response = await fetch(url);
    if (!response.ok) return '';
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.error('[PDF] Erro ao converter logo para base64:', err.message);
    return '';
  }
}

const app = express();
app.set('trust proxy', 1);
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

async function gerarQrCodePixHtml({
  chavePix,
  nomeRecebedor,
  cidadeRecebedor,
  valor,
  txid,
}) {
  if (!chavePix) return '';
  try {
    const payload = pixPayload({
      chavePix,
      nomeRecebedor,
      cidadeRecebedor,
      valor: valor || null,
      txid: txid || '***',
    });
    const qrDataUrl = await QRCode.toDataURL(payload, {
      width: 180,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
    return `
      <div style="text-align: center; margin-top: 20px; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa; page-break-inside: avoid;">
        <img src="${qrDataUrl}" alt="QR Code PIX" style="width: 150px; height: 150px; margin: 0 auto; display: block;" />
        <p style="font-size: 12px; color: #333; margin-top: 10px; font-weight: 700;">Pague via PIX</p>
        <p style="font-size: 9px; color: #999; margin-top: 2px;">Chave: ${chavePix}</p>
        <div style="margin-top: 10px; padding: 8px; background: #f0f0f0; border-radius: 6px; border: 1px dashed #ccc;">
          <p style="font-size: 8px; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">PIX Copia e Cola</p>
          <p style="font-size: 7px; color: #555; word-break: break-all; font-family: monospace; line-height: 1.4; margin: 0;">${payload}</p>
        </div>
      </div>`;
  } catch (err) {
    console.error('[QR PIX] Erro ao gerar:', err);
    return '';
  }
}

/* ==========================================
🌐 CORS (whitelist via env)
========================================== */

const allowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS ||
  'http://localhost:5173,http://localhost:3000,https://vertice-digital-crm.vercel.app'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS bloqueado: ' + origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],
  }),
);

/* ==========================================
🛡️ HELMET (security headers)
========================================== */

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

/* ==========================================
⏱️ RATE LIMIT
========================================== */

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
});
app.use(globalLimiter);

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de requisições excedido.' },
});

/* ==========================================
🔐 AUTH MIDDLEWARES (admin whitelist)
========================================== */

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);
    if (error || !user)
      return res.status(401).json({ error: 'Token inválido' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Erro de autenticação' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user?.id || !ADMIN_USER_IDS.includes(req.user.id)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
};

app.get('/', (_req, res) => res.sendStatus(200));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ==========================================
📁 SERVIR IMAGENS (LOGOS / ASSETS)
========================================== */

app.use('/assets', express.static(assetsPath));

/* ==========================================
🔥 ROTA OPENAI
========================================== */

app.post('/api/chat', strictLimiter, async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[Server] Erro OpenAI:', error);
    res.status(500).json({ error: 'Erro ao chamar OpenAI' });
  }
});

/* ==========================================
🏢 PROXY CNPJ (ReceitaWS)
========================================== */

app.get('/api/cnpj/:cnpj', async (req, res) => {
  const { cnpj } = req.params;
  const cnpjLimpo = cnpj.replace(/\D/g, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`,
      { signal: controller.signal },
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(404).json({ erro: 'CNPJ não encontrado' });
    }

    const data = await response.json();

    if (data.status === 'ERROR') {
      return res.status(404).json({ erro: 'CNPJ não encontrado' });
    }

    return res.json(data);
  } catch (error) {
    console.error('[CNPJ] Erro ao buscar:', error);
    return res.status(500).json({ erro: 'Erro ao consultar CNPJ' });
  }
});

/* ==========================================
🧾 GERAR ORÇAMENTO PDF (TEMPLATE REAL)
========================================== */

app.post('/api/gerar-orcamento', strictLimiter, async (req, res) => {
  try {
    const dados = req.body;

    /* ==========================================
    📄 CARREGAR TEMPLATE HTML
    ========================================== */

    const template_version = dados.template_version || 'v1';
    const templateFile =
      template_version === 'v2' ? 'orcamento-v2.html' : 'orcamento.html';
    const templatePath = path.resolve(process.cwd(), 'templates', templateFile);

    if (!fs.existsSync(templatePath)) {
      console.error('[Server] Template não encontrado');
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

    const itensLinhas = dados.itens
      .filter((item) => {
        const nome = (item.descricao || '').trim().toLowerCase();
        const valor = parseFloat(item.valorTotal || 0);
        if (!nome || nome === 'item') return false;
        const isMaoDeObra =
          nome.includes('mão de obra') || nome.includes('mao de obra');
        if (valor === 0 && !isMaoDeObra) return false;
        return true;
      })
      .map(
        (item) => `
        <tr>
          <td>${escapeHtml(item.descricao)}</td>
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

    // 🔥 recalcular automaticamente se vier null
    const subtotalCalculado = Array.isArray(dados.itens)
      ? dados.itens.reduce((acc, item) => acc + Number(item.valorTotal || 0), 0)
      : 0;

    const subtotal = Number(dados.subtotal) || subtotalCalculado;
    const total = Number(dados.total) || subtotal;

    const multiplicador = Number(dados.multiplicador) || 1;
    let maoDeObraItemHTML = '';
    if (multiplicador > 0 && multiplicador < 1) {
      const valor = subtotal * multiplicador;
      maoDeObraItemHTML = `
        <tr class="mao-de-obra">
          <td>Mão de obra</td>
          <td class="right">1</td>
          <td class="right">R$ ${formatar(valor)}</td>
          <td class="right">R$ ${formatar(valor)}</td>
        </tr>`;
    } else if (multiplicador > 1) {
      const valor = subtotal * (multiplicador - 1);
      maoDeObraItemHTML = `
        <tr class="mao-de-obra">
          <td>Mão de obra especializada</td>
          <td class="right">1</td>
          <td class="right">R$ ${formatar(valor)}</td>
          <td class="right">R$ ${formatar(valor)}</td>
        </tr>`;
    }

    const itensHTML = itensLinhas + maoDeObraItemHTML;

    /* ==========================================
🔢 GERAR NÚMERO SEQUENCIAL (PADRÃO ERP)
========================================== */

    const anoAtual = new Date().getFullYear();

    // 🔥 BUSCAR ÚLTIMO ORÇAMENTO DO ANO
    let sequencial = 1;

    try {
      const _respSequencial = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/orcamentos?select=numero&numero=like.ORC-${anoAtual}-%25&order=numero.desc&limit=1`,
        {
          headers: {
            apikey: process.env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          },
        },
      );
      const ultimoNumero = await _respSequencial.json();

      if (Array.isArray(ultimoNumero) && ultimoNumero.length > 0) {
        const ultimo = ultimoNumero[0].numero;

        const partes = ultimo.split('-');
        const numeroAtual = parseInt(partes[2]);

        sequencial = numeroAtual + 1;
      }
    } catch (error) {
      const fallbackNumber = Date.now().toString().slice(-6);
      console.error('[PDF] Falha ao buscar sequencial:', error.message);
      console.warn(
        '[PDF] Usando número sequencial de fallback:',
        fallbackNumber,
      );
      sequencial = parseInt(fallbackNumber, 10);
    }

    // 🔥 FORMATA 001, 002, 003...
    const sequencialFormatado = String(sequencial).padStart(3, '0');

    const numeroFormatado =
      dados.numero || `ORC-${anoAtual}-${sequencialFormatado}`;

    /* ==========================================
    🔁 SUBSTITUIÇÕES TEMPLATE
    ========================================== */

    if (template_version === 'v2') {
      // Campos de empresa
      const empresa_nome = dados.empresa_nome || '';
      const empresa_telefone = dados.empresa_telefone || '';
      const empresa_endereco = dados.empresa_endereco || '';
      const empresa_cnpj = dados.empresa_cnpj || '';
      const empresa_logo_url_raw = dados.empresa_logo_url || '';
      const empresa_logo_url = await urlToBase64(empresa_logo_url_raw);
      const texto_apresentacao = dados.texto_apresentacao || '';
      const condicoes_contrato = dados.condicoes_contrato || '';
      const metodos_pagamento = dados.metodos_pagamento || '';
      const cor_primaria = dados.cor_primaria || '#ff6a00';

      // Logo HTML
      const logoHtml = empresa_logo_url
        ? `<img src="${empresa_logo_url}" style="width: 180px; margin-bottom: 8px;" />`
        : '';

      // Seção apresentação (divider embutido — só aparece se há conteúdo)
      const secaoApresentacao = texto_apresentacao
        ? `<div class="divider"></div>
           <div class="secao">
             <div class="secao-titulo"><span class="icon">📋</span> Relatório inicial</div>
             <div class="texto-apresentacao">${escapeHtml(texto_apresentacao).replace(/\n/g, '<br/>')}</div>
           </div>`
        : '';

      // Seção atividades (divider embutido)
      const atividadesHtml = (dados.itens || [])
        .map((item) => {
          const ambiente = item.ambiente
            ? ` (${escapeHtml(item.ambiente)})`
            : '';
          return `<div class="atividade-item"><strong>${escapeHtml(item.descricao)}${ambiente}</strong></div>`;
        })
        .join('');

      const secaoAtividades = atividadesHtml
        ? `<div class="divider"></div>
           <div class="secao">
             <div class="secao-titulo"><span class="icon">📝</span> Descrição das atividades</div>
             ${atividadesHtml}
           </div>`
        : '';

      // Preços (blocos por item)
      const precosHtml = (dados.itens || [])
        .filter((item) => {
          const nome = (item.descricao || '').trim().toLowerCase();
          const valor = parseFloat(item.valorTotal || 0);
          if (!nome || nome === 'item') return false;
          if (valor === 0) return false;
          return true;
        })
        .map(
          (item) => `
        <div class="preco-grupo">
          <div class="preco-grupo-header">${escapeHtml(item.descricao) || 'Item'}</div>
          <div class="preco-grupo-body">
            <div class="preco-info">Qtde. ${item.quantidade || 1} un &nbsp;&nbsp; Valor unitário R$ ${formatar(item.valorUnitario)}</div>
            <div class="preco-valor">R$ ${formatar(item.valorTotal)}</div>
          </div>
        </div>
      `,
        )
        .join('');

      // Mão de obra
      let maoDeObraBloco = '';
      if (multiplicador > 1) {
        const valorMdO = subtotal * (multiplicador - 1);
        maoDeObraBloco = `
          <div class="preco-grupo mao-de-obra">
            <div class="preco-grupo-header">Mão de obra especializada</div>
            <div class="preco-grupo-body">
              <div class="preco-info">Qtde. 1 un</div>
              <div class="preco-valor">R$ ${formatar(valorMdO)}</div>
            </div>
          </div>
        `;
      }

      // Totais
      const descontoNum = Number(dados.desconto) || 0;
      const totaisHtml = `
        <div class="total-row"><span>Subtotal</span><span>R$ ${formatar(subtotal)}</span></div>
        ${descontoNum > 0 ? `<div class="total-row"><span>Desconto</span><span>- R$ ${formatar(descontoNum)}</span></div>` : ''}
        <div class="total-row final"><span>Total</span><span>R$ ${formatar(total)}</span></div>
      `;

      // Métodos de pagamento
      const metodosLabels = {
        pix: 'PIX',
        credito: 'Crédito',
        debito: 'Débito',
        dinheiro: 'Dinheiro',
        transferencia: 'Transferência',
        boleto: 'Boleto',
      };
      const metodosBadges = (metodos_pagamento || '')
        .split(',')
        .filter(Boolean)
        .map(
          (m) =>
            `<span class="metodo-badge">${escapeHtml(metodosLabels[m.trim()] || m.trim())}</span>`,
        )
        .join('');

      const secaoMetodos = metodosBadges
        ? `<div class="divider"></div>
           <div class="secao">
             <div class="secao-titulo"><span class="icon">💳</span> Métodos de pagamento</div>
             <div class="metodos-container">${metodosBadges}</div>
           </div>`
        : '';

      // Condições de contrato
      const condicoesItems = (condicoes_contrato || '')
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => {
          const texto = l.replace(
            /\{\{validade\}\}/g,
            String(dados.validade || 7),
          );
          return `<li>${escapeHtml(texto)}</li>`;
        })
        .join('');

      const secaoCondicoes = condicoesItems
        ? `<div class="divider"></div>
           <div class="secao">
             <div class="secao-titulo"><span class="icon">📜</span> Condições de contrato</div>
             <ol class="condicoes-lista">${condicoesItems}</ol>
           </div>`
        : '';

      const obsHtml = dados.observacoes
        ? `<div style="margin-top:12px;padding:12px 16px;background:#f8f8f8;border-radius:6px;border-left:4px solid ${cor_primaria};">
             <div style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Observações</div>
             <div style="font-size:11px;color:#444;line-height:1.5;white-space:pre-wrap;">${escapeHtml(dados.observacoes)}</div>
           </div>`
        : '';

      const qrCodePixHtml = await gerarQrCodePixHtml({
        chavePix: dados.chave_pix || '',
        nomeRecebedor: dados.nome_recebedor_pix || empresa_nome || 'EMPRESA',
        cidadeRecebedor: dados.cidade_pix || 'UBERABA',
        valor: total,
        txid: numeroFormatado,
      });

      console.log(
        '[PDF][logo_header] valor recebido:',
        JSON.stringify(dados.empresa_logo_url) ?? 'AUSENTE',
      );
      console.log(
        '[PDF][logo_bg] valor recebido:',
        JSON.stringify(dados.empresa_logo_bg_url) ?? 'AUSENTE',
      );

      let logoBgUrlOrc = logoBgPath;
      if (dados.empresa_logo_bg_url) {
        try {
          const converted = await urlToBase64(dados.empresa_logo_bg_url);
          if (converted) {
            logoBgUrlOrc = converted;
          } else {
            console.error(
              '[PDF][logo_bg] urlToBase64 retornou vazio — resposta HTTP não-ok ou body vazio. URL:',
              dados.empresa_logo_bg_url,
            );
          }
        } catch (err) {
          console.error(
            '[PDF][logo_bg] FALHA ao converter, caindo no fallback FL:',
            err?.message,
            err?.code,
          );
        }
      } else {
        console.warn(
          '[PDF][logo_bg] campo ausente ou vazio — usando fallback estático (FL Art Metal)',
        );
      }

      html = html
        .replace(/{{cor_primaria}}/g, cor_primaria)
        .replace('{{logo_html}}', logoHtml)
        .replace('{{logo_bg}}', logoBgUrlOrc)
        .replace(/{{empresa_nome}}/g, escapeHtml(empresa_nome) || 'Empresa')
        .replace(/{{empresa_cnpj}}/g, escapeHtml(empresa_cnpj) || '')
        .replace(/{{empresa_endereco}}/g, escapeHtml(empresa_endereco) || '')
        .replace(/{{empresa_telefone}}/g, escapeHtml(empresa_telefone) || '')
        .replace(
          /{{cliente_nome}}/g,
          escapeHtml(dados.cliente_nome) || 'Cliente',
        )
        .replace(/{{orcamento_id}}/g, numeroFormatado)
        .replace('{{secao_apresentacao}}', secaoApresentacao)
        .replace('{{secao_atividades}}', secaoAtividades)
        .replace('{{precos_blocos}}', precosHtml + maoDeObraBloco)
        .replace('{{totais_html}}', totaisHtml)
        .replace('{{secao_metodos_pagamento}}', secaoMetodos)
        .replace('{{secao_condicoes}}', secaoCondicoes)
        .replace(/{{observacoes_bloco}}/g, obsHtml)
        .replace('{{QR_CODE_PIX}}', qrCodePixHtml)
        .replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'));

      // ===== ASSINATURAS DIGITAIS (v2) =====
      const assinaturaEmpresaHtmlV2 = dados.assinatura_empresa
        ? `<img src="${dados.assinatura_empresa}" alt="Assinatura da empresa" style="height:50px;width:auto;display:block;margin:0 auto 4px;" />`
        : '';
      const assinaturaClienteHtmlV2 = dados.assinatura_cliente
        ? `<img src="${dados.assinatura_cliente}" alt="Assinatura do cliente" style="height:50px;width:auto;display:block;margin:0 auto 4px;" />`
        : '';
      const dataAssinaturaHtmlV2 = dados.data_assinatura
        ? `<p style="font-size:7px;color:#999;text-align:center;margin-top:2px;">Assinado digitalmente em ${new Date(dados.data_assinatura).toLocaleString('pt-BR')}</p>`
        : '';
      html = html
        .replace('{{ASSINATURA_EMPRESA}}', assinaturaEmpresaHtmlV2)
        .replace('{{ASSINATURA_CLIENTE}}', assinaturaClienteHtmlV2)
        .replace('{{DATA_ASSINATURA}}', dataAssinaturaHtmlV2);
    } else {
      const qrCodePixHtmlV1 = await gerarQrCodePixHtml({
        chavePix: dados.chave_pix || '',
        nomeRecebedor:
          dados.nome_recebedor_pix || dados.empresa_nome || 'EMPRESA',
        cidadeRecebedor: dados.cidade_pix || 'UBERABA',
        valor: total,
        txid: numeroFormatado,
      });

      html = html
        .replace(/{{cliente_nome}}/g, escapeHtml(dados.cliente_nome))
        .replace(
          /{{cliente_telefone}}/g,
          escapeHtml(dados.cliente_telefone) || '-',
        )
        .replace(
          /{{cliente_endereco}}/g,
          escapeHtml(dados.cliente_endereco) || '-',
        )
        .replace(/{{orcamento_id}}/g, numeroFormatado)
        .replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'))
        .replace(/{{itens}}/g, itensHTML)
        .replace(/{{subtotal}}/g, formatar(subtotal))
        .replace(/{{desconto}}/g, formatar(dados.desconto))
        .replace(/{{total}}/g, formatar(total))
        .replace(/{{observacoes}}/g, escapeHtml(dados.observacoes) || '')
        .replace(/{{validade}}/g, dados.validade || 7)
        .replace('{{QR_CODE_PIX}}', qrCodePixHtmlV1);

      // ===== ASSINATURAS DIGITAIS (v1) =====
      const assinaturaEmpresaHtmlV1 = dados.assinatura_empresa
        ? `<img src="${dados.assinatura_empresa}" alt="Assinatura da empresa" style="height:50px;width:auto;display:block;margin:0 auto 4px;" />`
        : '';
      const assinaturaClienteHtmlV1 = dados.assinatura_cliente
        ? `<img src="${dados.assinatura_cliente}" alt="Assinatura do cliente" style="height:50px;width:auto;display:block;margin:0 auto 4px;" />`
        : '';
      const dataAssinaturaHtmlV1 = dados.data_assinatura
        ? `<p style="font-size:7px;color:#999;text-align:center;margin-top:2px;">Assinado digitalmente em ${new Date(dados.data_assinatura).toLocaleString('pt-BR')}</p>`
        : '';
      html = html
        .replace('{{ASSINATURA_EMPRESA}}', assinaturaEmpresaHtmlV1)
        .replace('{{ASSINATURA_CLIENTE}}', assinaturaClienteHtmlV1)
        .replace('{{DATA_ASSINATURA}}', dataAssinaturaHtmlV1);

      // 🔥 IMAGENS DINÂMICAS
      html = html.replace('{{logo}}', logoPath);
      html = html.replace('{{logo_bg}}', logoBgPath);
    }

    /* ==========================================
    🧠 GERAR PDF (PUPPETEER)
    ========================================== */

    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // 🔥 DEFINE TAMANHO DA PÁGINA (IMPORTANTE)
    await page.setViewport({
      width: 1240,
      height: 1754,
    });

    // Safety net: limpar placeholders não substituídos
    html = html.replace(/\{\{[A-Za-z_]+\}\}/g, '');

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

    return res.send(pdf);
  } catch (error) {
    console.error('[Server] Erro ao gerar PDF:', error);

    return res.status(500).json({
      error: 'Erro ao gerar PDF',
    });
  }
});

/* ==========================================
📄 GERAR PDF AGRUPADO (múltiplos orçamentos)
========================================== */

app.post('/api/gerar-orcamento-agrupado', strictLimiter, async (req, res) => {
  try {
    const {
      orcamentos,
      cliente_nome,
      cliente_telefone,
      cliente_endereco,
      mostrar_total_geral,
      empresa_telefone,
      empresa_email,
      template_version,
      empresa_nome,
      empresa_cnpj,
      empresa_endereco,
      empresa_logo_url,
      empresa_logo_bg_url,
      texto_apresentacao,
      condicoes_contrato,
      metodos_pagamento,
      cor_primaria,
      chave_pix,
      nome_recebedor_pix,
      cidade_pix,
    } = req.body;

    if (!Array.isArray(orcamentos) || orcamentos.length === 0) {
      return res.status(400).json({ error: 'Nenhum orçamento fornecido' });
    }

    const formatar = (v) =>
      Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    const contatoTelefone = empresa_telefone || '(34) 9 9199-8953';
    const contatoEmail = empresa_email || 'flartmetal.uberaba@gmail.com';

    let totalGeral = 0;

    const blocos = orcamentos
      .map((orc, index) => {
        const itensLinhas = (orc.itens || [])
          .filter((item) => {
            const nome = (item.descricao || '').trim().toLowerCase();
            const valor = parseFloat(item.valorTotal || 0);
            if (!nome || nome === 'item') return false;
            const isMaoDeObra =
              nome.includes('mão de obra') || nome.includes('mao de obra');
            if (valor === 0 && !isMaoDeObra) return false;
            return true;
          })
          .map(
            (item) => `
        <tr>
          <td>${escapeHtml(item.descricao) || ''}</td>
          <td class="right">${item.quantidade || 1}</td>
          <td class="right">R$ ${formatar(item.valorUnitario)}</td>
          <td class="right">R$ ${formatar(item.valorTotal)}</td>
        </tr>
      `,
          )
          .join('');

        const subtotal = Number(orc.subtotal) || 0;
        const multiplicador = Number(orc.multiplicador) || 1;
        const total = Number(orc.total) || 0;

        totalGeral += total;

        let maoDeObraHTML = '';
        if (multiplicador > 1) {
          const valor = subtotal * (multiplicador - 1);
          maoDeObraHTML = `
          <tr class="mao-de-obra">
            <td>Mão de obra especializada</td>
            <td class="right">1</td>
            <td class="right">R$ ${formatar(valor)}</td>
            <td class="right">R$ ${formatar(valor)}</td>
          </tr>`;
        }

        const pageBreak = index > 0 ? 'page-break-before: always;' : '';

        const titulo = escapeHtml(
          orc.ambiente ||
            (orc.observacoes ? orc.observacoes.substring(0, 40) : null) ||
            `Orçamento ${index + 1}`,
        );

        return `
        <div style="${pageBreak}">
          <h2 style="color: ${cor_primaria || '#ff6a00'}; font-size: 18px; margin-bottom: 8px; border-bottom: 2px solid ${cor_primaria || '#ff6a00'}; padding-bottom: 6px;">
            ${titulo} — ${orc.numero || ''}
          </h2>
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th class="right">Qtd</th>
                <th class="right">Valor Unit</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itensLinhas}
              ${maoDeObraHTML}
            </tbody>
          </table>
          <div class="totals">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>R$ ${formatar(subtotal)}</span>
            </div>
            <div class="totals-row">
              <span>Desconto</span>
              <span>R$ ${formatar(orc.desconto || 0)}</span>
            </div>
            <div class="total-box">
              <div class="total-label">TOTAL</div>
              <div class="total-value">R$ ${formatar(total)}</div>
            </div>
          </div>
        </div>
      `;
      })
      .join('');

    const totalGeralHTML =
      mostrar_total_geral !== false
        ? `
      <div style="page-break-inside: avoid; margin-top: 40px;">
        <div class="total-box" style="background: linear-gradient(135deg, #222, #444);">
          <div class="total-label">TOTAL GERAL (${orcamentos.length} orçamento${orcamentos.length !== 1 ? 's' : ''})</div>
          <div class="total-value">R$ ${formatar(totalGeral)}</div>
        </div>
      </div>
    `
        : '';

    let htmlFinal;

    if (template_version === 'v2') {
      const v2TemplatePath = path.resolve(
        process.cwd(),
        'templates',
        'orcamento-v2.html',
      );
      const v2Base = fs.readFileSync(v2TemplatePath, 'utf-8');
      const v2StyleMatch = v2Base.match(/<style>([\s\S]*?)<\/style>/);
      const v2Estilos = v2StyleMatch ? v2StyleMatch[1] : '';

      const corPrimaria = cor_primaria || '#ff6a00';
      const logoUrlAgrupado = await urlToBase64(empresa_logo_url || '');
      const logoHtmlAgrupado = logoUrlAgrupado
        ? `<img src="${logoUrlAgrupado}" style="width: 180px; margin-bottom: 8px;" />`
        : '';
      const logoBgUrlAgrupado = empresa_logo_bg_url
        ? await urlToBase64(empresa_logo_bg_url)
        : logoBgPath;

      // Seção apresentação (aparece uma vez, antes dos orçamentos)
      const secaoApresentacaoAgrp = texto_apresentacao
        ? `<div class="secao">
             <div class="secao-titulo"><span class="icon">📋</span> Relatório inicial</div>
             <div class="texto-apresentacao">${escapeHtml(texto_apresentacao).replace(/\n/g, '<br/>')}</div>
           </div>
           <div class="divider"></div>`
        : '';

      // Blocos de orçamento no estilo v2
      let totalGeralV2 = 0;
      const blocosV2 = orcamentos
        .map((orc, index) => {
          const pageBreak = index > 0 ? 'class="page-break"' : '';
          const titulo = escapeHtml(
            orc.ambiente ||
              orc.observacoes?.substring(0, 40) ||
              `Orçamento ${index + 1}`,
          );
          const subtotalOrc = Number(orc.subtotal) || 0;
          const multiplicadorOrc = Number(orc.multiplicador) || 1;
          const totalOrc = Number(orc.total) || 0;
          totalGeralV2 += totalOrc;

          const precosOrc = (orc.itens || [])
            .filter((item) => {
              const nome = (item.descricao || '').trim().toLowerCase();
              const valor = parseFloat(item.valorTotal || 0);
              if (!nome || nome === 'item') return false;
              if (valor === 0) return false;
              return true;
            })
            .map(
              (item) => `
          <div class="preco-grupo">
            <div class="preco-grupo-header">${escapeHtml(item.descricao) || 'Item'}</div>
            <div class="preco-grupo-body">
              <div class="preco-info">Qtde. ${item.quantidade || 1} un &nbsp;&nbsp; Valor unitário R$ ${formatar(item.valorUnitario)}</div>
              <div class="preco-valor">R$ ${formatar(item.valorTotal)}</div>
            </div>
          </div>
        `,
            )
            .join('');

          let maoDeObraBlocoOrc = '';
          if (multiplicadorOrc > 1) {
            const valorMdO = subtotalOrc * (multiplicadorOrc - 1);
            maoDeObraBlocoOrc = `
            <div class="preco-grupo mao-de-obra">
              <div class="preco-grupo-header">Mão de obra especializada</div>
              <div class="preco-grupo-body">
                <div class="preco-info">Qtde. 1 un</div>
                <div class="preco-valor">R$ ${formatar(valorMdO)}</div>
              </div>
            </div>
          `;
          }

          const descontoOrc = Number(orc.desconto) || 0;
          const totaisOrc = `
          <div class="total-row"><span>Subtotal</span><span>R$ ${formatar(subtotalOrc)}</span></div>
          ${descontoOrc > 0 ? `<div class="total-row"><span>Desconto</span><span>- R$ ${formatar(descontoOrc)}</span></div>` : ''}
          <div class="total-row final"><span>Total</span><span>R$ ${formatar(totalOrc)}</span></div>
        `;

          return `
          <div ${pageBreak}>
            <div class="secao">
              <div class="secao-titulo" style="color: ${corPrimaria}; border-bottom: 2px solid ${corPrimaria}; padding-bottom: 6px;">
                ${titulo} — ${orc.numero || ''}
              </div>
            </div>
            <div class="secao">
              <div class="secao-titulo"><span class="icon">💰</span> Preços</div>
              ${precosOrc}${maoDeObraBlocoOrc}
              <div style="margin-top: 16px; padding-top: 8px;">${totaisOrc}</div>
            </div>
            <div class="divider"></div>
          </div>
        `;
        })
        .join('');

      // Total geral
      const totalGeralBlocoV2 =
        mostrar_total_geral !== false
          ? `
        <div class="secao" style="page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; background: #222; color: #fff; padding: 16px 20px; border-radius: 8px; font-size: 20px; font-weight: 700;">
            <span>TOTAL GERAL (${orcamentos.length} orçamento${orcamentos.length !== 1 ? 's' : ''})</span>
            <span>R$ ${formatar(totalGeralV2)}</span>
          </div>
        </div>
        <div class="divider"></div>
      `
          : '';

      // Métodos de pagamento
      const metodosLabelsAgrp = {
        pix: 'PIX',
        credito: 'Crédito',
        debito: 'Débito',
        dinheiro: 'Dinheiro',
        transferencia: 'Transferência',
        boleto: 'Boleto',
      };
      const metodosBadgesAgrp = (metodos_pagamento || '')
        .split(',')
        .filter(Boolean)
        .map(
          (m) =>
            `<span class="metodo-badge">${escapeHtml(metodosLabelsAgrp[m.trim()] || m.trim())}</span>`,
        )
        .join('');
      const secaoMetodosAgrp = metodosBadgesAgrp
        ? `<div class="secao"><div class="secao-titulo"><span class="icon">💳</span> Métodos de pagamento</div><div class="metodos-container">${metodosBadgesAgrp}</div></div><div class="divider"></div>`
        : '';

      // Condições
      const condicoesItemsAgrp = (condicoes_contrato || '')
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => `<li>${escapeHtml(l)}</li>`)
        .join('');
      const secaoCondicoesAgrp = condicoesItemsAgrp
        ? `<div class="secao"><div class="secao-titulo"><span class="icon">📜</span> Condições de contrato</div><ol class="condicoes-lista">${condicoesItemsAgrp}</ol></div>`
        : '';

      htmlFinal = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>${v2Estilos.replace(/{{cor_primaria}}/g, corPrimaria)}</style>
</head>
<body>
  <div class="watermark"><img src="${logoBgUrlAgrupado}" style="width: 100%" /></div>
  <div class="container">
    <div class="top-bar" style="background: ${corPrimaria};"></div>
    <div class="empresa-header">
      ${logoHtmlAgrupado}
      <div class="empresa-nome">${escapeHtml(empresa_nome) || ''}</div>
      <div class="empresa-dados">${escapeHtml(empresa_cnpj) || ''}<br/>${escapeHtml(empresa_endereco) || ''}<br/>${escapeHtml(empresa_telefone) || ''}</div>
    </div>
    <div class="divider"></div>
    <div class="titulo-orcamento">
      <h1>Proposta ${escapeHtml(cliente_nome) || 'Cliente'}</h1>
      <div class="cliente-sub">${orcamentos.length} orçamento${orcamentos.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="divider"></div>
    ${secaoApresentacaoAgrp}
    ${blocosV2}
    ${totalGeralBlocoV2}
    ${secaoMetodosAgrp}
    ${secaoCondicoesAgrp}
    ${await gerarQrCodePixHtml({ chavePix: chave_pix || '', nomeRecebedor: nome_recebedor_pix || empresa_nome || 'EMPRESA', cidadeRecebedor: cidade_pix || 'UBERABA', valor: totalGeralV2, txid: 'PROPOSTA' })}
    <div class="footer">Criado em ${new Date().toLocaleDateString('pt-BR')}</div>
  </div>
</body>
</html>`;
    } else {
      const templatePath = path.resolve(
        process.cwd(),
        'templates',
        'orcamento.html',
      );
      const baseHtml = fs.readFileSync(templatePath, 'utf-8');

      const styleMatch = baseHtml.match(/<style>([\s\S]*?)<\/style>/);
      const estilos = styleMatch ? styleMatch[1] : '';

      htmlFinal = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>${estilos}</style>
</head>
<body>
  <div class="watermark">
    <img src="${logoBgPath}" style="width: 100%" />
  </div>
  <div class="container">
    <div style="text-align: center; margin-bottom: 10px">
      <img src="${logoPath}" style="width: 220px; margin-bottom: 6px" />
    </div>
    <div class="contact-bar">
      📞 ${contatoTelefone} &nbsp;&nbsp; | &nbsp;&nbsp; ✉ ${contatoEmail}
    </div>
    <div class="client-section">
      <div class="client-row">
        <div class="client-box">
          <div class="client-title">Cliente</div>
          <div class="client-name">${escapeHtml(cliente_nome) || 'Cliente'}</div>
          <div class="client-info">
            📞 ${escapeHtml(cliente_telefone) || '-'}<br/>
            📍 ${escapeHtml(cliente_endereco) || '-'}
          </div>
        </div>
        <div class="orc-info">
          <div class="orc-title">PROPOSTA CONSOLIDADA</div>
          <div class="orc-date">Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>
          <div style="font-size: 13px; color: #888; margin-top: 4px;">
            ${orcamentos.length} orçamento${orcamentos.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
    ${blocos}
    ${totalGeralHTML}
    ${await gerarQrCodePixHtml({ chavePix: chave_pix || '', nomeRecebedor: nome_recebedor_pix || empresa_nome || 'EMPRESA', cidadeRecebedor: cidade_pix || 'UBERABA', valor: totalGeral, txid: 'PROPOSTA' })}
    <div class="footer" style="page-break-inside: avoid;">
      Agradecemos pela oportunidade.<br/>
      Aguardamos seu retorno para darmos início ao cronograma de execução.
    </div>
  </div>
</body>
</html>`;
    }

    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754 });

    // Safety net: limpar placeholders não substituídos
    htmlFinal = htmlFinal.replace(/\{\{[A-Za-z_]+\}\}/g, '');

    await page.setContent(htmlFinal, { waitUntil: 'networkidle0' });

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

    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdf);
  } catch (error) {
    console.error('[Server] Erro ao gerar PDF agrupado:', error);
    return res.status(500).json({ error: 'Erro ao gerar PDF agrupado' });
  }
});

/* ==========================================
🧾 VALOR POR EXTENSO (pt-BR, até 999.999,99)
========================================== */

function valorPorExtenso(valor) {
  const unidades = [
    '',
    'um',
    'dois',
    'três',
    'quatro',
    'cinco',
    'seis',
    'sete',
    'oito',
    'nove',
    'dez',
    'onze',
    'doze',
    'treze',
    'quatorze',
    'quinze',
    'dezesseis',
    'dezessete',
    'dezoito',
    'dezenove',
  ];
  const dezenas = [
    '',
    '',
    'vinte',
    'trinta',
    'quarenta',
    'cinquenta',
    'sessenta',
    'setenta',
    'oitenta',
    'noventa',
  ];
  const centenas = [
    '',
    'cem',
    'duzentos',
    'trezentos',
    'quatrocentos',
    'quinhentos',
    'seiscentos',
    'setecentos',
    'oitocentos',
    'novecentos',
  ];

  function grupo(n) {
    if (n === 0) return '';
    if (n < 20) return unidades[n];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return dezenas[d] + (u > 0 ? ' e ' + unidades[u] : '');
    }
    const c = Math.floor(n / 100);
    const resto = n % 100;
    if (n === 100) return 'cem';
    return centenas[c] + (resto > 0 ? ' e ' + grupo(resto) : '');
  }

  const n = Math.round(Number(valor || 0) * 100);
  const reais = Math.floor(n / 100);
  const centavos = n % 100;

  if (reais === 0 && centavos === 0) return 'zero reais';

  let resultado = '';

  if (reais >= 1000) {
    const mil = Math.floor(reais / 1000);
    const resto = reais % 1000;
    resultado += mil === 1 ? 'mil' : grupo(mil) + ' mil';
    if (resto > 0) resultado += ' e ' + grupo(resto);
  } else if (reais > 0) {
    resultado += grupo(reais);
  }

  if (reais > 0) resultado += reais === 1 ? ' real' : ' reais';

  if (centavos > 0) {
    if (reais > 0) resultado += ' e ';
    resultado += grupo(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  }

  return resultado;
}

function dataExtenso(dataStr) {
  const meses = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];

  let d;
  if (dataStr) {
    if (dataStr.includes('/')) {
      const partes = dataStr.split('/');
      d = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
    } else {
      d = new Date(dataStr);
    }
  } else {
    d = new Date();
  }

  return `Uberaba, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

/* ==========================================
🧾 GERAR RECIBO PDF (TEMPLATE REAL)
========================================== */

app.post('/api/gerar-recibo', strictLimiter, async (req, res) => {
  try {
    const dados = req.body;

    /* ==========================================
    📄 CARREGAR TEMPLATE HTML
    ========================================== */

    const templateVersion = dados.template_version || 'v1';
    const templateFile =
      templateVersion === 'v2' ? 'recibo-v2.html' : 'recibo.html';

    const templatePath = path.resolve(process.cwd(), 'templates', templateFile);

    if (!fs.existsSync(templatePath)) {
      console.error('[Recibo] Template não encontrado');
      return res.status(500).json({
        error: 'Template HTML do recibo não encontrado',
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

    if (!Array.isArray(dados.itens)) {
      console.warn('[Recibo] ⚠️ itens inválidos, corrigindo...');
      dados.itens = [];
    }

    const itensLinhas = dados.itens
      .map(
        (item) => `
        <tr>
          <td>${escapeHtml(item.descricao) || ''}</td>
          <td class="right">${item.quantidade || 1}</td>
          <td class="right">R$ ${formatar(item.valorUnitario)}</td>
          <td class="right">R$ ${formatar(item.valorTotal)}</td>
        </tr>
      `,
      )
      .join('');

    /* ==========================================
    📝 OBSERVAÇÕES (bloco opcional)
    ========================================== */

    const obsHtml = dados.observacoes
      ? `<div class="conditions">
           <div class="conditions-title">Observações</div>
           ${escapeHtml(dados.observacoes)}
         </div>`
      : '';

    /* ==========================================
    🔁 SUBSTITUIÇÕES TEMPLATE
    ========================================== */

    const dataEmissaoFormatada =
      dados.data_emissao || new Date().toLocaleDateString('pt-BR');

    html = html
      .replace(/{{numero_recibo}}/g, dados.numero_recibo || 'RECIBO')
      .replace(/{{data_emissao}}/g, dataEmissaoFormatada)
      .replace(/{{cliente_nome}}/g, escapeHtml(dados.cliente_nome) || 'Cliente')
      .replace(
        /{{cliente_telefone}}/g,
        escapeHtml(dados.cliente_telefone) || '-',
      )
      .replace(
        /{{cliente_endereco}}/g,
        escapeHtml(dados.cliente_endereco) || '-',
      )
      .replace(/{{valor_total}}/g, formatar(dados.valor_total))
      .replace(/{{valor_por_extenso}}/g, valorPorExtenso(dados.valor_total))
      .replace(/{{itens}}/g, itensLinhas)
      .replace(/{{observacoes_bloco}}/g, obsHtml)
      .replace(/{{data_extenso}}/g, dataExtenso(dados.data_emissao));

    const qrCodePixHtmlRecibo = await gerarQrCodePixHtml({
      chavePix: dados.chave_pix || '',
      nomeRecebedor:
        dados.nome_recebedor_pix || dados.empresa_nome || 'EMPRESA',
      cidadeRecebedor: dados.cidade_pix || 'UBERABA',
      valor: dados.valor_total,
      txid: dados.numero_recibo || 'RECIBO',
    });

    // 🔥 IMAGENS DINÂMICAS
    if (templateVersion === 'v2') {
      const logoUrl = dados.empresa_logo_url
        ? await urlToBase64(dados.empresa_logo_url)
        : logoPath;
      const logoHtml = logoUrl
        ? `<img src="${logoUrl}" style="width:180px;margin-bottom:8px;" />`
        : '';
      const logoBgUrl = dados.empresa_logo_bg_url
        ? await urlToBase64(dados.empresa_logo_bg_url)
        : logoBgPath;

      html = html
        .replace(/{{cor_primaria}}/g, dados.cor_primaria || '#ff6a00')
        .replace(/{{logo_html}}/g, logoHtml)
        .replace(/{{logo_bg}}/g, logoBgUrl)
        .replace(/{{empresa_nome}}/g, escapeHtml(dados.empresa_nome) || '')
        .replace(/{{empresa_cnpj}}/g, escapeHtml(dados.empresa_cnpj) || '')
        .replace(
          /{{empresa_endereco}}/g,
          escapeHtml(dados.empresa_endereco) || '',
        )
        .replace(
          /{{empresa_telefone}}/g,
          escapeHtml(dados.empresa_telefone) || '',
        )
        .replace('{{QR_CODE_PIX}}', qrCodePixHtmlRecibo);

      // ===== ASSINATURAS DIGITAIS RECIBO (v2) =====
      const assinaturaEmpresaHtmlRecibo = dados.assinatura_empresa
        ? `<img src="${dados.assinatura_empresa}" alt="Assinatura da empresa" style="height:50px;width:auto;display:block;margin:0 auto 4px;" />`
        : '';
      html = html
        .replace('{{ASSINATURA_EMPRESA}}', assinaturaEmpresaHtmlRecibo)
        .replace('{{ASSINATURA_CLIENTE}}', '')
        .replace('{{DATA_ASSINATURA}}', '');
    } else {
      html = html.replace('{{logo}}', logoPath);
      html = html.replace('{{logo_bg}}', logoBgPath);
      html = html.replace('{{QR_CODE_PIX}}', qrCodePixHtmlRecibo);

      // ===== ASSINATURAS DIGITAIS RECIBO (v1) =====
      const assinaturaEmpresaHtmlReciboV1 = dados.assinatura_empresa
        ? `<img src="${dados.assinatura_empresa}" alt="Assinatura da empresa" style="height:50px;width:auto;display:block;margin:0 auto 4px;" />`
        : '';
      html = html
        .replace('{{ASSINATURA_EMPRESA}}', assinaturaEmpresaHtmlReciboV1)
        .replace('{{ASSINATURA_CLIENTE}}', '')
        .replace('{{DATA_ASSINATURA}}', '');
    }

    /* ==========================================
    🧠 GERAR PDF (PUPPETEER)
    ========================================== */

    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1240,
      height: 1754,
    });

    // Safety net: limpar placeholders não substituídos
    html = html.replace(/\{\{[A-Za-z_]+\}\}/g, '');

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

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
    return res.send(pdf);
  } catch (error) {
    console.error('[Recibo] Erro ao gerar PDF:', error);
    return res.status(500).json({ error: 'Erro ao gerar PDF do recibo' });
  }
});

/* ==========================================
💸 PIX — Gerar payload Copia e Cola
========================================== */

app.post('/api/pix-payload', async (req, res) => {
  try {
    const { chavePix, nomeRecebedor, cidadeRecebedor, valor, txid } = req.body;

    if (!chavePix) {
      return res.status(400).json({ error: 'Chave PIX não informada' });
    }

    const payload = pixPayload({
      chavePix,
      nomeRecebedor: nomeRecebedor || 'EMPRESA',
      cidadeRecebedor: cidadeRecebedor || 'UBERABA',
      valor: valor || null,
      txid: txid || '***',
    });

    res.json({ payload, chavePix });
  } catch (err) {
    console.error('[PIX Payload] Erro:', err);
    res.status(500).json({ error: 'Erro ao gerar payload PIX' });
  }
});

/* ==========================================
🏢 ADMIN — Supabase service_role client
========================================== */

function getSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/* ==========================================
🏢 GET /api/admin/workspaces — Lista todas as empresas
========================================== */

app.get(
  '/api/admin/workspaces',
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('workspaces')
        .select('id, nome, segment, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.json(data ?? []);
    } catch (error) {
      console.error('[Admin] Erro ao listar workspaces:', error.message);
      return res.status(500).json({ error: error.message });
    }
  },
);

/* ==========================================
🏢 POST /api/admin/criar-empresa — Cria workspace + usuário + vínculo
========================================== */

app.post(
  '/api/admin/criar-empresa',
  requireAuth,
  requireAdmin,
  strictLimiter,
  async (req, res) => {
    const { nome, segment, email, senha } = req.body ?? {};

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome da empresa é obrigatório' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email do usuário é obrigatório' });
    }
    if (!senha || senha.length < 6) {
      return res
        .status(400)
        .json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();

      // 1. Criar workspace
      const { data: workspace, error: wsError } = await supabaseAdmin
        .from('workspaces')
        .insert({ nome: nome.trim(), segment: segment || 'metalurgica' })
        .select()
        .single();

      if (wsError) {
        console.error('[Admin] Erro ao criar workspace:', wsError.message);
        return res
          .status(500)
          .json({ error: 'Erro ao criar workspace: ' + wsError.message });
      }

      // 2. Criar usuário via admin API
      const { data: userResult, error: userError } =
        await supabaseAdmin.auth.admin.createUser({
          email: email.trim(),
          password: senha,
          email_confirm: true,
        });

      if (userError) {
        console.error('[Admin] Erro ao criar usuário:', userError.message);
        // Limpar workspace criado
        await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id);
        const alreadyExists =
          userError.message.includes('already registered') ||
          userError.status === 422;
        return res.status(alreadyExists ? 409 : 500).json({
          error: alreadyExists
            ? 'Email já cadastrado no sistema'
            : 'Erro ao criar usuário: ' + userError.message,
        });
      }

      const userId = userResult.user.id;

      // 3. Vincular usuário ao workspace como owner
      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({ workspace_id: workspace.id, user_id: userId, role: 'owner' });

      if (memberError) {
        console.error('[Admin] Erro ao vincular membro:', memberError.message);
        return res.status(500).json({
          error:
            'Erro ao vincular usuário ao workspace: ' + memberError.message,
        });
      }

      return res.json({
        workspace_id: workspace.id,
        user_id: userId,
        email: email.trim(),
      });
    } catch (error) {
      console.error('[Admin] Erro inesperado:', error.message);
      return res.status(500).json({ error: error.message });
    }
  },
);

/* ==========================================
📲 WEBHOOK EVOLUTION API (WhatsApp)
========================================== */
app.post('/webhook/evolution', async (req, res) => {
  try {
    const { event, instance, data } = req.body;

    console.log(`[Evolution Webhook] Event: ${event}, Instance: ${instance}`);

    if (event !== 'messages.upsert') {
      return res.status(200).json({ status: 'ignored', event });
    }

    const message = data;
    if (!message || !message.key) {
      return res.status(200).json({ status: 'no_message' });
    }

    const supabase = getSupabaseAdmin();

    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('workspace_id')
      .eq('instance_name', instance)
      .single();

    const workspaceId =
      instanceData?.workspace_id || process.env.DEFAULT_WORKSPACE_ID;

    if (!workspaceId) {
      console.log(
        '[Evolution Webhook] No workspace mapping for instance:',
        instance,
      );
      return res.status(200).json({ status: 'no_workspace' });
    }

    let content = '';
    let messageType = 'text';

    if (message.message?.conversation) {
      content = message.message.conversation;
    } else if (message.message?.extendedTextMessage?.text) {
      content = message.message.extendedTextMessage.text;
    } else if (message.message?.imageMessage) {
      messageType = 'image';
      content = message.message.imageMessage.caption || '[Imagem]';
    } else if (message.message?.audioMessage) {
      messageType = 'audio';
      content = '[Áudio]';
    } else if (message.message?.documentMessage) {
      messageType = 'document';
      content = message.message.documentMessage.fileName || '[Documento]';
    } else if (message.message?.videoMessage) {
      messageType = 'video';
      content = '[Vídeo]';
    }

    const { error } = await supabase.from('whatsapp_messages').upsert(
      {
        workspace_id: workspaceId,
        instance_name: instance,
        remote_jid: message.key.remoteJid,
        contact_name: message.pushName || null,
        message_id: message.key.id,
        from_me: message.key.fromMe || false,
        message_type: messageType,
        content: content,
        timestamp: message.messageTimestamp
          ? new Date(message.messageTimestamp * 1000).toISOString()
          : new Date().toISOString(),
        raw_data: message,
      },
      { onConflict: 'message_id' },
    );

    if (error) {
      console.error('[Evolution Webhook] Supabase error:', error);
      return res.status(500).json({ status: 'error', error: error.message });
    }

    return res.status(200).json({ status: 'saved' });
  } catch (err) {
    console.error('[Evolution Webhook] Error:', err);
    return res.status(500).json({ status: 'error' });
  }
});

/* ==========================================
📤 EVOLUTION API — PROXY ROUTES
========================================== */

function evolutionConfig(res) {
  const url = process.env.EVOLUTION_API_URL;
  const key = process.env.EVOLUTION_API_KEY;
  if (!url || !key) {
    res
      .status(500)
      .json({ error: 'Evolution API não configurada no servidor' });
    return null;
  }
  return { url, key };
}

// Enviar mensagem de texto
app.post('/api/whatsapp/send-text', requireAuth, async (req, res) => {
  const cfg = evolutionConfig(res);
  if (!cfg) return;
  try {
    const { instanceName, number, text, originalJid } = req.body ?? {};
    if (!instanceName || !number || !text) {
      return res
        .status(400)
        .json({ error: 'instanceName, number e text são obrigatórios' });
    }

    if (String(number).includes('@g.us')) {
      return res.status(400).json({
        error: 'Envio para grupos não disponível',
        groupNotSupported: true,
      });
    }

    if (String(number).includes('@lid')) {
      return res.status(400).json({
        error:
          'Este contato usa ID interno (LID). Informe o número real com DDI/DDD.',
        lidDetected: true,
      });
    }

    const sendNumber = String(number).split('@')[0].replace(/\D/g, '');
    if (!sendNumber) {
      return res.status(400).json({ error: 'Número inválido' });
    }

    const response = await fetch(
      `${cfg.url}/message/sendText/${instanceName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: cfg.key },
        body: JSON.stringify({ number: sendNumber, text }),
      },
    );
    const data = await response.json();

    if (response.ok && data?.key?.id && data?.key?.remoteJid) {
      try {
        const admin = getSupabaseAdmin();
        const { data: inst } = await admin
          .from('whatsapp_instances')
          .select('workspace_id')
          .eq('instance_name', instanceName)
          .single();

        if (inst?.workspace_id) {
          const persistJid = originalJid || data.key.remoteJid;
          await admin.from('whatsapp_messages').upsert(
            {
              workspace_id: inst.workspace_id,
              instance_name: instanceName,
              remote_jid: persistJid,
              contact_name: null,
              message_id: data.key.id,
              from_me: true,
              message_type: 'text',
              content: text,
              timestamp: new Date().toISOString(),
              raw_data: data,
            },
            { onConflict: 'message_id' },
          );
        }
      } catch (err) {
        console.error('[WhatsApp Send] persist error:', err);
      }
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[WhatsApp Send] Error:', err);
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Enviar mídia (imagem, documento, áudio, vídeo)
app.post('/api/whatsapp/send-media', requireAuth, async (req, res) => {
  const cfg = evolutionConfig(res);
  if (!cfg) return;
  try {
    const { instanceName, number, mediatype, caption, media } = req.body ?? {};
    if (!instanceName || !number || !mediatype || !media) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    const response = await fetch(
      `${cfg.url}/message/sendMedia/${instanceName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: cfg.key },
        body: JSON.stringify({ number, mediatype, caption, media }),
      },
    );
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[WhatsApp Media] Error:', err);
    return res.status(500).json({ error: 'Erro ao enviar mídia' });
  }
});

// Status da instância
app.get('/api/whatsapp/status/:instanceName', requireAuth, async (req, res) => {
  const cfg = evolutionConfig(res);
  if (!cfg) return;
  try {
    const response = await fetch(
      `${cfg.url}/instance/connectionState/${req.params.instanceName}`,
      { headers: { apikey: cfg.key } },
    );
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[WhatsApp Status] Error:', err);
    return res.status(500).json({ error: 'Erro ao verificar status' });
  }
});

// Desconectar instância (logout)
app.post(
  '/api/whatsapp/logout/:instanceName',
  requireAuth,
  async (req, res) => {
    const cfg = evolutionConfig(res);
    if (!cfg) return;
    try {
      const response = await fetch(
        `${cfg.url}/instance/logout/${req.params.instanceName}`,
        { method: 'DELETE', headers: { apikey: cfg.key } },
      );
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err) {
      console.error('[WhatsApp Logout] Error:', err);
      return res.status(500).json({ error: 'Erro ao desconectar' });
    }
  },
);

// Listar contatos da instância (resolve número real)
app.get(
  '/api/whatsapp/contacts/:instanceName',
  requireAuth,
  async (req, res) => {
    const cfg = evolutionConfig(res);
    if (!cfg) return;
    try {
      const response = await fetch(
        `${cfg.url}/chat/findContacts/${req.params.instanceName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: cfg.key },
          body: JSON.stringify({ where: {} }),
        },
      );
      const contacts = await response.json();
      const mapped = Array.isArray(contacts)
        ? contacts
            .filter((c) => c?.remoteJid?.includes?.('@s.whatsapp.net'))
            .map((c) => ({
              pushName: c.pushName || '',
              remoteJid: c.remoteJid,
              number: c.remoteJid.replace('@s.whatsapp.net', ''),
              profilePicUrl: c.profilePicUrl || null,
            }))
        : [];
      return res.json(mapped);
    } catch (err) {
      console.error('[WhatsApp Contacts] Error:', err);
      return res.status(500).json({ error: 'Erro ao buscar contatos' });
    }
  },
);

// Baixar mídia (base64) de uma mensagem
app.get(
  '/api/whatsapp/media/:instanceName/:messageId',
  requireAuth,
  async (req, res) => {
    const cfg = evolutionConfig(res);
    if (!cfg) return;
    try {
      const { instanceName, messageId } = req.params;
      const response = await fetch(
        `${cfg.url}/chat/getBase64FromMediaMessage/${instanceName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: cfg.key },
          body: JSON.stringify({ message: { key: { id: messageId } } }),
        },
      );
      const data = await response.json();
      if (data?.base64) {
        return res.json({
          base64: data.base64,
          mimetype: data.mimetype || null,
        });
      }
      return res.status(404).json({ error: 'Mídia não encontrada' });
    } catch (err) {
      console.error('[WhatsApp Media] Error:', err);
      return res.status(500).json({ error: 'Erro ao buscar mídia' });
    }
  },
);

/* ==========================================
🚀 START SERVER
========================================== */

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Backend rodando na porta ${PORT}`);
});
