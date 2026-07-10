import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import api from '../services/api';
import {
  ArrowLeft,
  Sliders,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Download,
  Check,
  X,
  Edit2,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const formatINR = (amount) => {
  if (amount === undefined || amount === null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatIndianDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
};

const parseCompoundSpec = (key, valStr) => {
  const kLower = key.toLowerCase();
  const vStr = String(valStr);
  const vLower = vStr.toLowerCase();

  if (kLower.includes('dia') && kLower.includes('thk') && (kLower.includes('lagging') || kLower.includes('shaft'))) {
    const parts = vStr.split(/\s*[xX]\s*/);
    if (parts.length >= 4) {
      return [
        { label: 'Pulley Dia', value: parts[0] },
        { label: 'Shell Thk', value: parts[1] },
        { label: 'Lagging Thk/Type', value: parts[2] },
        { label: 'Shaft Dia', value: parts[3] },
      ];
    }
  }

  if ((kLower.includes('spec') || kLower.includes('desc') || kLower.includes('size')) && vStr.includes('x') && vStr.split(/\s*[xX]\s*/).length > 1) {
    const parts = vStr.split(/\s*[xX]\s*/);
    return parts.map((p, idx) => ({
      label: `Dim ${idx + 1}`,
      value: p,
    }));
  }

  if (kLower.includes('dia') && kLower.includes('len') && kLower.includes('shaft')) {
    const parts = vStr.split(/\s*[xX]\s*/);
    if (parts.length >= 3) {
      return [
        { label: 'Idler Dia', value: parts[0] },
        { label: 'Roller Length', value: parts[1] },
        { label: 'Shaft Dia', value: parts[2] },
      ];
    }
  }

  return null;
};

const ItemSpecificationsCell = ({ specifications }) => {
  const [isMinimized, setIsMinimized] = useState(true);

  if (!specifications || typeof specifications !== 'object') {
    return <span className="text-slate-400 font-mono text-xs">Standard</span>;
  }

  const entries = Object.entries(specifications).filter(([k]) => k !== 'Remarks');
  if (entries.length === 0) {
    return <span className="text-slate-400 font-mono text-xs">Standard</span>;
  }

  if (isMinimized && entries.length > 1) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="inline-flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded px-2 py-1 text-xs cursor-pointer transition-all max-w-[260px] truncate group"
        title="Click to expand full specifications"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
        <span className="truncate font-mono text-slate-200">
          {entries[0][0]}: <strong className="text-cyan-300">{String(entries[0][1])}</strong> (+{entries.length - 1} more)
        </span>
        <span className="text-[10px] text-cyan-400 shrink-0 font-semibold group-hover:underline">▼</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 max-w-md items-start">
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([k, v], idx) => {
          const compound = parseCompoundSpec(k, v);
          if (compound) {
            return (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 bg-slate-900/90 border border-cyan-500/30 rounded px-2 py-0.5 text-[11px]"
              >
                <span className="text-cyan-400 font-semibold">{k}:</span>
                <div className="flex items-center gap-1">
                  {compound.map((sub, sIdx) => (
                    <span key={sIdx} className="inline-flex items-center bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                      <span className="text-slate-400 mr-1 text-[10px]">{sub.label}:</span>
                      <span className="font-mono text-slate-200 font-medium">{sub.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-mono text-slate-300"
            >
              <span className="text-slate-400 font-sans">{k}:</span>
              <strong className="text-slate-200">{String(v)}</strong>
            </span>
          );
        })}
      </div>
      {entries.length > 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-1 mt-0.5 cursor-pointer"
        >
          ▲ Minimize Specs
        </button>
      )}
    </div>
  );
};

const DomainWorkspace = ({ domain, title, badgeColor, borderColor }) => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedParentCategory, setSelectedParentCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState({});
  const [selectedBenchmarkForLineItem, setSelectedBenchmarkForLineItem] = useState(null);
  const [quantityInput, setQuantityInput] = useState(1);
  const [selectedPhase, setSelectedPhase] = useState('All');
  const [exporting, setExporting] = useState(false);
  const [lineItemSuccessMsg, setLineItemSuccessMsg] = useState('');

  const [editingItem, setEditingItem] = useState(null);
  const [isEditingParams, setIsEditingParams] = useState(false);
  const [paramForm, setParamForm] = useState({ margin: 15.0, erection: 10.0, escalation: 4.5, conveyorLength: 2965 });
  const [minimizeQuotes, setMinimizeQuotes] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}`);
      return res.data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', domain],
    queryFn: async () => {
      const res = await api.get('/categories', { params: { domain } });
      return res.data;
    },
  });

  const activeCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === parseInt(selectedCategoryId, 10));
  }, [selectedCategoryId, categories]);

  const { data: validSpecsData = { valid_options: {} }, isFetching: isFetchingValidSpecs } = useQuery({
    queryKey: ['validSpecs', selectedCategoryId, selectedSpecs],
    queryFn: async () => {
      if (!selectedCategoryId) return { valid_options: {} };
      const res = await api.post(`/categories/${selectedCategoryId}/valid-specs`, {
        selected_specs: selectedSpecs,
      });
      return res.data;
    },
    enabled: !!selectedCategoryId,
    placeholderData: keepPreviousData,
  });

  const { data: benchmarkData, isFetching: isFetchingBenchmark } = useQuery({
    queryKey: ['benchmark', selectedCategoryId, selectedSpecs, projectId],
    queryFn: async () => {
      if (!selectedCategoryId) return null;
      const res = await api.post('/benchmark', {
        category_id: parseInt(selectedCategoryId, 10),
        specifications: selectedSpecs,
        project_id: parseInt(projectId, 10),
      });
      return res.data;
    },
    enabled: !!selectedCategoryId,
    placeholderData: keepPreviousData,
  });

  const { data: lineItems = [], isLoading: lineItemsLoading } = useQuery({
    queryKey: ['lineItems', projectId, domain],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/line-items`, { params: { domain } });
      return res.data;
    },
  });

  const { data: availableRatesForEdit = [] } = useQuery({
    queryKey: ['categoryRates', editingItem?.categoryId],
    queryFn: async () => {
      if (!editingItem?.categoryId) return [];
      const res = await api.get(`/categories/${editingItem.categoryId}/rates`);
      return res.data;
    },
    enabled: !!editingItem?.categoryId,
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put(`/projects/${projectId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['lineItems', projectId] });
      queryClient.invalidateQueries({ queryKey: ['benchmark'] });
      setIsEditingParams(false);
      setLineItemSuccessMsg('Project estimation parameters updated and all rates recalculated!');
      setTimeout(() => setLineItemSuccessMsg(''), 4000);
    },
  });

  const addLineItemMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(`/projects/${projectId}/line-items`, { ...payload, domain });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineItems', projectId, domain] });
      setSelectedBenchmarkForLineItem(null);
      setQuantityInput(1);
      setLineItemSuccessMsg('Equipment added to project report!');
      setTimeout(() => setLineItemSuccessMsg(''), 4000);
    },
  });

  const updateLineItemMutation = useMutation({
    mutationFn: async ({ itemId, quantity, selected_rate_id, phase_name }) => {
      const res = await api.put(`/projects/${projectId}/line-items/${itemId}`, {
        quantity,
        selected_rate_id,
        phase_name,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineItems', projectId, domain] });
      setEditingItem(null);
    },
  });

  const deleteLineItemMutation = useMutation({
    mutationFn: async (itemId) => {
      await api.delete(`/projects/${projectId}/line-items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineItems', projectId, domain] });
    },
  });

  const handleOpenParamsModal = () => {
    if (project) {
      setParamForm({
        margin: parseFloat((project.global_margin_pct * 100).toFixed(2)),
        erection: parseFloat((project.global_erection_pct * 100).toFixed(2)),
        escalation: parseFloat((project.default_annual_escalation_pct * 100).toFixed(2)),
        conveyorLength: project.conveyor_length_mtr || 0,
      });
      setIsEditingParams(true);
    }
  };

  const handleSaveParams = (e) => {
    e.preventDefault();
    updateProjectMutation.mutate({
      global_margin_pct: parseFloat(paramForm.margin) / 100,
      global_erection_pct: parseFloat(paramForm.erection) / 100,
      default_annual_escalation_pct: parseFloat(paramForm.escalation) / 100,
      conveyor_length_mtr: parseFloat(paramForm.conveyorLength) || 0,
    });
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await api.get(`/projects/${projectId}/export-excel`, {
        params: { domain },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${domain}_Report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate Excel report.');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    setSelectedCategoryId(val);
    setSelectedSpecs({});
    setSelectedBenchmarkForLineItem(null);
  };

  const handleSpecChange = (key, val) => {
    setSelectedSpecs((prev) => {
      const updated = { ...prev };
      if (!val || val === '') {
        delete updated[key];
      } else {
        updated[key] = val;
      }
      if (activeCategory?.spec_schema) {
        const idx = activeCategory.spec_schema.indexOf(key);
        if (idx !== -1) {
          for (let i = idx + 1; i < activeCategory.spec_schema.length; i++) {
            delete updated[activeCategory.spec_schema[i]];
          }
        }
      }
      return updated;
    });
    setSelectedBenchmarkForLineItem(null);
  };

  const handleResetSpecs = () => {
    setSelectedSpecs({});
    setSelectedBenchmarkForLineItem(null);
  };

  const benchmarkColumns = useMemo(
    () => [
      {
        accessorKey: 'vendor_name',
        header: 'Vendor Name',
        cell: (info) => (
          <span className="font-semibold text-slate-200">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: 'specifications',
        header: 'Specifications',
        cell: (info) => <ItemSpecificationsCell specifications={info.getValue()} />,
      },
      {
        accessorKey: 'quotation_date',
        header: 'Quote Date',
        cell: (info) => (
          <span className="text-slate-400 font-mono text-xs">
            {formatIndianDate(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'base_rate',
        header: 'Base Rate',
        cell: (info) => (
          <span className="font-mono text-slate-300">
            {formatINR(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'years_elapsed',
        header: 'Elapsed',
        cell: (info) => <span className="font-mono text-xs text-slate-400">{info.getValue()} yrs</span>,
      },
      {
        accessorKey: 'escalation_multiplier',
        header: 'Multiplier',
        cell: (info) => (
          <span className="font-mono text-xs text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900">
            {info.getValue()}x
          </span>
        ),
      },
      {
        accessorKey: 'escalated_rate',
        header: 'Escalated Rate',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {formatINR(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'remarks',
        header: 'Remarks',
        cell: (info) => (
          <span className="text-xs text-slate-300 italic">
            {info.getValue() || info.row.original?.specifications?.Remarks || '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            onClick={() => setSelectedBenchmarkForLineItem(row.original)}
            className="btn-primary py-1 px-3 text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-all"
          >
            <span>Select Equipment</span>
          </button>
        ),
      },
    ],
    []
  );

  const tableData = useMemo(() => benchmarkData?.benchmarks || [], [benchmarkData]);

  const table = useReactTable({
    data: tableData,
    columns: benchmarkColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalProjectCost = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + item.total_item_cost, 0);
  }, [lineItems]);

  const erectionAmount = project ? totalProjectCost * project.global_erection_pct : 0;
  const grandEstimateTotal = totalProjectCost + erectionAmount;

  if (projectLoading) {
    return <div className="text-center py-20 text-slate-400 text-sm font-mono">Loading {domain} workspace...</div>;
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
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-slate-700/60 shadow-sm"
            title="Back to Project Home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Project Home</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{title}</h1>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-bold ${badgeColor}`}>
                {domain}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Project: <strong className="text-slate-200">{project.name}</strong> • Client: {project.client}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Mine Life: <strong className="text-slate-200">{project.total_mine_life_years || 26} Yrs</strong></span>
            <span>Phases: <strong className="text-cyan-400">{project.phases ? project.phases.length : 3}</strong></span>
          </div>

          <button
            onClick={handleOpenParamsModal}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded border border-cyan-500/40 transition-all cursor-pointer ml-1"
            title="Modify EPC Markup, Erection, or Escalation Rate"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit Params</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded border border-emerald-500/40 transition-all cursor-pointer"
            title={`Download ${domain} Report (.xlsx)`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{exporting ? 'Generating...' : `Export ${domain} Report`}</span>
          </button>
        </div>
      </div>

      {lineItemSuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{lineItemSuccessMsg}</span>
        </div>
      )}

      {/* 1. Equipment Category Selection & Filters */}
      <div className={`glass-panel p-5 space-y-4 transition-all duration-300 border-l-4 ${borderColor}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>1. Select {domain} Equipment Category & Specifications</span>
          </span>
          {Object.keys(selectedSpecs).length > 0 && (
            <button
              onClick={handleResetSpecs}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3 h-3" /> Reset Filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {domain === 'Mechanical' && (
            <div className="min-w-[240px]">
              <select
                value={selectedParentCategory}
                onChange={(e) => {
                  setSelectedParentCategory(e.target.value);
                  setSelectedCategoryId('');
                  setSelectedSpecs({});
                }}
                className="input-field text-xs py-2 bg-slate-950 transition-all border-slate-700 font-semibold text-cyan-300"
              >
                <option value="">-- Choose Mechanical Category --</option>
                <option value="Belt Conveyor">Belt Conveyor</option>
                <option value="Auxiliary Equipment">Auxiliary Equipment</option>
                <option value="Hopper Above Crusher">Hopper above crusher</option>
                <option value="Major Equipment">Major equipment</option>
              </select>
            </div>
          )}

          {(domain !== 'Mechanical' || selectedParentCategory) && (
            <div className="min-w-[260px] animate-fadeIn">
              <select
                value={selectedCategoryId}
                onChange={handleCategoryChange}
                className="input-field text-xs py-2 bg-slate-950 transition-all border-slate-700"
              >
                <option value="">
                  {domain === 'Mechanical'
                    ? `-- Choose Sub-Equipment in ${selectedParentCategory} --`
                    : `-- Choose ${domain} Category --`}
                </option>
                {categories
                  .filter(
                    (cat) =>
                      domain !== 'Mechanical' ||
                      cat.parent_category?.toLowerCase() === selectedParentCategory.toLowerCase()
                  )
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {activeCategory && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800/60 transition-opacity duration-300 ${isFetchingValidSpecs ? 'opacity-70' : 'opacity-100'}`}>
            {activeCategory.spec_schema
              .filter((key) => !key.includes(' x ') && !key.includes(' X ') && !key.toLowerCase().includes('spec (') && !key.includes('(') && !key.includes(')'))
              .map((key) => {
                const availableOptions = validSpecsData.valid_options?.[key] || [];
                const currentVal = selectedSpecs[key] || '';
                const labelName = key === 'Type' ? `${activeCategory?.name?.replace(/s$/i, '') || 'Equipment'} Type` : (key === 'Belt Width' ? 'Belt Width (BW)' : key);

                return (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-200 mb-1 truncate" title={labelName}>
                      {labelName}
                    </label>
                    <select
                      value={currentVal}
                      onChange={(e) => handleSpecChange(key, e.target.value)}
                      className="input-field text-xs py-1.5 bg-slate-950 border-slate-800 transition-all"
                    >
                      <option value="">Any {labelName}</option>
                      {availableOptions.map((opt, i) => (
                        <option key={i} value={opt}>
                          {String(opt)}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 2. Benchmarking Table */}
      {activeCategory && (
        <div className={`glass-panel p-5 space-y-4 transition-all duration-300 ${isFetchingBenchmark ? 'opacity-75' : 'opacity-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                2. Available Vendor Quotes
              </span>
              <button
                type="button"
                onClick={() => setMinimizeQuotes(!minimizeQuotes)}
                className="text-[10px] px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-400 font-semibold cursor-pointer transition-all flex items-center gap-1"
              >
                {minimizeQuotes ? 'Expand Quotes ▼' : 'Minimize Quotes ▲'}
              </button>
            </div>
            {isFetchingBenchmark && (
              <span className="text-xs text-cyan-400 font-mono animate-pulse">Updating rates...</span>
            )}
          </div>

          {minimizeQuotes ? (
            <div
              onClick={() => setMinimizeQuotes(false)}
              className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-center text-xs text-slate-300 font-mono flex items-center justify-center gap-2 cursor-pointer hover:border-cyan-500/50 transition-all"
            >
              <span>Available vendor quotes minimized ({table.getRowModel().rows.length} total quotes).</span>
              <span className="text-cyan-400 underline font-semibold">Click to expand ▼</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs transition-all duration-300">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-slate-800 text-slate-200 bg-slate-950/80 font-bold">
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="p-3 font-semibold">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={benchmarkColumns.length} className="p-6 text-center text-slate-300 font-medium">
                        No vendor quotes match this specification combination.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="p-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Configure Selected Equipment Modal/Panel */}
      {selectedBenchmarkForLineItem && (
        <div className="glass-panel p-5 border border-cyan-500/40 bg-slate-900/95 space-y-4 animate-fadeIn transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-cyan-400">
              Configure & Add Equipment: {selectedBenchmarkForLineItem.vendor_name}
            </span>
            <button
              onClick={() => setSelectedBenchmarkForLineItem(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <span className="block text-[11px] text-slate-400">Quote Date</span>
              <div className="text-xs font-mono text-slate-200 mt-1">
                {formatIndianDate(selectedBenchmarkForLineItem.quotation_date)}
              </div>
            </div>

            <div>
              <span className="block text-[11px] text-slate-400">Escalated Unit Rate</span>
              <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                {formatINR(selectedBenchmarkForLineItem.escalated_rate)}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">
                Quantity Required
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                value={quantityInput === 0 ? '' : quantityInput}
                onChange={(e) => setQuantityInput(e.target.value === '' ? '' : e.target.value.replace(/^0+(?=\d)/, ''))}
                className="input-field py-1.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">
                Target Phase
              </label>
              <select
                value={selectedPhase === 'All' ? (project?.phases?.[0]?.name || 'Phase 1') : selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="input-field py-1.5 text-xs bg-slate-950 font-semibold text-cyan-300"
              >
                {(project?.phases || []).map((ph, idx) => (
                  <option key={idx} value={ph.name}>
                    {ph.name} ({ph.from_year} - {ph.to_year} Yrs)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                addLineItemMutation.mutate({
                  category_id: parseInt(selectedCategoryId, 10),
                  selected_rate_id: selectedBenchmarkForLineItem.rate_id,
                  quantity: quantityInput,
                  phase_name: selectedPhase === 'All' ? (project?.phases?.[0]?.name || 'Phase 1') : selectedPhase,
                });
              }}
              disabled={addLineItemMutation.isPending || quantityInput <= 0}
              className="btn-primary py-2 text-xs bg-emerald-500 hover:bg-emerald-400 font-semibold text-slate-950 cursor-pointer transition-all"
            >
              {addLineItemMutation.isPending ? 'Saving Equipment...' : '+ Add Equipment to Project'}
            </button>
          </div>
        </div>
      )}

      {/* 3. Saved Equipment List & Cost Report */}
      <div className="glass-panel p-5 space-y-4 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            3. {domain} Equipment Cost Report ({lineItems.filter(item => selectedPhase === 'All' || item.phase_name === selectedPhase).length})
          </span>
          {lineItems.length > 0 && (
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Generating Excel...' : `Export ${domain} Report (.xlsx)`}</span>
            </button>
          )}
        </div>

        {/* Phase Switcher Tab Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() => setSelectedPhase('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              selectedPhase === 'All'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Phases ({lineItems.length})
          </button>
          {(project?.phases || []).map((ph, idx) => {
            const count = lineItems.filter(item => item.phase_name === ph.name).length;
            return (
              <button
                key={idx}
                onClick={() => setSelectedPhase(ph.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  selectedPhase === ph.name
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                {ph.name} ({ph.from_year}-{ph.to_year} Yrs) [{count}]
              </button>
            );
          })}
        </div>

        {lineItemsLoading ? (
          <div className="text-center py-6 text-slate-300 font-medium text-xs">Loading equipment list...</div>
        ) : lineItems.filter(item => selectedPhase === 'All' || item.phase_name === selectedPhase).length === 0 ? (
          <div className="text-center py-6 text-slate-300 font-medium text-xs bg-slate-950/40 rounded border border-slate-800">
            No {domain.toLowerCase()} equipment added for {selectedPhase}. Select an equipment category above to begin building your project report.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs transition-all duration-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-200 bg-slate-950/80 font-bold">
                    <th className="p-3">Phase</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Specifications</th>
                    <th className="p-3">Vendor Name</th>
                    <th className="p-3 text-right">Base Rate</th>
                    <th className="p-3 text-right">Escalated Rate</th>
                    <th className="p-3 text-right">Remarks</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">EPC Markup</th>
                    <th className="p-3 text-right">Total Cost</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {lineItems
                    .filter(item => selectedPhase === 'All' || item.phase_name === selectedPhase)
                    .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-semibold text-cyan-400 font-mono text-[11px]">
                        {editingItem?.itemId === item.id ? (
                          <select
                            value={editingItem.phase_name}
                            onChange={(e) => setEditingItem({ ...editingItem, phase_name: e.target.value })}
                            className="input-field py-1 px-1.5 text-xs bg-slate-950 border-cyan-500/60 font-semibold text-cyan-300"
                          >
                            {(project?.phases || []).map((ph, idx) => (
                              <option key={idx} value={ph.name}>{ph.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span>{item.phase_name || 'Phase 1'}</span>
                        )}
                      </td>
                      <td className="p-3 font-medium text-slate-200">
                        {item.category?.name || `#${item.category_id}`}
                      </td>
                      <td className="p-3">
                        <ItemSpecificationsCell specifications={item.selected_rate?.specifications} />
                      </td>
                      <td className="p-3">
                        {editingItem?.itemId === item.id ? (
                          <select
                            value={editingItem.rateId}
                            onChange={(e) => setEditingItem({ ...editingItem, rateId: parseInt(e.target.value, 10) })}
                            className="input-field py-1 px-2 text-xs bg-slate-950 border-cyan-500/60 max-w-[240px]"
                          >
                            {(() => {
                              const matched = availableRatesForEdit.filter((r) => {
                                if (!r.specifications || !item.selected_rate?.specifications) return true;
                                const itemSpecs = item.selected_rate.specifications;
                                return Object.entries(itemSpecs).every(([k, v]) => k === 'Remarks' || String(r.specifications[k] || '').trim() === String(v || '').trim());
                              });
                              const listToRender = matched.length > 0 ? matched : availableRatesForEdit;
                              return listToRender.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.vendor_name} (Base: {formatINR(r.base_rate)})
                                </option>
                              ));
                            })()}
                          </select>
                        ) : (
                          <span className="font-semibold text-white">{item.selected_rate?.vendor_name}</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-400">
                        {formatINR(item.selected_rate?.base_rate || 0)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-semibold">
                        {formatINR(item.calculated_escalated_rate)}
                      </td>
                      <td className="p-3 text-slate-300 italic text-xs max-w-[180px]">
                        {item.selected_rate?.remarks || item.selected_rate?.specifications?.Remarks || '-'}
                      </td>
                      <td className="p-3 text-right font-mono text-cyan-400 font-semibold">
                        {editingItem?.itemId === item.id ? (
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={editingItem.qty === 0 ? '' : editingItem.qty}
                            onChange={(e) => setEditingItem({ ...editingItem, qty: e.target.value === '' ? '' : e.target.value.replace(/^0+(?=\d)/, '') })}
                            className="input-field w-16 py-0.5 px-1.5 text-xs font-mono text-right border-cyan-500/60"
                          />
                        ) : (
                          <span>{item.quantity}</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-300">
                        {(() => {
                          const baseSub = (item.calculated_escalated_rate || 0) * (item.quantity || 0);
                          const mp = item.selected_rate?.margin_pct ?? project?.global_margin_pct ?? 0;
                          return (
                            <>
                              <div>{formatINR(baseSub * mp)}</div>
                              <div className="text-[10px] text-slate-400">({(mp * 100).toFixed(1)}%)</div>
                            </>
                          );
                        })()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        {formatINR(item.total_item_cost)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {editingItem?.itemId === item.id ? (
                            <>
                              <button
                                onClick={() => updateLineItemMutation.mutate({
                                  itemId: item.id,
                                  quantity: editingItem.qty,
                                  selected_rate_id: editingItem.rateId,
                                  phase_name: editingItem.phase_name,
                                })}
                                className="text-emerald-400 hover:text-emerald-300 cursor-pointer p-1"
                                title="Save Vendor, Phase & Quantity"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="text-slate-400 hover:text-white cursor-pointer p-1"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingItem({
                                  itemId: item.id,
                                  qty: item.quantity,
                                  rateId: item.selected_rate_id,
                                  categoryId: item.category_id,
                                  phase_name: item.phase_name || 'Phase 1',
                                })}
                                className="text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors"
                                title="Change Vendor, Phase or Edit Quantity"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteLineItemMutation.mutate(item.id)}
                                className="text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
                                title="Delete Equipment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Box */}
            <div className="max-w-xs ml-auto bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs font-mono transition-all">
              <div className="flex justify-between text-slate-200 font-semibold">
                <span>{domain} Subtotal:</span>
                <span>{formatINR(totalProjectCost)}</span>
              </div>
              <div className="flex justify-between text-slate-200 font-semibold">
                <span>Erection ({(project.global_erection_pct * 100).toFixed(1)}%):</span>
                <span>{formatINR(erectionAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold text-white text-sm">
                <span>{domain} Grand Total:</span>
                <span className="text-emerald-400">{formatINR(grandEstimateTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Parameters Modal */}
      {isEditingParams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel max-w-sm w-full p-6 relative bg-slate-900 border border-slate-700">
            <button
              onClick={() => setIsEditingParams(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Edit Estimation Parameters</h3>
            <p className="text-xs text-slate-300 font-medium mb-4">
              Update project erection percentage and total conveyor length.
            </p>

            <form onSubmit={handleSaveParams} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Erection (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={paramForm.erection === 0 || paramForm.erection === '0' || paramForm.erection === '0.0' ? '' : paramForm.erection}
                  onChange={(e) => setParamForm({ ...paramForm, erection: e.target.value === '' ? '' : e.target.value.replace(/^0+(?=\d)/, '') })}
                  className="input-field text-xs py-1.5"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cyan-400 mb-1">
                  Conveyor Length (R.Mtr)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={paramForm.conveyorLength === 0 || paramForm.conveyorLength === '0' ? '' : paramForm.conveyorLength}
                  onChange={(e) => setParamForm({ ...paramForm, conveyorLength: e.target.value === '' ? '' : e.target.value.replace(/^0+(?=\d)/, '') })}
                  className="input-field text-xs py-1.5 border-cyan-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingParams(false)}
                  className="btn-secondary text-xs py-1.5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProjectMutation.isPending}
                  className="btn-primary text-xs py-1.5 cursor-pointer bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                >
                  {updateProjectMutation.isPending ? 'Recalculating...' : 'Save & Recalculate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DomainWorkspace;
