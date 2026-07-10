import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Database,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Filter,
  Search,
  Settings,
  AlertTriangle,
  Calendar,
  IndianRupee,
  Tag,
  Sliders,
  RefreshCw,
  FolderPlus,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

const AdminPanel = () => {
  const [categories, setCategories] = useState([]);
  const [masterRates, setMasterRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Category modal / editing states
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catDomain, setCatDomain] = useState('Mechanical');
  const [catParent, setCatParent] = useState('');
  const [catHasType, setCatHasType] = useState(false);
  const [catHasBw, setCatHasBw] = useState(false);
  const [catSpecSchema, setCatSpecSchema] = useState([]);
  const [newSpecKey, setNewSpecKey] = useState('');

  // Rate item form states (create / edit)
  const [editingRateId, setEditingRateId] = useState(null);
  const [rateVendor, setRateVendor] = useState('');
  const [rateBasePrice, setRateBasePrice] = useState('');
  const [rateDate, setRateDate] = useState(new Date().toISOString().split('T')[0]);
  const [rateMargin, setRateMargin] = useState(10); // %
  const [rateEscalation, setRateEscalation] = useState(4.5); // %
  const [rateRemarks, setRateRemarks] = useState('');
  const [rateTypeVal, setRateTypeVal] = useState('');
  const [rateBwVal, setRateBwVal] = useState('');
  const [rateSpecs, setRateSpecs] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, ratesRes] = await Promise.all([
        api.get('/categories'),
        api.get('/master-rates')
      ]);
      setCategories(catsRes.data || []);
      setMasterRates(ratesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeCategory = categories.find((c) => c.id === Number(selectedCategoryId));

  // Reset rate form when switching category or clicking Add New
  const resetRateForm = (cat = activeCategory) => {
    setEditingRateId(null);
    setRateVendor('');
    setRateBasePrice('');
    setRateDate(new Date().toISOString().split('T')[0]);
    setRateMargin(10);
    setRateEscalation(4.5);
    setRateRemarks('');
    setRateTypeVal('');
    setRateBwVal('');
    
    const initialSpecs = {};
    if (cat && cat.spec_schema) {
      cat.spec_schema.forEach((key) => {
        initialSpecs[key] = '';
      });
    }
    setRateSpecs(initialSpecs);
  };

  useEffect(() => {
    if (activeCategory && !editingRateId) {
      resetRateForm(activeCategory);
    }
  }, [selectedCategoryId]);

  // Handle Category Creation / Updating
  const openCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatDomain(cat.domain || 'Mechanical');
      setCatParent(cat.parent_category || '');
      setCatHasType(cat.has_type || false);
      setCatHasBw(cat.has_bw || false);
      setCatSpecSchema([...(cat.spec_schema || [])]);
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatDomain(activeCategory ? (activeCategory.domain || 'Mechanical') : (selectedDomain !== 'All' ? selectedDomain : 'Mechanical'));
      setCatParent('');
      setCatHasType(false);
      setCatHasBw(false);
      setCatSpecSchema([]);
    }
    setNewSpecKey('');
    setShowCatModal(true);
  };

  const handleAddSpecKey = () => {
    if (!newSpecKey.trim()) return;
    if (!catSpecSchema.includes(newSpecKey.trim())) {
      setCatSpecSchema([...catSpecSchema, newSpecKey.trim()]);
    }
    setNewSpecKey('');
  };

  const handleRemoveSpecKey = (keyToRemove) => {
    setCatSpecSchema(catSpecSchema.filter((k) => k !== keyToRemove));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return alert('Please enter a category name');
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, {
          name: catName,
          domain: catDomain,
          parent_category: catParent || null,
          has_type: catHasType,
          has_bw: catHasBw,
          spec_schema: catSpecSchema
        });
      } else {
        const res = await api.post('/categories', {
          name: catName,
          domain: catDomain,
          parent_category: catParent || null,
          has_type: catHasType,
          has_bw: catHasBw,
          spec_schema: catSpecSchema
        });
        setSelectedCategoryId(res.data.id);
      }
      setShowCatModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving category');
    }
  };

  const handleDeleteCategory = async (catId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this category and all its master rates?')) return;
    try {
      await api.delete(`/categories/${catId}`);
      if (Number(selectedCategoryId) === catId) {
        setSelectedCategoryId('');
      }
      fetchData();
    } catch (err) {
      alert('Error deleting category');
    }
  };

  // Handle Rate Item Creation / Updating
  const handleSaveRateItem = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId) return alert('Please select a category first.');
    if (!rateVendor.trim() || !rateBasePrice) return alert('Vendor Name and Base Price are required.');

    const finalSpecs = { ...rateSpecs };
    if (activeCategory?.has_type && rateTypeVal.trim()) {
      finalSpecs['Type'] = rateTypeVal.trim();
    }
    if (activeCategory?.has_bw && rateBwVal.trim()) {
      finalSpecs['Belt Width'] = rateBwVal.trim();
    }

    const payload = {
      category_id: Number(selectedCategoryId),
      vendor_name: rateVendor.trim(),
      base_rate: parseFloat(rateBasePrice),
      quotation_date: rateDate ? `${rateDate}T00:00:00` : new Date().toISOString(),
      margin_pct: parseFloat(rateMargin) / 100,
      escalation_pct: parseFloat(rateEscalation) / 100,
      remarks: rateRemarks.trim() || null,
      specifications: finalSpecs
    };

    try {
      if (editingRateId) {
        await api.put(`/master-rates/${editingRateId}`, payload);
      } else {
        await api.post('/master-rates', payload);
      }
      resetRateForm(activeCategory);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving equipment item.');
    }
  };

  const handleEditRate = (rate) => {
    setEditingRateId(rate.id);
    setSelectedCategoryId(rate.category_id);
    setRateVendor(rate.vendor_name || '');
    setRateBasePrice(rate.base_rate || '');
    if (rate.quotation_date) {
      setRateDate(rate.quotation_date.split('T')[0]);
    } else {
      setRateDate(new Date().toISOString().split('T')[0]);
    }
    setRateMargin(rate.margin_pct !== undefined ? round(rate.margin_pct * 100, 2) : 10);
    setRateEscalation(rate.escalation_pct !== undefined ? round(rate.escalation_pct * 100, 2) : 4.5);
    setRateRemarks(rate.remarks || '');

    const specs = rate.specifications || {};
    setRateTypeVal(specs['Type'] || specs['Pulley Type'] || specs['Idler Type'] || '');
    setRateBwVal(specs['Belt Width'] || specs['BW'] || specs['BW (mm)'] || '');

    const cat = categories.find((c) => c.id === rate.category_id);
    const newRateSpecs = {};
    if (cat && cat.spec_schema) {
      cat.spec_schema.forEach((key) => {
        newRateSpecs[key] = specs[key] !== undefined && specs[key] !== null ? strVal(specs[key]) : '';
      });
    } else {
      Object.entries(specs).forEach(([k, v]) => {
        if (!['Type', 'Belt Width', 'BW', 'Remarks'].includes(k)) {
          newRateSpecs[k] = v !== undefined && v !== null ? strVal(v) : '';
        }
      });
    }
    setRateSpecs(newRateSpecs);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRate = async (rateId) => {
    if (!window.confirm('Are you sure you want to delete this master equipment quotation?')) return;
    try {
      await api.delete(`/master-rates/${rateId}`);
      if (editingRateId === rateId) resetRateForm();
      fetchData();
    } catch (err) {
      alert('Error deleting item.');
    }
  };

  const round = (num, decimals = 2) => Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
  const strVal = (val) => (typeof val === 'object' ? JSON.stringify(val) : String(val));

  // Filtered categories & rates
  const filteredCategories = categories.filter((c) => {
    if (selectedDomain !== 'All' && c.domain !== selectedDomain) return false;
    return true;
  });

  const filteredRates = masterRates.filter((r) => {
    if (selectedCategoryId && r.category_id !== Number(selectedCategoryId)) return false;
    if (selectedDomain !== 'All') {
      const cat = categories.find((c) => c.id === r.category_id);
      if (!cat || cat.domain !== selectedDomain) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const vendorMatch = (r.vendor_name || '').toLowerCase().includes(q);
      const remMatch = (r.remarks || '').toLowerCase().includes(q);
      const specMatch = JSON.stringify(r.specifications || {}).toLowerCase().includes(q);
      return vendorMatch || remMatch || specMatch;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Equipment Catalog & Schema Administration
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Add, update, and manage equipment categories, dynamic specification schemas, and vendor quotation pricing directly in the app. No Python scripts or Excel ETL needed.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openCategoryModal()}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer text-sm"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ New Equipment Category</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Domain & Category Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Domain Filter Bar */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
              1. Filter by Domain
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['All', 'Mechanical', 'Electrical', 'Civil'].map((dom) => (
                <button
                  key={dom}
                  onClick={() => {
                    setSelectedDomain(dom);
                    setSelectedCategoryId('');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                    selectedDomain === dom
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800/60'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector / Schema Config */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                2. Select Equipment Category
              </label>
              <span className="text-xs text-purple-400 font-semibold">
                {filteredCategories.length} Categories
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const isSelected = Number(selectedCategoryId) === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-500/15 border-purple-500/40 text-white shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950/80'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <span>{cat.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {cat.domain}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                        {cat.has_type && <span className="text-cyan-400 font-medium">+Type</span>}
                        {cat.has_bw && <span className="text-amber-400 font-medium">+BW</span>}
                        <span>• {cat.spec_schema?.length || 0} specs</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCategoryModal(cat);
                        }}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="Edit Schema & Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCategory(cat.id, e)}
                        className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  No categories found. Click "+ New Equipment Category" to create one.
                </div>
              )}
            </div>

            {activeCategory && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Selected: <strong className="text-white">{activeCategory.name}</strong></span>
                <button
                  onClick={() => openCategoryModal(activeCategory)}
                  className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Edit Schema Configuration</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Item Management & Catalog (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Rate Item Form (Add / Edit) */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {editingRateId ? (
                    <>
                      <Edit3 className="w-5 h-5 text-amber-400" />
                      <span>Edit Quotation #{editingRateId} in {activeCategory ? activeCategory.name : 'Selected Category'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-purple-400" />
                      <span>Add New Equipment to {activeCategory ? activeCategory.name : 'Catalog'}</span>
                    </>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {activeCategory
                    ? `Enter vendor pricing, quotation date, EPC Markup, escalation rate, and exact schema specifications for ${activeCategory.name}.`
                    : 'Select a category from the left sidebar to add a new equipment item.'}
                </p>
              </div>

              {editingRateId && (
                <button
                  onClick={() => resetRateForm()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {!activeCategory ? (
              <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-400 text-sm">
                <Info className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-80" />
                Please select an Equipment Category on the left to start adding or updating items.
              </div>
            ) : (
              <form onSubmit={handleSaveRateItem} className="space-y-6">
                {/* Core Pricing & Vendor Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Vendor / Manufacturer *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fenner India / Elecon"
                      value={rateVendor}
                      onChange={(e) => setRateVendor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Base Price / Unit Rate (INR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="150000.00"
                        value={rateBasePrice === 0 || rateBasePrice === '0' || rateBasePrice === '0.0' ? '' : rateBasePrice}
                        onChange={(e) => setRateBasePrice(e.target.value === '' ? '' : e.target.value.replace(/^0+(?=\d)/, ''))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Quotation Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={rateDate}
                      onChange={(e) => setRateDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Margin, Escalation & Optional Type/BW Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800/50">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Default EPC Markup (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={rateMargin === 0 || rateMargin === '0' || rateMargin === '0.0' ? '' : rateMargin}
                        onChange={(e) => setRateMargin(e.target.value === '' ? '' : e.target.value.replace(/^0+(?=\d)/, ''))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                      <span className="absolute right-3.5 top-2 text-slate-500 text-xs">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Annual Escalation Rate (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={rateEscalation === 0 || rateEscalation === '0' || rateEscalation === '0.0' ? '' : rateEscalation}
                        onChange={(e) => setRateEscalation(e.target.value === '' ? '' : e.target.value.replace(/^0+(?=\d)/, ''))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                      <span className="absolute right-3.5 top-2 text-slate-500 text-xs">% / yr</span>
                    </div>
                  </div>

                  {activeCategory.has_type && (
                    <div>
                      <label className="block text-xs font-semibold text-cyan-300 mb-1.5">
                        Equipment Type / Sub-Type *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Drive Pulley"
                        value={rateTypeVal}
                        onChange={(e) => setRateTypeVal(e.target.value)}
                        className="w-full bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-3.5 py-2 text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}

                  {activeCategory.has_bw && (
                    <div>
                      <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                        Belt Width (BW) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1200 mm"
                        value={rateBwVal}
                        onChange={(e) => setRateBwVal(e.target.value)}
                        className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-amber-200 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}
                </div>

                {/* Dynamic Schema Specification Inputs */}
                <div className="pt-4 border-t border-slate-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                      Dynamic Schema Specifications ({activeCategory.spec_schema?.length || 0} fields)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      These parameters define the specification schema matching option for estimators.
                    </span>
                  </div>

                  {(!activeCategory.spec_schema || activeCategory.spec_schema.length === 0) ? (
                    <div className="text-xs text-slate-500 py-3 italic">
                      No custom schema attributes defined for this category. Click "Edit Schema Configuration" to add specifications like Dia, Shell Thk, etc.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {activeCategory.spec_schema.map((specKey) => (
                        <div key={specKey}>
                          <label className="block text-xs text-slate-400 font-medium mb-1 truncate" title={specKey}>
                            {specKey}
                          </label>
                          <input
                            type="text"
                            placeholder={`Enter ${specKey}...`}
                            value={rateSpecs[specKey] || ''}
                            onChange={(e) => setRateSpecs({ ...rateSpecs, [specKey]: e.target.value })}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Remarks Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Remarks / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Any specific technical notes, duty classification, or supplier terms..."
                    value={rateRemarks}
                    onChange={(e) => setRateRemarks(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  {editingRateId && (
                    <button
                      type="button"
                      onClick={() => resetRateForm()}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingRateId ? 'Update Quotation Rate' : 'Save Equipment to Catalog'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Catalog Items Table */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-bold text-white">
                  Existing Master Equipment Catalog ({filteredRates.length} items)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  View, edit, or delete stored pricing and technical specifications across categories.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 font-mono text-sm">Loading master catalog data...</div>
            ) : filteredRates.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800/80 rounded-xl">
                No equipment items found matching filters. Add your first quotation using the form above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3">Category & Type</th>
                      <th className="py-3 px-3">Specification Attributes</th>
                      <th className="py-3 px-3">Vendor & Date</th>
                      <th className="py-3 px-3 text-right">Base Price (INR)</th>
                      <th className="py-3 px-3 text-center">EPC Markup / Esc</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredRates.map((rate) => {
                      const cat = categories.find((c) => c.id === rate.category_id);
                      const specs = rate.specifications || {};
                      const typeStr = specs['Type'] || specs['Pulley Type'] || specs['Idler Type'];
                      const bwStr = specs['Belt Width'] || specs['BW'] || specs['BW (mm)'];

                      // Build clean spec string
                      const specEntries = Object.entries(specs).filter(
                        ([k, v]) => !['Type', 'Pulley Type', 'Idler Type', 'Belt Width', 'BW', 'Remarks'].includes(k) && v !== null && strVal(v).trim() !== ''
                      );

                      return (
                        <tr key={rate.id} className="hover:bg-slate-950/40 transition-colors group">
                          <td className="py-3 px-3 align-top">
                            <div className="font-bold text-white text-sm">
                              {cat ? cat.name : `Category #${rate.category_id}`}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {typeStr && (
                                <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold text-[10px]">
                                  {typeStr}
                                </span>
                              )}
                              {bwStr && (
                                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-[10px]">
                                  BW: {bwStr}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 align-top max-w-xs">
                            {specEntries.length === 0 ? (
                              <span className="text-slate-500 italic text-[11px]">No specs entered</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {specEntries.map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700/60"
                                  >
                                    <strong className="text-purple-300 font-sans">{k}:</strong> {strVal(v)}
                                  </span>
                                ))}
                              </div>
                            )}
                            {rate.remarks && (
                              <div className="text-[11px] text-slate-400 mt-1.5 italic">
                                "{rate.remarks}"
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 align-top">
                            <div className="font-semibold text-slate-200">{rate.vendor_name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                              {rate.quotation_date ? rate.quotation_date.split('T')[0] : 'N/A'}
                            </div>
                          </td>

                          <td className="py-3 px-3 align-top text-right font-mono font-bold text-emerald-400 text-sm">
                            ₹ {Number(rate.base_rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-3 align-top text-center text-[11px] text-slate-300 font-mono">
                            <div>EPC: <span className="text-purple-300 font-semibold">{rate.margin_pct !== undefined ? round(rate.margin_pct * 100, 1) : 10}%</span></div>
                            <div className="mt-0.5">E: <span className="text-cyan-300 font-semibold">{rate.escalation_pct !== undefined ? round(rate.escalation_pct * 100, 1) : 4.5}%</span>/yr</div>
                          </td>

                          <td className="py-3 px-3 align-top text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditRate(rate)}
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                                title="Edit Quotation / Price / Specs"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRate(rate.id)}
                                className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                title="Delete Quotation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Schema & Settings Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl max-h-[88vh] flex flex-col my-auto overflow-hidden">
            {/* Sticky Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
                <span className="truncate">{editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Equipment Category'}</span>
              </h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex flex-col flex-grow overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pulleys / Conveyor Belts / Transformers"
                      value={catName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCatName(val);
                        if (!editingCategory && val.trim()) {
                          const match = categories.find(c => c.name.toLowerCase() === val.trim().toLowerCase() || (c.parent_category || '').toLowerCase() === val.trim().toLowerCase());
                          if (match) {
                            setCatDomain(match.domain || 'Mechanical');
                            setCatParent(match.parent_category || '');
                            setCatHasType(match.has_type || false);
                            setCatHasBw(match.has_bw || false);
                          }
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Engineering Domain *
                    </label>
                    <select
                      value={catDomain}
                      onChange={(e) => setCatDomain(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Mechanical">Mechanical</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Civil">Civil</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Parent Category / Grouping (Optional)
                  </label>
                  <input
                    type="text"
                    list="parent-categories-list"
                    placeholder="e.g. Belt Conveyor / Structural / Power Supply"
                    value={catParent}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCatParent(val);
                      if (!editingCategory && val.trim()) {
                        const match = categories.find(c => (c.parent_category || '').toLowerCase() === val.trim().toLowerCase() || c.name.toLowerCase() === val.trim().toLowerCase());
                        if (match) {
                          setCatDomain(match.domain || 'Mechanical');
                          setCatHasType(match.has_type || false);
                          setCatHasBw(match.has_bw || false);
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <datalist id="parent-categories-list">
                    {[...new Set(categories.map(c => c.parent_category).filter(Boolean))].map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                {/* Toggles for Type & BW */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catHasType}
                      onChange={(e) => setCatHasType(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-900 shrink-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Enable Equipment Type</span>
                      <span className="text-[10px] text-slate-400 block sm:inline">Prompts for type like Drive vs Tail Pulley</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catHasBw}
                      onChange={(e) => setCatHasBw(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-700 bg-slate-900 shrink-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Enable Belt Width (BW)</span>
                      <span className="text-[10px] text-slate-400 block sm:inline">Prompts for separate Belt Width parameter</span>
                    </div>
                  </label>
                </div>

                {/* Dynamic Specification Schema Builder */}
                <div className="space-y-3 pt-1">
                  <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Specification Schema Attributes ({catSpecSchema.length})
                  </label>
                  <p className="text-xs text-slate-400">
                    Add attributes defining technical variants (e.g., Dia, Shell Thk, Voltage). Estimators will fill these exact fields.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="New attribute name (e.g. Dia / Shell Thk / Lagging)..."
                      value={newSpecKey}
                      onChange={(e) => setNewSpecKey(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSpecKey();
                        }
                      }}
                      className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSpecKey}
                      className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      + Add Attribute
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 min-h-[60px] max-h-[140px] overflow-y-auto">
                    {catSpecSchema.length === 0 ? (
                      <span className="text-xs text-slate-500 italic my-auto">No custom specification attributes added yet.</span>
                    ) : (
                      catSpecSchema.map((key) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs font-mono shrink-0"
                        >
                          <span>{key}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecKey(key)}
                            className="hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Footer Buttons */}
              <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
                >
                  Save Category Schema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
