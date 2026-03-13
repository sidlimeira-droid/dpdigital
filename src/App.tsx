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
    console.log('App component mounted. Supabase status:', !!supabase);
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    }).catch(() => {
      setLoading(false);
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

    if (data) {
      let profileData = data;
      
      // Force admin role for this specific email regardless of DB state
      if (data.email === 'admin@clinicaninho.com') {
        profileData = { ...data, tipo: 'admin' };
        
        // Attempt to sync this to the DB in the background
        if (data.tipo !== 'admin') {
          supabase.from('profiles').update({ tipo: 'admin' }).eq('id', userId).then();
        }
      }
      
      setProfile(profileData);
    }
    setLoading(false);
  }

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy-500"></div>
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
