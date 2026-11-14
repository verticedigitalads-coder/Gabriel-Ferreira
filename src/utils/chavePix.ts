// Chave PIX no formato do DICT, pelo tipo escolhido em Configurações.
// O BR Code usa a chave no formato do DICT (Manual de Padrões para Iniciação do Pix
// v2.10.0, seção 2.5.1). Formatos: Manual Operacional do DICT v8.5, seção 1, e as
// expressões regulares da API DICT 2.13.0. O tipo manda: nada é deduzido pelo formato
// (um celular sem +55 tem 11 dígitos, como um CPF).

// E-mail e chave aleatória (EVP): regex da API DICT 2.13.0, só minúsculas.
const EMAIL_DICT = /^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;
const EVP_DICT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Dígito verificador de CPF e CNPJ. No CNPJ alfanumérico cada caractere vale o
// código ASCII menos 48 (dígito vale ele mesmo; A = 17 ... Z = 42).
function dv(base: string, pesos: number[]): number {
  const soma = [...base].reduce((s, c, i) => s + (c.charCodeAt(0) - 48) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function cpfValido(c: string): boolean {
  return (
    !/^(\d)\1{10}$/.test(c) &&
    dv(c.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(c[9]) &&
    dv(c.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(c[10])
  );
}

function cnpjValido(c: string): boolean {
  return (
    !/^(\d)\1{13}$/.test(c) &&
    dv(c.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(c[12]) &&
    dv(c.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(c[13])
  );
}

const AVISO_CELULAR = 'Digite o celular com DDD, como (34) 99999-9999.';

export function normalizarChavePix(chave: string, tipo: string): { chave: string; erro: string | null } {
  const ok = (c: string) => ({ chave: c, erro: null });
  const falha = (erro: string) => ({ chave, erro });

  if (tipo === 'cpf_cnpj') {
    const c = chave.replace(/[\s./-]/g, '').toUpperCase();
    if (/^\d{11}$/.test(c)) return cpfValido(c) ? ok(c) : falha('Esse CPF não é válido. Confira os números.');
    if (/^[A-Z0-9]{12}\d{2}$/.test(c)) return cnpjValido(c) ? ok(c) : falha('Esse CNPJ não é válido. Confira os números.');
    return falha('CPF tem 11 números e CNPJ tem 14 caracteres. Confira a chave.');
  }

  if (tipo === 'telefone') {
    if (!/^[\d\s().+-]+$/.test(chave)) return falha(AVISO_CELULAR);
    const comMais = chave.trim().startsWith('+');
    let d = chave.replace(/\D/g, '');
    if (comMais && !d.startsWith('55')) return falha('A chave de celular precisa ser um número do Brasil (+55).');
    // Tira o 55 só quando é o código do país: com "+" ou com 13 dígitos (DDD 55 + celular tem 11).
    if (comMais || (d.length === 13 && d.startsWith('55'))) d = d.slice(2);
    return /^[1-9]{2}9\d{8}$/.test(d) ? ok(`+55${d}`) : falha(AVISO_CELULAR);
  }

  if (tipo === 'email') {
    const c = chave.replace(/\s/g, '').toLowerCase();
    if (c.length > 77) return falha('E-mail longo demais para chave PIX (máximo 77 caracteres).');
    return EMAIL_DICT.test(c) ? ok(c) : falha('Esse e-mail não é válido.');
  }

  if (tipo === 'aleatoria') {
    const c = chave.replace(/\s/g, '').toLowerCase();
    return EVP_DICT.test(c)
      ? ok(c)
      : falha('Cole a chave aleatória como aparece no app do banco: 36 caracteres, com os hífens.');
  }

  return falha('Escolha o tipo da chave.');
}
