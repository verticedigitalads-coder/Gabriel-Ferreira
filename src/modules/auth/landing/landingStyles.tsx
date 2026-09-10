// CSS da landing, prefixado `lp-*` para não colidir com o design system interno.
// Renderizado como <style> normal (sem href/precedence, que fariam o React 19
// içar a tag para o <head>) — precisa continuar sendo o primeiro filho da raiz.
export function LandingStyles() {
  return (
    <style>{`
        .lp-nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);background:rgba(15,17,23,0.8);border-bottom:1px solid #262a36}
        .lp-nav-inner{max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:64px}
        .lp-container{max-width:1200px;margin:0 auto;padding:0 24px}
        .lp-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;transition:all .15s;white-space:nowrap;min-height:44px;border:none;cursor:pointer;text-decoration:none}
        .lp-btn-primary{background:#ff6a00;color:#fff}
        .lp-btn-primary:hover{background:#ff7a1a;transform:translateY(-1px);box-shadow:0 10px 30px -8px rgba(255,106,0,0.35)}
        .lp-btn-ghost{color:#b8bcc7;border:1px solid #363b4a;background:transparent}
        .lp-btn-ghost:hover{border-color:#7a7f8c;color:#f4f5f7}
        .lp-btn-lg{padding:14px 24px;font-size:15px;border-radius:10px}
        /* index.css:212 tem um "a:hover{text-decoration:underline}" global fora de
           @layer (0-1-1) que vence o .lp-btn (0-1-0) e sublinha os botoes-link. */
        .lp-btn:hover{text-decoration:none}
        html{scroll-behavior:smooth}
        /* Sem isso a ancora para atras do .lp-nav sticky (64px de altura). */
        #acesso,#features,#how{scroll-margin-top:80px}
        .lp-hero{position:relative;background:radial-gradient(60% 80% at 70% 0%,rgba(255,106,0,0.18) 0%,transparent 60%),radial-gradient(50% 60% at 10% 20%,rgba(99,102,241,0.18) 0%,transparent 60%),linear-gradient(180deg,#0f1117,#0b0d12);padding:80px 0 60px;overflow:hidden}
        .lp-hero::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(ellipse 80% 60% at 50% 30%,#000 30%,transparent 80%);pointer-events:none}
        .lp-grad{background:linear-gradient(135deg,#ff6a00 0%,#ff9a5c 60%,#ffb37c 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
        @keyframes lp-fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .lp-fade{animation:lp-fadeUp .7s ease forwards;opacity:0}
        .lp-d1{animation-delay:.08s}.lp-d2{animation-delay:.16s}.lp-d3{animation-delay:.24s}.lp-d4{animation-delay:.32s}
        .lp-feat{background:#1a1d27;border:1px solid #262a36;border-radius:14px;padding:28px;transition:all .2s}
        .lp-feat:hover{border-color:#363b4a;transform:translateY(-2px);box-shadow:0 20px 40px -20px rgba(0,0,0,0.5)}
        .lp-feat.highlight{background:linear-gradient(180deg,rgba(255,106,0,0.06) 0%,#1a1d27 60%);border-color:rgba(255,106,0,0.25)}
        .lp-step{background:#1a1d27;border:1px solid #262a36;border-radius:14px;padding:32px 28px}
        /* Secundario: o WhatsApp e o CTA primario do card. Mantem o logo do Google
           para reconhecimento, mas para de competir com o botao laranja. */
        .lp-google{width:100%;display:flex;align-items:center;justify-content:center;gap:12px;padding:14px 24px;border-radius:10px;background:transparent;color:#b8bcc7;font-weight:600;font-size:15px;transition:all .15s;min-height:48px;border:1px solid #363b4a;cursor:pointer}
        .lp-google:hover{border-color:#7a7f8c;color:#f4f5f7}
        @media(max-width:720px){.lp-mockup-body{grid-template-columns:1fr!important}.lp-mockup-side{display:none!important}.lp-stat-row{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:600px){.lp-hero{padding:60px 0 40px}.lp-cta-card{padding:32px 20px!important;margin:0 12px}}
        @media(max-width:900px){.lp-nav-links{display:none!important}}
        /* A 375px o nav tem logo + "Entrar" + botao (os links ja somem em 900px). */
        @media(max-width:480px){.lp-nav-inner{padding:0 16px}.lp-nav-cta{padding:10px 12px;font-size:13px}}
      `}</style>
  );
}
