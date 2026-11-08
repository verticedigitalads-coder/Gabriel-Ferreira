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
        #acesso,#features,#how,#clientes,#automacoes,#precos,#celular{scroll-margin-top:80px}
        /* Os glows moram no ::after (nao no background da secao) para o mask-image
           poder apagar so o brilho, sem apagar o conteudo. Sem isso o overflow:hidden
           corta o brilho em linha reta no fim do hero. A base e lisa (--bg-app) para
           nao haver degrau de cor contra a secao seguinte. */
        .lp-hero{position:relative;background:var(--bg-app);padding:80px 0 100px;overflow:hidden}
        .lp-hero::after{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(60% 80% at 70% 0%,rgba(255,106,0,0.18) 0%,transparent 60%),radial-gradient(35% 45% at 10% 20%,rgba(99,102,241,0.08) 0%,transparent 60%),radial-gradient(60% 260px at 50% calc(100% - 100px),rgba(255,106,0,0.32) 0%,transparent 72%);mask-image:linear-gradient(180deg,#000 calc(100% - 160px),transparent 100%)}
        .lp-hero>.lp-container{position:relative;z-index:1}
        .lp-hero::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(ellipse 80% 60% at 50% 30%,#000 30%,transparent 80%);pointer-events:none}
        .lp-grad{background:linear-gradient(135deg,#ff6a00 0%,#ff9a5c 60%,#ffb37c 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
        @keyframes lp-fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .lp-fade{animation:lp-fadeUp .7s ease forwards;opacity:0}
        .lp-d1{animation-delay:.08s}.lp-d2{animation-delay:.16s}.lp-d3{animation-delay:.24s}.lp-d4{animation-delay:.32s}
        .lp-feat{display:flex;flex-direction:column;background:#1a1d27;border:1px solid #262a36;border-radius:14px;padding:28px;transition:all .2s}
        .lp-feat:hover{border-color:#363b4a;transform:translateY(-2px);box-shadow:0 20px 40px -20px rgba(0,0,0,0.5)}
        /* Cards da mesma altura so quando ha 2+ colunas (2*300px + gap + padding = 668px).
           Em 1 coluna forcar a altura do maior abriria vao morto nos cards curtos. */
        @media(min-width:668px){.lp-feat-grid{grid-auto-rows:1fr}}
        .lp-feat.highlight{background:linear-gradient(180deg,rgba(255,106,0,0.06) 0%,#1a1d27 60%);border-color:rgba(255,106,0,0.25)}
        .lp-step{background:#1a1d27;border:1px solid #262a36;border-radius:14px;padding:32px 28px}
        /* CTA final: mesmo esquema do hero. O glow nasce transparente no topo da secao
           (mask) em vez de comecar na intensidade maxima contra a secao de Precos. */
        .lp-login::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(55% 60% at 50% 35%,rgba(255,106,0,0.26) 0%,transparent 70%);mask-image:linear-gradient(180deg,transparent 0%,#000 35%)}
        .lp-login>.lp-container{position:relative;z-index:1}
        /* Titulo "Quando voce" com 2 linhas de altura minima para as setas das
           automacoes alinharem entre cards da mesma linha. So a partir de 589px: abaixo
           disso o grid e de 1 coluna e o vao seria so espaco sobrando. */
        @media(min-width:589px){.lp-auto-quando{min-height:calc(1.35em*2)}}
        /* Secundario: o WhatsApp e o CTA primario do card. Mantem o logo do Google
           para reconhecimento, mas para de competir com o botao laranja. */
        .lp-google{width:100%;display:flex;align-items:center;justify-content:center;gap:12px;padding:14px 24px;border-radius:10px;background:transparent;color:#b8bcc7;font-weight:600;font-size:15px;transition:all .15s;min-height:48px;border:1px solid #363b4a;cursor:pointer}
        .lp-google:hover{border-color:#7a7f8c;color:#f4f5f7}
        /* Secao #celular. Mobile: carrossel horizontal contido (o scroll-snap roda
           dentro do proprio .lp-phones, a pagina nao rola de lado). Desktop: 3
           colunas, Operacional no centro e maior (order, o DOM segue a ordem de leitura). */
        .lp-phones{display:flex;gap:var(--space-4);overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;padding-bottom:var(--space-3);scrollbar-width:thin}
        .lp-phone{flex:0 0 min(240px,70vw);margin:0;scroll-snap-align:start}
        .lp-phone-frame{border:8px solid var(--bg-surface-3);border-radius:36px;overflow:hidden;background:var(--bg-surface);box-shadow:0 0 0 1px var(--border-strong)}
        .lp-phone-frame img{display:block;width:100%;height:auto}
        .lp-phone figcaption{margin-top:var(--space-4);text-align:center;color:var(--text-secondary);font-size:var(--text-base);line-height:1.5}
        @media(min-width:960px){.lp-phones{justify-content:center;align-items:center;gap:var(--space-8);overflow:visible;scroll-snap-type:none;padding-bottom:0}.lp-phone{flex:0 1 250px}.lp-phone-operacional{flex-basis:310px;order:2}.lp-phone-lead{order:1}.lp-phone-orcamentos{order:3}}
        @media(max-width:720px){.lp-mockup-body{grid-template-columns:1fr!important}.lp-mockup-side{display:none!important}.lp-stat-row{grid-template-columns:repeat(2,1fr)!important}.lp-br-desk{display:none}}
        @media(max-width:600px){.lp-hero{padding:60px 0 40px}.lp-cta-card{padding:32px 20px!important;margin:0 12px}}
        @media(max-width:900px){.lp-nav-links{display:none!important}}
        /* A 375px o nav tem logo + "Entrar" + botao (os links ja somem em 900px). */
        @media(max-width:480px){.lp-nav-inner{padding:0 16px}.lp-nav-cta{padding:10px 12px;font-size:13px}}
        /* Movimento reduzido: sem fade de entrada, sem reveal ao rolar, sem hover que
           desloca e sem scroll suave. !important no .lp-reveal porque o
           useScrollReveal grava opacity/transform/transition inline. */
        @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.lp-fade{animation:none;opacity:1}.lp-reveal{opacity:1!important;transform:none!important;transition:none!important}.lp-feat,.lp-btn{transition:none}.lp-feat:hover,.lp-btn-primary:hover{transform:none}}
      `}</style>
  );
}
