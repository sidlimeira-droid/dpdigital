import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Document, Profile } from '../types';
import { 
  FileText, Upload, Search, Filter, Download, Trash2, 
  Send, Loader2, X, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDocuments() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [colaboradores, setColaboradores] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  async function deleteDocument(id: string, filePath: string) {
    if (!confirm('Deseja realmente excluir este documento?')) return;

    try {
      // Extract path from URL
      const url = new URL(filePath);
      const path = url.pathname.split('/').slice(-2).join('/'); // bucket/path

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([path]);

      // Delete from DB
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
      fetchData();
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
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

  const filteredDocs = docs.filter(doc => 
    doc.profile?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.competencia?.includes(searchTerm) ||
    doc.tipo_documento.replace('_', ' ').toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-display font-bold text-navy-950 tracking-tight">Documentos</h1>
          <p className="text-slate-500 mt-1">Gerencie e envie documentos para os colaboradores.</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="btn-primary"
        >
          <Upload className="w-4 h-4" />
          Enviar Documento
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar documento ou colaborador..." 
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
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Competência</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
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
                      <button 
                        onClick={() => deleteDocument(doc.id, doc.arquivo_pdf)}
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
