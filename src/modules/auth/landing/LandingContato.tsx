import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { ArrowUpRight, ChevronDown, X } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import {
  CONTATO_LIMITES,
  CONTATO_SEGMENTOS,
  LEGAL_PATHS,
  contato,
  whatsappContatoUrl,
  whatsappUrl,
  type ContatoCampos,
} from './landingContent';

// Painel "Falar com a equipe" (visual do ContactModal da v4.1). Montado uma vez no
// AuthPage; os CTAs abrem com abrirContato, por evento de janela, para não passar
// prop por 7 componentes. O href wa.me do CTA continua como fallback sem JS.
// Envio: POST sem retry (o retry do apiFetch espera >60s e pode duplicar o lead)
// contra um timer de 5s. Gravou: "Abrindo o WhatsApp…" e segue. Falhou, demorou ou
// 429: aviso por 1,5s e segue do mesmo jeito. WhatsApp na MESMA aba: o tráfego vem
// de anúncio Meta, e o navegador interno do Instagram/Facebook bloqueia aba nova.
// Sem <footer> aqui: a LandingDock trata o primeiro <footer> da página como o rodapé.

const EVENTO = 'lp:contato';
const TIMEOUT_MS = 5000;
const AVISO_MS = 1500;
const RESET_MS = 3000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FOCAVEIS =
  'a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled])';

const VAZIO: ContatoCampos = { nome: '', empresa: '', whatsapp: '', email: '', segmento: '' };

type Campo = keyof ContatoCampos;
type Erros = Partial<Record<Campo, string>>;
type Etapa = 'form' | 'enviando' | 'abrindo' | 'aviso';

export function abrirContato(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  window.dispatchEvent(new Event(EVENTO));
}

// Mesma normalização do server.js: só dígitos e sem o 55 quando sobram 12 ou 13.
function digitosTelefone(v: string): string {
  const d = v.replace(/\D/g, '');
  return (d.length === 12 || d.length === 13) && d.startsWith('55') ? d.slice(2) : d;
}

function validar(c: ContatoCampos): Erros {
  const erros: Erros = {};
  if (c.nome.length < 2) erros.nome = contato.erros.nome;
  if (!c.empresa) erros.empresa = contato.erros.empresa;
  const tel = digitosTelefone(c.whatsapp).length;
  if (tel < 10 || tel > 11) erros.whatsapp = contato.erros.whatsapp;
  if (c.email && !EMAIL_RE.test(c.email)) erros.email = contato.erros.email;
  if (!CONTATO_SEGMENTOS.includes(c.segmento)) erros.segmento = contato.erros.segmento;
  return erros;
}

