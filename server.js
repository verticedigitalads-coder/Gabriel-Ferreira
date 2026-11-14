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
import {
  GATEWAYS,
  gatewayAtual,
  VALOR_MENSAL,
  soDigitos,
  validarCpfCnpj,
  validarCelular,
  hojeSaoPaulo,
  periodoFimDe,
} from './utils/billing/index.js';

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

// Primeira letra maiúscula só na exibição do PDF (o dado salvo não muda).
// Não mexe em texto que começa com unidade (m, m², m³, kg, cm, mm, un, pç);
// número não tem maiúscula, então "10 telhas" já fica igual.
function maiusculaInicial(texto) {
  const s = String(texto || '');
  if (/^\s*(kg|cm|mm|un|p\u00e7|m)(?![a-z\u00e0-\u00ff])/i.test(s)) return s;
  return s.replace(/^(\s*)(\S)/, (_, esp, c) => esp + c.toLocaleUpperCase('pt-BR'));
}

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

// Comissão embutida no total, diluída proporcionalmente nos valores das
// linhas: o cliente não vê a comissão, e linhas − desconto = total. Tudo em
// centavos. A sobra do arredondamento vai para a última linha com qtd 1
// (com mão de obra é sempre ela); se nenhuma tiver qtd 1, vai para a última,
// com unitário = total ÷ qtd. Devolve cópias, sem alterar as linhas recebidas.
function diluirComissao(linhas, total, desconto) {
  const alvo = Math.round((Number(total || 0) + Number(desconto || 0)) * 100);
  const base = linhas.reduce(
    (soma, l) => soma + Math.round(Number(l.valorTotal || 0) * 100),
    0,
  );
  if (!(base > 0)) return linhas;

  const qtds = linhas.map((l) => Number(l.quantidade) || 1);
  const unitarios = linhas.map((l) =>
    Math.round((Number(l.valorUnitario || 0) * 100 * alvo) / base),
  );
  const totais = unitarios.map((u, i) => Math.round(u * qtds[i]));

  const sobra = alvo - totais.reduce((soma, t) => soma + t, 0);
  let k = qtds.lastIndexOf(1);
  if (k < 0) k = linhas.length - 1;
  totais[k] += sobra;
  unitarios[k] = qtds[k] === 1 ? totais[k] : Math.round(totais[k] / qtds[k]);

  return linhas.map((l, i) => ({
    ...l,
    valorUnitario: unitarios[i] / 100,
    valorTotal: totais[i] / 100,
  }));
}

// Data do documento no PDF (v3): a data de criação no fuso de Brasília, para
// que gerar de novo não troque a data. Sem ela, a data de hoje, como antes.
function dataDoDocumento(dataCriacao) {
  const d = new Date(dataCriacao);
  if (!dataCriacao || Number.isNaN(d.getTime())) {
    return new Date().toLocaleDateString('pt-BR');
  }
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
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
          <span class="item-name">${escapeHtml(maiusculaInicial(item.descricao)) || 'Item'}</span>
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
// A faixa TOTAL GERAL fica fora da tabela, presa ao quadro de observações
// (obsBox) num bloco que não quebra: o TOTAL GERAL nunca termina uma página
// sem a observação logo abaixo. As linhas da tabela correm entre páginas.
function resumoTabelaHtml(itensParaExibir, descontoNum, total, obsBox = '') {
  if (!itensParaExibir.length) {
    return obsBox ? `<div class="secao no-break">${obsBox}</div>` : '';
  }
  const linhas = itensParaExibir
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(maiusculaInicial(item.descricao)) || 'Item'}</td>
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
    <div class="secao resumo">
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
        </tbody>
      </table>
      <div class="no-break">
        <div class="total-geral-faixa"><span>TOTAL GERAL</span><span>R$ ${fmtBRL(total)}</span></div>
        ${obsBox}
      </div>
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

// Quadro de observações (v3) — combina observações do usuário + itens de valor 0.
// Com observação escrita: quadro em destaque "Importante". Só itens de valor 0:
// quadro cinza "Observações", como antes. Devolve só o quadro, sem .secao:
// quem chama decide onde ele entra.
function observacoesHtml(observacoesUsuario, zerados) {
  const partes = [];
  const temObsUsuario = !!(
    observacoesUsuario && String(observacoesUsuario).trim()
  );
  if (temObsUsuario) {
    partes.push(escapeHtml(maiusculaInicial(observacoesUsuario)));
  }
  const zeroLinhas = (zerados || [])
    .map((it) => {
      const ambiente = it.ambiente ? ` (${escapeHtml(it.ambiente)})` : '';
      return `• ${escapeHtml(maiusculaInicial(it.descricao)) || 'Item'}${ambiente} — sem custo`;
    })
    .join('\n');
  if (zeroLinhas) partes.push(zeroLinhas);
  const corpo = partes.join('\n');
  if (!corpo) return '';
  const boxClass = temObsUsuario ? 'obs-box obs-destaque' : 'obs-box';
  const titulo = temObsUsuario ? '📌 Importante' : 'Observações';
  return `
      <div class="${boxClass}">
        <div class="obs-title">${titulo}</div>
        <div class="obs-body">${corpo}</div>
      </div>`;
}

// CPF/CNPJ com rótulo, só na exibição do PDF (o dado salvo não muda). Com
// outro número de dígitos, sai como foi digitado.
function documentoComRotulo(valor) {
  const texto = String(valor || '').trim();
  const d = soDigitos(texto);
  if (d.length === 11) {
    return `CPF ${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (d.length === 14) {
    return `CNPJ ${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  return texto;
}

// Telefone formatado, só na exibição do PDF. Mesma regra do formatPhone do
// front (src/utils/formatters.ts), mas o 55 só sai com 12 ou 13 dígitos
// (telefone com DDD 55 tem 11). Com outro número de dígitos, sai como foi
// digitado.
function telefoneFormatado(valor) {
  const texto = String(valor || '').trim();
  let d = soDigitos(texto);
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return texto;
}

// Rodapé de contato (v3): WhatsApp + Instagram/site (só o que existir).
function footerContatoHtml(empresaTelefone, empresaInstagram) {
  const partes = [];
  const tel = telefoneFormatado(empresaTelefone);
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

// Lado maior (px) da logo e da marca d'água no PDF. Topo: ~300 dpi no maior
// tamanho exibido (até 230x140 px no v2, 260 px de largura no v1). Fundo:
// exibido com 500 px a 6% de opacidade.
const LOGO_PDF_MAX_PX = { logo_header: 800, logo_bg: 1000 };

// Imagens já reduzidas, por `${logLabel}|${url}`: valem 1 h, no máximo 50.
// Falha não entra no cache.
const LOGO_CACHE_VALIDADE_MS = 60 * 60 * 1000;
const LOGO_CACHE_MAX = 50;
const logoCache = new Map();

// Só PNG, JPEG e WebP são reduzidos, pela assinatura dos bytes (não pela
// extensão). Outro formato (SVG, GIF...) vai para o PDF como veio.
function formatoReduzivel(dataUrl) {
  const inicio = dataUrl.indexOf(',') + 1;
  const b = Buffer.from(dataUrl.slice(inicio, inicio + 24), 'base64');
  const png = b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG';
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const webp =
    b.toString('latin1', 0, 4) === 'RIFF' &&
    b.toString('latin1', 8, 12) === 'WEBP';
  return png || jpeg || webp;
}

const kbDoDataUrl = (dataUrl) =>
  Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75) / 1024);

// Reduz no Chrome (canvas): lado maior até o máximo, sem ampliar, achatada no
// branco (o papel do PDF é branco e nada fica atrás da logo) e em JPEG, que o
// PDF embute como está. A marca d'água sai em cinza com o mesmo
// grayscale(100%) que o CSS dos templates aplicava. O Chrome aplica a
// orientação EXIF, como no PDF.
async function reduzirLogoParaPdf(dataUrl, logLabel) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  try {
    const page = await browser.newPage();
    return await page.evaluate(
      async (src, max, cinza) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const escala = Math.min(
          1,
          max / Math.max(img.naturalWidth, img.naturalHeight),
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * escala);
        canvas.height = Math.round(img.naturalHeight * escala);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingQuality = 'high';
        if (cinza) ctx.filter = 'grayscale(100%)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return {
          dataUrl: canvas.toDataURL('image/jpeg', 0.85),
          de: `${img.naturalWidth}x${img.naturalHeight}`,
          para: `${canvas.width}x${canvas.height}`,
        };
      },
      dataUrl,
      LOGO_PDF_MAX_PX[logLabel],
      logLabel === 'logo_bg',
    );
  } finally {
    await browser.close();
  }
}

