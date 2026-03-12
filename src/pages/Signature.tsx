import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../lib/supabase';
import { PenTool, Trash2, Save, CheckCircle, Loader2, Info, AlertCircle, ShieldCheck, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Signature() {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [loading, setLoading] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSignature();
  }, []);

  async function fetchSignature() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_signature')
      .select('assinatura_imagem')
      .eq('user_id', user.id)
      .single();

    if (data) setSavedSignature(data.assinatura_imagem);
  }

  function clear() {
    sigCanvas.current?.clear();
    setMessage(null);
  }

  async function save() {
    if (sigCanvas.current?.isEmpty()) {
      setMessage({ type: 'error', text: 'Por favor, desenhe sua assinatura antes de salvar.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const base64 = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
      if (!base64) throw new Error('Erro ao capturar imagem');

      const fileName = `${user.id}/signature_${Date.now()}.png`;
      const blob = await (await fetch(base64)).blob();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('user_signature')
        .upsert({
          user_id: user.id,
          assinatura_imagem: publicUrl,
          data_cadastro: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (dbError) throw dbError;

      setSavedSignature(publicUrl);
      setMessage({ type: 'success', text: 'Sua assinatura digital foi salva com sucesso!' });
      sigCanvas.current?.clear();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar assinatura' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-navy-950 text-white rounded-2xl shadow-xl mb-2">
          <PenTool className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-display font-bold text-navy-950 tracking-tight">Assinatura Digital</h1>
        <p className="text-slate-500 max-w-lg mx-auto">
          Cadastre sua assinatura oficial para assinar documentos digitais com validade jurídica e segurança total.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-6 rounded-3xl flex items-start gap-4 border ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-red-50 text-red-700 border-red-100'
            }`}
          >
            <div className={`p-2 rounded-xl ${message.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="font-bold">{message.type === 'success' ? 'Sucesso!' : 'Ops!'}</p>
              <p className="text-sm opacity-90">{message.text}</p>
            </div>
            <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Signature Pad */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-navy-950/5" />
            <div className="flex items-center justify-between mb-6">
              <label className="text-sm font-bold text-navy-950 uppercase tracking-widest flex items-center gap-2">
                <PenTool className="w-4 h-4" />
                Área de Assinatura
              </label>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                Ambiente Seguro
              </div>
            </div>
            
            <div className="border-2 border-dashed border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 group-hover:bg-slate-50 transition-colors">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="#020617"
                canvasProps={{
                  className: "w-full h-72 cursor-crosshair"
                }}
              />
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={clear}
                className="btn-secondary flex-1"
              >
                <RefreshCw className="w-4 h-4" />
                Limpar
              </button>
              <button
                onClick={save}
                disabled={loading}
                className="btn-primary flex-[2]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Save className="w-4 h-4" /> 
                    Salvar Assinatura
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-400 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Dica: Use um mouse ou tela touch para desenhar sua assinatura da forma mais fiel possível ao seu documento de identidade.
            </p>
          </div>
        </div>

        {/* Current Signature Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm h-full flex flex-col">
            <h2 className="text-sm font-bold text-navy-950 uppercase tracking-widest mb-8 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Assinatura Ativa
            </h2>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              {savedSignature ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full space-y-8"
                >
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex items-center justify-center min-h-[160px]">
                    <img 
                      src={savedSignature} 
                      alt="Sua Assinatura" 
                      className="max-h-32 w-full object-contain filter drop-shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-950">Verificada e Ativa</p>
                    <p className="text-xs text-slate-500 mt-1">Pronta para uso em documentos oficiais.</p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4 opacity-40">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <PenTool className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400 italic">Nenhuma assinatura cadastrada.</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                Criptografia de Ponta a Ponta
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