export function LandingContato() {
  const [aberto, setAberto] = useState(false);
  const [campos, setCampos] = useState<ContatoCampos>(VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [etapa, setEtapa] = useState<Etapa>('form');
  const painelRef = useRef<HTMLDivElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const focoAntes = useRef<HTMLElement | null>(null);
  const etapaRef = useRef<Etapa>('form');
  etapaRef.current = etapa;

  const ocupado = etapa !== 'form';

  useEffect(() => {
    const abrir = () => {
      focoAntes.current = document.activeElement as HTMLElement | null;
      setAberto(true);
    };
    window.addEventListener(EVENTO, abrir);
    return () => window.removeEventListener(EVENTO, abrir);
  }, []);

  // Aberto: trava a rolagem da página, foca o 1º campo, Esc fecha (menos durante o
  // envio) e o Tab circula dentro do painel. Ao fechar, o foco volta ao CTA.
  useEffect(() => {
    if (!aberto) return;
    const painel = painelRef.current;
    document.body.style.overflow = 'hidden';
    document.getElementById('lp-contato-nome')?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (etapaRef.current === 'form') setAberto(false);
        return;
      }
      if (e.key !== 'Tab' || !painel) return;
      const focaveis = painel.querySelectorAll<HTMLElement>(FOCAVEIS);
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (!painel.contains(document.activeElement)) {
        e.preventDefault();
        primeiro.focus();
      } else if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      focoAntes.current?.focus();
    };
  }, [aberto]);

  const fechar = () => {
    if (!ocupado) setAberto(false);
  };

  const mudar = (campo: Campo, valor: string) => {
    setCampos(prev => ({ ...prev, [campo]: valor }));
    setErros(prev => ({ ...prev, [campo]: undefined }));
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (ocupado) return;
    const limpos: ContatoCampos = {
      nome: campos.nome.trim(),
      empresa: campos.empresa.trim(),
      whatsapp: campos.whatsapp.trim(),
      email: campos.email.trim(),
      segmento: campos.segmento,
    };
    const novosErros = validar(limpos);
    setErros(novosErros);
    const primeiroErro = (Object.keys(novosErros) as Campo[])[0];
    if (primeiroErro) {
      document.getElementById(`lp-contato-${primeiroErro}`)?.focus();
      return;
    }

    setEtapa('enviando');
    const destino = whatsappContatoUrl(limpos);
    const gravou = await Promise.race([
      apiFetch(
        '/api/landing/contato',
        {
          method: 'POST',
          body: JSON.stringify({ ...limpos, site: honeypotRef.current?.value ?? '' }),
        },
        0,
      )
        .then(r => r.ok)
        .catch(() => false),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), TIMEOUT_MS)),
    ]);

    if (gravou) {
      setEtapa('abrindo');
      seguir(destino);
      return;
    }
    setEtapa('aviso');
    setTimeout(() => seguir(destino), AVISO_MS);
  };

  // No iOS o wa.me abre o app por cima e a aba fica aqui: sem isso, quem volta
  // encontra o painel travado em "Abrindo…" com o fechar desabilitado.
  const seguir = (destino: string) => {
    window.location.href = destino;
    setTimeout(() => {
      setAberto(false);
      setEtapa('form');
      setCampos(VAZIO);
    }, RESET_MS);
  };

  if (!aberto) return null;

  const status = etapa === 'abrindo' ? contato.abrindo : etapa === 'aviso' ? contato.avisoFalha : '';

  return (
    <div className="lp-contato lp-v2">
      <div className="lp-contato-fundo" onClick={fechar} aria-hidden="true" />
      <div
        ref={painelRef}
        className="lp-contato-painel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lp-contato-titulo"
      >
        <button
          type="button"
          className="lp-contato-fechar"
          onClick={fechar}
          disabled={ocupado}
          aria-label={contato.fechar}
        >
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <div className="lp-contato-lado">
          <span className="lp-mono lp-eyebrow">{contato.eyebrow}</span>
          <h2 id="lp-contato-titulo" className="lp-contato-titulo">
            {contato.titulo}{' '}<span className="lp-serif">{contato.destaque}</span>
          </h2>
          <p className="lp-contato-texto">{contato.texto}</p>
          <ul className="lp-contato-itens">
            {contato.itens.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <form className="lp-contato-form" onSubmit={enviar} noValidate>
          <div className="lp-contato-campos">
            <CampoTexto
              campo="nome"
              valor={campos.nome}
              erro={erros.nome}
              onChange={mudar}
              autoComplete="name"
              maxLength={CONTATO_LIMITES.nome}
            />
            <CampoTexto
              campo="empresa"
              valor={campos.empresa}
              erro={erros.empresa}
              onChange={mudar}
              autoComplete="organization"
              maxLength={CONTATO_LIMITES.empresa}
            />
            <CampoTexto
              campo="whatsapp"
              valor={campos.whatsapp}
              erro={erros.whatsapp}
              onChange={mudar}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={CONTATO_LIMITES.whatsapp}
            />
            <CampoTexto
              campo="email"
              valor={campos.email}
              erro={erros.email}
              onChange={mudar}
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={CONTATO_LIMITES.email}
            />
            <div className="lp-contato-campo lp-contato-largo">
              <label htmlFor="lp-contato-segmento" className="lp-mono">{contato.campos.segmento}</label>
              <div className="lp-contato-select">
                <select
                  id="lp-contato-segmento"
                  name="segmento"
                  value={campos.segmento}
                  onChange={e => mudar('segmento', e.target.value)}
                  aria-invalid={Boolean(erros.segmento)}
                  aria-describedby={erros.segmento ? 'lp-contato-segmento-erro' : undefined}
                >
                  <option value="">{contato.segmentoVazio}</option>
                  {CONTATO_SEGMENTOS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
              </div>
              {erros.segmento && (
                <p id="lp-contato-segmento-erro" className="lp-contato-erro">{erros.segmento}</p>
              )}
            </div>
          </div>

          {/* Honeypot: fora da tela, fora do Tab e do leitor de tela. Só robô preenche. */}
          <div className="lp-contato-hp" aria-hidden="true">
            <label htmlFor="lp-contato-site">{contato.honeypot}</label>
            <input id="lp-contato-site" ref={honeypotRef} name="site" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>

          <button type="submit" className="lp-cta lp-contato-enviar" disabled={ocupado}>
            <span>{etapa === 'enviando' ? contato.enviando : contato.enviar}</span>
            <span className="lp-cta-seta" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={1.75} /></span>
          </button>
          <p className="lp-contato-status" role="status">{status}</p>

          <a href={whatsappUrl('form')} className="lp-textlink">
            <span>{contato.direto}</span>
            <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
          </a>
          <p className="lp-acesso-legal">
            {contato.legalPrefix}{' '}
            <a href={LEGAL_PATHS.privacidade} target="_blank" rel="noopener noreferrer">{contato.legalLink}</a>.
          </p>
        </form>
      </div>
    </div>
  );
}

function CampoTexto({
  campo,
  valor,
  erro,
  onChange,
  type = 'text',
  inputMode,
  autoComplete,
  maxLength,
}: {
  campo: Exclude<Campo, 'segmento'>;
  valor: string;
  erro?: string;
  onChange: (campo: Campo, valor: string) => void;
  type?: string;
  inputMode?: 'tel' | 'email';
  autoComplete: string;
  maxLength: number;
}) {
  const id = `lp-contato-${campo}`;
  return (
    <div className="lp-contato-campo">
      <label htmlFor={id} className="lp-mono">{contato.campos[campo]}</label>
      <input
        id={id}
        name={campo}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={contato.placeholders[campo]}
        value={valor}
        onChange={e => onChange(campo, e.target.value)}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
      />
      {erro && <p id={`${id}-erro`} className="lp-contato-erro">{erro}</p>}
    </div>
  );
}
