import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export function AuthPage() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  };

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'none';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.lp-reveal').forEach(el => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(20px)';
      (el as HTMLElement).style.transition = 'opacity .6s ease, transform .6s ease';
      obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#0f1117', color: '#f4f5f7', minHeight: '100vh', overflowX: 'hidden' }}>
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
        html{scroll-behavior:smooth}
        .lp-hero{position:relative;background:radial-gradient(60% 80% at 70% 0%,rgba(255,106,0,0.18) 0%,transparent 60%),radial-gradient(50% 60% at 10% 20%,rgba(99,102,241,0.18) 0%,transparent 60%),linear-gradient(180deg,#0f1117,#0b0d12);padding:80px 0 60px;overflow:hidden}
        .lp-hero::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(ellipse 80% 60% at 50% 30%,#000 30%,transparent 80%);pointer-events:none}
        .lp-grad{background:linear-gradient(135deg,#ff6a00 0%,#ff9a5c 60%,#ffb37c 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
        @keyframes lp-fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .lp-fade{animation:lp-fadeUp .7s ease forwards;opacity:0}
        .lp-d1{animation-delay:.08s}.lp-d2{animation-delay:.16s}.lp-d3{animation-delay:.24s}.lp-d4{animation-delay:.32s}
        @keyframes lp-pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.15)}}
        .lp-live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;animation:lp-pulse 1.6s ease-in-out infinite}
        .lp-feat{background:#1a1d27;border:1px solid #262a36;border-radius:14px;padding:28px;transition:all .2s}
        .lp-feat:hover{border-color:#363b4a;transform:translateY(-2px);box-shadow:0 20px 40px -20px rgba(0,0,0,0.5)}
        .lp-feat.highlight{background:linear-gradient(180deg,rgba(255,106,0,0.06) 0%,#1a1d27 60%);border-color:rgba(255,106,0,0.25)}
        .lp-step{background:#1a1d27;border:1px solid #262a36;border-radius:14px;padding:32px 28px}
        .lp-testi{background:#1a1d27;border:1px solid #262a36;border-radius:14px;padding:28px;display:flex;flex-direction:column}
        .lp-google{width:100%;display:flex;align-items:center;justify-content:center;gap:12px;padding:14px 24px;border-radius:10px;background:#fff;color:#1f1f1f;font-weight:600;font-size:15px;transition:all .15s;min-height:48px;border:none;cursor:pointer}
        .lp-google:hover{transform:translateY(-1px);box-shadow:0 12px 28px -10px rgba(255,255,255,0.2)}
        @media(max-width:720px){.lp-mockup-body{grid-template-columns:1fr!important}.lp-mockup-side{display:none!important}.lp-stat-row{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:600px){.lp-hero{padding:60px 0 40px}.lp-cta-card{padding:32px 20px!important;margin:0 12px}}
        @media(max-width:900px){.lp-nav-links{display:none!important}}
      `}</style>

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 16, color: '#f4f5f7', textDecoration: 'none' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#ff6a00,#ff8a3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px -4px rgba(255,106,0,0.35)', color: '#fff', fontSize: 14, fontWeight: 800 }}>V</span>
            VRTX <span style={{ color: '#7a7f8c', fontWeight: 500 }}>CRM</span>
          </a>
          <div className="lp-nav-links" style={{ display: 'flex', gap: 32, fontSize: 14, color: '#b8bcc7' }}>
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Funcionalidades</a>
            <a href="#how" style={{ color: 'inherit', textDecoration: 'none' }}>Como funciona</a>
            <a href="#testi" style={{ color: 'inherit', textDecoration: 'none' }}>Depoimentos</a>
          </div>
          <a href="#login" className="lp-btn lp-btn-primary">Acessar CRM</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-container">
          <div style={{ position: 'relative', textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
            <span className="lp-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,106,0,0.12)', color: '#ff6a00', fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,106,0,0.25)', marginBottom: 24 }}>
              ✦ CRM com Inteligência Artificial integrada
            </span>
            <h1 className="lp-fade lp-d1" style={{ fontSize: 'clamp(34px,5.5vw,64px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20 }}>
              O CRM inteligente para<br/><span className="lp-grad">empresas que vendem serviços</span>
            </h1>
            <p className="lp-fade lp-d2" style={{ fontSize: 'clamp(16px,1.6vw,19px)', color: '#b8bcc7', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.6 }}>
              Metalúrgicas, marcenarias e serralherias gerenciam leads, orçamentos e operação em um só lugar — com priorização automática por IA e PDFs profissionais com PIX.
            </p>
            <div className="lp-fade lp-d3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#login" className="lp-btn lp-btn-primary lp-btn-lg">Começar agora — Grátis →</a>
              <a href="#features" className="lp-btn lp-btn-ghost lp-btn-lg">Ver funcionalidades</a>
            </div>
            <div className="lp-fade lp-d3" style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
              {[{ v: 'R$ 2M+', l: 'em orçamentos gerenciados' }, { v: '500+', l: 'leads acompanhados' }, { v: '98%', l: 'de uptime' }].map(s => (
                <div key={s.v} style={{ textAlign: 'center' }}>
                  <strong style={{ display: 'block', fontSize: 28, fontWeight: 800 }}>{s.v}</strong>
                  <span style={{ fontSize: 12, color: '#7a7f8c' }}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup */}
          <div className="lp-fade lp-d4" style={{ marginTop: 64, perspective: 1400 }}>
            <div style={{ background: 'linear-gradient(180deg,#1a1d27,#13161e)', border: '1px solid #363b4a', borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6),0 60px 120px -30px rgba(255,106,0,0.35)', maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid #262a36', background: 'rgba(0,0,0,0.2)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28ca42' }} />
                <span style={{ marginLeft: 16, fontSize: 12, color: '#7a7f8c', background: '#222633', padding: '5px 12px', borderRadius: 6 }}>vertice-digital-crm.vercel.app</span>
                <span style={{ fontSize: 11, color: '#7a7f8c', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}><span className="lp-live-dot" /> Ao vivo</span>
              </div>
              <div className="lp-mockup-body" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 420 }}>
                <aside className="lp-mockup-side" style={{ background: '#13161e', borderRight: '1px solid #262a36', padding: '18px 12px', fontSize: 13 }}>
                  {['⊞ Dashboard', '👥 Leads', '📄 Orçamentos', '📅 Operacional', '💰 Financeiro', '✦ IA Assistente'].map((item, i) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 6, color: i === 0 ? '#ff6a00' : '#7a7f8c', background: i === 0 ? 'rgba(255,106,0,0.12)' : 'transparent', fontWeight: i === 0 ? 600 : 400, marginBottom: 2 }}>{item}</div>
                  ))}
                </aside>
                <div style={{ padding: 24, overflow: 'hidden' }}>
                  <h3 style={{ fontSize: 18, marginBottom: 6, letterSpacing: '-0.02em' }}>Dashboard Executivo</h3>
                  <div style={{ fontSize: 12, color: '#7a7f8c', marginBottom: 18 }}>Receita prevista, foco do dia e saúde do CRM em tempo real</div>
                  <div className="lp-stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
                    {[{ l: 'Receita prevista', v: 'R$ 84.250', c: '#ff6a00' }, { l: 'Leads críticos', v: '7', c: '#f87171' }, { l: 'Tarefas hoje', v: '12', c: '#f4f5f7' }, { l: 'Conversão', v: '28%', c: '#22c55e' }].map(s => (
                      <div key={s.l} style={{ background: '#222633', padding: 12, borderRadius: 8, border: '1px solid #262a36' }}>
                        <div style={{ fontSize: 10, color: '#7a7f8c', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>{s.l}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#7a7f8c', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Foco hoje · 3 leads</div>
                  {[{ n: 'João Almeida — Portão automático', p: 'Crítico', c: '#ff6a00', bc: 'rgba(255,106,0,0.12)' }, { n: 'Marcenaria Souza — Móveis sob medida', p: 'Médio', c: '#60a5fa', bc: 'rgba(96,165,250,0.12)' }, { n: 'Construtora Lima — Estruturas metálicas', p: 'Baixo', c: '#7a7f8c', bc: '#1f2330' }].map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: '#222633', border: '1px solid #262a36', borderTop: `3px solid ${l.c}`, marginBottom: 6, fontSize: 12 }}>
                      <span style={{ flex: 1, fontWeight: 600 }}>{l.n}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: l.bc, color: l.c }}>{l.p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '96px 0' }}>
        <div className="lp-container">
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 56px' }}>
            <span style={{ color: '#ff6a00', fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, display: 'inline-block' }}>Funcionalidades</span>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 14 }}>Tudo que sua operação precisa, sem amarrar 5 ferramentas</h2>
            <p style={{ fontSize: 17, color: '#b8bcc7', lineHeight: 1.6 }}>De primeiro contato a recebimento — uma plataforma única, pensada para quem vende serviços de alto valor.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {[
              { icon: '✦', title: 'Gestão de Leads com IA', desc: 'A IA analisa cada lead e atribui prioridade automática com base em valor, urgência e histórico de contato.', tag: '✦ Priorização automática', hi: true, iconBg: 'rgba(168,85,247,0.12)', iconColor: '#a855f7' },
              { icon: '📄', title: 'Orçamentos profissionais', desc: 'PDF com sua identidade visual, QR Code PIX integrado e assinatura digital.', tag: 'PDF · PIX · Assinatura', iconBg: 'rgba(255,106,0,0.12)', iconColor: '#ff6a00' },
              { icon: '📊', title: 'Dashboard executivo', desc: 'Receita prevista, foco do dia, saúde do CRM e conversão por etapa.', tag: 'Visão estratégica', iconBg: 'rgba(34,197,94,0.12)', iconColor: '#22c55e' },
              { icon: '📅', title: 'Painel operacional', desc: 'Agenda semanal e mensal, tarefas por prioridade, alertas de atraso.', tag: 'Agenda inteligente', iconBg: 'rgba(96,165,250,0.12)', iconColor: '#60a5fa' },
              { icon: '💰', title: 'Financeiro completo', desc: 'Receitas, despesas, contas a receber e resultado do mês com fluxo de caixa visual.', tag: 'Fluxo de caixa', iconBg: 'rgba(245,158,11,0.12)', iconColor: '#f59e0b' },
              { icon: '🏢', title: 'Multi-workspace', desc: 'Cada empresa com dados isolados: leads, financeiro, branding e documentos separados.', tag: 'Isolamento total', iconBg: 'rgba(248,113,113,0.12)', iconColor: '#f87171' },
            ].map(f => (
              <div key={f.title} className={`lp-feat lp-reveal ${f.hi ? 'highlight' : ''}`}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: f.iconBg, color: f.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, fontSize: 20 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: '#b8bcc7', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
                <span style={{ display: 'inline-block', marginTop: 14, padding: '3px 10px', borderRadius: 99, background: '#222633', color: '#7a7f8c', fontSize: 11, fontWeight: 600 }}>{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="how" style={{ padding: '96px 0', background: '#161922' }}>
        <div className="lp-container">
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 56px' }}>
            <span style={{ color: '#ff6a00', fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, display: 'inline-block' }}>Como funciona</span>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>Do cadastro ao primeiro orçamento em menos de 10 minutos</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24 }}>
            {[
              { n: '1', t: 'Cadastre sua empresa', d: 'Entre com Google, configure logo, dados PIX e modelo de orçamento. Tudo pronto em poucos cliques.' },
              { n: '2', t: 'Importe ou crie seus leads', d: 'Cadastro manual rápido, importação em lote ou captura via formulário. A IA já começa a priorizar.' },
              { n: '3', t: 'Gerencie tudo num só lugar', d: 'Leads, orçamentos, agenda, financeiro e equipe. Acompanhe o crescimento pelo dashboard executivo.' },
            ].map(s => (
              <div key={s.n} className="lp-step lp-reveal">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ff6a00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, boxShadow: '0 8px 24px -8px rgba(255,106,0,0.35)', marginBottom: 18 }}>{s.n}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{s.t}</h3>
                <p style={{ color: '#b8bcc7', fontSize: 14, lineHeight: 1.6 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="testi" style={{ padding: '96px 0' }}>
        <div className="lp-container">
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 56px' }}>
            <span style={{ color: '#ff6a00', fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, display: 'inline-block' }}>O que dizem</span>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>Empresas que pararam de perder lead em planilha</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {[
              { q: '"Antes eu perdia 3-4 orçamentos por semana esquecidos no WhatsApp. Em 2 meses de VRTX, fechei 32% mais."', n: 'Rafael Marques', r: 'Sócio · Marquemetal Serralheria', i: 'RM', g: 'linear-gradient(135deg,#ff6a00,#ff9a5c)' },
              { q: '"O PDF do orçamento com QR Code PIX virou nosso diferencial. Cliente recebe, vê o valor e paga ali mesmo."', n: 'Carla Lima', r: 'Diretora · Marcenaria Lima & Filhos', i: 'CL', g: 'linear-gradient(135deg,#6366f1,#a78bfa)' },
              { q: '"Tenho 3 empresas e cada uma com workspace separado. Acabou a confusão de relatórios misturados."', n: 'João Pereira', r: 'CEO · Grupo Pereira Indústria', i: 'JP', g: 'linear-gradient(135deg,#22c55e,#86efac)' },
            ].map(t => (
              <div key={t.n} className="lp-testi lp-reveal">
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(s => <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="#ff6a00"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                </div>
                <blockquote style={{ fontSize: 15, color: '#f4f5f7', lineHeight: 1.65, flex: 1, marginBottom: 20 }}>{t.q}</blockquote>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.g, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14 }}>{t.i}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.n}</div>
                    <div style={{ color: '#7a7f8c', fontSize: 12 }}>{t.r}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + LOGIN */}
      <section id="login" style={{ padding: '96px 0', background: 'radial-gradient(50% 80% at 50% 0%,rgba(255,106,0,0.18) 0%,transparent 60%),#0f1117', position: 'relative', overflow: 'hidden' }}>
        <div className="lp-container">
          <div className="lp-cta-card lp-reveal" style={{ maxWidth: 560, margin: '0 auto', background: '#1a1d27', border: '1px solid #363b4a', borderRadius: 20, padding: '48px 40px', textAlign: 'center', boxShadow: '0 40px 100px -30px rgba(0,0,0,0.6)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,106,0,0.12)', color: '#ff6a00', fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,106,0,0.25)', marginBottom: 20 }}>⚡ Comece grátis · Sem cartão</span>
            <h2 style={{ fontSize: 'clamp(26px,3vw,34px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 14 }}>Pronto para parar de perder venda?</h2>
            <p style={{ color: '#b8bcc7', fontSize: 16, marginBottom: 32, lineHeight: 1.55 }}>Entre com sua conta Google, crie seu workspace em segundos e teste todas as funcionalidades.</p>

            <button onClick={handleLogin} className="lp-google">
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.2-.1-2.3-.1-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.1 4.1-3.9 5.5l6.2 5.2C41.8 35.4 44 30 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
              Entrar com Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0', color: '#7a7f8c', fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#262a36' }} />
              ou
              <div style={{ flex: 1, height: 1, background: '#262a36' }} />
            </div>

            <a href="mailto:contato@verticedigital.com.br" className="lp-btn lp-btn-ghost lp-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              ✉️ Falar com vendas
            </a>

            <p style={{ color: '#7a7f8c', fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
              Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 24, marginTop: 36, color: '#7a7f8c', fontSize: 13 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>🔒 SSL criptografado</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>💾 Backup diário</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>🛡️ LGPD compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #262a36', padding: '40px 0', color: '#7a7f8c', fontSize: 13 }}>
        <div className="lp-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 16, color: '#f4f5f7' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#ff6a00,#ff8a3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800 }}>V</span>
            VRTX CRM
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Funcionalidades</a>
            <a href="#how" style={{ color: 'inherit', textDecoration: 'none' }}>Como funciona</a>
            <a href="#testi" style={{ color: 'inherit', textDecoration: 'none' }}>Depoimentos</a>
          </div>
          <div>© 2026 VRTX · CRM Inteligente</div>
        </div>
      </footer>
    </div>
  );
}
