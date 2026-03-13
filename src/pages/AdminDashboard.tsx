import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [uploading, setUploading] = useState(false);
  
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
      supabase.from('documents').select('*, profile:profiles(*)').order('data_envio', { ascending: false }).limit(5),
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

  function resetForm() {
    setSelectedUser('');
    setDocType('contra_cheque');
    setCompetencia('');
    setFile(null);
  }

  async function handleExport() {
    alert('Exportando dados para Excel... (Simulação)');
    // In a real app, we would generate a CSV/XLSX file here
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
          <button 
            onClick={handleExport}
            className="btn-secondary hidden sm:flex"
          >
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
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm card-hover"
          >
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-display font-bold text-navy-950 mt-1">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-navy-950">Atividade de Assinaturas</h3>
              <p className="text-sm text-slate-500">Acompanhamento mensal de documentos.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Assinados
              </div>
              <div className="flex items-center gap-1.5 text-amber-600">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Pendentes
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAssinados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPendentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="assinados" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAssinados)" />
                <Area type="monotone" dataKey="pendentes" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorPendentes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-navy-950 p-8 rounded-3xl text-white shadow-xl shadow-navy-950/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
            <h3 className="text-xl font-bold mb-2 relative z-10">Ações Rápidas</h3>
            <p className="text-navy-200 text-sm mb-6 relative z-10">Gerencie documentos e usuários com facilidade.</p>
            <div className="space-y-3 relative z-10">
              <button onClick={() => setIsUploadModalOpen(true)} className="w-full py-3 px-4 bg-white text-navy-950 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-navy-50 transition-colors">
                <Upload className="w-4 h-4" />
                Novo Documento
              </button>
              <Link to="/users" className="w-full py-3 px-4 bg-navy-900 text-white border border-navy-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors">
                <Users className="w-4 h-4" />
                Gerenciar Usuários
              </Link>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-navy-950 mb-4">Status Geral</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 font-medium">Taxa de Conclusão</span>
                <span className="text-sm font-bold text-navy-950">
                  {docs.length ? Math.round((docs.filter(d => d.status === 'assinado').length / docs.length) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${docs.length ? (docs.filter(d => d.status === 'assinado').length / docs.length) * 100 : 0}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy-950">Documentos Recentes</h2>
            <p className="text-sm text-slate-500">Acompanhe o status de envio e assinatura.</p>
          </div>
          <Link to="/docs" className="text-sm font-bold text-navy-600 hover:underline">Ver todos</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colaborador</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Competência</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-navy-50 rounded-lg flex items-center justify-center text-xs font-bold text-navy-600">
                        {doc.profile?.nome?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm font-bold text-navy-950">{doc.profile?.nome}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm text-slate-600 capitalize">{doc.tipo_documento.replace('_', ' ')}</span>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{doc.competencia}</td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      doc.status === 'assinado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {doc.status === 'assinado' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={doc.arquivo_pdf} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-navy-950 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

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
