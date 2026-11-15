// Prévia do orçamento (HTML aproximado): espelho do PDF v2 do server.js.
// Mudou uma destas funções no server.js, muda aqui (e roda o teste da prévia, ver o current-state):
// fmtBRL (:55), maiusculaInicial (:61), separarItens (:69), maoDeObraItem (:83), diluirComissao (:99),
// dataDoDocumento (:128), resumoTabelaHtml (:162), caixaTotalHtml (:206), observacoesHtml (:219),
// valorPorExtenso (:1832) e a rota /api/gerar-orcamento v2 (:1032-1225).
// A entrada é a mesma que o generatePDF de Orcamentos.tsx manda ao servidor.
import type { Orcamento } from '@/types';

interface AjustesPrevia {
  empresaNome: string;
  validadePadraoOrcamento: number;
  condicoesContrato: string;
}

interface LinhaCalculo {
  descricao?: string;
  quantidade?: number;
  valorUnitario?: number;
  valorTotal?: number;
  ambiente?: string;
}

export interface LinhaPrevia {
  descricao: string;
  quantidade: string;
  unitario: string;
  total: string;
}

export interface Previa {
  empresa: string;
  numero: string;
  data: string;
  cliente: string;
  linhas: LinhaPrevia[];
  desconto: string | null;
  total: string;
  extenso: string;
  quadro: { titulo: 'Importante' | 'Observações'; texto: string } | null;
  validadeDias: number | null;
}

// server.js:55
const fmtBRL = (v: unknown) =>
  Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// server.js:61
function maiusculaInicial(texto: unknown) {
  const s = String(texto || '');
  if (/^\s*(kg|cm|mm|un|p\u00e7|m)(?![a-z\u00e0-\u00ff])/i.test(s)) return s;
  return s.replace(/^(\s*)(\S)/, (_, esp, c) => esp + c.toLocaleUpperCase('pt-BR'));
}

// server.js:69
function separarItens(itens: LinhaCalculo[]) {
  const validos: LinhaCalculo[] = [];
  const zerados: LinhaCalculo[] = [];
  for (const item of itens || []) {
    const nome = (item.descricao || '').trim().toLowerCase();
    if (!nome || nome === 'item') continue;
    const valor = parseFloat(String(item.valorTotal || 0));
    if (valor === 0) zerados.push(item);
    else validos.push(item);
  }
  return { validos, zerados };
}

// server.js:83
function maoDeObraItem(subtotal: number, multiplicador: number): LinhaCalculo | null {
  if (!(multiplicador > 1)) return null;
  const valor = subtotal * (multiplicador - 1);
  return { descricao: 'Mão de obra especializada', quantidade: 1, valorUnitario: valor, valorTotal: valor };
}

// server.js:99
function diluirComissao(linhas: LinhaCalculo[], total: number, desconto: number) {
  const alvo = Math.round((Number(total || 0) + Number(desconto || 0)) * 100);
  const base = linhas.reduce((soma, l) => soma + Math.round(Number(l.valorTotal || 0) * 100), 0);
  if (!(base > 0)) return linhas;

  const qtds = linhas.map((l) => Number(l.quantidade) || 1);
  const unitarios = linhas.map((l) => Math.round((Number(l.valorUnitario || 0) * 100 * alvo) / base));
  const totais = unitarios.map((u, i) => Math.round(u * qtds[i]));

  const sobra = alvo - totais.reduce((soma, t) => soma + t, 0);
  let k = qtds.lastIndexOf(1);
  if (k < 0) k = linhas.length - 1;
  totais[k] += sobra;
  unitarios[k] = qtds[k] === 1 ? totais[k] : Math.round(totais[k] / qtds[k]);

  return linhas.map((l, i) => ({ ...l, valorUnitario: unitarios[i] / 100, valorTotal: totais[i] / 100 }));
}

