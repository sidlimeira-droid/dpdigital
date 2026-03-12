import React, { useState } from 'react';
import { 
  Settings, User, Bell, Shield, Database, Globe, 
  Save, Loader2, CheckCircle, Smartphone, Mail
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  const sections = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'integrations', label: 'Integrações', icon: Database },
  ];

  const [activeSection, setActiveSection] = useState('general');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-navy-950 tracking-tight">Configurações</h1>
        <p className="text-slate-500 mt-1">Gerencie as preferências do sistema e sua conta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                activeSection === section.id 
                  ? 'bg-navy-950 text-white shadow-lg shadow-navy-950/10' 
                  : 'text-slate-500 hover:bg-white hover:text-navy-950 border border-transparent hover:border-slate-200'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <motion.div 
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-bold text-navy-950">
                {sections.find(s => s.id === activeSection)?.label}
              </h3>
              <p className="text-sm text-slate-500">Ajuste as configurações desta seção.</p>
            </div>

            <div className="p-8 space-y-8">
              {activeSection === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Nome da Empresa</label>
                      <input type="text" defaultValue="Sistema DP Ltda" className="input-field" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">CNPJ</label>
                      <input type="text" defaultValue="00.000.000/0001-00" className="input-field" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Idioma do Sistema</label>
                    <select className="input-field">
                      <option>Português (Brasil)</option>
                      <option>English</option>
                      <option>Español</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200">
                        <Globe className="w-5 h-5 text-navy-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-950">Fuso Horário</p>
                        <p className="text-xs text-slate-500">Brasília (GMT-3)</p>
                      </div>
                    </div>
                    <button className="text-xs font-bold text-navy-600 hover:underline">Alterar</button>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy-950">Notificações por E-mail</p>
                          <p className="text-xs text-slate-500">Receba alertas de novos documentos assinados.</p>
                        </div>
                      </div>
                      <div className="w-12 h-6 bg-navy-950 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy-950">Notificações Push</p>
                          <p className="text-xs text-slate-500">Alertas em tempo real no navegador.</p>
                        </div>
                      </div>
                      <div className="w-12 h-6 bg-slate-200 rounded-full relative">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Senha Atual</label>
                    <input type="password" placeholder="••••••••" className="input-field" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Nova Senha</label>
                      <input type="password" placeholder="••••••••" className="input-field" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Confirmar Nova Senha</label>
                      <input type="password" placeholder="••••••••" className="input-field" />
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                    <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      A autenticação de dois fatores (2FA) está desativada. Recomendamos ativar para maior segurança da conta administrativa.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
                <button className="btn-secondary">Descartar</button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary min-w-[140px]"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    success ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Salvando...' : (success ? 'Salvo!' : 'Salvar Alterações')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
