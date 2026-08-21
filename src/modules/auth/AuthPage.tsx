import { supabase } from '@/lib/supabase';
import { LandingStyles } from './landing/landingStyles';
import { useScrollReveal } from './landing/useScrollReveal';
import { LandingNav } from './landing/LandingNav';
import { LandingHero } from './landing/LandingHero';
import { LandingFeatures } from './landing/LandingFeatures';
import { LandingHowItWorks } from './landing/LandingHowItWorks';
import { LandingTestimonials } from './landing/LandingTestimonials';
import { LandingLoginCta } from './landing/LandingLoginCta';
import { LandingFooter } from './landing/LandingFooter';

// A landing pública É a tela de auth (App.tsx renderiza este componente quando
// não há sessão). Aqui só ficam o login e a composição das seções — a copy mora
// em landing/landingContent.ts.
export function AuthPage() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  };

  // Scroll reveal
  useScrollReveal();

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#0f1117', color: '#f4f5f7', minHeight: '100vh', overflowX: 'hidden' }}>
      <LandingStyles />

      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingLoginCta onLogin={handleLogin} />
      <LandingFooter />
    </div>
  );
}
