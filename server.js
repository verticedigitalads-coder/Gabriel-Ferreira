import { fileURLToPath } from 'url';
import crypto from 'crypto';
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

// Comparação constante no tempo (evita timing side-channel em segredos).
// Trata tamanhos diferentes sem lançar (timingSafeEqual exige buffers iguais).
function safeEqual(a, b) {
  const ba = Buffer.from(String(a ?? ''));
  const bb = Buffer.from(String(b ?? ''));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

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

// Cor de destaque do workspace: usa a configurada, senão cai na cor principal
// (decisão de produto — nunca quebra por ausência, zero risco de contraste).
function resolveCorDestaque(corDestaque, corPrimaria) {
  const d = (corDestaque || '').trim();
  return d || corPrimaria || '#ff6a00';
}

// ===== Helpers de template v3 (orçamento simples + agrupado) =====
const fmtBRL = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

// Separa itens exibíveis (com valor) dos de valor 0 (vão p/ observações).
// Descarta itens sem nome / placeholder "item".
function separarItens(itens) {
  const validos = [];
  const zerados = [];
  for (const item of itens || []) {
    const nome = (item.descricao || '').trim().toLowerCase();
    if (!nome || nome === 'item') continue;
    const valor = parseFloat(item.valorTotal || 0);
    if (valor === 0) zerados.push(item);
    else validos.push(item);
  }
  return { validos, zerados };
}

// Item de mão de obra sintético quando multiplicador > 1 (ou null).
function maoDeObraItem(subtotal, multiplicador) {
  if (!(multiplicador > 1)) return null;
  const valor = subtotal * (multiplicador - 1);
  return {
    descricao: 'Mão de obra especializada',
    quantidade: 1,
    valorUnitario: valor,
    valorTotal: valor,
  };
}

// Card numerado de um item (v3). idx é 1-based.
function itemCardHtml(item, idx) {
  const qtd = item.quantidade || 1;
  const ambiente = item.ambiente
    ? ` &middot; ${escapeHtml(item.ambiente)}`
    : '';
  return `
      <div class="item-card">
        <div class="item-card-head">
          <span class="item-num">${idx}</span>
          <span class="item-name">${escapeHtml(item.descricao) || 'Item'}</span>
        </div>
        <div class="item-body">
          <div class="item-desc">Qtde. ${qtd} un${ambiente}</div>
          <div class="item-values">
            <div class="item-val"><span class="lbl">Valor unitário</span><span class="amt">R$ ${fmtBRL(item.valorUnitario)}</span></div>
            <div class="item-val total"><span class="lbl">Valor total</span><span class="amt">R$ ${fmtBRL(item.valorTotal)}</span></div>
          </div>
        </div>
      </div>`;
}

// Tabela-resumo compacta (v3): itens + desconto opcional + TOTAL GERAL.
function resumoTabelaHtml(itensParaExibir, descontoNum, total) {
  if (!itensParaExibir.length) return '';
  const linhas = itensParaExibir
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.descricao) || 'Item'}</td>
          <td class="right">${item.quantidade || 1}</td>
          <td class="right">R$ ${fmtBRL(item.valorUnitario)}</td>
          <td class="right">R$ ${fmtBRL(item.valorTotal)}</td>
        </tr>`,
    )
    .join('');
  const descontoRow =
    descontoNum > 0
      ? `<tr><td colspan="3" class="right">Desconto</td><td class="right">- R$ ${fmtBRL(descontoNum)}</td></tr>`
      : '';
  return `
    <div class="secao resumo no-break">
      <div class="secao-titulo"><span class="icon">🧾</span> Resumo do orçamento</div>
      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th class="right">Qtd</th>
            <th class="right">Unit.</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
          ${descontoRow}
          <tr class="total-geral"><td colspan="3">TOTAL GERAL</td><td class="right">R$ ${fmtBRL(total)}</td></tr>
        </tbody>
      </table>
    </div>`;
}

// Caixa de total em destaque (v3) + valor por extenso.
function caixaTotalHtml(total, label = 'Valor total do orçamento') {
  return `
      <div class="caixa-total">
        <div class="ct-label">${label}</div>
        <div class="ct-value">R$ ${fmtBRL(total)}</div>
        <div class="ct-extenso">${valorPorExtenso(total)}</div>
      </div>`;
}

// Bloco de observações (v3) — combina observações do usuário + itens de valor 0.
function observacoesHtml(observacoesUsuario, zerados) {
  const partes = [];
  if (observacoesUsuario && String(observacoesUsuario).trim()) {
    partes.push(escapeHtml(observacoesUsuario));
  }
  const zeroLinhas = (zerados || [])
    .map((it) => {
      const ambiente = it.ambiente ? ` (${escapeHtml(it.ambiente)})` : '';
      return `• ${escapeHtml(it.descricao) || 'Item'}${ambiente} — sem custo`;
    })
    .join('\n');
  if (zeroLinhas) partes.push(zeroLinhas);
  const corpo = partes.join('\n');
  if (!corpo) return '';
  return `
    <div class="secao no-break">
      <div class="obs-box">
        <div class="obs-title">Observações</div>
        <div class="obs-body">${corpo}</div>
      </div>
    </div>`;
}

// Rodapé de contato (v3): WhatsApp + Instagram/site (só o que existir).
function footerContatoHtml(empresaTelefone, empresaInstagram) {
  const partes = [];
  const tel = (empresaTelefone || '').trim();
  const insta = (empresaInstagram || '').trim();
  if (tel) partes.push(`📱 WhatsApp: ${escapeHtml(tel)}`);
  if (insta) partes.push(`📸 ${escapeHtml(insta)}`);
  if (!partes.length) return '';
  return `<div class="contato">${partes.join(' &nbsp;•&nbsp; ')}</div>`;
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

// Resolve a logo/marca d'água configurada no workspace. Ausente ou falha no
// download → retorna '' (NUNCA cai num fallback estático de outro cliente).
async function resolveWorkspaceLogo(rawUrl, logLabel, noun) {
  if (!rawUrl) {
    console.warn(
      `[PDF][${logLabel}] campo ausente ou vazio — renderizando sem ${noun}`,
    );
    return '';
  }
  const converted = await urlToBase64(rawUrl);
  if (!converted) {
    console.error(
      `[PDF][${logLabel}] urlToBase64 retornou vazio — resposta HTTP não-ok ou body vazio. URL:`,
      rawUrl,
    );
  }
  return converted;
}

// Aplica {{placeholder}} usado como src de <img> num template carregado de
// arquivo. Se o valor vier vazio, remove a tag <img> inteira em vez de deixar
// src="" (evita ícone de imagem quebrada) — sem tocar no arquivo .html.
function injectLogoImg(html, placeholder, base64Value) {
  if (base64Value) {
    return html.replace(
      new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g'),
      base64Value,
    );
  }
  return html.replace(
    new RegExp(`<img[^>]*src="\\{\\{${placeholder}\\}\\}"[^>]*>`, 'g'),
    '',
  );
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

// ===== Central de Ajuda: cache dos docs/help/*.md em memória =====
const helpDocsPath = path.join(__dirname, 'docs/help');
let helpDocsCache = {};
try {
  const helpFiles = fs.readdirSync(helpDocsPath).filter(f => f.endsWith('.md'));
  helpDocsCache = Object.fromEntries(
    helpFiles.map(f => [
      f.replace(/\.md$/, ''),
      fs.readFileSync(path.join(helpDocsPath, f), 'utf-8'),
    ])
  );
  console.log(`[HelpChat] ${Object.keys(helpDocsCache).length} docs carregados de docs/help`);
} catch (err) {
  console.warn('[HelpChat] docs/help não encontrado — /api/help-chat responderá 503:', err.message);
}

// Nome amigável do módulo (mesmo texto de src/layout/HeaderGlobal.tsx moduleNames)
const HELP_MODULE_FRIENDLY_NAME = {
  dashboard: 'Dashboard Executivo',
  leads: 'Gestão de Leads',
  kanban: 'Pipeline Comercial',
  orcamentos: 'Orçamentos',
  recibos: 'Recibos',
  financeiro: 'Financeiro',
  notas: 'Notas Fiscais',
  ia: 'IA Assistente',
  settings: 'Configurações',
  operacional: 'Painel Operacional',
  central: 'Modo Execução',
  'contas-receber': 'Contas a Receber',
  fornecedores: 'Fornecedores',
  estoque: 'Estoque',
  whatsapp: 'WhatsApp',
};

// Mapeia o activeModule do frontend para o nome do arquivo em docs/help
const HELP_MODULE_TO_DOC = {
  dashboard: 'dashboard',
  operacional: 'operacional',
  kanban: 'kanban',
  central: 'central',
  leads: 'leads',
  whatsapp: 'whatsapp',
  orcamentos: 'orcamentos',
  recibos: 'recibos',
  financeiro: 'financeiro',
  'contas-receber': 'contas-a-receber',
  notas: 'notas',
  ia: 'ia-assistente',
  fornecedores: 'fornecedores',
  estoque: 'estoque',
  settings: 'configuracoes',
};

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

// Produção: apenas domínios reais (via env). Localhost entra só fora de
// produção (NODE_ENV !== 'production') — não fica na whitelist em prod.
const isProd = process.env.NODE_ENV === 'production';
const envOrigins = (
  process.env.CORS_ALLOWED_ORIGINS || 'https://vertice-digital-crm.vercel.app'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const devOrigins = isProd
  ? []
  : ['http://localhost:5173', 'http://localhost:3000'];
const allowedOrigins = [...new Set([...envOrigins, ...devOrigins])];

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

// Limites configuráveis via env (RATE_LIMIT_GLOBAL_MAX / RATE_LIMIT_STRICT_MAX)
// para janelas temporárias de teste de carga — defaults preservam produção.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_GLOBAL_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
});
app.use(globalLimiter);

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_STRICT_MAX) || 10,
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

app.post('/api/chat', requireAuth, strictLimiter, async (req, res) => {
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
🆘 CENTRAL DE AJUDA — CHAT COM CONTEXTO DA DOCUMENTAÇÃO
========================================== */

app.post('/api/help-chat', requireAuth, strictLimiter, async (req, res) => {
  if (Object.keys(helpDocsCache).length === 0) {
    return res.status(503).json({ error: 'Central de Ajuda indisponível no momento.' });
  }

  try {
    const { message, history, activeModule } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem inválida' });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(h => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
          .slice(-6)
      : [];

    const priorityStem = HELP_MODULE_TO_DOC[activeModule];
    const orderedStems = Object.keys(helpDocsCache).sort();
    const docOrder = priorityStem && helpDocsCache[priorityStem]
      ? [priorityStem, ...orderedStems.filter(s => s !== priorityStem)]
      : orderedStems;

    const docsBlock = docOrder
      .map(stem => `### ${stem}\n${helpDocsCache[stem]}`)
      .join('\n\n---\n\n');

    const friendlyName = HELP_MODULE_FRIENDLY_NAME[activeModule];
    const screenContextLine = friendlyName
      ? `O usuário está NESTE MOMENTO na tela '${friendlyName}'. Quando ele disser 'esta tela', 'essa página', 'aqui', refere-se a ela.\n\n`
      : '';

    const systemPrompt =
      'Você é o assistente de ajuda do CRM VRTX. Responda SOMENTE com base na documentação fornecida abaixo. ' +
      "Se a resposta não estiver na documentação, diga honestamente que não tem essa informação e oriente o usuário a clicar em 'Falar com suporte'. " +
      'Nunca invente funcionalidades. Responda curto e prático, em português.\n\n' +
      screenContextLine +
      docsBlock;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...safeHistory.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      console.error('[HelpChat] Resposta sem conteúdo da OpenAI:', data);
      return res.status(500).json({ error: 'Erro ao chamar OpenAI' });
    }

    res.json({ reply });
  } catch (error) {
    console.error('[HelpChat] Erro:', error);
    res.status(500).json({ error: 'Erro ao chamar OpenAI' });
  }
});

