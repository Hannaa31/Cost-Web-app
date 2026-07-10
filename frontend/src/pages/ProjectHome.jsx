import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  ArrowLeft,
  FileSpreadsheet,
  Settings,
  Wrench,
  Zap,
  Building2,
  ChevronRight,
  TrendingUp,
  IndianRupee,
  PieChart,
  RefreshCw,
  Layers,
  CheckCircle2,
} from 'lucide-react';

const formatINR = (amount) => {
  if (amount === undefined || amount === null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

const ProjectHome = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}`);
      return res.data;
    },
  });

  const { data: lineItems = [], isLoading: lineItemsLoading } = useQuery({
    queryKey: ['lineItems', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/line-items`);
      return res.data;
    },
  });

  const { mechItems, elecItems, civilItems, mechSub, elecSub, civilSub, subtotal, marginAmount, erectionAmount, grandTotal } = useMemo(() => {
    const mech = lineItems.filter((i) => i.domain === 'Mechanical' || i.category?.domain === 'Mechanical');
    const elec = lineItems.filter((i) => i.domain === 'Electrical' || i.category?.domain === 'Electrical');
    const civil = lineItems.filter((i) => i.domain === 'Civil' || i.category?.domain === 'Civil');

    const mSub = mech.reduce((acc, i) => acc + i.total_item_cost, 0);
    const eSub = elec.reduce((acc, i) => acc + i.total_item_cost, 0);
    const cSub = civil.reduce((acc, i) => acc + i.total_item_cost, 0);

    const tot = mSub + eSub + cSub;
    const margin = project ? tot * project.global_margin_pct : 0;
    const erection = project ? (tot + margin) * project.global_erection_pct : 0;
    const grand = tot + margin + erection;

    return {
      mechItems: mech,
      elecItems: elec,
      civilItems: civil,
      mechSub: mSub,
      elecSub: eSub,
      civilSub: cSub,
      subtotal: tot,
      marginAmount: margin,
      erectionAmount: erection,
      grandTotal: grand,
    };
  }, [lineItems, project]);

  if (projectLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-slate-400 font-mono text-sm">Loading project executive dashboard...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-white">Project Not Found</h2>
        <Link to="/dashboard" className="btn-primary inline-flex mt-4 text-xs">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fadeIn">
      {/* Top Bar / Breadcrumbs & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 shadow-sm shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white">{project.name}</h1>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold">
                {project.client}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300 font-mono">
              <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                Total Mine Life: <strong className="text-white">{project.total_mine_life_years || 26} Years</strong>
              </span>
              <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                Phases: <strong className="text-cyan-400">{project.phases ? project.phases.length : 3} Phases</strong>
              </span>
              {project.phases && project.phases.map((ph, idx) => (
                <span key={idx} className="text-[11px] bg-slate-900/80 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                  {ph.name}: {ph.from_year}-{ph.to_year}y
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Financial Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 border-l-4 border-emerald-500 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mechanical Subtotal</span>
            <Wrench className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">{formatINR(mechSub)}</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between font-mono">
            <span>{mechItems.length} line items</span>
            <span className="text-emerald-400">{subtotal > 0 ? `${((mechSub / subtotal) * 100).toFixed(1)}% of equip` : '0%'}</span>
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-amber-500 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Electrical Subtotal</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">{formatINR(elecSub)}</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between font-mono">
            <span>{elecItems.length} line items</span>
            <span className="text-amber-400">{subtotal > 0 ? `${((elecSub / subtotal) * 100).toFixed(1)}% of equip` : '0%'}</span>
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-indigo-500 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Civil Subtotal</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">{formatINR(civilSub)}</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between font-mono">
            <span>{civilItems.length} line items</span>
            <span className="text-indigo-400">{subtotal > 0 ? `${((civilSub / subtotal) * 100).toFixed(1)}% of equip` : '0%'}</span>
          </div>
        </div>

        <div className="glass-panel p-5 border-l-4 border-cyan-500 flex flex-col justify-between shadow-xl shadow-cyan-950/20">
          <div className="flex items-center justify-between text-cyan-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Grand Project Total</span>
            <IndianRupee className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">{formatINR(grandTotal)}</div>
          <div className="text-[11px] text-slate-300 mt-2 flex items-center justify-between font-mono border-t border-slate-800 pt-2">
            <span>Equip: {formatINR(subtotal)}</span>
            <span>+EPC/E: {formatINR(marginAmount + erectionAmount)}</span>
          </div>
        </div>
      </div>

      {/* Domain Discipline Portal Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Engineering Disciplines</span>
          </h2>
          <span className="text-xs text-slate-400">Select a discipline to configure specifications and benchmark vendor quotes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mechanical Portal */}
          <Link
            to={`/projects/${projectId}/mechanical`}
            className="group relative glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all"></div>
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md shadow-emerald-950/50">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Mechanical Discipline
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Estimate conveyor components, Pulleys, Belts, Idlers, Drive Units, and mechanical assemblies with dynamic specification filtering.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="font-mono">
                <span className="block text-[10px] uppercase text-slate-500 font-bold">Discipline Total</span>
                <span className="text-sm font-bold text-emerald-400">{formatINR(mechSub)}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Enter Discipline</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Electrical Portal */}
          <Link
            to={`/projects/${projectId}/electrical`}
            className="group relative glass-panel p-6 rounded-2xl border border-slate-800 hover:border-amber-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all"></div>
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md shadow-amber-950/50">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                Electrical Discipline
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Benchmark Transformers, Switchgears, Power Cables, Control Panels, Motors, and substation electrification infrastructure.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="font-mono">
                <span className="block text-[10px] uppercase text-slate-500 font-bold">Discipline Total</span>
                <span className="text-sm font-bold text-amber-400">{formatINR(elecSub)}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                <span>Enter Discipline</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Civil Portal */}
          <Link
            to={`/projects/${projectId}/civil`}
            className="group relative glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all"></div>
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md shadow-indigo-950/50">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                Civil Discipline
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Configure RCC Structures, Foundations, Structural Steelwork, Excavation, Roads, Drainage, and industrial shed structures.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="font-mono">
                <span className="block text-[10px] uppercase text-slate-500 font-bold">Discipline Total</span>
                <span className="text-sm font-bold text-indigo-400">{formatINR(civilSub)}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Enter Discipline</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectHome;
