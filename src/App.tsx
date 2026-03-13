import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Profile } from './types';
import { AlertCircle, Loader2 } from 'lucide-react';

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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
      }
      setAuthReady(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as Profile);
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  }

  if (!authReady || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 text-navy-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Carregando sistema...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        
        <Route element={<Layout profile={profile} />}>
          <Route 
            path="/" 
            element={
              user ? (
                profile?.tipo === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/users" 
            element={user && profile?.tipo === 'admin' ? <AdminEmployees /> : <Navigate to="/" />} 
          />
          <Route 
            path="/docs" 
            element={user && profile?.tipo === 'admin' ? <AdminDocuments /> : <Navigate to="/" />} 
          />
          <Route 
            path="/settings" 
            element={user && profile?.tipo === 'admin' ? <AdminSettings /> : <Navigate to="/" />} 
          />
          <Route 
            path="/reports" 
            element={user && profile?.tipo === 'admin' ? <AdminReports /> : <Navigate to="/" />} 
          />
          <Route 
            path="/signature" 
            element={user && profile?.tipo === 'colaborador' ? <Signature /> : <Navigate to="/" />} 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
