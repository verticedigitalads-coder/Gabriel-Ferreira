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
        #acesso,#produto,#features,#how,#clientes,#automacoes,#precos,#celular,#segmentos,#duvidas{scroll-margin-top:80px}
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
        /* R2 do redesign (problema, interludio, depoimentos, tres frentes). */
        /* Rotulo mono com quadrado laranja no topo das secoes da R2. */
        .lp-eyebrow{display:inline-flex;align-items:center;gap:var(--space-3);color:var(--text-secondary)}
        .lp-eyebrow::before{content:"";flex-shrink:0;width:8px;height:8px;background:var(--accent)}
        /* Superficie clara (secao do problema e card 02 das tres frentes). Nao ha token
           de superficie clara: fundo --text-primary e tinta --bg-app, como o card de
           orcamento do hero. As variaveis locais so apelidam misturas desses tokens:
           tinta secundaria (~5,7:1), linhas e o laranja para TEXTO (--accent com
           --bg-app, ~4,6:1; o --accent puro daria 2,6:1 neste fundo). Fica depois do
           .lp-v2 para vencer o color dele. */
        .lp-claro{--lp-tinta-2:color-mix(in srgb,var(--bg-app) 65%,transparent);--lp-linha:color-mix(in srgb,var(--bg-app) 15%,transparent);--lp-laranja-texto:color-mix(in srgb,var(--accent) 70%,var(--bg-app));background-color:var(--text-primary);color:var(--bg-app)}
        .lp-claro .lp-eyebrow{color:var(--lp-tinta-2)}
        /* Secao 4: grade de linhas escuras no fundo, titulo e comparativo empilhados.
           Sem .lp-cta nem .lp-textlink aqui: o hover deles usa --text-primary e sumiria. */
        .lp-prob{padding-block:calc(var(--space-8) * 2);background-image:linear-gradient(to right,color-mix(in srgb,var(--bg-app) 6%,transparent) 1px,transparent 1px),linear-gradient(to bottom,color-mix(in srgb,var(--bg-app) 4%,transparent) 1px,transparent 1px);background-size:12.5% 100%,100% 120px}
        .lp-prob-titulo{max-width:18ch;margin:var(--space-8) 0 0;color:inherit;font-size:clamp(2.2rem,5.6vw,5rem);font-weight:var(--font-semibold);line-height:.95;letter-spacing:-.048em}
        .lp-prob-destaque{color:var(--lp-laranja-texto);letter-spacing:-.025em}
        .lp-prob-l2{display:block}
        .lp-prob-apagado{color:color-mix(in srgb,var(--bg-app) 55%,transparent)}
        .lp-prob-comp{display:grid;grid-template-columns:minmax(0,1fr);margin-top:var(--space-12);border:1px solid var(--lp-linha)}
        .lp-prob-col{padding:var(--space-6)}
        .lp-prob-antes{border-bottom:1px solid var(--lp-linha)}
        .lp-prob-rotulo{display:inline-block;padding:var(--space-1) 0;color:var(--lp-tinta-2)}
        .lp-prob-selo{padding:var(--space-1) var(--space-2);background:var(--accent);color:var(--bg-app)}
        .lp-prob-lista{margin:var(--space-4) 0 0;padding:0;list-style:none}
        .lp-prob-lista li{display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-3) 0;border-bottom:1px solid var(--lp-linha);font-size:var(--text-md);line-height:1.4}
        .lp-prob-lista li:last-child{border-bottom:0}
        .lp-prob-antes li{color:var(--lp-tinta-2);text-decoration:line-through;text-decoration-color:color-mix(in srgb,var(--bg-app) 30%,transparent)}
        .lp-prob-com{background:var(--bg-surface);color:var(--text-primary)}
        .lp-prob-com li{border-bottom-color:var(--border-strong)}
        .lp-prob-com li svg{flex-shrink:0;margin-top:3px;color:var(--accent)}
        @media(min-width:640px){.lp-prob-comp{grid-template-columns:repeat(2,minmax(0,1fr))}.lp-prob-antes{border-bottom:0;border-right:1px solid var(--lp-linha)}}
        @media(min-width:1024px){.lp-prob{padding-block:calc(var(--space-12) * 2)}.lp-prob-col{padding:var(--space-8)}.lp-prob-lista li{font-size:var(--text-lg)}}
        /* Secao 5: foto decorativa (alt="") sob veus de --bg-app. Celular: veu forte por
           igual, porque o titulo ocupa a largura toda. A partir de 768px: escuro a
           esquerda (atras do titulo) e leve a direita, onde estao as faiscas. Em cima e
           embaixo o veu fecha em --bg-app para emendar nas secoes vizinhas. */
        .lp-inter{position:relative;overflow:hidden;background:var(--bg-app)}
        .lp-inter-foto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:72% 50%}
        .lp-inter::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(to top,var(--bg-app),transparent 45%),linear-gradient(to bottom,var(--bg-app),transparent 30%),color-mix(in srgb,var(--bg-app) 55%,transparent)}
        .lp-inter-linha{position:absolute;top:28%;left:0;right:0;z-index:1;height:1px;background:var(--border-accent);pointer-events:none}
        .lp-inter-linha::before{content:"";position:absolute;top:-3px;left:8%;width:7px;height:7px;background:var(--accent)}
        .lp-inter-conteudo{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:flex-end;gap:var(--space-10);min-height:560px;padding-top:calc(var(--space-12) * 2);padding-bottom:calc(var(--space-8) * 2)}
        .lp-inter-titulo{margin:0;color:var(--text-primary);font-size:clamp(3.2rem,7.6vw,7.6rem);line-height:.92;letter-spacing:-.02em}
        .lp-inter-titulo>span{display:block}
        .lp-inter-destaque{position:relative;display:inline-block;color:var(--accent)}
        .lp-inter-destaque svg{position:absolute;left:0;bottom:-.04em;width:100%;height:.12em;overflow:visible}
        .lp-inter-cta{display:flex;flex-direction:column;gap:var(--space-2);max-width:440px}
        .lp-inter-cta .lp-mono{color:var(--text-secondary)}
        @media(min-width:768px){.lp-inter::after{background:linear-gradient(to top,var(--bg-app),transparent 40%),linear-gradient(to bottom,var(--bg-app),transparent 25%),linear-gradient(to right,var(--bg-app) 10%,color-mix(in srgb,var(--bg-app) 70%,transparent) 45%,color-mix(in srgb,var(--bg-app) 10%,transparent))}.lp-inter-conteudo{min-height:640px}}
        /* Secao 6: as frases reais, literais, em serif grande. A legenda alinha no pe
           das duas colunas porque o blockquote estica (flex:1). */
        .lp-dep{padding-block:calc(var(--space-8) * 2);background:var(--bg-app)}
        .lp-dep-titulo{margin:var(--space-4) 0 0;color:var(--text-primary);font-size:clamp(1.75rem,3.4vw,3rem);font-weight:var(--font-semibold);line-height:1.05;letter-spacing:-.04em}
        .lp-dep-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-12);margin-top:var(--space-12)}
        .lp-dep-item{display:flex;flex-direction:column;margin:0}
        .lp-dep-item>svg{color:var(--accent)}
        .lp-dep-frase{flex:1;margin:var(--space-5) 0 0;color:var(--text-primary);font-size:clamp(1.5rem,2.5vw,2.25rem);line-height:1.12;letter-spacing:-.01em}
        .lp-dep-legenda{margin-top:var(--space-6);padding-top:var(--space-4);border-top:1px solid var(--border-strong)}
        .lp-dep-autor{display:block;font-size:var(--text-md);font-weight:var(--font-semibold)}
        .lp-dep-empresa{color:var(--text-secondary);font-weight:var(--font-normal)}
        .lp-dep-legenda .lp-mono{display:block;margin-top:var(--space-1);color:var(--text-secondary)}
        /* "cliente desde X" inteiro: a linha quebra antes do trecho, nunca no meio.
           font-family/feature inherit porque o * do index.css trocaria a mono pela sans. */
        .lp-dep-desde{font-family:inherit;font-feature-settings:inherit;white-space:nowrap}
        @media(min-width:1024px){.lp-dep{padding-block:calc(var(--space-12) * 2)}.lp-dep-grid{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:calc(var(--space-12) * 2)}}
        /* Secao 8 (id="features"): cabecalho e 3 cards, o do meio claro. Os cards nao
           sao links: sem seta nem hover. */
        .lp-frentes{padding-block:calc(var(--space-8) * 2);border-top:1px solid var(--border-strong);background:var(--bg-app)}
        .lp-frentes-head{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-5)}
        .lp-frentes-titulo{max-width:20ch;margin:var(--space-4) 0 0;color:var(--text-primary);font-size:clamp(2rem,4.6vw,4.2rem);font-weight:var(--font-semibold);line-height:.98;letter-spacing:-.045em}
        .lp-frentes-titulo .lp-serif,.lp-frente-titulo .lp-serif{color:var(--accent);letter-spacing:-.02em}
        .lp-frentes-sub{max-width:440px;margin:0;color:var(--text-secondary);font-size:var(--text-md);line-height:1.6}
        .lp-frentes-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-5);margin-top:var(--space-12)}
        .lp-frente{display:flex;flex-direction:column;padding:var(--space-6);border:1px solid var(--border-strong);background-color:var(--bg-surface)}
        .lp-frente-topo{display:flex;align-items:center;gap:var(--space-3);padding-bottom:var(--space-3);border-bottom:1px solid var(--border-strong)}
        .lp-frente-n{color:var(--accent)}
        .lp-frente-filete{width:1px;height:12px;background:var(--border-strong)}
        .lp-frente-label{color:var(--text-secondary)}
        .lp-frente-titulo{margin:var(--space-8) 0 0;color:inherit;font-size:clamp(1.6rem,2.4vw,2.2rem);font-weight:var(--font-medium);line-height:1.02;letter-spacing:-.04em}
        .lp-frente-desc{margin:var(--space-4) 0 0;color:var(--text-secondary);font-size:var(--text-base);line-height:1.6}
        .lp-frente-chips{display:flex;flex-wrap:wrap;align-items:center;gap:var(--space-2);margin:auto 0 0;padding:var(--space-8) 0 0;list-style:none}
        .lp-frente-chips li{display:flex;align-items:center;gap:var(--space-2)}
        .lp-frente-chips svg{flex-shrink:0;color:var(--text-tertiary)}
        .lp-chip{padding:var(--space-1) var(--space-2);border:1px solid var(--border-strong);color:var(--text-secondary)}
        .lp-frente.lp-claro{border-color:var(--lp-linha);background-color:var(--text-primary)}
        .lp-claro .lp-frente-topo{border-bottom-color:var(--lp-linha)}
        .lp-claro .lp-frente-filete{background:var(--lp-linha)}
        .lp-claro .lp-frente-n,.lp-claro .lp-frente-titulo .lp-serif{color:var(--lp-laranja-texto)}
        .lp-claro .lp-frente-label,.lp-claro .lp-frente-desc,.lp-claro .lp-chip{color:var(--lp-tinta-2)}
        .lp-claro .lp-chip{border-color:var(--lp-linha)}
        @media(min-width:1024px){.lp-frentes{padding-block:calc(var(--space-12) * 2)}.lp-frentes-head{grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:end}.lp-frentes-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.lp-frente{padding:var(--space-8)}}
        /* R3 do redesign (produto em abas, automacoes, celular). Mesmo ritmo das
           secoes da R2: filete no topo, titulo grande com destaque serif laranja. */
        .lp-prod,.lp-auto,.lp-cel,.lp-seg,.lp-preco{padding-block:calc(var(--space-8) * 2);border-top:1px solid var(--border-strong);background:var(--bg-app)}
        .lp-prod-titulo,.lp-auto-titulo,.lp-cel-titulo,.lp-seg-titulo,.lp-preco-titulo,.lp-faq-titulo{max-width:18ch;margin:var(--space-4) 0 0;color:var(--text-primary);font-size:clamp(2rem,4.6vw,4.2rem);font-weight:var(--font-semibold);line-height:.98;letter-spacing:-.045em}
        .lp-prod-titulo .lp-serif,.lp-auto-titulo .lp-serif,.lp-cel-titulo .lp-serif,.lp-seg-titulo .lp-serif,.lp-preco-titulo .lp-serif,.lp-faq-titulo .lp-serif{color:var(--accent);letter-spacing:-.02em}
        @media(min-width:1024px){.lp-prod,.lp-auto,.lp-cel,.lp-seg,.lp-preco{padding-block:calc(var(--space-12) * 2)}}
        /* Secao 7 (id="produto"): abas da ds2 e moldura de navegador. Celular: abas em
           grade 2x2; a partir de 640px, uma fileira apoiada no filete de baixo. Ativa:
           laranja com texto escuro (~6,6:1, como o .lp-cta). O numero da aba tem
           font-family inherit porque o * do index.css trocaria a mono pela sans. */
        .lp-prod-abas{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-2);margin-top:var(--space-10)}
        .lp-prod-aba{display:flex;align-items:center;gap:var(--space-2);min-height:44px;padding:0 var(--space-3);border:1px solid var(--border-strong);background:transparent;color:var(--text-secondary);letter-spacing:.12em;text-align:left;cursor:pointer;transition:color var(--transition-base),border-color var(--transition-base),background-color var(--transition-base)}
        .lp-prod-aba:hover{border-color:var(--text-tertiary);color:var(--text-primary)}
        .lp-prod-aba-n{font-family:inherit;font-feature-settings:inherit;color:var(--accent)}
        .lp-prod-aba[aria-selected="true"]{border-color:var(--accent);background:var(--accent);color:var(--bg-app)}
        .lp-prod-aba[aria-selected="true"] .lp-prod-aba-n{color:inherit}
        .lp-prod-painel[hidden]{display:none}
        .lp-prod-frase{max-width:60ch;margin:var(--space-6) 0 0;color:var(--text-primary);font-size:var(--text-md);line-height:1.6}
        /* Moldura: barra com 3 bolinhas, endereco e a nota de dados de demonstracao
           (quebra para a linha de baixo no celular). Cantos em L como o card do hero. */
        .lp-prod-moldura{position:relative;margin-top:var(--space-5);border:1px solid var(--border-strong);background:var(--bg-surface);box-shadow:var(--shadow-modal)}
        .lp-prod-moldura::before,.lp-prod-moldura::after{content:"";position:absolute;width:12px;height:12px;border:0 solid var(--accent);pointer-events:none}
        .lp-prod-moldura::before{top:calc(var(--space-2) * -1);left:calc(var(--space-2) * -1);border-width:1px 0 0 1px}
        .lp-prod-moldura::after{right:calc(var(--space-2) * -1);bottom:calc(var(--space-2) * -1);border-width:0 1px 1px 0}
        .lp-prod-barra{display:flex;flex-wrap:wrap;align-items:center;gap:var(--space-2) var(--space-4);padding:var(--space-2) var(--space-4);border-bottom:1px solid var(--border-strong);background:var(--bg-sidebar)}
        .lp-prod-bolinhas{display:flex;gap:var(--space-1)}
        .lp-prod-bolinhas span{width:8px;height:8px;border-radius:var(--radius-full);background:var(--border-strong)}
        .lp-prod-bolinhas span:last-child{background:var(--accent)}
        .lp-prod-url{padding:2px var(--space-2);border:1px solid var(--border-strong);background:var(--bg-app);color:var(--text-secondary);letter-spacing:.04em;text-transform:none}
        .lp-prod-nota{margin-left:auto;color:var(--text-secondary)}
        .lp-prod-moldura img{display:block;width:100%;height:auto}
        @media(min-width:640px){.lp-prod-abas{display:flex;flex-wrap:wrap;border-bottom:1px solid var(--border-strong)}.lp-prod-aba{margin-bottom:-1px;padding:0 var(--space-5);border-bottom-color:transparent}.lp-prod-frase{font-size:var(--text-lg)}}
        /* Secao 9 (id="automacoes"): stepper estatico. Os 4 sao gatilhos independentes:
           numero no trilho vertical, sem barra de progresso. Cabecalho sticky a partir
           de 1024px (64px = altura do .lp-nav). */
        .lp-auto{background:var(--bg-sidebar)}
        .lp-auto-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-10)}
        .lp-auto-sub{max-width:440px;margin:var(--space-5) 0 0;color:var(--text-secondary);font-size:var(--text-md);line-height:1.6}
        .lp-auto-trilho{margin:0;padding:0;list-style:none}
        .lp-auto-item{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--space-5);padding-bottom:var(--space-10)}
        .lp-auto-item:last-child{padding-bottom:0}
        .lp-auto-item::before{content:"";position:absolute;top:var(--space-10);bottom:0;left:calc(var(--space-10) / 2);width:1px;background:var(--border-strong)}
        .lp-auto-item:last-child::before{display:none}
        .lp-auto-n{display:flex;align-items:center;justify-content:center;width:var(--space-10);height:var(--space-10);border:1px solid var(--border-accent);background:var(--bg-app);color:var(--accent);letter-spacing:.08em}
        .lp-auto-corpo{padding-top:var(--space-2)}
        .lp-auto-rotulo{display:block;color:var(--text-secondary)}
        .lp-auto-gatilho{margin:var(--space-2) 0 0;color:var(--text-primary);font-size:clamp(1.4rem,2.2vw,2rem);font-weight:var(--font-medium);line-height:1.1;letter-spacing:-.035em}
        .lp-auto-rotulo-vrtx{margin-top:var(--space-5);color:var(--accent)}
        .lp-auto-acao{max-width:52ch;margin:var(--space-2) 0 0;color:var(--text-secondary);font-size:var(--text-base);line-height:1.6}
        @media(min-width:1024px){.lp-auto-grid{grid-template-columns:minmax(0,5fr) minmax(0,7fr);column-gap:calc(var(--space-12) * 2);align-items:start}.lp-auto-head{position:sticky;top:calc(64px + var(--space-8))}}
        /* Secao 10 (id="celular"): cabecalho da R2 e nota PWA em mono. A moldura do
           aparelho e o carrossel ficam no bloco .lp-phones mais abaixo. */
        .lp-cel-titulo{margin-bottom:var(--space-12)}
        .lp-cel-pwa{display:flex;align-items:center;gap:var(--space-3);margin:var(--space-8) 0 0;color:var(--text-secondary)}
        .lp-cel-pwa::before{content:"";flex-shrink:0;width:6px;height:6px;background:var(--accent)}
        /* R4 do redesign (segmentos, preco, duvidas, fechamento + login, rodape).
           Segmentos e preco entram no ritmo da R3 (filete no topo, titulo com destaque
           serif) pelos seletores compartilhados acima. Duvidas e rodape sao claros
           (.lp-claro, da R2): la o titulo herda a tinta e o destaque usa o laranja de
           texto (--accent puro daria 2,6:1 no fundo claro). */
        .lp-faq,.lp-fecho{padding-block:calc(var(--space-8) * 2)}
        @media(min-width:1024px){.lp-faq,.lp-fecho{padding-block:calc(var(--space-12) * 2)}}
        .lp-claro .lp-faq-titulo{color:inherit}
        .lp-claro .lp-faq-titulo .lp-serif{color:var(--lp-laranja-texto)}
        /* Secao 11 (id="segmentos"): lista grande da ds2. Celular: lista estatica, sem
           foto e sem estado. A partir de 1024px: lista | painel sticky (64px = altura do
           .lp-nav) e a linha sob o mouse em laranja com texto escuro (~6,6:1, como o
           .lp-cta). Painel: foto do segmento ou, sem foto, so o nome sobre a grade de
           linhas; veu de --bg-app embaixo da legenda e cantos em L laranja. */
        .lp-seg-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-10);margin-top:var(--space-10)}
        .lp-seg-lista{margin:0;padding:0;list-style:none;border-top:1px solid var(--border-strong)}
        .lp-seg-item{display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--space-4);padding:var(--space-6) 0;border-bottom:1px solid var(--border-strong)}
        .lp-seg-n{padding-top:var(--space-2);color:var(--accent)}
        .lp-seg-nome{margin:0;color:inherit;font-size:clamp(1.75rem,4vw,3.2rem);font-weight:var(--font-medium);line-height:1;letter-spacing:-.045em}
        .lp-seg-frase{max-width:46ch;margin:var(--space-3) 0 0;color:var(--text-secondary);font-size:var(--text-base);line-height:1.6}
        .lp-seg-nota{margin:var(--space-6) 0 0;color:var(--text-secondary)}
        .lp-seg-painel{display:none}
        @media(min-width:1024px){
          .lp-seg-grid{grid-template-columns:minmax(0,7fr) minmax(0,5fr);column-gap:var(--space-10);align-items:start}
          .lp-seg-item{padding:var(--space-6) var(--space-5);transition:background-color var(--transition-base),color var(--transition-base)}
          .lp-seg-item.is-ativo{background:var(--accent);color:var(--bg-app)}
          .lp-seg-item.is-ativo .lp-seg-n,.lp-seg-item.is-ativo .lp-seg-frase{color:inherit}
          .lp-seg-painel{position:sticky;top:calc(64px + var(--space-8));display:block;overflow:hidden;aspect-ratio:1/1;border:1px solid var(--border-strong);background-color:var(--bg-surface);background-image:linear-gradient(to right,var(--border) 1px,transparent 1px),linear-gradient(to bottom,var(--border) 1px,transparent 1px);background-size:12.5% 100%,100% 80px}
          .lp-seg-painel::before,.lp-seg-painel::after{content:"";position:absolute;z-index:2;width:16px;height:16px;border:0 solid var(--accent);pointer-events:none}
          .lp-seg-painel::before{top:var(--space-3);left:var(--space-3);border-width:1px 0 0 1px}
          .lp-seg-painel::after{right:var(--space-3);bottom:var(--space-3);border-width:0 1px 1px 0}
          .lp-seg-foto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s ease}
          .lp-seg-foto.is-ativo{opacity:1}
          .lp-seg-legenda{position:absolute;left:0;right:0;bottom:0;z-index:1;display:flex;align-items:baseline;gap:var(--space-3);padding:var(--space-12) var(--space-6) var(--space-6);background:linear-gradient(to top,var(--bg-app),transparent)}
          .lp-seg-legenda .lp-mono{color:var(--accent)}
          .lp-seg-legenda-nome{color:var(--text-primary);font-size:var(--text-2xl);font-weight:var(--font-medium);line-height:1;letter-spacing:-.03em}
        }
        /* Secao 12 (id="precos"): um card so, como o Offer da v4.1, com filete laranja
           no topo. Preco | lista a partir de 640px; cabecalho | card (5/7) a partir de
           1024px. A base do card e um div: a LandingDock usa o primeiro <footer>. */
        .lp-preco-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-10)}
        .lp-preco-card{position:relative;border:1px solid var(--border-strong);background:var(--bg-surface)}
        .lp-preco-card::before{content:"";position:absolute;top:-1px;left:-1px;width:96px;height:3px;background:var(--accent)}
        .lp-preco-corpo{display:grid;grid-template-columns:minmax(0,1fr)}
        .lp-preco-valor{display:flex;flex-wrap:wrap;align-items:baseline;align-content:flex-start;gap:var(--space-2);padding:var(--space-6);border-bottom:1px solid var(--border-strong)}
        .lp-preco-moeda{color:var(--text-secondary);font-size:var(--text-lg)}
        .lp-preco-num{color:var(--text-primary);font-size:clamp(3.5rem,7vw,5.5rem);font-weight:var(--font-medium);line-height:.85;letter-spacing:-.06em}
        .lp-preco-periodo{color:var(--text-secondary);font-size:var(--text-sm)}
        .lp-preco-inclui{padding:var(--space-6)}
        .lp-preco-rotulo{margin:0;color:var(--text-secondary)}
        .lp-preco-lista{margin:var(--space-4) 0 0;padding:0;list-style:none}
        .lp-preco-lista li{display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-2) 0;border-bottom:1px solid var(--border);color:var(--text-primary);font-size:var(--text-base);line-height:1.45}
        .lp-preco-lista li:last-child{border-bottom:0}
        .lp-preco-lista svg{flex-shrink:0;margin-top:3px;color:var(--accent)}
        .lp-preco-base{display:flex;flex-direction:column;gap:var(--space-5);padding:var(--space-6);border-top:1px solid var(--border-strong)}
        .lp-preco-cta{justify-content:space-between}
        .lp-preco-selos{display:flex;flex-direction:column;gap:var(--space-2);margin:0;padding:0;list-style:none}
        .lp-preco-selos li{display:flex;align-items:center;gap:var(--space-2);color:var(--text-secondary)}
        .lp-preco-selos svg{flex-shrink:0;color:var(--accent)}
        @media(min-width:640px){.lp-preco-corpo{grid-template-columns:minmax(0,2fr) minmax(0,3fr)}.lp-preco-valor{border-bottom:0;border-right:1px solid var(--border-strong)}.lp-preco-base{flex-direction:row;align-items:center}.lp-preco-cta{flex:1}}
        @media(min-width:1024px){.lp-preco-grid{grid-template-columns:minmax(0,5fr) minmax(0,7fr);column-gap:calc(var(--space-12) * 2);align-items:start}}
        /* Secao 13 (id="duvidas"): FAQ da v4.1, clara. <details> nativo: o marcador do
           navegador some e o + gira 45 graus quando aberto. Cabecalho sticky a partir de
           1024px, como nas automacoes. O foco do summary e o *:focus-visible do
           index.css (azul, ~3,5:1 no fundo claro). */
        .lp-faq-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-10)}
        .lp-faq-cta{display:flex;flex-direction:column;align-items:flex-start;gap:var(--space-1);margin-top:var(--space-8);padding-top:var(--space-5);border-top:1px solid var(--lp-linha)}
        .lp-faq-cta .lp-mono{color:var(--lp-tinta-2)}
        .lp-faq-link{display:inline-flex;align-items:center;gap:var(--space-2);min-height:44px;color:inherit;font-size:var(--text-md);font-weight:var(--font-medium);text-decoration:none;transition:color var(--transition-base)}
        .lp-faq-link>span{padding-bottom:2px;border-bottom:1px solid var(--lp-linha)}
        .lp-faq-link:hover{color:var(--lp-laranja-texto);text-decoration:none}
        .lp-faq-lista{border-top:1px solid var(--lp-linha)}
        .lp-faq-item{border-bottom:1px solid var(--lp-linha)}
        .lp-faq-item summary{display:flex;align-items:flex-start;gap:var(--space-4);min-height:44px;padding:var(--space-5) 0;list-style:none;cursor:pointer}
        .lp-faq-item summary::-webkit-details-marker{display:none}
        .lp-faq-n{flex-shrink:0;padding-top:var(--space-1);color:var(--lp-tinta-2)}
        .lp-faq-pergunta{flex:1;font-size:var(--text-md);font-weight:var(--font-medium);line-height:1.3;letter-spacing:-.02em}
        .lp-faq-mais{display:flex;flex-shrink:0;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--lp-linha);transition:transform var(--transition-slow),background-color var(--transition-slow),border-color var(--transition-slow)}
        .lp-faq-item summary:hover .lp-faq-mais{border-color:var(--lp-laranja-texto);color:var(--lp-laranja-texto)}
        .lp-faq-item[open] .lp-faq-n{color:var(--lp-laranja-texto)}
        .lp-faq-item[open] .lp-faq-mais{transform:rotate(45deg);border-color:var(--accent);background:var(--accent);color:var(--bg-app)}
        .lp-faq-resposta{max-width:62ch;margin:0;padding:0 var(--space-8) var(--space-5) var(--space-10);color:var(--lp-tinta-2);font-size:var(--text-base);line-height:1.6}
        @media(min-width:640px){.lp-faq-pergunta{font-size:var(--text-lg)}}
        @media(min-width:1024px){.lp-faq-grid{grid-template-columns:minmax(0,4fr) minmax(0,8fr);column-gap:calc(var(--space-12) * 2);align-items:start}.lp-faq-head{position:sticky;top:calc(64px + var(--space-8))}}
        /* Secao 14 (id="login"): Closing da v4.1. Filete laranja no topo e brilho
           --accent-subtle no canto, como o hero. Titulo e CTA | card #acesso (7/5) a
           partir de 1024px; no celular empilha, com o card embaixo. O botao do Google
           e claro (o CTA do WhatsApp esta ao lado) e os cantos em L sao os do hero. */
        .lp-fecho{position:relative;overflow:hidden;border-top:1px solid var(--accent);background:var(--bg-app)}
        .lp-fecho::after{content:"";position:absolute;top:0;left:0;right:0;height:520px;pointer-events:none;background:radial-gradient(70% 100% at 20% 0%,var(--accent-subtle),transparent 65%)}
        .lp-fecho>.lp-wrap{position:relative;z-index:1}
        .lp-fecho-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-12)}
        .lp-fecho-titulo{max-width:16ch;margin:0 0 var(--space-10);color:var(--text-primary);font-size:clamp(2.5rem,5.6vw,5.4rem);font-weight:var(--font-medium);line-height:.92;letter-spacing:-.05em}
        .lp-fecho-titulo .lp-serif{color:var(--accent);letter-spacing:-.02em}
        .lp-acesso{position:relative;padding:var(--space-8) var(--space-6);border:1px solid var(--border-strong);background:var(--bg-surface);box-shadow:var(--shadow-modal)}
        .lp-acesso::before,.lp-acesso::after{content:"";position:absolute;width:12px;height:12px;border:0 solid var(--border-accent);pointer-events:none}
        .lp-acesso::before{top:-12px;left:-12px;border-width:1px 0 0 1px}
        .lp-acesso::after{right:-12px;bottom:-12px;border-width:0 1px 1px 0}
        .lp-acesso-titulo{margin:0;color:var(--text-primary);font-size:var(--text-2xl);font-weight:var(--font-semibold);letter-spacing:-.03em}
        .lp-acesso-texto{margin:var(--space-2) 0 var(--space-6);color:var(--text-secondary);font-size:var(--text-base);line-height:1.5}
        .lp-acesso-google{display:flex;align-items:center;justify-content:center;gap:var(--space-3);width:100%;min-height:48px;padding:0 var(--space-6);border:1px solid var(--text-primary);background:var(--text-primary);color:var(--bg-app);font-size:var(--text-md);font-weight:var(--font-semibold);cursor:pointer;transition:background-color var(--transition-base),border-color var(--transition-base)}
        .lp-acesso-google:hover{border-color:color-mix(in srgb,var(--text-primary) 85%,var(--bg-app));background:color-mix(in srgb,var(--text-primary) 85%,var(--bg-app))}
        .lp-acesso-google svg{flex-shrink:0}
        .lp-acesso-legal{margin:var(--space-5) 0 0;color:var(--text-secondary);font-size:var(--text-xs);line-height:1.6}
        .lp-acesso-legal a{color:var(--accent);text-decoration:underline}
        .lp-acesso-trust{display:flex;flex-wrap:wrap;gap:var(--space-2) var(--space-5);margin:var(--space-6) 0 0;padding:var(--space-5) 0 0;border-top:1px solid var(--border-strong);list-style:none}
        .lp-acesso-trust li{display:flex;align-items:center;gap:var(--space-2);color:var(--text-secondary)}
        .lp-acesso-trust li::before{content:"";flex-shrink:0;width:6px;height:6px;background:var(--accent)}
        @media(min-width:1024px){.lp-fecho-grid{grid-template-columns:minmax(0,7fr) minmax(0,5fr);column-gap:var(--space-12);align-items:end}.lp-acesso{padding:var(--space-10) var(--space-8)}}
        /* Secao 15 (rodape): Footer da v4.1, claro. Topo com contato e links (os do
           nav), wordmark gigante e a base com copyright e links legais. O wordmark e
           inline com espaco real, para o texto ser "VRTX CRM"; min(18vw,16rem) deixa
           ~16px de folga a 320px. Tracking -.045em: o -.075em da referencia encavala
           as letras nesta fonte. Sem token de peso extrabold: --font-bold (a Inter
           Tight carrega ate 700). */
        .lp-rodape{overflow:hidden;padding-top:calc(var(--space-8) * 2)}
        .lp-rodape-topo{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-6);padding-bottom:var(--space-8);border-bottom:1px solid var(--lp-linha)}
        .lp-rodape-contato{display:flex;flex-direction:column;align-items:flex-start;font-size:var(--text-sm)}
        .lp-rodape-contato>span{color:var(--lp-tinta-2)}
        .lp-rodape-nav{display:flex;flex-wrap:wrap;gap:0 var(--space-6)}
        .lp-rodape-link{display:inline-flex;align-items:center;min-height:44px;color:inherit;font-size:var(--text-sm);font-weight:var(--font-medium);text-decoration:none;transition:color var(--transition-base)}
        .lp-rodape-link:hover{color:var(--lp-laranja-texto);text-decoration:none}
        .lp-rodape-marca{margin:0;padding:var(--space-8) 0 var(--space-2);color:inherit;font-size:min(18vw,16rem);font-weight:var(--font-bold);line-height:.8;letter-spacing:-.045em;white-space:nowrap}
        .lp-rodape-marca-sufixo{color:var(--lp-laranja-texto)}
        .lp-rodape-base{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--space-2) var(--space-6);padding:var(--space-4) 0;border-top:1px solid var(--lp-linha)}
        .lp-rodape-base .lp-mono{color:var(--lp-tinta-2)}
        .lp-rodape-legal{display:flex;gap:var(--space-6)}
        @media(min-width:1024px){.lp-rodape{padding-top:calc(var(--space-12) * 2)}.lp-rodape-topo{grid-template-columns:minmax(0,5fr) minmax(0,7fr);align-items:start}.lp-rodape-nav{justify-content:flex-end}}
        /* Painel "Falar com a equipe" (LandingContato.tsx), visual do ContactModal da
           v4.1. Celular: tela cheia vindo de baixo, com rolagem propria. A partir de
           640px: caixa centralizada; a partir de 1024px: lado editorial | formulario
           (5/7). Filete laranja no topo. Campos com fonte --text-lg (17px): abaixo de
           16px o Safari do iOS da zoom no foco. color-scheme dark para o <select>
           abrir a lista escura. */
        .lp-contato{position:fixed;inset:0;z-index:100;display:flex;align-items:flex-end;justify-content:center;color-scheme:dark}
        .lp-contato-fundo{position:absolute;inset:0;background:color-mix(in srgb,var(--bg-app) 85%,transparent);backdrop-filter:blur(4px)}
        .lp-contato-painel{position:relative;display:grid;grid-template-columns:minmax(0,1fr);align-content:start;width:100%;height:100%;overflow-y:auto;overscroll-behavior:contain;padding-bottom:env(safe-area-inset-bottom);border-top:3px solid var(--accent);background:var(--bg-surface);box-shadow:var(--shadow-modal);animation:lp-contato-sobe .35s ease}
        @keyframes lp-contato-sobe{from{opacity:0;transform:translateY(var(--space-6))}to{opacity:1;transform:none}}
        .lp-contato-fechar{position:absolute;top:var(--space-3);right:var(--space-3);z-index:1;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid var(--border-strong);background:var(--bg-surface-2);color:var(--text-secondary);cursor:pointer;transition:color var(--transition-base),border-color var(--transition-base)}
        .lp-contato-fechar:hover{border-color:var(--accent);color:var(--accent)}
        .lp-contato-fechar:disabled{cursor:wait;opacity:.5}
        .lp-contato-lado{padding:var(--space-8) var(--space-4) var(--space-6);border-bottom:1px solid var(--border-strong)}
        .lp-contato-titulo{max-width:16ch;margin:var(--space-4) 0 0;color:var(--text-primary);font-size:clamp(1.9rem,3.2vw,2.8rem);font-weight:var(--font-medium);line-height:.98;letter-spacing:-.045em}
        .lp-contato-titulo .lp-serif{color:var(--accent);letter-spacing:-.02em}
        .lp-contato-texto{max-width:40ch;margin:var(--space-4) 0 0;color:var(--text-secondary);font-size:var(--text-base);line-height:1.6}
        .lp-contato-itens{display:none;flex-direction:column;gap:var(--space-3);margin:var(--space-8) 0 0;padding:var(--space-5) 0 0;border-top:1px solid var(--border-strong);list-style:none}
        .lp-contato-itens li{display:flex;align-items:center;gap:var(--space-3);color:var(--text-secondary);font-size:var(--text-sm)}
        .lp-contato-itens li::before{content:"";flex-shrink:0;width:6px;height:6px;background:var(--accent)}
        .lp-contato-form{display:flex;flex-direction:column;align-items:flex-start;gap:var(--space-5);padding:var(--space-6) var(--space-4) var(--space-8)}
        .lp-contato-campos{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-5);width:100%}
        .lp-contato-campo label{display:block;color:var(--text-secondary)}
        .lp-contato-campo input,.lp-contato-campo select{display:block;width:100%;min-height:44px;margin-top:var(--space-1);padding:var(--space-2) 0;border:0;border-bottom:1px solid var(--border-strong);border-radius:0;background:transparent;color:var(--text-primary);font-size:var(--text-lg);outline:none;transition:border-color var(--transition-base)}
        .lp-contato-campo input::placeholder{color:var(--text-tertiary)}
        .lp-contato-campo input:focus,.lp-contato-campo select:focus{border-bottom-color:var(--accent)}
        .lp-contato-campo [aria-invalid="true"]{border-bottom-color:var(--danger)}
        .lp-contato-select{position:relative}
        .lp-contato-select select{padding-right:var(--space-6);appearance:none;cursor:pointer}
        .lp-contato-select svg{position:absolute;right:0;top:50%;transform:translateY(-50%);color:var(--accent);pointer-events:none}
        .lp-contato-select option{background:var(--bg-surface);color:var(--text-primary)}
        .lp-contato-erro{margin:var(--space-1) 0 0;color:var(--danger);font-size:var(--text-xs)}
        .lp-contato-hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
        .lp-contato-enviar{justify-content:space-between;width:100%;min-height:48px;cursor:pointer}
        .lp-contato-enviar:disabled{cursor:wait;opacity:.7}
        .lp-contato-enviar:disabled:hover{background:var(--accent);border-color:var(--accent)}
        .lp-contato-status{margin:0;color:var(--text-primary);font-size:var(--text-sm)}
        .lp-contato-status:empty{display:none}
        .lp-contato-form .lp-acesso-legal{margin:0}
        @media(min-width:640px){
          .lp-contato{align-items:center;padding:var(--space-6)}
          .lp-contato-painel{max-width:560px;height:auto;max-height:calc(100vh - var(--space-12));max-height:calc(100dvh - var(--space-12));border:1px solid var(--border-strong);border-top:3px solid var(--accent)}
          .lp-contato-lado{padding:var(--space-8) var(--space-8) var(--space-6)}
          .lp-contato-form{padding:var(--space-6) var(--space-8) var(--space-8)}
          .lp-contato-campos{grid-template-columns:repeat(2,minmax(0,1fr))}
          .lp-contato-largo{grid-column:1/-1}
        }
        @media(min-width:1024px){
          .lp-contato-painel{max-width:940px;grid-template-columns:minmax(0,5fr) minmax(0,7fr)}
          .lp-contato-lado{padding:var(--space-10) var(--space-8);border-bottom:0;border-right:1px solid var(--border-strong)}
          .lp-contato-itens{display:flex}
          .lp-contato-form{padding:var(--space-10) var(--space-8)}
        }
        @media(prefers-reduced-motion:reduce){.lp-contato-painel{animation:none}.lp-contato-fechar,.lp-contato-campo input,.lp-contato-campo select{transition:none}}
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
        .lp-phone figcaption{margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid var(--border-strong);color:var(--text-secondary);font-size:var(--text-base);line-height:1.5}
        @media(min-width:960px){.lp-phones{justify-content:center;align-items:center;gap:var(--space-8);overflow:visible;scroll-snap-type:none;padding-bottom:0}.lp-phone{flex:0 1 250px}.lp-phone-operacional{flex-basis:310px;order:2}.lp-phone-lead{order:1}.lp-phone-orcamentos{order:3}}
        @media(max-width:720px){.lp-mockup-body{grid-template-columns:1fr!important}.lp-mockup-side{display:none!important}.lp-stat-row{grid-template-columns:repeat(2,1fr)!important}.lp-br-desk{display:none}}
        @media(max-width:600px){.lp-cta-card{padding:32px 20px!important;margin:0 12px}}
        /* Gutter de 16px no celular nos blocos novos. */
        @media(max-width:480px){.lp-wrap{padding-left:var(--space-4);padding-right:var(--space-4)}}
        /* Movimento reduzido: sem fade de entrada, sem reveal ao rolar, sem hover que
           desloca e sem scroll suave. !important no .lp-reveal porque o
           useScrollReveal grava opacity/transform/transition inline. */
        @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.lp-fade{animation:none;opacity:1}.lp-reveal{opacity:1!important;transform:none!important;transition:none!important}.lp-feat,.lp-btn{transition:none}.lp-feat:hover,.lp-btn-primary:hover{transform:none}.lp-faixa-track{animation:none}.lp-dock,.lp-dock.is-on,.lp-cta,.lp-cta-big,.lp-nav-link,.lp-textlink,.lp-prod-aba,.lp-seg-item,.lp-seg-foto,.lp-faq-mais,.lp-faq-link,.lp-acesso-google,.lp-rodape-link{transition:none}}
        /* Cards do hero endireitam no hover so com movimento liberado. */
        @media(prefers-reduced-motion:no-preference){.lp-card{transition:transform .7s cubic-bezier(.16,1,.3,1)}.lp-card:hover{transform:none}}
      `}</style>
  );
}
