import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Document, Profile } from '../types';
import { 
  Users, FileText, CheckCircle, Clock, Upload, Search, 
  Filter, MoreVertical, Download, Trash2, Send, Loader2, X,
  FileCheck, AlertCircle, TrendingUp, Calendar, Settings
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [colaboradores, setColaboradores] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'docs' | 'users'>('docs');
  const [uploading, setUploading] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  
  // Form state
  const [selectedUser, setSelectedUser] = useState('');
  const [docType, setDocType] = useState<'contra_cheque' | 'folha_ponto' | 'trabalhista'>('contra_cheque');
  const [competencia, setCompetencia] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [docsRes, usersRes] = await Promise.all([
      supabase.from('documents').select('*, profile:profiles(*)').order('data_envio', { ascending: false }),
      supabase.from('profiles').select('*').eq('tipo', 'colaborador')
    ]);

    if (docsRes.data) setDocs(docsRes.data);
    if (usersRes.data) setColaboradores(usersRes.data);
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !selectedUser) return;

    setUploading(true);
    try {
      const fileName = `${selectedUser}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert([{
          user_id: selectedUser,
          tipo_documento: docType,
          competencia,
          arquivo_pdf: publicUrl,
          status: 'pendente'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      await supabase.from('notifications').insert([{
        user_id: selectedUser,
        titulo: 'Novo documento disponível',
        mensagem: `Um novo ${docType.replace('_', ' ')} de ${competencia} foi enviado para você.`,
        tipo: 'documento_novo'
      }]);

      setIsUploadModalOpen(false);
      fetchData();
      resetForm();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
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
      fetchData();
    } catch (error: any) {
      alert('Erro ao atualizar cargo: ' + error.message);
    } finally {
      setUpdatingRole(null);
    }
  }

  function resetForm() {
    setSelectedUser('');
    setDocType('contra_cheque');
    setCompetencia('');
    setFile(null);
  }

  const stats = [
    { label: 'Colaboradores', value: colaboradores.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Documentos Enviados', value: docs.length, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Assinaturas Concluídas', value: docs.filter(d => d.status === 'assinado').length, icon: CheckCircle, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Aguardando Assinatura', value: docs.filter(d => d.status === 'pendente').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const chartData = [
    { name: 'Jan', assinados: 12, pendentes: 4 },
    { name: 'Fev', assinados: 18, pendentes: 2 },
    { name: 'Mar', assinados: docs.filter(d => d.status === 'assinado').length, pendentes: docs.filter(d => d.status === 'pendente').length },
  ];

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-950 tracking-tight">Visão Geral</h1>
          <p className="text-slate-500 mt-1">Bem-vindo ao painel de controle do RH.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary hidden sm:flex">
            <Download className="w-4 h-4" />
            Exportar Dados
          </button>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-primary"
          >
            <Upload className="w-4 h-4" />
            Enviar Documento
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ... existing stats ... */}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('docs')}
          className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'docs' ? 'border-navy-950 text-navy-950' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Documentos
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'users' ? 'border-navy-950 text-navy-950' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Colaboradores & Admins
        </button>
      </div>

      {activeTab === 'docs' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ... existing charts and quick actions ... */}
          </div>

          {/* Documents Table Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* ... existing table content ... */}
          </motion.div>
        </>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-xl font-bold text-navy-950">Gestão de Usuários</h2>
            <p className="text-sm text-slate-500">Gerencie cargos e permissões de acesso.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuário</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargo</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Cadastro</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {colaboradores.concat(docs.map(d => d.profile).filter((p, i, self) => p && p.tipo === 'admin' && self.findIndex(s => s?.id === p.id) === i) as Profile[]).filter((p, i, self) => p && self.findIndex(s => s.id === p.id) === i).map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200">
                          {user.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy-950">{user.nome}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{user.cpf}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600">{user.email}</td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.tipo === 'admin' ? 'bg-navy-100 text-navy-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.tipo}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-500">
                      {new Date(user.data_criacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => toggleUserRole(user)}
                        disabled={updatingRole === user.id}
                        className="text-xs font-bold text-navy-950 hover:underline underline-offset-4 disabled:opacity-50"
                      >
                        {updatingRole === user.id ? 'Atualizando...' : `Tornar ${user.tipo === 'admin' ? 'Colaborador' : 'Admin'}`}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden relative z-10"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-display font-bold text-navy-950">Enviar Documento</h3>
                  <p className="text-sm text-slate-500">O colaborador será notificado imediatamente.</p>
                </div>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-2 text-slate-400 hover:text-navy-950 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleUpload} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Colaborador Destinatário</label>
                  <select 
                    required
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Selecione um colaborador</option>
                    {colaboradores.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} ({c.cpf})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Tipo de Documento</label>
                    <select 
                      required
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as any)}
                      className="input-field"
                    >
                      <option value="contra_cheque">Contra Cheque</option>
                      <option value="folha_ponto">Folha de Ponto</option>
                      <option value="trabalhista">Trabalhista</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Mês/Ano Competência</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: 03/2026"
                      value={competencia}
                      onChange={(e) => setCompetencia(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Arquivo PDF</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:bg-slate-50 hover:border-navy-950/20 transition-all cursor-pointer relative group">
                    <input 
                      type="file" 
                      accept=".pdf"
                      required
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-sm font-bold text-navy-950">
                      {file ? file.name : 'Clique para selecionar ou arraste o PDF'}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider">Apenas PDF • Máx 10MB</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={uploading}
                    className="btn-primary flex-1"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar Agora
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
