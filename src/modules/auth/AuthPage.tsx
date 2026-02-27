import { supabase } from '@/lib/supabase'
import { Sparkles } from 'lucide-react'

export function AuthPage() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
  }

  return (
    <div className="flex h-screen w-full">

      {/* LADO ESQUERDO */}
      <div className="hidden md:flex flex-col justify-center px-20 flex-1 
                      bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700
                      text-white relative overflow-hidden">

        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl" />

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-bold mb-6">
            CRM Inteligente
          </h1>

          <h2 className="text-xl font-light mb-4 opacity-90">
            Sistema de Inteligência Comercial Evolutiva.
          </h2>

          <p className="text-base opacity-80 leading-relaxed">
            Gestão estratégica de leads, análise inteligente e priorização automática
            para maximizar conversões e escalar resultados.
          </p>

          <div className="mt-10 text-sm opacity-60">
            v1.0 • Multi-Workspace • Cloud Ready
          </div>
        </div>
      </div>

      {/* LADO DIREITO */}
      <div className="flex flex-1 items-center justify-center bg-slate-100">

        <div className="bg-white p-10 rounded-2xl shadow-xl w-[380px]">

          <div className="flex items-center justify-center mb-6">
            <Sparkles className="text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">
              Acessar Plataforma
            </h2>
          </div>

          <p className="text-sm text-gray-500 text-center mb-6">
            Entre com sua conta Google para acessar seu workspace.
          </p>

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 
                       transition-all duration-200 
                       text-white py-3 rounded-lg font-medium shadow-md"
          >
            Entrar com Google
          </button>

          <p className="text-xs text-gray-400 text-center mt-6">
            Seus dados são protegidos e sincronizados com segurança.
          </p>
        </div>

      </div>
    </div>
  )
}