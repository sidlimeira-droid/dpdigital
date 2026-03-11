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
          <h1 className="text-3xl font-display font-bold text-zinc-900 tracking-tight">Visão Geral</h1>
          <p className="text-zinc-500 mt-1">Bem-vindo ao painel de controle do RH.</p>
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
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm card-hover"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <TrendingUp className="w-3 h-3" />
                +12%
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
              <p className="text-3xl font-display font-bold text-zinc-900 mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Atividade de Assinaturas</h2>
              <p className="text-xs text-zinc-500">Volume de documentos processados mensalmente</p>
            </div>
            <select className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-600 outline-none">
              <option>Últimos 6 meses</option>
              <option>Este ano</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAssinados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="assinados" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAssinados)" />
                <Area type="monotone" dataKey="pendentes" stroke="#f59e0b" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick Actions Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm"
        >
          <h2 className="text-lg font-bold text-zinc-900 mb-6">Ações Rápidas</h2>
          <div className="space-y-3">
            {[
              { label: 'Gerenciar Colaboradores', desc: 'Ver lista e editar dados', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Gerar Relatório Mensal', desc: 'Exportar dados em PDF', icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Notificar Pendentes', desc: 'Enviar lembrete em massa', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Configurações do Sistema', desc: 'Ajustar parâmetros globais', icon: Settings, color: 'text-zinc-600', bg: 'bg-zinc-100' },
            ].map((action, i) => (
              <button 
                key={i}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-zinc-50 hover:bg-zinc-50 hover:border-zinc-200 transition-all text-left group"
              >
                <div className={`${action.bg} ${action.color} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">{action.label}</p>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Documents Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden"
      >
        <div className="p-8 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Controle de Documentos</h2>
            <p className="text-sm text-zinc-500">Acompanhe o status de cada envio em tempo real.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-zinc-900 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar colaborador..." 
                className="pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 outline-none transition-all w-full sm:w-64"
              />
            </div>
            <button className="p-2.5 text-zinc-500 hover:bg-zinc-100 rounded-xl border border-zinc-200 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Colaborador</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tipo de Documento</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Competência</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Data Envio</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-sm font-bold text-zinc-600 border border-zinc-200 group-hover:bg-white transition-colors">
                        {doc.profile?.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{doc.profile?.nome}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{doc.profile?.cpf}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-zinc-300" />
                      <span className="text-sm font-medium text-zinc-600 capitalize">{doc.tipo_documento.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-600">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      {doc.competencia}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      doc.status === 'assinado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {doc.status === 'assinado' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {doc.status === 'assinado' ? 'Assinado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-zinc-500">
                    {new Date(doc.data_envio).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all">
                        <Download className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {docs.length === 0 && !loading && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-zinc-200" />
            </div>
            <p className="text-sm font-medium text-zinc-500">Nenhum documento encontrado.</p>
          </div>
        )}
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
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden relative z-10"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h3 className="text-2xl font-display font-bold text-zinc-900">Enviar Documento</h3>
                  <p className="text-sm text-zinc-500">O colaborador será notificado imediatamente.</p>
                </div>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-zinc-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleUpload} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 ml-1">Colaborador Destinatário</label>
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
                    <label className="text-sm font-bold text-zinc-700 ml-1">Tipo de Documento</label>
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
                    <label className="text-sm font-bold text-zinc-700 ml-1">Mês/Ano Competência</label>
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
                  <label className="text-sm font-bold text-zinc-700 ml-1">Arquivo PDF</label>
                  <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-10 text-center hover:bg-zinc-50 hover:border-zinc-900/20 transition-all cursor-pointer relative group">
                    <input 
                      type="file" 
                      accept=".pdf"
                      required
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-zinc-500" />
                    </div>
                    <p className="text-sm font-bold text-zinc-900">
                      {file ? file.name : 'Clique para selecionar ou arraste o PDF'}
                    </p>
                    <p className="text-xs text-zinc-400 mt-2 font-medium uppercase tracking-wider">Apenas PDF • Máx 10MB</p>
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