/* ==========================================
🏢 PROXY CNPJ (ReceitaWS)
========================================== */

app.get('/api/cnpj/:cnpj', requireAuth, async (req, res) => {
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

app.post(
  '/api/gerar-orcamento',
  requireAuth,
  strictLimiter,
  async (req, res) => {
    try {
      const dados = req.body;

      /* ==========================================
    📄 CARREGAR TEMPLATE HTML
    ========================================== */

      const template_version = dados.template_version || 'v1';
      const templateFile =
        template_version === 'v2' ? 'orcamento-v2.html' : 'orcamento.html';
      const templatePath = path.resolve(
        process.cwd(),
        'templates',
        templateFile,
      );

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
        ? dados.itens.reduce(
            (acc, item) => acc + Number(item.valorTotal || 0),
            0,
          )
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
        const empresa_logo_url = await resolveWorkspaceLogo(
          dados.empresa_logo_url,
          'logo_header',
          'logo',
        );
        const texto_apresentacao = dados.texto_apresentacao || '';
        const condicoes_contrato = dados.condicoes_contrato || '';
        const metodos_pagamento = dados.metodos_pagamento || '';
        const cor_primaria = dados.cor_primaria || '#ff6a00';
        const cor_destaque = resolveCorDestaque(
          dados.cor_destaque,
          cor_primaria,
        );

        // Logo HTML (header à esquerda)
        const logoHtml = empresa_logo_url
          ? `<img src="${empresa_logo_url}" />`
          : '';

        // Seção apresentação (Relatório inicial)
        const secaoApresentacao = texto_apresentacao
          ? `<div class="secao">
             <div class="secao-titulo"><span class="icon">📋</span> Relatório inicial</div>
             <div class="texto-apresentacao">${escapeHtml(texto_apresentacao).replace(/\n/g, '<br/>')}</div>
           </div>
           <div class="divider"></div>`
          : '';

        // Itens: separa válidos (viram cards) dos de valor 0 (vão p/ observações)
        const { validos, zerados } = separarItens(dados.itens);
        const mdo = maoDeObraItem(subtotal, multiplicador);
        const itensParaExibir = mdo ? [...validos, mdo] : validos;

        const itensCards =
          itensParaExibir.map((it, i) => itemCardHtml(it, i + 1)).join('') ||
          '<div class="item-desc" style="padding:8px 0;">Nenhum item com valor lançado.</div>';

        const descontoNum = Number(dados.desconto) || 0;
        const resumoTabela = resumoTabelaHtml(
          itensParaExibir,
          descontoNum,
          total,
        );
        const caixaTotal = caixaTotalHtml(total);
        const obsHtml = observacoesHtml(dados.observacoes, zerados);
        const footerContato = footerContatoHtml(
          empresa_telefone,
          dados.empresa_instagram,
        );

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
            const texto = l
              .replace(/\{\{validade\}\}/g, String(dados.validade || 7))
              .replace(/^\s*\d+[\.\)]\s*/, '');
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

        const logoBgUrlOrc = await resolveWorkspaceLogo(
          dados.empresa_logo_bg_url,
          'logo_bg',
          "marca d'água",
        );

        html = html
          .replace(/{{cor_primaria}}/g, cor_primaria)
          .replace(/{{cor_destaque}}/g, cor_destaque)
          .replace('{{logo_html}}', logoHtml)
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
          .replace('{{itens_cards}}', itensCards)
          .replace('{{resumo_tabela}}', resumoTabela)
          .replace('{{caixa_total}}', caixaTotal)
          .replace(/{{observacoes_bloco}}/g, obsHtml)
          .replace('{{secao_metodos_pagamento}}', secaoMetodos)
          .replace('{{secao_condicoes}}', secaoCondicoes)
          .replace('{{QR_CODE_PIX}}', qrCodePixHtml)
          .replace('{{footer_contato}}', footerContato)
          .replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'));

        html = injectLogoImg(html, 'logo_bg', logoBgUrlOrc);

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

        // 🔥 IMAGENS DINÂMICAS (workspace, sem fallback estático)
        const logoUrlV1 = await resolveWorkspaceLogo(
          dados.empresa_logo_url,
          'logo_header',
          'logo',
        );
        const logoBgUrlV1 = await resolveWorkspaceLogo(
          dados.empresa_logo_bg_url,
          'logo_bg',
          "marca d'água",
        );
        html = injectLogoImg(html, 'logo', logoUrlV1);
        html = injectLogoImg(html, 'logo_bg', logoBgUrlV1);
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
  },
);

/* ==========================================
📄 GERAR PDF AGRUPADO (múltiplos orçamentos)
========================================== */

app.post(
  '/api/gerar-orcamento-agrupado',
  requireAuth,
  strictLimiter,
  async (req, res) => {
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
        cor_destaque,
        empresa_instagram,
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
        const corDestaque = resolveCorDestaque(cor_destaque, corPrimaria);
        const logoUrlAgrupado = await resolveWorkspaceLogo(
          empresa_logo_url,
          'logo_header',
          'logo',
        );
        const logoHtmlAgrupado = logoUrlAgrupado
          ? `<img src="${logoUrlAgrupado}" />`
          : '';
        const logoBgUrlAgrupado = await resolveWorkspaceLogo(
          empresa_logo_bg_url,
          'logo_bg',
          "marca d'água",
        );
        const watermarkHtmlAgrupadoV2 = logoBgUrlAgrupado
          ? `<div class="watermark"><img src="${logoBgUrlAgrupado}" style="width: 100%" /></div>`
          : '';

        // Seção apresentação (aparece uma vez, antes dos orçamentos)
        const secaoApresentacaoAgrp = texto_apresentacao
          ? `<div class="secao">
             <div class="secao-titulo"><span class="icon">📋</span> Relatório inicial</div>
             <div class="texto-apresentacao">${escapeHtml(texto_apresentacao).replace(/\n/g, '<br/>')}</div>
           </div>
           <div class="divider"></div>`
          : '';

        // Blocos de orçamento no estilo v3 (cards + resumo + caixa de total por orçamento)
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
            const descontoOrc = Number(orc.desconto) || 0;
            totalGeralV2 += totalOrc;

            const { validos, zerados } = separarItens(orc.itens);
            const mdoOrc = maoDeObraItem(subtotalOrc, multiplicadorOrc);
            const itensExibirOrc = mdoOrc ? [...validos, mdoOrc] : validos;

            const cardsOrc =
              itensExibirOrc.map((it, i) => itemCardHtml(it, i + 1)).join('') ||
              '<div class="item-desc" style="padding:8px 0;">Nenhum item com valor lançado.</div>';
            const resumoOrc = resumoTabelaHtml(
              itensExibirOrc,
              descontoOrc,
              totalOrc,
            );
            const caixaOrc = caixaTotalHtml(totalOrc, 'Total deste orçamento');
            const obsOrc = observacoesHtml(orc.observacoes, zerados);

            return `
          <div ${pageBreak}>
            <div class="secao">
              <div class="secao-titulo" style="color: ${corPrimaria}; border-bottom: 2px solid ${corDestaque}; padding-bottom: 6px;">
                ${titulo} — ${orc.numero || ''}
              </div>
            </div>
            <div class="secao">${cardsOrc}</div>
            ${resumoOrc}
            <div class="secao no-break">${caixaOrc}</div>
            ${obsOrc}
            <div class="divider"></div>
          </div>
        `;
          })
          .join('');

        // Total geral (destaque na cor principal)
        const totalGeralBlocoV2 =
          mostrar_total_geral !== false
            ? `
        <div class="secao no-break">
          <div style="display: flex; justify-content: space-between; align-items: center; background: ${corPrimaria}; color: #fff; padding: 16px 20px; border-radius: 10px; font-size: 20px; font-weight: 800;">
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
          .map(
            (l) => `<li>${escapeHtml(l.replace(/^\s*\d+[\.\)]\s*/, ''))}</li>`,
          )
          .join('');
        const secaoCondicoesAgrp = condicoesItemsAgrp
          ? `<div class="secao"><div class="secao-titulo"><span class="icon">📜</span> Condições de contrato</div><ol class="condicoes-lista">${condicoesItemsAgrp}</ol></div>`
          : '';

        const footerContatoAgrp = footerContatoHtml(
          empresa_telefone,
          empresa_instagram,
        );

        htmlFinal = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>${v2Estilos.replace(/{{cor_primaria}}/g, corPrimaria).replace(/{{cor_destaque}}/g, corDestaque)}</style>
</head>
<body>
  ${watermarkHtmlAgrupadoV2}
  <div class="container">
    <div class="header-v3">
      <div class="header-logo">${logoHtmlAgrupado}</div>
      <div class="empresa-card">
        <div class="doc-title">Proposta</div>
        <div class="emp-nome">${escapeHtml(empresa_nome) || ''}</div>
        <div class="emp-dados">${escapeHtml(empresa_cnpj) || ''}<br/>${escapeHtml(empresa_endereco) || ''}<br/>${escapeHtml(empresa_telefone) || ''}</div>
      </div>
    </div>
    <div class="meta-bar">
      <div class="meta-item"><span class="mk">Cliente</span><span class="mv">${escapeHtml(cliente_nome) || 'Cliente'}</span></div>
      <div class="meta-item"><span class="mk">Data</span><span class="mv">${new Date().toLocaleDateString('pt-BR')}</span></div>
      <div class="meta-item"><span class="mk">Orçamentos</span><span class="mv">${orcamentos.length}</span></div>
    </div>
    <div class="divider"></div>
    ${secaoApresentacaoAgrp}
    ${blocosV2}
    ${totalGeralBlocoV2}
    ${secaoMetodosAgrp}
    ${secaoCondicoesAgrp}
    ${await gerarQrCodePixHtml({ chavePix: chave_pix || '', nomeRecebedor: nome_recebedor_pix || empresa_nome || 'EMPRESA', cidadeRecebedor: cidade_pix || 'UBERABA', valor: totalGeralV2, txid: 'PROPOSTA' })}
    <div class="footer-v3">
      ${footerContatoAgrp}
      <div class="criado">Criado em ${new Date().toLocaleDateString('pt-BR')}</div>
    </div>
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

        const logoUrlAgrupadoV1 = await resolveWorkspaceLogo(
          empresa_logo_url,
          'logo_header',
          'logo',
        );
        const logoBgUrlAgrupadoV1 = await resolveWorkspaceLogo(
          empresa_logo_bg_url,
          'logo_bg',
          "marca d'água",
        );
        const watermarkHtmlAgrupadoV1 = logoBgUrlAgrupadoV1
          ? `<div class="watermark"><img src="${logoBgUrlAgrupadoV1}" style="width: 100%" /></div>`
          : '';
        const logoHtmlAgrupadoV1 = logoUrlAgrupadoV1
          ? `<img src="${logoUrlAgrupadoV1}" style="width: 220px; margin-bottom: 6px" />`
          : '';

        htmlFinal = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>${estilos}</style>
</head>
<body>
  ${watermarkHtmlAgrupadoV1}
  <div class="container">
    <div style="text-align: center; margin-bottom: 10px">
      ${logoHtmlAgrupadoV1}
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
  },
);

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
    const centena = c === 1 && resto > 0 ? 'cento' : centenas[c];
    return centena + (resto > 0 ? ' e ' + grupo(resto) : '');
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

app.post('/api/gerar-recibo', requireAuth, strictLimiter, async (req, res) => {
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

    // v2: itens de valor 0 saem da tabela e vão p/ observações (nunca R$ 0,00).
    // v1 (legado): mantém TODOS os itens, comportamento intocado.
    const { validos: itensValidosV2, zerados: itensZeradosV2 } = separarItens(
      dados.itens,
    );
    const itensParaLinhas =
      templateVersion === 'v2' ? itensValidosV2 : dados.itens;

    const itensLinhas = itensParaLinhas
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

    const obsHtml =
      templateVersion === 'v2'
        ? observacoesHtml(dados.observacoes, itensZeradosV2)
        : dados.observacoes
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

    // Recibo v2: PIX é opcional (default desmarcado no frontend) — v1 (legado)
    // sempre inclui, comportamento intocado.
    const incluirPixRecibo =
      templateVersion === 'v2' ? dados.incluir_pix === true : true;
    const qrCodePixHtmlRecibo = incluirPixRecibo
      ? await gerarQrCodePixHtml({
          chavePix: dados.chave_pix || '',
          nomeRecebedor:
            dados.nome_recebedor_pix || dados.empresa_nome || 'EMPRESA',
          cidadeRecebedor: dados.cidade_pix || 'UBERABA',
          valor: dados.valor_total,
          txid: dados.numero_recibo || 'RECIBO',
        })
      : '';

    // 🔥 IMAGENS DINÂMICAS
    if (templateVersion === 'v2') {
      const logoUrl = await resolveWorkspaceLogo(
        dados.empresa_logo_url,
        'logo_header',
        'logo',
      );
      const logoHtml = logoUrl ? `<img src="${logoUrl}" />` : '';
      const logoBgUrl = await resolveWorkspaceLogo(
        dados.empresa_logo_bg_url,
        'logo_bg',
        "marca d'água",
      );

      const corPrimariaRec = dados.cor_primaria || '#ff6a00';
      const corDestaqueRec = resolveCorDestaque(
        dados.cor_destaque,
        corPrimariaRec,
      );
      const footerContatoRec = footerContatoHtml(
        dados.empresa_telefone,
        dados.empresa_instagram,
      );

      html = injectLogoImg(html, 'logo_bg', logoBgUrl);
      html = html
        .replace(/{{cor_primaria}}/g, corPrimariaRec)
        .replace(/{{cor_destaque}}/g, corDestaqueRec)
        .replace(/{{logo_html}}/g, logoHtml)
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
        .replace('{{footer_contato}}', footerContatoRec)
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
      const logoUrlReciboV1 = await resolveWorkspaceLogo(
        dados.empresa_logo_url,
        'logo_header',
        'logo',
      );
      const logoBgUrlReciboV1 = await resolveWorkspaceLogo(
        dados.empresa_logo_bg_url,
        'logo_bg',
        "marca d'água",
      );
      html = injectLogoImg(html, 'logo', logoUrlReciboV1);
      html = injectLogoImg(html, 'logo_bg', logoBgUrlReciboV1);
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

app.post('/api/pix-payload', requireAuth, async (req, res) => {
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

// Rota antiga sem secret — descontinuada (evita aceitar POST forjado)
app.post('/webhook/evolution', (_req, res) => {
  res
    .status(410)
    .json({ error: 'Rota descontinuada. Atualize a URL do webhook.' });
});

app.post('/webhook/evolution/:secret', async (req, res) => {
  // DÉBITO: segredo no path da URL aparece em logs de servidor/proxy. Migrar p/
  // header X-Webhook-Secret quando a URL configurada no Evolution API puder ser
  // atualizada (mover agora quebraria a config em produção).
  if (!safeEqual(req.params.secret, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
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

    // Instância não mapeada em whatsapp_instances → REJEITA (não atribui ao
    // DEFAULT_WORKSPACE_ID, que misturaria dados de origem desconhecida). 200
    // evita retry infinito do Evolution; a mensagem é descartada.
    const workspaceId = instanceData?.workspace_id;

    if (!workspaceId) {
      console.warn(
        '[Evolution Webhook] Instância não-mapeada, mensagem rejeitada:',
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

// Valida que a instância pertence a um workspace do usuário autenticado.
// Retorna o workspace_id se pertencer, senão null. Duas queries explícitas via
// service_role (que BYPASSA RLS) — o filtro por workspace_members.user_id é
// OBRIGATÓRIO. Não usa embed do PostgREST (a RLS/FK de whatsapp_instances foi
// criada no painel, sem relação garantida ao PostgREST).
async function assertInstanceOwnership(instanceName, userId) {
  if (!instanceName || !userId) return null;
  try {
    const admin = getSupabaseAdmin();
    const { data: inst, error: e1 } = await admin
      .from('whatsapp_instances')
      .select('workspace_id')
      .eq('instance_name', instanceName)
      .maybeSingle();
    if (e1 || !inst?.workspace_id) return null;

    const { data: member, error: e2 } = await admin
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', inst.workspace_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (e2 || !member) return null;

    return inst.workspace_id;
  } catch (err) {
    console.error('[assertInstanceOwnership] erro:', err);
    return null;
  }
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

    const wsId = await assertInstanceOwnership(instanceName, req.user.id);
    if (!wsId) return res.status(403).json({ error: 'Acesso negado' });

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
        // workspace_id vem do helper de ownership (nunca do body)
        const admin = getSupabaseAdmin();
        const persistJid = originalJid || data.key.remoteJid;
        await admin.from('whatsapp_messages').upsert(
          {
            workspace_id: wsId,
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
    if (!(await assertInstanceOwnership(instanceName, req.user.id))) {
      return res.status(403).json({ error: 'Acesso negado' });
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
    if (!(await assertInstanceOwnership(req.params.instanceName, req.user.id))) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
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
      if (!(await assertInstanceOwnership(req.params.instanceName, req.user.id))) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
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
      if (!(await assertInstanceOwnership(req.params.instanceName, req.user.id))) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
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
      if (!(await assertInstanceOwnership(instanceName, req.user.id))) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
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
