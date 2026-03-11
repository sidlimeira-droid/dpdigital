import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Document, UserSignature } from '../types';
import { 
  FileText, CheckCircle, Clock, Download, PenTool, 
  Loader2, X, Eye, AlertCircle, Info, Calendar, ArrowRight,
  ExternalLink, ShieldCheck
} from 'lucide-react';
import { signPdf } from '../lib/pdf';
import { motion, AnimatePresence } from 'motion/react';

export default function EmployeeDashboard() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [userSignature, setUserSignature] = useState<UserSignature | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [docsRes, sigRes] = await Promise.all([
      supabase.from('documents').select('*').eq('user_id', user.id).order('data_envio', { ascending: false }),
      supabase.from('user_signature').select('*').eq('user_id', user.id).single()
    ]);

    if (docsRes.data) setDocs(docsRes.data);
    if (sigRes.data) setUserSignature(sigRes.data);
    setLoading(false);
  }

  async function handleSign(doc: Document) {
    if (!userSignature) {
      alert('Por favor, cadastre sua assinatura primeiro no menu "Minha Assinatura".');
      return;
    }

    setSigning(doc.id);
    try {
      const signedPdfBytes = await signPdf(doc.arquivo_pdf, userSignature.assinatura_imagem);
      const fileName = `signed/${doc.user_id}/${Date.now()}_signed_${doc.id}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, signedPdfBytes, { contentType: 'application/pdf' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('documents')
        .update({
          status: 'assinado',
          arquivo_pdf: publicUrl,
          data_assinatura: new Date().toISOString()
        })
        .eq('id', doc.id);

      if (dbError) throw dbError;

      await supabase.from('signatures').insert([{
        document_id: doc.id,
        assinatura_imagem: userSignature.assinatura_imagem,
        ip_usuario: '127.0.0.1'
      }]);

      fetchData();
      setViewingDoc(null);
    } catch (error: any) {
      alert('Erro ao assinar documento: ' + error.message);
    } finally {
      setSigning(null);
    }
  }

  const pendingDocs = docs.filter(d => d.status === 'pendente');
  const signedDocs = docs.filter(d => d.status === 'assinado');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900 tracking-tight">Meus Documentos</h1>
          <p className="text-zinc-500 mt-1">Visualize e assine seus documentos digitais com segurança.</p>
        </div>
        {!userSignature && (
          <motion.button 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => window.location.href = '/signature'}
            className="btn-primary bg-amber-600 hover:bg-amber-700 shadow-amber-200"
          >
            <ShieldCheck className="w-4 h-4" />
            Cadastrar Assinatura
          </motion.button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Pendentes', value: pendingDocs.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Assinados', value: signedDocs.length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total', value: docs.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm card-hover"
          >
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                <p className="text-3xl font-display font-bold text-zinc-900 mt-1">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!userSignature && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4"
        >
          <div className="bg-amber-100 p-2 rounded-xl">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-amber-900">Assinatura não cadastrada</p>
            <p className="text-amber-700 mt-1">
              Você precisa cadastrar sua assinatura digital antes de assinar documentos. 
              Isso garante a validade jurídica dos seus documentos.
            </p>
            <button 
              onClick={() => window.location.href = '/signature'}
              className="mt-4 flex items-center gap-2 text-amber-900 font-bold hover:underline"
            >
              Cadastrar agora <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Lista de Documentos</h2>
            <p className="text-sm text-zinc-500">Clique em um documento para visualizar ou assinar.</p>
          </div>
        </div>
        <div className="divide-y divide-zinc-100">
          {docs.length > 0 ? (
            docs.map((doc, i) => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-zinc-50/50 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${
                    doc.status === 'assinado' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-zinc-900 capitalize group-hover:text-zinc-900 transition-colors">
                      {doc.tipo_documento.replace('_', ' ')}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-500">
                        <Calendar className="w-4 h-4" />
                        {doc.competencia}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-zinc-300" />
                      <span className="text-sm text-zinc-400 font-medium">
                        Enviado em: {new Date(doc.data_envio).toLocaleDateString('pt-BR')}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        doc.status === 'assinado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {doc.status === 'assinado' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {doc.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setViewingDoc(doc)}
                    className="btn-secondary"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </button>
                  {doc.status === 'pendente' ? (
                    <button 
                      onClick={() => handleSign(doc)}
                      disabled={!!signing}
                      className="btn-primary"
                    >
                      {signing === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                      Assinar
                    </button>
                  ) : (
                    <a 
                      href={doc.arquivo_pdf} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-primary bg-zinc-900 hover:bg-zinc-800 shadow-zinc-200"
                    >
                      <Download className="w-4 h-4" />
                      Baixar
                    </a>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-24 text-center">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="text-zinc-200 w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Nenhum documento</h3>
              <p className="text-zinc-500 mt-1">Você ainda não recebeu nenhum documento para assinar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingDoc(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h3 className="text-2xl font-display font-bold text-zinc-900 capitalize">
                    {viewingDoc.tipo_documento.replace('_', ' ')} - {viewingDoc.competencia}
                  </h3>
                  <p className="text-sm text-zinc-500">Visualização segura do documento</p>
                </div>
                <button onClick={() => setViewingDoc(null)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-zinc-200">
                  <X className="w-7 h-7" />
                </button>
              </div>
              
              <div className="flex-1 bg-zinc-100 p-6 overflow-hidden">
                <iframe 
                  src={`${viewingDoc.arquivo_pdf}#toolbar=0`} 
                  className="w-full h-full rounded-2xl border border-zinc-200 bg-white shadow-inner"
                  title="Document Viewer"
                />
              </div>

              <div className="p-8 border-t border-zinc-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-3 text-zinc-600">
                  <div className={`p-2 rounded-xl ${viewingDoc.status === 'pendente' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {viewingDoc.status === 'pendente' ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      {viewingDoc.status === 'pendente' ? 'Aguardando Assinatura' : 'Documento Assinado'}
                    </p>
                    <p className="text-xs font-medium text-zinc-500">
                      {viewingDoc.status === 'pendente' 
                        ? 'Este documento ainda não possui validade jurídica.' 
                        : `Assinado digitalmente em ${new Date(viewingDoc.data_assinatura!).toLocaleString('pt-BR')}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setViewingDoc(null)}
                    className="btn-secondary px-8"
                  >
                    Fechar
                  </button>
                  {viewingDoc.status === 'pendente' ? (
                    <button 
                      onClick={() => handleSign(viewingDoc)}
                      disabled={!!signing}
                      className="btn-primary px-10"
                    >
                      {signing === viewingDoc.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <PenTool className="w-5 h-5" />}
                      Assinar Agora
                    </button>
                  ) : (
                    <a 
                      href={viewingDoc.arquivo_pdf} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-primary bg-zinc-900 hover:bg-zinc-800 shadow-zinc-200 px-10"
                    >
                      <Download className="w-5 h-5" />
                      Baixar PDF
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
