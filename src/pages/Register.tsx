import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FileText, Mail, Lock, User, CreditCard, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Register() {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Auth Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          cpf,
          tipo: 'colaborador',
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Profile is created automatically by the database trigger
      navigate('/');
    }

  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Visual/Marketing */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden md:flex md:w-1/2 bg-zinc-900 p-12 flex-col justify-between relative overflow-hidden"
      >
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -ml-48 -mb-48" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FileText className="text-zinc-900 w-6 h-6" />
            </div>
            <span className="text-white font-display font-bold text-xl tracking-tight">Sistema DP</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-5xl font-display font-bold text-white leading-tight mb-6">
              Junte-se à revolução do <span className="text-emerald-400">RH Digital</span>.
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
              Crie sua conta em segundos e tenha acesso imediato a todos os seus documentos corporativos.
            </p>

            <div className="space-y-6">
              {[
                { title: 'Segurança Total', desc: 'Dados criptografados e conformidade com a LGPD.' },
                { title: 'Agilidade', desc: 'Assine documentos de qualquer lugar, a qualquer hora.' },
                { title: 'Transparência', desc: 'Histórico completo de todas as suas interações.' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="flex gap-4"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{item.title}</h4>
                    <p className="text-zinc-500 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-12 border-t border-zinc-800">
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
            © 2026 Sistema DP • Tecnologia para RH
          </p>
        </div>
      </motion.div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-zinc-50 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md my-8"
        >
          <div className="mb-10">
            <h1 className="text-4xl font-display font-bold text-zinc-900 mb-2">Criar conta</h1>
            <p className="text-zinc-500">Preencha os dados abaixo para começar.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 ml-1">Nome Completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 group-focus-within:text-zinc-900 transition-colors" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input-field pl-12"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 ml-1">CPF</label>
              <div className="relative group">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 group-focus-within:text-zinc-900 transition-colors" />
                <input
                  type="text"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="input-field pl-12"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 ml-1">Email Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 group-focus-within:text-zinc-900 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="nome@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 group-focus-within:text-zinc-900 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full group mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Criar minha conta
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-zinc-200 text-center">
            <p className="text-zinc-500 text-sm">
              Já possui uma conta?{' '}
              <Link to="/login" className="text-zinc-900 font-bold hover:underline underline-offset-4">
                Fazer login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
