import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Profile } from './types';
import { AlertCircle } from 'lucide-react';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Signature from './pages/Signature';
import Layout from './components/Layout';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) setProfile(data);
    setLoading(false);
  }

  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-4 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="text-amber-600 w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Configuração Necessária</h1>
        <p className="text-zinc-600 mt-2 max-w-md">
          As credenciais do Supabase não foram encontradas. Por favor, configure as variáveis de ambiente 
          <strong> NEXT_PUBLIC_SUPABASE_URL</strong> e <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> nas configurações do AI Studio.
        </p>
        <div className="mt-8 p-4 bg-white border border-zinc-200 rounded-xl text-left text-sm">
          <p className="font-bold mb-2">Passos para configurar:</p>
          <ol className="list-decimal ml-4 space-y-1 text-zinc-500">
            <li>Vá em <strong>Settings</strong> (ícone de engrenagem)</li>
            <li>Acesse a aba <strong>Secrets</strong></li>
            <li>Adicione as chaves mencionadas acima</li>
            <li>Reinicie o servidor se necessário</li>
          </ol>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/" />} />
        
        <Route element={<Layout profile={profile} />}>
          <Route 
            path="/" 
            element={
              session ? (
                profile?.tipo === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/signature" 
            element={session && profile?.tipo === 'colaborador' ? <Signature /> : <Navigate to="/" />} 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
