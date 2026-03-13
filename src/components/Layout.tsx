import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, PenTool, Bell, LogOut, User, Menu, X, ChevronRight, Settings, HelpCircle, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Profile, Notification } from '../types';
import { auth, db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, signOut } from 'firebase/firestore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  profile: Profile | null;
}

export default function Layout({ profile }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (profile) {
      const q = query(
        collection(db, 'notifications'),
        where('user_id', '==', profile.id),
        orderBy('data_criacao', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(notifs);
      });

      return () => unsubscribe();
    }
  }, [profile]);

  async function handleLogout() {
    await auth.signOut();
    navigate('/login');
  }

  const unreadCount = notifications.filter(n => !n.lida).length;

  const navItems = profile?.tipo === 'admin' 
    ? [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Colaboradores', path: '/users', icon: User },
        { name: 'Documentos', path: '/docs', icon: FileText },
        { name: 'Relatórios', path: '/reports', icon: BarChart3 },
        { name: 'Configurações', path: '/settings', icon: Settings },
      ]
    : [
        { name: 'Meus Documentos', path: '/', icon: FileText },
        { name: 'Minha Assinatura', path: '/signature', icon: PenTool },
        { name: 'Ajuda', path: '/help', icon: HelpCircle },
      ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased">
      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-40 lg:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transition-all duration-300 lg:translate-x-0 lg:static lg:block shadow-sm",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-navy-950 rounded-xl flex items-center justify-center shadow-lg shadow-navy-950/20">
              <FileText className="text-white w-6 h-6" />
            </div>
            <span className="font-display font-bold text-2xl text-navy-950 tracking-tight">Sistema DP</span>
          </div>

          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
            <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu Principal</p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "group flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium relative",
                    isActive 
                      ? "bg-navy-950 text-white shadow-lg shadow-navy-950/10" 
                      : "text-slate-500 hover:bg-slate-100 hover:text-navy-950"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-navy-950")} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  {isActive && (
                    <motion.div layoutId="active-nav" className="absolute right-2 w-1.5 h-1.5 rounded-full bg-navy-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-6 mt-auto">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200 font-bold text-navy-950">
                  {profile?.nome?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy-950 truncate">{profile?.nome}</p>
                  <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-wider">{profile?.tipo}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all font-bold text-xs border border-slate-200 bg-white"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden lg:block">
              <h2 className="text-xl font-display font-bold text-navy-950">
                {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl relative transition-all border border-transparent hover:border-slate-200"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-navy-500 rounded-full border-2 border-white" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-navy-950 text-sm">Notificações</h3>
                        <span className="text-[10px] font-bold bg-navy-950 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {unreadCount} Novas
                        </span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(n => (
                            <div key={n.id} className={cn("p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors relative group", !n.lida && "bg-navy-50/20")}>
                              <div className="flex gap-3">
                                <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", !n.lida ? "bg-navy-500" : "bg-slate-200")} />
                                <div>
                                  <p className="text-sm font-bold text-navy-950 leading-tight">{n.titulo}</p>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.mensagem}</p>
                                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                    {new Date(n.data_criacao).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-10 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Bell className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Nenhuma notificação por aqui.</p>
                          </div>
                        )}
                      </div>
                      <button className="w-full p-4 text-xs font-bold text-navy-950 hover:bg-slate-50 transition-colors border-t border-slate-100">
                        Ver todas as notificações
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