// Resolve a logo/marca d'água configurada no workspace. Ausente ou falha no
// download → retorna '' (NUNCA cai num fallback estático de outro cliente).
// PNG, JPEG e WebP vão reduzidos para o PDF; se a redução falhar, vai a
// imagem original, como antes.
async function resolveWorkspaceLogo(rawUrl, logLabel, noun) {
  if (!rawUrl) {
    console.warn(
      `[PDF][${logLabel}] campo ausente ou vazio — renderizando sem ${noun}`,
    );
    return '';
  }
  if (rawUrl.startsWith('data:')) return rawUrl;

  const chave = `${logLabel}|${rawUrl}`;
  const emCache = logoCache.get(chave);
  if (emCache && Date.now() - emCache.em < LOGO_CACHE_VALIDADE_MS) {
    return emCache.dataUrl;
  }

  const converted = await urlToBase64(rawUrl);
  if (!converted) {
    console.error(
      `[PDF][${logLabel}] urlToBase64 retornou vazio — resposta HTTP não-ok ou body vazio. URL:`,
      rawUrl,
    );
    return converted;
  }
  if (!formatoReduzivel(converted)) return converted;

  try {
    const reduzida = await reduzirLogoParaPdf(converted, logLabel);
    console.log(
      `[PDF][${logLabel}] reduzida ${reduzida.de} → ${reduzida.para}, ${kbDoDataUrl(converted)} KB → ${kbDoDataUrl(reduzida.dataUrl)} KB`,
    );
    logoCache.delete(chave);
    logoCache.set(chave, { dataUrl: reduzida.dataUrl, em: Date.now() });
    if (logoCache.size > LOGO_CACHE_MAX) {
      logoCache.delete(logoCache.keys().next().value);
    }
    return reduzida.dataUrl;
  } catch (err) {
    console.error(
      `[PDF][${logLabel}] redução falhou, indo a imagem original:`,
      err.message,
    );
    return converted;
  }
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

// Ocultação temporária do envio de WhatsApp (bug de formato LID pendente de
// correção — com dado de cliente sob LGPD, envio é risco até a correção existir).
// Reverter: MODULO_WHATSAPP_VISIVEL: true em feature-flags.json
const featureFlags = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'feature-flags.json'), 'utf-8'),
);

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
    // Uma linha só: QR (110px, gerado em 180px) à esquerda; chave e copia e
    // cola (texto inteiro, selecionável) à direita.
    // Copia e cola sem quebra de linha (leitor de PDF cola a quebra junto e o
    // banco recusa): fonte cabe em ~560px, até 7px, com 0.62em por caractere
    // (folga para as monoespaçadas do Linux da VPS).
    const fonteCopiaECola = Math.min(
      7,
      Math.floor((560 / (payload.length * 0.62)) * 10) / 10,
    );
    return `
      <div style="display: flex; align-items: center; gap: 14px; margin: 12px 24px 0; padding: 10px 14px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa; page-break-inside: avoid;">
        <img src="${qrDataUrl}" alt="QR Code PIX" style="width: 110px; height: 110px; flex-shrink: 0; display: block;" />
        <div style="flex: 1; min-width: 0;">
          <p style="font-size: 12px; color: #333; margin: 0; font-weight: 700;">Pague via PIX</p>
          <p style="font-size: 9px; color: #777; margin: 2px 0 6px;">Chave: ${escapeHtml(chavePix)}</p>
          <div style="padding: 6px 8px; background: #f0f0f0; border-radius: 6px; border: 1px dashed #ccc;">
            <p style="font-size: 8px; color: #888; margin: 0 0 3px; text-transform: uppercase; letter-spacing: 0.5px;">PIX Copia e Cola</p>
            <p style="font-size: ${fonteCopiaECola}px; color: #555; white-space: nowrap; font-family: monospace; line-height: 1.4; margin: 0;">${payload}</p>
          </div>
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

// Health check real: sem auth e sem Origin (UptimeRobot não manda). Consulta
// mínima no Supabase com timeout de 3s. Corpo fixo: nunca devolve mensagem de
// erro, chave, URL do banco ou stack. Sem log no sucesso (monitor bate a cada
// 5 min); só a falha é logada, para o PM2 mostrar por que o banco caiu.
app.get('/health', async (_req, res) => {
  try {
    const { error } = await getSupabaseAdmin()
      .from('workspaces')
      .select('id')
      .limit(1)
      .abortSignal(AbortSignal.timeout(3000));
    if (error) throw error;
    return res.status(200).json({
      status: 'ok',
      db: 'ok',
      uptime: Math.round(process.uptime()),
    });
  } catch (err) {
    console.error('[health] banco indisponível:', err?.message);
    return res.status(503).json({ status: 'error', db: 'down' });
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ==========================================
📨 LANDING — formulário "Falar com a equipe" (público, sem auth)
========================================== */

// Grava o lead do site no workspace da Vértice com service_role. O destino vem
// SÓ do env LANDING_WORKSPACE_ID, nunca do body. Limite próprio de 20 por IP/hora:
// operadora móvel usa CGNAT e muito cliente real sai pelo mesmo IP; robô fica com
// o honeypot (`site`). Resposta sempre genérica ({ ok }) e log sem dado pessoal.
// Os limites e a lista de segmentos espelham CONTATO_* em
// src/modules/auth/landing/landingContent.ts: mudou lá, muda aqui.
const landingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false },
});

const LANDING_SEGMENTOS = [
  'Serralheria',
  'Marcenaria',
  'Metalúrgica',
  'Drywall/Gesso',
  'Vidraçaria/Esquadrias',
  'Outro',
];
const LANDING_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/landing/contato', landingLimiter, async (req, res) => {
  const body = req.body || {};
  const txt = (v) => (typeof v === 'string' ? v.trim() : '');

  // Honeypot: campo invisível que só robô preenche. Responde como sucesso e não grava.
  if (txt(body.site)) return res.status(200).json({ ok: true });

  const nome = txt(body.nome);
  const empresa = txt(body.empresa);
  const whatsapp = txt(body.whatsapp);
  const email = txt(body.email);
  const segmento = txt(body.segmento);

  // Mesmo formato dos leads no banco: DDD + número, só dígitos, sem o 55.
  let telefone = whatsapp.replace(/\D/g, '');
  if (
    (telefone.length === 12 || telefone.length === 13) &&
    telefone.startsWith('55')
  ) {
    telefone = telefone.slice(2);
  }

  const valido =
    nome.length >= 2 &&
    nome.length <= 80 &&
    empresa.length >= 1 &&
    empresa.length <= 80 &&
    whatsapp.length <= 20 &&
    telefone.length >= 10 &&
    telefone.length <= 11 &&
    email.length <= 120 &&
    (!email || LANDING_EMAIL_RE.test(email)) &&
    LANDING_SEGMENTOS.includes(segmento);
  if (!valido) return res.status(400).json({ ok: false });

  const workspaceId = process.env.LANDING_WORKSPACE_ID;
  if (!workspaceId) {
    console.error('[landing/contato] falhou: LANDING_WORKSPACE_ID ausente');
    return res.status(500).json({ ok: false });
  }

  try {
    // Mesmos defaults do createLead do app (src/services/database/lead.service.ts).
    const { error } = await getSupabaseAdmin()
      .from('leads')
      .insert({
        workspace_id: workspaceId,
        nome,
        telefone,
        email,
        endereco: '',
        servico: '',
        status: 'novo',
        temperatura: 'morno',
        resumo: '',
        observacoes: `Empresa: ${empresa} · Segmento: ${segmento} · via landing`,
        origem: 'site',
        prazo_cliente: 'nao_definido',
        probabilidade_manual: 3,
        orcamento_enviado: false,
      });
    if (error) throw error;
    console.log('[landing/contato] lead criado');
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[landing/contato] falhou:', err?.code || 'sem-codigo');
    return res.status(500).json({ ok: false });
  }
});

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
🔢 NÚMERO DO DOCUMENTO
========================================== */

      // O front manda o numero_documento gravado no orçamento (novos:
      // ORC-AAAA-NNN; legado: ORC-2026-001, que o PDF sempre mostrou). Sem ele
      // (app antigo em cache), o mesmo de antes: a busca anon do sequencial
      // nunca achava nada (RLS) e todo PDF saía ORC-<ano>-001.
      const anoAtual = new Date().getFullYear();
      const numeroFormatado = dados.numero || `ORC-${anoAtual}-001`;

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
        const linhasBase = mdo ? [...validos, mdo] : validos;
        const descontoNum = Number(dados.desconto) || 0;
        // Com comissão, ela entra diluída nas linhas para a conta fechar
        const itensParaExibir =
          Number(dados.valor_comissao) > 0
            ? diluirComissao(linhasBase, total, descontoNum)
            : linhasBase;

        const itensCards =
          itensParaExibir.map((it, i) => itemCardHtml(it, i + 1)).join('') ||
          '<div class="item-desc" style="padding:8px 0;">Nenhum item com valor lançado.</div>';

        const resumoTabela = resumoTabelaHtml(
          itensParaExibir,
          descontoNum,
          total,
          observacoesHtml(dados.observacoes, zerados),
        );
        const caixaTotal = caixaTotalHtml(total);
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
          .replace(/{{empresa_cnpj}}/g, escapeHtml(documentoComRotulo(empresa_cnpj)))
          .replace(/{{empresa_endereco}}/g, escapeHtml(empresa_endereco) || '')
          .replace(/{{empresa_telefone}}/g, escapeHtml(telefoneFormatado(empresa_telefone)))
          .replace(
            /{{cliente_nome}}/g,
            escapeHtml(dados.cliente_nome) || 'Cliente',
          )
          .replace(/{{orcamento_id}}/g, numeroFormatado)
          .replace('{{secao_apresentacao}}', secaoApresentacao)
          .replace('{{itens_cards}}', itensCards)
          .replace('{{resumo_tabela}}', resumoTabela)
          .replace('{{caixa_total}}', caixaTotal)
          .replace('{{secao_metodos_pagamento}}', secaoMetodos)
          .replace('{{secao_condicoes}}', secaoCondicoes)
          .replace('{{QR_CODE_PIX}}', qrCodePixHtml)
          .replace('{{footer_contato}}', footerContato)
          .replace(/{{data}}/g, dataDoDocumento(dados.data_criacao));

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
        validade,
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
            const linhasBaseOrc = mdoOrc ? [...validos, mdoOrc] : validos;
            const itensExibirOrc =
              Number(orc.valor_comissao) > 0
                ? diluirComissao(linhasBaseOrc, totalOrc, descontoOrc)
                : linhasBaseOrc;

            const cardsOrc =
              itensExibirOrc.map((it, i) => itemCardHtml(it, i + 1)).join('') ||
              '<div class="item-desc" style="padding:8px 0;">Nenhum item com valor lançado.</div>';
            const resumoOrc = resumoTabelaHtml(
              itensExibirOrc,
              descontoOrc,
              totalOrc,
              observacoesHtml(orc.observacoes, zerados),
            );
            const caixaOrc = caixaTotalHtml(totalOrc, 'Total deste orçamento');

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
          .map((l) => {
            const texto = l
              .replace(/\{\{validade\}\}/g, String(validade || 7))
              .replace(/^\s*\d+[\.\)]\s*/, '');
            return `<li>${escapeHtml(texto)}</li>`;
          })
          .join('');
        const secaoCondicoesAgrp = condicoesItemsAgrp
          ? `<div class="secao"><div class="secao-titulo"><span class="icon">📜</span> Condições de contrato</div><ol class="condicoes-lista">${condicoesItemsAgrp}</ol></div>`
          : '';

        const footerContatoAgrp = footerContatoHtml(
          empresa_telefone,
          empresa_instagram,
        );

        // Data da proposta: a criação mais antiga entre os orçamentos escolhidos
        const datasCriacao = orcamentos
          .map((o) => o.created_at)
          .filter((d) => d && !Number.isNaN(new Date(d).getTime()));
        const dataAgrupado = dataDoDocumento(
          datasCriacao.length
            ? datasCriacao.reduce((a, b) => (new Date(b) < new Date(a) ? b : a))
            : null,
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
        <div class="emp-dados">${escapeHtml(documentoComRotulo(empresa_cnpj))}<br/>${escapeHtml(empresa_endereco) || ''}<br/>${escapeHtml(telefoneFormatado(empresa_telefone))}</div>
      </div>
    </div>
    <div class="meta-bar">
      <div class="meta-item"><span class="mk">Cliente</span><span class="mv">${escapeHtml(cliente_nome) || 'Cliente'}</span></div>
      <div class="meta-item"><span class="mk">Data</span><span class="mv">${dataAgrupado}</span></div>
      <div class="meta-item"><span class="mk">Orçamentos</span><span class="mv">${orcamentos.length}</span></div>
    </div>
    <div class="divider"></div>
    ${secaoApresentacaoAgrp}
    ${blocosV2}
    ${totalGeralBlocoV2}
    ${secaoMetodosAgrp}
    ${secaoCondicoesAgrp}
    <div class="no-break">
      ${await gerarQrCodePixHtml({ chavePix: chave_pix || '', nomeRecebedor: nome_recebedor_pix || empresa_nome || 'EMPRESA', cidadeRecebedor: cidade_pix || 'UBERABA', valor: totalGeralV2, txid: 'PROPOSTA' })}
      <div class="footer-v3">${footerContatoAgrp}<span class="criado">Criado em ${dataAgrupado}</span></div>
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
🧾 VALOR POR EXTENSO (pt-BR, até 999.999.999,99)
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

  // Classes: milhões, milhares e unidades. O " e " só entra antes da última
  // classe quando ela é menor que 100 ou centena redonda ("mil e cem",
  // "dois mil e cinquenta"); nos outros casos, só espaço ("três mil
  // trezentos e oitenta e dois").
  const milhoes = Math.floor(reais / 1000000);
  const milhares = Math.floor(reais / 1000) % 1000;
  const unidadesReais = reais % 1000;
  const classes = [];
  if (milhoes > 0) {
    classes.push({
      valor: milhoes,
      texto: grupo(milhoes) + (milhoes === 1 ? ' milhão' : ' milhões'),
    });
  }
  if (milhares > 0) {
    classes.push({
      valor: milhares,
      texto: milhares === 1 ? 'mil' : grupo(milhares) + ' mil',
    });
  }
  if (unidadesReais > 0) {
    classes.push({ valor: unidadesReais, texto: grupo(unidadesReais) });
  }

  let resultado = '';
  classes.forEach((classe, i) => {
    if (i === 0) {
      resultado = classe.texto;
    } else if (
      i === classes.length - 1 &&
      (classe.valor < 100 || classe.valor % 100 === 0)
    ) {
      resultado += ' e ' + classe.texto;
    } else {
      resultado += ' ' + classe.texto;
    }
  });

  // Milhão exato leva "de": "um milhão de reais".
  if (reais === 1) resultado += ' real';
  else if (reais > 0 && milhares === 0 && unidadesReais === 0)
    resultado += ' de reais';
  else if (reais > 0) resultado += ' reais';

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
    let itensParaLinhas =
      templateVersion === 'v2' ? itensValidosV2 : dados.itens;

    // v2: recibo criado de orçamento sai com as mesmas linhas do PDF do
    // orçamento (mão de obra, comissão diluída e desconto), para a soma fechar
    // com o total. Só quando o recibo ainda bate com o orçamento (soma dos
    // itens = subtotal e valor = total, em centavos); recibo manual ou com
    // valor editado sai como antes.
    const ref = dados.orcamento_ref;
    const centavos = (v) => Math.round(Number(v || 0) * 100);
    let descontoRecibo = 0;
    if (
      templateVersion === 'v2' &&
      ref &&
      centavos(
        dados.itens.reduce((soma, it) => soma + Number(it.valorTotal || 0), 0),
      ) === centavos(ref.subtotal) &&
      centavos(dados.valor_total) === centavos(ref.total)
    ) {
      const mdoRecibo = maoDeObraItem(
        Number(ref.subtotal) || 0,
        Number(ref.multiplicador) || 1,
      );
      const linhasBaseRecibo = mdoRecibo
        ? [...itensValidosV2, mdoRecibo]
        : itensValidosV2;
      descontoRecibo = Number(ref.desconto) || 0;
      itensParaLinhas =
        Number(ref.valor_comissao) > 0
          ? diluirComissao(linhasBaseRecibo, Number(ref.total) || 0, descontoRecibo)
          : linhasBaseRecibo;
    }

    const itensLinhas =
      itensParaLinhas
        .map(
          (item) => `
        <tr>
          <td>${escapeHtml(templateVersion === 'v2' ? maiusculaInicial(item.descricao) : item.descricao) || ''}</td>
          <td class="right">${item.quantidade || 1}</td>
          <td class="right">R$ ${formatar(item.valorUnitario)}</td>
          <td class="right">R$ ${formatar(item.valorTotal)}</td>
        </tr>
      `,
        )
        .join('') +
      (descontoRecibo > 0
        ? `<tr><td colspan="3" class="right">Desconto</td><td class="right">- R$ ${formatar(descontoRecibo)}</td></tr>`
        : '');

    /* ==========================================
    📝 OBSERVAÇÕES (bloco opcional)
    ========================================== */

    const obsBoxRecibo =
      templateVersion === 'v2'
        ? observacoesHtml(dados.observacoes, itensZeradosV2)
        : '';
    const obsHtml =
      templateVersion === 'v2'
        ? obsBoxRecibo
          ? `<div class="secao no-break">${obsBoxRecibo}</div>`
          : ''
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
        .replace(
          /{{empresa_cnpj}}/g,
          escapeHtml(documentoComRotulo(dados.empresa_cnpj)),
        )
        .replace(
          /{{empresa_endereco}}/g,
          escapeHtml(dados.empresa_endereco) || '',
        )
        .replace(
          /{{empresa_telefone}}/g,
          escapeHtml(telefoneFormatado(dados.empresa_telefone)),
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
🏢 GET /api/admin/me — O usuário logado é admin?
========================================== */

// Usado pelo useIsAdmin (menu "Empresas" da Sidebar). Responde pela mesma
// whitelist ADMIN_USER_IDS das outras rotas /api/admin/*: o role 'owner' do
// workspace não conta, porque todo cliente é owner da própria empresa.
// 200 = admin; 401/403 (requireAuth/requireAdmin) = não é.
app.get('/api/admin/me', requireAuth, requireAdmin, (_req, res) =>
  res.json({ admin: true }),
);

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

      // 1b. Linha de assinatura isenta (cliente fechado pelo Admin não cai no
      // checkout; mesmo formato do seed da R1). Empresa nunca fica sem ela: se o
      // insert falhar, o workspace é apagado (a cascata leva o que dependeria dele).
      const { error: assError } = await supabaseAdmin
        .from('assinaturas')
        .insert({ workspace_id: workspace.id, status: 'ativa', isento: true });

      if (assError) {
        console.error('[Admin] Erro ao criar assinatura isenta:', assError.code);
        await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id);
        return res
          .status(500)
          .json({ error: 'Erro ao criar assinatura isenta: ' + assError.message });
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
💳 COBRANÇA — onboarding, assinatura e webhook do gateway (R2)
========================================== */

// Plano: _build/plano-assinatura.md. Escrita em assinaturas/assinatura_eventos só
// por aqui (service_role). Logs sem dado pessoal, sem chave, sem token:
// [assinatura/<rota>] <gateway> ok|duplicado|erro <code>.

// Porta fechada até a R3 ligar a flag ASSINATURA_ATIVA junto com o gate do app.
// ASSINATURA_ROTAS_TESTE=true só no .env LOCAL, nunca na VPS. O webhook fica fora
// da porta (sempre ativo, validado pelo token).
function portaAssinaturaAberta(res) {
  if (featureFlags.ASSINATURA_ATIVA === true) return true;
  if (process.env.ASSINATURA_ROTAS_TESTE === 'true') return true;
  res.status(404).json({ error: 'Não encontrado' });
  return false;
}

// Trava de dinheiro real: fora do sandbox, as rotas de assinatura só respondem com
// ASAAS_PRODUCAO_LIBERADA=true (a R6 liga, junto com as chaves de produção).
const ASAAS_SANDBOX_URL = 'https://api-sandbox.asaas.com/v3';
function dinheiroRealLiberado(res) {
  if (process.env.ASAAS_API_URL === ASAAS_SANDBOX_URL) return true;
  if (process.env.ASAAS_PRODUCAO_LIBERADA === 'true') return true;
  res.status(503).json({ error: 'Cobrança indisponível no momento' });
  return false;
}

const logAssinatura = (rota, resultado, codigo) =>
  console.log(
    `[assinatura/${rota}] asaas ${resultado}${codigo ? ' ' + codigo : ''}`,
  );

const codigoErro = (err) =>
  err?.codigo || err?.status || err?.code || 'sem-codigo';

// Dono = membership 'owner' conferida via service_role com filtro explícito de
// user_id (o service_role ignora a RLS; mesmo padrão do assertInstanceOwnership).
async function ehDonoDoWorkspace(admin, workspaceId, userId) {
  if (typeof workspaceId !== 'string' || !workspaceId || !userId) return false;
  const { data, error } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('role', 'owner')
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// Trava em memória por workspace: duplo clique, duas abas ou retry do mesmo
// workspace rodam um de cada vez (o backend é 1 processo PM2 em fork). A busca por
// externalReference no gateway cobre queda no meio do checkout.
const travasAssinatura = new Map();
function comTravaAssinatura(chave, fn) {
  const anterior = travasAssinatura.get(chave) || Promise.resolve();
  const atual = anterior.catch(() => {}).then(fn);
  travasAssinatura.set(chave, atual);
  const limpar = () => {
    if (travasAssinatura.get(chave) === atual) travasAssinatura.delete(chave);
  };
  atual.then(limpar, limpar);
  return atual;
}

async function lerAssinatura(admin, workspaceId) {
  const { data, error } = await admin
    .from('assinaturas')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Aplica a consulta do gateway (webhook e sincronizar). O status vem sempre da
// consulta; o periodo_fim só SOBE (update condicional), então evento fora de ordem
// não faz regredir. Linha cancelada com cancelada_em fica congelada: sem isso, um
// evento depois de um estorno religaria o acesso. Só o nosso cancelar e o estorno
// gravam cancelada_em: assinatura pausada (INACTIVE) ou removida pelo painel vira
// "cancelada" SEM cancelada_em, para que, reativada no painel e paga, volte a
// "ativa". O estorno é a única escrita que baixa o periodo_fim e não passa por aqui.
async function aplicarConsultaAssinatura(admin, linha, consulta) {
  if (linha.status === 'cancelada' && linha.cancelada_em) return 'congelada';
  const agora = new Date().toISOString();
  const { error: e1 } = await admin
    .from('assinaturas')
    .update({ status: consulta.status, updated_at: agora })
    .eq('workspace_id', linha.workspace_id);
  if (e1) throw e1;

  const novoFim = periodoFimDe(consulta.vencimentoUltimaPaga);
  if (novoFim) {
    const { error: e2 } = await admin
      .from('assinaturas')
      .update({ periodo_fim: novoFim, updated_at: agora })
      .eq('workspace_id', linha.workspace_id)
      .or(`periodo_fim.is.null,periodo_fim.lt."${novoFim}"`);
    if (e2) throw e2;
  }
  return 'aplicada';
}

// Estorno: cancela a renovação no gateway e corta o acesso agora. Única escrita que
// pode baixar o periodo_fim (só baixa: se já estiver no passado, fica). O corte usa
// 1 minuto de margem para trás: o acesso_workspace compara com o now() do Postgres,
// e um relógio do servidor adiantado deixaria o acesso aberto por alguns instantes.
async function aplicarEstornoAssinatura(admin, gateway, linha, timeoutMs) {
  await gateway.cancelar({ assinaturaId: linha.gateway_assinatura_id, timeoutMs });
  const agora = new Date().toISOString();
  const corte = new Date(Date.now() - 60000).toISOString();
  const { error: e1 } = await admin
    .from('assinaturas')
    .update({
      status: 'cancelada',
      cancelada_em: linha.cancelada_em || agora,
      updated_at: agora,
    })
    .eq('workspace_id', linha.workspace_id);
  if (e1) throw e1;
  const { error: e2 } = await admin
    .from('assinaturas')
    .update({ periodo_fim: corte, updated_at: agora })
    .eq('workspace_id', linha.workspace_id)
    .or(`periodo_fim.is.null,periodo_fim.gt."${corte}"`);
  if (e2) throw e2;
}

/* ---------- POST /api/onboarding/empresa ---------- */

// Cria a empresa de quem entrou com Google sem empresa. Idempotente pela própria
// função (advisory lock + "já tem membership → devolve a mais antiga"). Segmento:
// "Marcenaria" → marcenaria; o resto → metalurgica (os dois valores que o app lê).
app.post(
  '/api/onboarding/empresa',
  requireAuth,
  strictLimiter,
  async (req, res) => {
    if (!portaAssinaturaAberta(res)) return;
    const nome = typeof req.body?.nome === 'string' ? req.body.nome.trim() : '';
    const segmento =
      typeof req.body?.segmento === 'string' ? req.body.segmento.trim() : '';
    if (
      nome.length < 2 ||
      nome.length > 80 ||
      !LANDING_SEGMENTOS.includes(segmento)
    ) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    try {
      const { data, error } = await getSupabaseAdmin().rpc(
        'criar_empresa_onboarding',
        {
          p_user_id: req.user.id,
          p_nome: nome,
          p_segment: segmento === 'Marcenaria' ? 'marcenaria' : 'metalurgica',
        },
      );
      if (error) throw error;
      logAssinatura('onboarding', 'ok');
      return res.status(201).json({ workspace_id: data });
    } catch (err) {
      logAssinatura('onboarding', 'erro', codigoErro(err));
      return res.status(500).json({ error: 'Erro ao criar empresa' });
    }
  },
);

/* ---------- POST /api/assinatura/checkout ---------- */

// Ordem das regras: isento → 409; ativa/atrasada → 409 (o caminho é o
// Regularizar); cancelada ainda dentro do período pago → 409 sem mexer em nada;
// pendente com assinatura viva → devolve a mesma URL; resto → cria assinatura nova
// (cancelando a velha no gateway, se ainda existir). CPF/CNPJ e celular só são
// repassados ao gateway: não vão para o banco nem para o log.
app.post(
  '/api/assinatura/checkout',
  requireAuth,
  strictLimiter,
  async (req, res) => {
    if (!portaAssinaturaAberta(res) || !dinheiroRealLiberado(res)) return;
    const workspaceId = req.body?.workspace_id;
    const cpfCnpj = soDigitos(req.body?.cpf_cnpj);
    const celular = soDigitos(req.body?.celular);
    if (!validarCpfCnpj(cpfCnpj) || !validarCelular(celular)) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    if (!process.env.APP_URL) {
      logAssinatura('checkout', 'erro', 'APP_URL ausente');
      return res.status(500).json({ error: 'Cobrança indisponível no momento' });
    }
    try {
      const admin = getSupabaseAdmin();
      if (!(await ehDonoDoWorkspace(admin, workspaceId, req.user.id))) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      const gateway = gatewayAtual();
      const resultado = await comTravaAssinatura(workspaceId, async () => {
        const linha = await lerAssinatura(admin, workspaceId);
        if (!linha) return { http: 409, corpo: { error: 'sem_assinatura' } };
        if (linha.isento) return { http: 409, corpo: { error: 'isento' } };
        if (linha.status === 'ativa' || linha.status === 'atrasada') {
          return { http: 409, corpo: { error: 'ja_assinada' } };
        }
        if (
          linha.status === 'cancelada' &&
          linha.periodo_fim &&
          Date.now() < new Date(linha.periodo_fim).getTime()
        ) {
          return { http: 409, corpo: { error: 'periodo_pago_vigente' } };
        }
        if (linha.status === 'pendente' && linha.gateway_assinatura_id) {
          const url = await gateway.urlAssinaturaViva(linha.gateway_assinatura_id);
          if (url) return { http: 200, corpo: { url }, resultado: 'mesma' };
        }
        if (linha.status === 'cancelada' && linha.gateway_assinatura_id) {
          await gateway.cancelar({ assinaturaId: linha.gateway_assinatura_id });
        }

        const { data: ws, error: wsErr } = await admin
          .from('workspaces')
          .select('nome')
          .eq('id', workspaceId)
          .single();
        if (wsErr) throw wsErr;

        const criado = await gateway.criarCheckout({
          workspaceId,
          nomeEmpresa: ws.nome,
          email: req.user.email,
          cpfCnpj,
          celular,
          valor: VALOR_MENSAL,
          vencimentoHoje: hojeSaoPaulo(),
          urlRetorno: `${process.env.APP_URL}/?assinatura=retorno`,
          clienteId: linha.gateway_cliente_id,
        });
        const { error: upErr } = await admin
          .from('assinaturas')
          .update({
            gateway: 'asaas',
            gateway_cliente_id: criado.clienteId,
            gateway_assinatura_id: criado.assinaturaId,
            status: 'pendente',
            cancelada_em: null,
            updated_at: new Date().toISOString(),
          })
          .eq('workspace_id', workspaceId);
        if (upErr) throw upErr;
        return { http: 200, corpo: { url: criado.url }, resultado: 'criada' };
      });
      logAssinatura(
        'checkout',
        resultado.http === 200 ? 'ok' : 'erro',
        resultado.resultado || resultado.corpo.error,
      );
      return res.status(resultado.http).json(resultado.corpo);
    } catch (err) {
      logAssinatura('checkout', 'erro', codigoErro(err));
      return res.status(502).json({ error: 'Erro ao iniciar a assinatura' });
    }
  },
);

/* ---------- POST /api/assinatura/regularizar ---------- */

// Link da fatura em aberto (a vencida mais antiga primeiro). Pagar com outro cartão
// nessa página troca o cartão da renovação (visto no sandbox) e ela volta sozinha
// para o app (o callback da assinatura vale para todas as cobranças).
app.post(
  '/api/assinatura/regularizar',
  requireAuth,
  strictLimiter,
  async (req, res) => {
    if (!portaAssinaturaAberta(res) || !dinheiroRealLiberado(res)) return;
    const workspaceId = req.body?.workspace_id;
    try {
      const admin = getSupabaseAdmin();
      if (!(await ehDonoDoWorkspace(admin, workspaceId, req.user.id))) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      const linha = await lerAssinatura(admin, workspaceId);
      if (!linha?.gateway_assinatura_id || linha.isento) {
        return res.status(409).json({ error: 'sem_assinatura' });
      }
      const url = await GATEWAYS[linha.gateway].linkRegularizar({
        assinaturaId: linha.gateway_assinatura_id,
      });
      if (!url) return res.status(409).json({ error: 'nada_em_aberto' });
      logAssinatura('regularizar', 'ok');
      return res.json({ url });
    } catch (err) {
      logAssinatura('regularizar', 'erro', codigoErro(err));
      return res.status(502).json({ error: 'Erro ao abrir a fatura' });
    }
  },
);

/* ---------- POST /api/assinatura/cancelar ---------- */

// Cancela a renovação no gateway. O acesso segue até o fim do período pago
// (periodo_fim fica). Nunca pagou (pendente) → continua pendente.
app.post(
  '/api/assinatura/cancelar',
  requireAuth,
  strictLimiter,
  async (req, res) => {
    if (!portaAssinaturaAberta(res) || !dinheiroRealLiberado(res)) return;
    const workspaceId = req.body?.workspace_id;
    try {
      const admin = getSupabaseAdmin();
      if (!(await ehDonoDoWorkspace(admin, workspaceId, req.user.id))) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      const resultado = await comTravaAssinatura(workspaceId, async () => {
        const linha = await lerAssinatura(admin, workspaceId);
        if (!linha?.gateway_assinatura_id || linha.isento) {
          return { http: 409, corpo: { error: 'sem_assinatura' } };
        }
        if (linha.status === 'cancelada') {
          return { http: 200, corpo: { status: 'cancelada' } };
        }
        await GATEWAYS[linha.gateway].cancelar({
          assinaturaId: linha.gateway_assinatura_id,
        });
        const agora = new Date().toISOString();
        const novoStatus = linha.status === 'pendente' ? 'pendente' : 'cancelada';
        const { error } = await admin
          .from('assinaturas')
          .update({
            status: novoStatus,
            cancelada_em: novoStatus === 'cancelada' ? agora : null,
            updated_at: agora,
          })
          .eq('workspace_id', workspaceId);
        if (error) throw error;
        return { http: 200, corpo: { status: novoStatus } };
      });
      logAssinatura('cancelar', resultado.http === 200 ? 'ok' : 'erro', resultado.corpo.error);
      return res.status(resultado.http).json(resultado.corpo);
    } catch (err) {
      logAssinatura('cancelar', 'erro', codigoErro(err));
      return res.status(502).json({ error: 'Erro ao cancelar a assinatura' });
    }
  },
);

/* ---------- POST /api/assinatura/sincronizar ---------- */

// Consulta o gateway e aplica (cobre webhook perdido): volta do checkout e "Já paguei".
app.post(
  '/api/assinatura/sincronizar',
  requireAuth,
  strictLimiter,
  async (req, res) => {
    if (!portaAssinaturaAberta(res) || !dinheiroRealLiberado(res)) return;
    const workspaceId = req.body?.workspace_id;
    try {
      const admin = getSupabaseAdmin();
      if (!(await ehDonoDoWorkspace(admin, workspaceId, req.user.id))) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      const linha = await lerAssinatura(admin, workspaceId);
      if (!linha) return res.status(409).json({ error: 'sem_assinatura' });
      if (!linha.isento && linha.gateway_assinatura_id) {
        const consulta = await GATEWAYS[linha.gateway].consultar({
          assinaturaId: linha.gateway_assinatura_id,
        });
        await aplicarConsultaAssinatura(admin, linha, consulta);
      }
      const atual = await lerAssinatura(admin, workspaceId);
      logAssinatura('sincronizar', 'ok');
      return res.json({
        status: atual.status,
        isento: atual.isento,
        periodo_fim: atual.periodo_fim,
      });
    } catch (err) {
      logAssinatura('sincronizar', 'erro', codigoErro(err));
      return res.status(502).json({ error: 'Erro ao sincronizar a assinatura' });
    }
  },
);

/* ---------- POST /webhook/assinatura/:gateway ---------- */

// 1) gateway desconhecido → 404; token inválido → 401. 2) Grava o evento (sem o
// creditCardToken); repetido e já processado → 200 "duplicado"; repetido sem
// processado_em → reprocessa. 3) Assinatura desconhecida ou referência divergente
// → grava o erro e responde 200 (o Asaas pausa a fila após 15 falhas). 4) Estorno →
// cancela e corta o acesso; 1ª cobrança vencida de assinatura que nunca foi paga
// (checkout abandonado) → remove a assinatura e o workspace segue "pendente";
// demais → consulta e aplica. 5) 500 só em falha de banco ou do gateway (reenvia).
// Chamadas ao gateway com timeout curto para responder em menos de 10s.
const TIMEOUT_WEBHOOK = 4000;

app.post('/webhook/assinatura/:gateway', async (req, res) => {
  const nomeGateway = req.params.gateway;
  const gateway = Object.hasOwn(GATEWAYS, nomeGateway) ? GATEWAYS[nomeGateway] : null;
  if (!gateway) return res.status(404).json({ error: 'Não encontrado' });
  if (!gateway.validarWebhook(req, safeEqual)) {
    logAssinatura('webhook', 'erro', 401);
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const ev = gateway.extrairEvento(req.body);
  if (!ev.eventoId || !ev.tipo) {
    logAssinatura('webhook', 'erro', 'sem_id');
    return res.status(200).json({ status: 'ignorado' });
  }

  try {
    const admin = getSupabaseAdmin();
    let eventoRowId;
    const { data: novo, error: insErr } = await admin
      .from('assinatura_eventos')
      .insert({
        gateway: nomeGateway,
        evento_id: ev.eventoId,
        tipo: ev.tipo,
        payload: gateway.payloadParaGuardar(req.body),
      })
      .select('id')
      .single();
    if (insErr) {
      if (insErr.code !== '23505') throw insErr;
      const { data: existente, error: selErr } = await admin
        .from('assinatura_eventos')
        .select('id, processado_em')
        .eq('gateway', nomeGateway)
        .eq('evento_id', ev.eventoId)
        .single();
      if (selErr) throw selErr;
      if (existente.processado_em) {
        logAssinatura('webhook', 'duplicado');
        return res.status(200).json({ status: 'duplicado' });
      }
      eventoRowId = existente.id;
    } else {
      eventoRowId = novo.id;
    }

    const fechar = async (erro, workspaceId) => {
      const campos = { processado_em: new Date().toISOString(), erro: erro || null };
      if (workspaceId) campos.workspace_id = workspaceId;
      const { error } = await admin
        .from('assinatura_eventos')
        .update(campos)
        .eq('id', eventoRowId);
      if (error) throw error;
    };

    if (!ev.assinaturaId) {
      await fechar('sem_assinatura');
      logAssinatura('webhook', 'erro', 'sem_assinatura');
      return res.status(200).json({ status: 'sem_assinatura' });
    }
    const { data: linha, error: linhaErr } = await admin
      .from('assinaturas')
      .select('*')
      .eq('gateway', nomeGateway)
      .eq('gateway_assinatura_id', ev.assinaturaId)
      .maybeSingle();
    if (linhaErr) throw linhaErr;
    if (!linha) {
      await fechar('assinatura_desconhecida');
      logAssinatura('webhook', 'erro', 'assinatura_desconhecida');
      return res.status(200).json({ status: 'assinatura_desconhecida' });
    }
    if (ev.externalReference && ev.externalReference !== linha.workspace_id) {
      await fechar('referencia_divergente', linha.workspace_id);
      logAssinatura('webhook', 'erro', 'referencia_divergente');
      return res.status(200).json({ status: 'referencia_divergente' });
    }

    if (ev.estorno) {
      await aplicarEstornoAssinatura(admin, gateway, linha, TIMEOUT_WEBHOOK);
      await fechar(null, linha.workspace_id);
      logAssinatura('webhook', 'ok', 'estorno');
      return res.status(200).json({ status: 'ok' });
    }

    let consulta = await gateway.consultar({
      assinaturaId: ev.assinaturaId,
      timeoutMs: TIMEOUT_WEBHOOK,
    });
    if (ev.vencida && consulta.nuncaPaga && !consulta.removida) {
      await gateway.cancelar({ assinaturaId: ev.assinaturaId, timeoutMs: TIMEOUT_WEBHOOK });
      consulta = { ...consulta, removida: true, status: 'pendente' };
    }
    await aplicarConsultaAssinatura(admin, linha, consulta);

    // 'pago_no_debito' no campo erro é AVISO, não falha de processamento: o evento
    // foi processado (processado_em preenchido) e o status não muda. Marca quem pagou
    // a última cobrança no cartão de débito: sem renovação automática, cada mês vira
    // fatura manual. 'sem_vencimento' = paga sem data: o periodo_fim não foi mexido.
    const aviso = consulta.semVencimento
      ? 'sem_vencimento'
      : consulta.pagoNoDebito
        ? 'pago_no_debito'
        : null;
    await fechar(aviso, linha.workspace_id);
    logAssinatura('webhook', 'ok', aviso);
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    logAssinatura('webhook', 'erro', codigoErro(err));
    return res.status(500).json({ status: 'erro' });
  }
});

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
  if (!featureFlags.MODULO_WHATSAPP_VISIVEL) {
    res
      .status(503)
      .json({ error: 'Envio de WhatsApp temporariamente desativado' });
    return null;
  }
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
