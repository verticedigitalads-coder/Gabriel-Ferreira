// CSS da landing, prefixado `lp-*` para não colidir com o design system interno.
// Renderizado como <style> normal (sem href/precedence, que fariam o React 19
// içar a tag para o <head>) — precisa continuar sendo o primeiro filho da raiz.
export function LandingStyles() {
  return (
    <style>{`
        /* R1 do redesign (nav, hero, faixa, dock). O index.css aplica
           font-family:var(--font-sans) em todo elemento (*), entao font-family no pai
           nao chega aos filhos: .lp-v2 redefine os tokens de fonte nos blocos novos e
           serif/mono tem classe propria. font-feature-settings:normal porque o mesmo *
           liga cv01/ss03 do Inter. Sem token para familia serif, tamanho de display e
           largura de conteiner: esses ficam literais. */
        .lp-v2{--font-sans:'Inter Tight','Inter',system-ui,sans-serif;--font-mono:'JetBrains Mono',ui-monospace,monospace;color:var(--text-primary)}
        .lp-serif{font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-weight:400;font-feature-settings:normal}
        .lp-mono{font-family:var(--font-mono);font-feature-settings:normal;font-size:var(--text-xs);font-weight:var(--font-normal);letter-spacing:.16em;line-height:1.4;text-transform:uppercase}
        .lp-wrap{max-width:1440px;margin:0 auto;padding-left:var(--space-6);padding-right:var(--space-6)}
        /* Nav sticky (nao fixed): o AccessNotice vem antes dele no AuthPage e um nav
           fixed cobriria o aviso. Na rolagem ele fica preso no topo do mesmo jeito. */
        .lp-nav{position:sticky;top:0;z-index:50;background:var(--bg-app);border-bottom:1px solid var(--border-strong)}
        .lp-nav-inner{display:flex;align-items:center;justify-content:space-between;gap:var(--space-6);height:64px}
        .lp-logo{display:inline-flex;align-items:center;gap:var(--space-2);min-height:44px;color:var(--text-primary);font-size:var(--text-lg);font-weight:var(--font-bold);letter-spacing:-.04em;text-decoration:none}
        .lp-logo-mark{display:flex;align-items:center;justify-content:center;width:26px;height:26px;background:var(--accent);color:var(--bg-app);font-size:var(--text-sm);letter-spacing:0}
        .lp-logo-suffix{color:var(--accent)}
        .lp-nav-links{display:none;align-items:center;gap:var(--space-8)}
        .lp-nav-actions{display:flex;align-items:center;gap:var(--space-5)}
        .lp-nav-link{display:inline-flex;align-items:center;min-height:44px;color:var(--text-secondary);font-size:var(--text-sm);font-weight:var(--font-medium);text-decoration:none;transition:color var(--transition-base)}
        .lp-nav-link:hover,.lp-logo:hover{color:var(--text-primary);text-decoration:none}
        @media(min-width:1024px){.lp-nav-links{display:flex}}
        /* Botao da v4.1: laranja com texto escuro (contraste ~6,6:1) e caixa de seta. */
        .lp-cta{display:inline-flex;align-items:stretch;gap:var(--space-4);min-height:44px;padding:0 var(--space-4);border:1px solid var(--accent);background:var(--accent);color:var(--bg-app);font-size:var(--text-sm);font-weight:var(--font-semibold);white-space:nowrap;text-decoration:none;transition:background-color var(--transition-slow),border-color var(--transition-slow)}
        .lp-cta>span{display:flex;align-items:center}
        .lp-cta-seta{padding-left:var(--space-3);border-left:1px solid color-mix(in srgb,currentColor 25%,transparent)}
        .lp-cta:hover{background:var(--text-primary);border-color:var(--text-primary);text-decoration:none}
        /* Botao do nav so a partir de 640px (depois do .lp-cta, que define o display). */
        .lp-nav .lp-nav-cta{display:none}
        @media(min-width:640px){.lp-nav .lp-nav-cta{display:inline-flex}}
        /* Bloco CTA grande da ds2 (hero). */
        .lp-cta-big{display:flex;align-items:center;justify-content:space-between;gap:var(--space-6);min-height:64px;padding:0 var(--space-6);background:var(--accent);color:var(--bg-app);font-family:var(--font-mono);font-feature-settings:normal;font-size:var(--text-sm);font-weight:var(--font-medium);letter-spacing:.14em;text-transform:uppercase;text-decoration:none;transition:background-color var(--transition-slow)}
        .lp-cta-big:hover{background:var(--accent-hover);text-decoration:none}
        .lp-textlink{display:inline-flex;align-items:center;gap:var(--space-2);min-height:44px;color:var(--text-primary);font-size:var(--text-sm);font-weight:var(--font-medium);text-decoration:none;transition:color var(--transition-base)}
        .lp-textlink>span{padding-bottom:2px;border-bottom:1px solid color-mix(in srgb,currentColor 35%,transparent)}
        .lp-textlink:hover{color:var(--accent);text-decoration:none}
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
        /* Hero: linhas da v4.1 no ::before e brilho laranja no canto no ::after.
           Termina reto na faixa laranja logo abaixo. Celular: uma coluna (titulo,
           subtitulo, CTA, fatos, cards). A partir de 1024px: titulo | cards e a barra
           de 3 colunas embaixo. */
        .lp-hero{position:relative;overflow:hidden;background:var(--bg-app)}
        .lp-hero::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(to right,var(--border) 1px,transparent 1px),linear-gradient(to bottom,var(--border) 1px,transparent 1px);background-size:8.3333% 100%,100% 140px}
        .lp-hero::after{content:"";position:absolute;top:0;left:0;right:0;height:520px;pointer-events:none;background:radial-gradient(80% 100% at 72% 0%,var(--accent-subtle),transparent 65%)}
        .lp-hero>.lp-wrap{position:relative;z-index:1}
        .lp-hero-grid{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"meta" "titulo" "barra" "cards";padding-top:var(--space-5);padding-bottom:var(--space-12)}
        .lp-hero-meta{grid-area:meta;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--space-2) var(--space-6);padding-bottom:var(--space-4);border-bottom:1px solid var(--border-strong);color:var(--text-secondary)}
        .lp-hero-meta-tag{display:inline-flex;align-items:center;gap:var(--space-2)}
        .lp-hero-meta-tag svg{flex-shrink:0;color:var(--accent)}
        .lp-hero-meta-local{display:none}
        @media(min-width:640px){.lp-hero-meta-local{display:inline}}
        .lp-hero-title{grid-area:titulo;margin:0;padding:var(--space-8) 0;color:var(--text-primary);font-weight:var(--font-semibold);letter-spacing:normal}
        .lp-hero-title>span{display:block}
        .lp-hero-l1{font-size:clamp(2.6rem,11vw,5rem);line-height:.9;letter-spacing:-.048em}
        .lp-hero-rule{position:relative;height:8px;margin:var(--space-5) 0 var(--space-2)}
        .lp-hero-rule::before{content:"";position:absolute;left:0;top:0;width:8px;height:8px;background:var(--accent)}
        .lp-hero-rule::after{content:"";position:absolute;left:var(--space-4);right:0;top:4px;height:1px;background:var(--border-accent)}
        /* padding-bottom em em: a cauda do "c" cedilha desce abaixo da caixa da linha
           e encostava em "pode ser o seu" nos tamanhos grandes. */
        .lp-hero-word{padding-bottom:.14em;font-size:clamp(4rem,19vw,10rem);line-height:.92;letter-spacing:-.035em;white-space:nowrap}
        .lp-hero-title>.lp-hero-l3{display:flex;align-items:center;gap:var(--space-4);margin-top:var(--space-3);font-size:clamp(1.25rem,5vw,2.2rem);font-weight:var(--font-medium);line-height:1.1;letter-spacing:-.035em}
        .lp-hero-l3::after{content:"";flex:1;height:1px;background:var(--border-accent)}
        .lp-hero-l4{margin-top:var(--space-2);font-size:clamp(2rem,9vw,4.4rem);line-height:1;letter-spacing:-.048em}
        .lp-hero-end{color:var(--accent);font-size:1.18em;letter-spacing:-.025em}
        .lp-hero-bar{grid-area:barra;display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-8);padding-top:var(--space-6);border-top:1px solid var(--border-strong)}
        .lp-hero-sub p{max-width:440px;margin:0;color:var(--text-secondary);font-size:var(--text-md);line-height:1.6}
        .lp-hero-sub .lp-textlink{margin-top:var(--space-2)}
        .lp-hero-fatos{order:3;display:grid;gap:var(--space-3);margin:0;padding:0;list-style:none}
        .lp-hero-fatos li{display:flex;align-items:center;gap:var(--space-3);padding-left:var(--space-3);border-left:1px solid var(--border-strong);font-size:var(--text-md);font-weight:var(--font-medium)}
        .lp-hero-fatos li::before{content:"";flex-shrink:0;width:6px;height:6px;background:var(--accent)}
        .lp-hero-cta{order:2;display:flex;flex-direction:column;gap:var(--space-2);max-width:440px}
        .lp-hero-cta .lp-mono{color:var(--text-secondary)}
        /* Cards ilustrativos (ds2): girados, o claro sobrepondo o escuro. O hover que
           endireita so existe com movimento liberado (bloco no-preference no fim). */
        .lp-hero-cards{grid-area:cards;display:flex;flex-direction:column;align-items:flex-end;padding:var(--space-12) var(--space-3) 0}
        .lp-card{position:relative;width:100%}
        .lp-card-leads{max-width:420px;border:1px solid var(--border-strong);background:var(--bg-surface);box-shadow:var(--shadow-modal);transform:rotate(2deg)}
        .lp-card-leads::before,.lp-card-leads::after{content:"";position:absolute;width:12px;height:12px;border:0 solid var(--border-accent);pointer-events:none}
        .lp-card-leads::before{top:-12px;left:-12px;border-width:1px 0 0 1px}
        .lp-card-leads::after{right:-12px;bottom:-12px;border-width:0 1px 1px 0}
        .lp-card-head{display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--border-strong)}
        .lp-card-tag{padding:2px var(--space-2);border:1px solid var(--border-accent);color:var(--accent)}
        .lp-lead{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4)}
        .lp-lead+.lp-lead{border-top:1px solid var(--border)}
        .lp-lead-ini{display:flex;flex-shrink:0;align-items:center;justify-content:center;width:28px;height:28px;border:1px solid var(--border-strong);color:var(--text-secondary)}
        .lp-lead-txt{flex:1;min-width:0}
        .lp-lead-nome{display:block;font-size:var(--text-sm);font-weight:var(--font-semibold)}
        .lp-lead-serv{display:block;overflow:hidden;color:var(--text-secondary);font-size:var(--text-xs);white-space:nowrap;text-overflow:ellipsis}
        .lp-badge{flex-shrink:0;padding:2px var(--space-2);border:1px solid color-mix(in srgb,currentColor 25%,transparent);border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:var(--font-semibold)}
        .lp-badge-critico{background:var(--danger-subtle);color:var(--danger)}
        .lp-badge-alto{background:var(--warning-subtle);color:var(--warning)}
        .lp-badge-medio{background:var(--info-subtle);color:var(--info)}
        /* Card claro: sem token de superficie clara, o fundo usa --text-primary. */
        .lp-card-orc{max-width:min(260px,82%);margin-top:var(--space-1);margin-right:auto;padding:var(--space-4);background:var(--text-primary);color:var(--bg-app);box-shadow:var(--shadow-modal);transform:rotate(-3deg)}
        .lp-card-orc .lp-mono{color:color-mix(in srgb,var(--bg-app) 65%,transparent)}
        .lp-orc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-2)}
        .lp-orc-titulo{display:block;font-size:var(--text-md);font-weight:var(--font-bold);letter-spacing:-.02em}
        .lp-card-orc .lp-orc-tag{padding:2px var(--space-2);border:1px solid var(--accent);color:var(--bg-app)}
        .lp-orc-cliente{display:block;margin-top:var(--space-2)}
        .lp-orc-itens{margin:var(--space-3) 0 0;padding:var(--space-2) 0 0;border-top:1px solid color-mix(in srgb,var(--bg-app) 15%,transparent);list-style:none}
        .lp-orc-itens li{display:flex;justify-content:space-between;gap:var(--space-3);padding:2px 0;font-size:var(--text-xs)}
        .lp-orc-total{display:flex;align-items:baseline;justify-content:space-between;margin-top:var(--space-2);padding-top:var(--space-2);border-top:1px solid color-mix(in srgb,var(--bg-app) 15%,transparent)}
        .lp-orc-total strong{font-size:var(--text-lg);font-weight:var(--font-bold)}
        .lp-orc-pix{display:flex;align-items:center;gap:var(--space-2);margin-top:var(--space-3);padding:var(--space-1) var(--space-2);background:var(--bg-app);color:var(--text-primary);font-size:var(--text-xs);font-weight:var(--font-medium)}
        .lp-orc-pix svg{flex-shrink:0;color:var(--accent)}
        @media(min-width:1024px){
          .lp-hero-grid{grid-template-columns:minmax(0,1fr) 34%;grid-template-areas:"meta meta" "titulo cards" "barra barra";column-gap:var(--space-8);padding-bottom:var(--space-10)}
          .lp-hero-title{padding:var(--space-10) 0 var(--space-12)}
          .lp-hero-l1{font-size:min(6.2vw,6.4rem)}
          .lp-hero-word{font-size:min(15vw,13rem)}
          .lp-hero-title>.lp-hero-l3{font-size:min(2.6vw,2.6rem)}
          .lp-hero-l4{font-size:min(4.8vw,5rem)}
          .lp-hero-cards{align-self:center;padding:0}
          .lp-card-orc{margin-left:calc(var(--space-8) * -1)}
          .lp-hero-bar{grid-template-columns:5fr 3fr 4fr;align-items:end}
          .lp-hero-fatos,.lp-hero-cta{order:0}
          .lp-hero-cta{justify-self:end;width:100%}
        }
        /* Faixa laranja: 2 grupos iguais e translateX(-50%) fecham o loop sem salto. */
        .lp-faixa{overflow:hidden;border-block:1px solid var(--bg-app);background:var(--accent);color:var(--bg-app)}
        .lp-faixa-track{display:flex;width:max-content;animation:lp-marquee 60s linear infinite}
        .lp-faixa:hover .lp-faixa-track{animation-play-state:paused}
        .lp-faixa-grupo{display:flex;flex-shrink:0;align-items:center}
        .lp-faixa-item{display:flex;flex-shrink:0;align-items:center;gap:var(--space-6);padding:var(--space-3) var(--space-5);white-space:nowrap}
        @keyframes lp-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        /* Dock do celular: aparece depois do hero e some com o #acesso ou o rodape na
           tela (LandingDock.tsx). Escondida, visibility:hidden tira o botao do foco. */
        .lp-dock{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) var(--space-4);border-top:1px solid var(--border-accent);background:var(--bg-app);transform:translateY(100%);visibility:hidden;transition:transform .4s ease,visibility 0s linear .4s}
        .lp-dock.is-on{transform:none;visibility:visible;transition:transform .4s ease}
        .lp-dock-info{display:flex;flex:1;flex-direction:column;min-width:0}
        .lp-dock-info .lp-mono{color:var(--accent)}
        .lp-dock-num{font-size:var(--text-sm);font-weight:var(--font-medium);white-space:nowrap}
        .lp-dock-cta{flex-shrink:0;min-height:48px}
        @media(max-width:360px){.lp-dock-num{display:none}}
        @media(min-width:1024px){.lp-dock{display:none}}
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
        @media(max-width:600px){.lp-cta-card{padding:32px 20px!important;margin:0 12px}}
        /* Gutter de 16px no celular nos blocos novos. */
        @media(max-width:480px){.lp-wrap{padding-left:var(--space-4);padding-right:var(--space-4)}}
        /* Movimento reduzido: sem fade de entrada, sem reveal ao rolar, sem hover que
           desloca e sem scroll suave. !important no .lp-reveal porque o
           useScrollReveal grava opacity/transform/transition inline. */
        @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.lp-fade{animation:none;opacity:1}.lp-reveal{opacity:1!important;transform:none!important;transition:none!important}.lp-feat,.lp-btn{transition:none}.lp-feat:hover,.lp-btn-primary:hover{transform:none}.lp-faixa-track{animation:none}.lp-dock,.lp-dock.is-on,.lp-cta,.lp-cta-big,.lp-nav-link,.lp-textlink{transition:none}}
        /* Cards do hero endireitam no hover so com movimento liberado. */
        @media(prefers-reduced-motion:no-preference){.lp-card{transition:transform .7s cubic-bezier(.16,1,.3,1)}.lp-card:hover{transform:none}}
      `}</style>
  );
}
