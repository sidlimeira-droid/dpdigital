import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FileText, Mail, Lock, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email ou senha inválidos');
      setLoading(false);
    } else {
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
        className="hidden md:flex md:w-1/2 bg-navy-950 p-12 flex-col justify-between relative overflow-hidden"
      >
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-navy-500/10 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-navy-500/10 rounded-full blur-3xl -ml-48 -mb-48" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-navy-500 rounded-xl flex items-center justify-center shadow-lg shadow-navy-500/20">
              <FileText className="text-white w-6 h-6" />
            </div>
            <span className="text-white font-display font-bold text-xl tracking-tight">Sistema DP</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-5xl font-display font-bold text-white leading-tight mb-6">
              Gestão de documentos <span className="text-navy-400">simplificada</span> para sua empresa.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Assinaturas digitais, holerites e gestão de colaboradores em uma única plataforma moderna e segura.
            </p>

            <ul className="space-y-4">
              {[
                'Assinatura digital com validade jurídica',
                'Notificações em tempo real',
                'Painel administrativo completo',
                'Acesso mobile e PWA'
              ].map((item, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="flex items-center gap-3 text-slate-300"
                >
                  <CheckCircle2 className="w-5 h-5 text-navy-400" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10 pt-12 border-t border-navy-900">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
            © 2026 Sistema DP • Tecnologia para RH
          </p>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h1 className="text-4xl font-display font-bold text-navy-950 mb-2">Bem-vindo de volta</h1>
            <p className="text-slate-500">Insira suas credenciais para acessar sua conta.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
              <label className="text-sm font-semibold text-slate-700 ml-1">Endereço de Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-navy-950 transition-colors" />
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
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-slate-700">Senha</label>
                <button type="button" className="text-xs font-semibold text-navy-600 hover:text-navy-700 transition-colors">
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-navy-950 transition-colors" />
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
              className="btn-primary w-full group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar na conta
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-200 text-center">
            <p className="text-slate-500 text-sm">
              Ainda não tem uma conta?{' '}
              <Link to="/register" className="text-navy-950 font-bold hover:underline underline-offset-4">
                Criar conta agora
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