// server.js:128
function dataDoDocumento(dataCriacao: string | undefined) {
  const d = new Date(dataCriacao as string);
  if (!dataCriacao || Number.isNaN(d.getTime())) {
    return new Date().toLocaleDateString('pt-BR');
  }
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

// server.js:219 (o texto do quadro, sem o HTML)
function observacoes(observacoesUsuario: unknown, zerados: LinhaCalculo[]): Previa['quadro'] {
  const partes: string[] = [];
  const temObsUsuario = !!(observacoesUsuario && String(observacoesUsuario).trim());
  if (temObsUsuario) partes.push(maiusculaInicial(observacoesUsuario));
  const zeroLinhas = (zerados || [])
    .map((it) => {
      const ambiente = it.ambiente ? ` (${it.ambiente})` : '';
      return `• ${maiusculaInicial(it.descricao) || 'Item'}${ambiente} — sem custo`;
    })
    .join('\n');
  if (zeroLinhas) partes.push(zeroLinhas);
  const corpo = partes.join('\n');
  if (!corpo) return null;
  return { titulo: temObsUsuario ? 'Importante' : 'Observações', texto: corpo };
}

// server.js:1832
function valorPorExtenso(valor: number) {
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cem', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  function grupo(n: number): string {
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

  const milhoes = Math.floor(reais / 1000000);
  const milhares = Math.floor(reais / 1000) % 1000;
  const unidadesReais = reais % 1000;
  const classes: { valor: number; texto: string }[] = [];
  if (milhoes > 0) classes.push({ valor: milhoes, texto: grupo(milhoes) + (milhoes === 1 ? ' milhão' : ' milhões') });
  if (milhares > 0) classes.push({ valor: milhares, texto: milhares === 1 ? 'mil' : grupo(milhares) + ' mil' });
  if (unidadesReais > 0) classes.push({ valor: unidadesReais, texto: grupo(unidadesReais) });

  let resultado = '';
  classes.forEach((classe, i) => {
    if (i === 0) resultado = classe.texto;
    else if (i === classes.length - 1 && (classe.valor < 100 || classe.valor % 100 === 0)) resultado += ' e ' + classe.texto;
    else resultado += ' ' + classe.texto;
  });

  if (reais === 1) resultado += ' real';
  else if (reais > 0 && milhares === 0 && unidadesReais === 0) resultado += ' de reais';
  else if (reais > 0) resultado += ' reais';

  if (centavos > 0) {
    if (reais > 0) resultado += ' e ';
    resultado += grupo(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  }

  return resultado;
}

// Os mesmos valores do generatePDF (Orcamentos.tsx) e as mesmas contas da rota v2 do server.js
export function montarPrevia(orc: Orcamento, nomeLead: string | undefined, ajustes: AjustesPrevia): Previa {
  const itens: LinhaCalculo[] = Array.isArray(orc.itens) ? orc.itens : [];
  const subtotalCalculado = itens.reduce((acc, item) => acc + Number(item.valorTotal || 0), 0);
  const subtotal = Number(orc.subtotal) || subtotalCalculado;
  const total = Number(orc.total) || subtotal;
  const multiplicador = Number(orc.multiplicador ?? 1) || 1;
  const descontoNum = Number(orc.desconto) || 0;
  const validade = orc.validadeEmDias ?? ajustes.validadePadraoOrcamento;

  const { validos, zerados } = separarItens(itens);
  const mdo = maoDeObraItem(subtotal, multiplicador);
  const linhasBase = mdo ? [...validos, mdo] : validos;
  const itensParaExibir =
    Number(orc.valorComissao ?? 0) > 0 ? diluirComissao(linhasBase, total, descontoNum) : linhasBase;

  return {
    empresa: ajustes.empresaNome || 'Empresa',
    numero: orc.numeroDocumento || `ORC-${new Date().getFullYear()}-001`,
    data: dataDoDocumento(orc.createdAt),
    cliente: orc.clienteNome || nomeLead || 'Cliente',
    linhas: itensParaExibir.map((item) => ({
      descricao: maiusculaInicial(item.descricao) || 'Item',
      quantidade: String(item.quantidade || 1),
      unitario: fmtBRL(item.valorUnitario),
      total: fmtBRL(item.valorTotal),
    })),
    desconto: descontoNum > 0 ? fmtBRL(descontoNum) : null,
    total: fmtBRL(total),
    extenso: valorPorExtenso(total),
    quadro: observacoes(orc.observacoes, zerados),
    validadeDias: (ajustes.condicoesContrato || '').includes('{{validade}}') ? Number(validade) || 7 : null,
  };
}
