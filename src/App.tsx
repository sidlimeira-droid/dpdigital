import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Profile } from './types';
import { AlertCircle } from 'lucide-react';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminEmployees from './pages/AdminEmployees';
import AdminDocuments from './pages/AdminDocuments';
import AdminSettings from './pages/AdminSettings';
import AdminReports from './pages/AdminReports';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Signature from './pages/Signature';
import Layout from './components/Layout';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: if loading takes more than 10 seconds, force it to false
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timed out. Forcing loading to false.');
        setLoading(false);
      }
    }, 10000);

    async function fetchProfileData(userId: string) {
      if (!mounted) return;
      setLoading(true);
      try {
        const { data, error } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (mounted) {
          if (error) {
            console.error('Error fetching profile:', error);
            setProfile(null);
          } else {
            setProfile(data);
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching profile:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session) {
        fetchProfileData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
        if (currentSession) {
          fetchProfileData(currentSession.user.id);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="text-amber-600 w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Configuração Necessária</h1>
        <p className="text-slate-600 mt-2 max-w-md">
          As credenciais do Supabase não foram encontradas. Por favor, configure as variáveis de ambiente 
          <strong> VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> nas configurações do AI Studio.
        </p>
        <div className="mt-8 p-4 bg-white border border-slate-200 rounded-xl text-left text-sm">
          <p className="font-bold mb-2">Passos para configurar:</p>
          <ol className="list-decimal ml-4 space-y-1 text-slate-500">
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy-500"></div>
          <p className="text-slate-500 font-medium animate-pulse">Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  if (session && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="text-red-600 w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Perfil não encontrado</h1>
        <p className="text-slate-600 mt-2 max-w-md">
          Sua conta foi autenticada, mas não encontramos seu perfil de usuário no banco de dados. 
          Isso pode acontecer se a conta foi criada manualmente ou se houve um erro no registro.
        </p>
        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            Tentar Novamente
          </button>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="btn-primary"
          >
            Sair da conta
          </button>
        </div>
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
            path="/users" 
            element={session && profile?.tipo === 'admin' ? <AdminEmployees /> : <Navigate to="/" />} 
          />
          <Route 
            path="/docs" 
            element={session && profile?.tipo === 'admin' ? <AdminDocuments /> : <Navigate to="/" />} 
          />
          <Route 
            path="/settings" 
            element={session && profile?.tipo === 'admin' ? <AdminSettings /> : <Navigate to="/" />} 
          />
          <Route 
            path="/reports" 
            element={session && profile?.tipo === 'admin' ? <AdminReports /> : <Navigate to="/" />} 
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
