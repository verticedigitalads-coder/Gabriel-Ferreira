// Maiúscula automática ao digitar (pedido da FL Art Metal).
// Regra pura, sem DOM: o hook useMaiusculaAuto chama estas funções a cada tecla.

// frase: começo do campo e de cada frase · inicio: só a 1ª letra do campo ·
// palavras: cada palavra (nomes, empresas, endereços), menos os conectivos.
export type ModoMaiuscula = 'frase' | 'inicio' | 'palavras';

// Mesmas unidades do maiusculaInicial() do server.js (m, m², m³, kg, cm, mm, un, pç).
// Mudou lá, muda aqui.
const UNIDADE = /^(kg|cm|mm|un|p\u00e7|m)$/i;
const LETRA = /[a-z\u00e0-\u00ff]/i;

// No modo palavras, voltam a minúscula quando a palavra fecha (menos na 1ª palavra do campo).
const CONECTIVO = /^(da|das|de|do|dos|e)$/i;

const INICIO_CAMPO = /^\s*$/;
const INICIO_FRASE = /(?:^\s*|[.!?]\s+|\n\s*)$/;
const INICIO_PALAVRA = /(?:^|\s)$/;
const REGRA = { inicio: INICIO_CAMPO, frase: INICIO_FRASE, palavras: INICIO_PALAVRA };

// Índice da letra recém-digitada (em cursor - 1) que deve virar maiúscula, ou -1.
// Só age com o cursor no fim do texto: editar no meio não muda nada.
export function posicaoParaMaiuscula(valor: string, cursor: number, modo: ModoMaiuscula): number {
  if (cursor < 1 || valor.slice(cursor).trim() !== '') return -1;
  const c = valor[cursor - 1];
  const maiuscula = c.toLocaleUpperCase('pt-BR');
  if (maiuscula === c || maiuscula.length !== 1) return -1;
  return REGRA[modo].test(valor.slice(0, cursor - 1)) ? cursor - 1 : -1;
}

// Índice da maiúscula colocada pelo campo (posCorrigida) que volta a ser minúscula
// porque a palavra fechou como unidade ("M" + "²" vira "m²") ou, no modo palavras,
// como conectivo ("Maria Da " vira "Maria da "), ou -1.
// No modo palavras não há exceção de unidade: "M." de "João M. Souza" é inicial de nome.
export function posicaoParaDesfazer(valor: string, cursor: number, posCorrigida: number, modo: ModoMaiuscula): number {
  if (posCorrigida < 0 || posCorrigida >= cursor - 1 || valor.slice(cursor).trim() !== '') return -1;
  if (LETRA.test(valor[cursor - 1])) return -1;
  const palavra = valor.slice(posCorrigida, cursor - 1);
  if (modo === 'palavras') {
    if (!CONECTIVO.test(palavra) || INICIO_CAMPO.test(valor.slice(0, posCorrigida))) return -1;
  } else if (!UNIDADE.test(palavra)) return -1;
  const c = valor[posCorrigida];
  return c !== c.toLocaleLowerCase('pt-BR') ? posCorrigida : -1;
}
