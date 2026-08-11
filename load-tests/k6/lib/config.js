// Config compartilhada dos cenários k6.
// Tudo vem de __ENV: variáveis de ambiente do SO ou flags `--env NOME=valor` do k6.

export const BASE_URL = __ENV.BASE_URL || 'https://api.vrtxcrm.com.br';

// Lê número de __ENV com default; ignora valor ausente, inválido ou <= 0.
export function num(name, def) {
  const v = Number(__ENV[name]);
  return Number.isFinite(v) && v > 0 ? v : def;
}

export function bool(name) {
  return __ENV[name] === '1' || __ENV[name] === 'true';
}
