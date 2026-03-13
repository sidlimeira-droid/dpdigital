import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { 
  Users, Search, Filter, MoreVertical, Trash2, UserPlus, 
  Loader2, Mail, Phone, Calendar, Shield, ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminEmployees() {
  const [colaboradores, setColaboradores] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nome', { ascending: true });

    if (data) setColaboradores(data);
    setLoading(false);
  }

  async function deleteUser(id: string, nome: string) {
    if (!confirm(`Deseja realmente excluir o colaborador ${nome}? Esta ação não pode ser desfeita.`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchEmployees();
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    
    // In a real app with Service Role, we would use supabase.auth.admin.inviteUserByEmail
    // For now, we'll simulate it or just show a success message
    setTimeout(() => {
      alert(`Convite enviado para ${inviteEmail}! (Simulação)`);
      setInviting(false);
      setIsInviteModalOpen(false);
      setInviteEmail('');
    }, 1500);
  }

  async function toggleUserRole(user: Profile) {
    const newRole = user.tipo === 'admin' ? 'colaborador' : 'admin';
    if (!confirm(`Deseja alterar o cargo de ${user.nome} para ${newRole}?`)) return;

    setUpdatingRole(user.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ tipo: newRole })
        .eq('id', user.id);

      if (error) throw error;
      fetchEmployees();
    } catch (error: any) {
      alert('Erro ao atualizar cargo: ' + error.message);
    } finally {
      setUpdatingRole(null);
    }
  }

  const filteredEmployees = colaboradores.filter(emp => 
    emp.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cpf?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-navy-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-950 tracking-tight">Colaboradores</h1>
          <p className="text-slate-500 mt-1">Gerencie a equipe e permissões de acesso.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          Convidar Colaborador
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, email ou CPF..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-950/10 focus:border-navy-950 transition-all w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-navy-950 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colaborador</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contato</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargo</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200 shadow-sm">
                        {user.nome?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-950">{user.nome}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">CPF: {user.cpf}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        (11) 99999-9999
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.tipo === 'admin' ? 'bg-navy-100 text-navy-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {user.tipo === 'admin' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                      {user.tipo}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                      Ativo
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleUserRole(user)}
                        disabled={updatingRole === user.id}
                        className="p-2 text-slate-400 hover:text-navy-950 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200"
                        title={user.tipo === 'admin' ? 'Tornar Colaborador' : 'Tornar Admin'}
                      >
                        {updatingRole === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          user.tipo === 'admin' ? <ShieldAlert className="w-4 h-4" /> : <Shield className="w-4 h-4" />
                        )}
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id, user.nome || '')}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            onClick={() => setIsInviteModalOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative z-10"
          >
            <h3 className="text-2xl font-display font-bold text-navy-950 mb-2">Convidar Colaborador</h3>
            <p className="text-sm text-slate-500 mb-6">Envie um convite por e-mail para que o colaborador possa se cadastrar.</p>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">E-mail do Colaborador</label>
                <input 
                  type="email" 
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="exemplo@empresa.com"
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={inviting}
                  className="btn-primary flex-1"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Convite'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
