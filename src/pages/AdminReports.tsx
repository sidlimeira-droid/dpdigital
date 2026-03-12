import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart3, TrendingUp, Download, Calendar, Filter, 
  FileText, Users, CheckCircle, Clock, Loader2, Search
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { motion } from 'motion/react';

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDocs: 0,
    signedDocs: 0,
    pendingDocs: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    const [docsRes, usersRes] = await Promise.all([
      supabase.from('documents').select('status'),
      supabase.from('profiles').select('id', { count: 'exact' })
    ]);

    if (docsRes.data) {
      const signed = docsRes.data.filter(d => d.status === 'assinado').length;
      setStats({
        totalDocs: docsRes.data.length,
        signedDocs: signed,
        pendingDocs: docsRes.data.length - signed,
        totalUsers: usersRes.count || 0
      });
    }
    setLoading(false);
  }

  const pieData = [
    { name: 'Assinados', value: stats.signedDocs, color: '#10b981' },
    { name: 'Pendentes', value: stats.pendingDocs, color: '#f59e0b' },
  ];

  const monthlyData = [
    { name: 'Jan', docs: 45, assinaturas: 38 },
    { name: 'Fev', docs: 52, assinaturas: 48 },
    { name: 'Mar', docs: stats.totalDocs, assinaturas: stats.signedDocs },
  ];

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
          <h1 className="text-3xl font-display font-bold text-navy-950 tracking-tight">Relatórios</h1>
          <p className="text-slate-500 mt-1">Análise detalhada de documentos e assinaturas.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Calendar className="w-4 h-4" />
            Março 2026
          </button>
          <button 
            onClick={() => window.print()}
            className="btn-primary"
          >
            <Download className="w-4 h-4" />
            Gerar PDF
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Documentos', value: stats.totalDocs, icon: FileText, color: 'blue' },
          { label: 'Assinados', value: stats.signedDocs, icon: CheckCircle, color: 'emerald' },
          { label: 'Pendentes', value: stats.pendingDocs, icon: Clock, color: 'amber' },
          { label: 'Colaboradores', value: stats.totalUsers, icon: Users, color: 'violet' },
        ].map((item, i) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className={`w-10 h-10 bg-${item.color}-50 text-${item.color}-600 rounded-xl flex items-center justify-center mb-4`}>
              <item.icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="text-2xl font-display font-bold text-navy-950 mt-1">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-navy-950">Evolução Mensal</h3>
              <p className="text-sm text-slate-500">Volume de documentos vs assinaturas.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Documentos
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                Assinaturas
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
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
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="docs" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="assinaturas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-navy-950 mb-2">Distribuição</h3>
          <p className="text-sm text-slate-500 mb-8">Status atual dos documentos.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-navy-950">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy-950">Histórico de Exportações</h3>
          <button className="text-sm font-bold text-navy-600 hover:underline">Ver tudo</button>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { name: 'Relatório Mensal - Fevereiro', date: '02/03/2026', size: '2.4 MB', type: 'PDF' },
            { name: 'Lista de Colaboradores Ativos', date: '28/02/2026', size: '1.1 MB', type: 'XLSX' },
            { name: 'Auditoria de Assinaturas Q1', date: '15/02/2026', size: '5.8 MB', type: 'PDF' },
          ].map((report) => (
            <div key={report.name} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-950">{report.name}</p>
                  <p className="text-xs text-slate-500">{report.date} • {report.size}</p>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-navy-950 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
