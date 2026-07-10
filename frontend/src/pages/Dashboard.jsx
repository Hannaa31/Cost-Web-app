import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Briefcase, Calendar, ChevronRight, Layers, X, AlertCircle, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    global_margin_pct: 0.15,
    global_erection_pct: 0.10,
    default_annual_escalation_pct: 0.045,
    conveyor_length_mtr: '',
    total_mine_life_years: '',
    phases: [],
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handlePhaseCountChange = (count) => {
    const parsed = parseInt(count);
    if (isNaN(parsed) || parsed < 1) {
      setNewProject({ ...newProject, phases: [] });
      return;
    }
    const num = Math.min(15, parsed);
    const currentPhases = [...newProject.phases];
    if (num > currentPhases.length) {
      for (let i = currentPhases.length; i < num; i++) {
        currentPhases.push({
          name: `Phase ${i + 1}`,
          from_year: '',
          to_year: '',
        });
      }
    } else if (num < currentPhases.length) {
      currentPhases.splice(num);
    }
    setNewProject({ ...newProject, phases: currentPhases });
  };

  const handlePhaseItemChange = (index, field, value) => {
    const updated = [...newProject.phases];
    updated[index] = {
      ...updated[index],
      [field]: field.includes('year') ? (value === '' ? '' : parseInt(value) || '') : value,
    };
    setNewProject({ ...newProject, phases: updated });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projRes, catRes] = await Promise.all([
        api.get('/projects'),
        api.get('/categories'),
      ]);
      setProjects(projRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/projects', {
        ...newProject,
        global_margin_pct: parseFloat(newProject.global_margin_pct) || 0.15,
        global_erection_pct: parseFloat(newProject.global_erection_pct) || 0.10,
        default_annual_escalation_pct: parseFloat(newProject.default_annual_escalation_pct) || 0.045,
        conveyor_length_mtr: parseFloat(newProject.conveyor_length_mtr) || 0,
        total_mine_life_years: parseInt(newProject.total_mine_life_years) || 0,
        phases: newProject.phases.map(ph => ({
          name: ph.name || 'Phase',
          from_year: parseInt(ph.from_year) || 0,
          to_year: parseInt(ph.to_year) || 0,
        })),
      });
      setIsModalOpen(false);
      setNewProject({
        name: '',
        client: '',
        global_margin_pct: 0.15,
        global_erection_pct: 0.10,
        default_annual_escalation_pct: 0.045,
        conveyor_length_mtr: '',
        total_mine_life_years: '',
        phases: [],
      });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (e, projectId, projectName) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete project "${projectName}" and all its equipment records?`)) {
      try {
        await api.delete(`/projects/${projectId}`);
        fetchDashboardData();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete project.');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 transition-all duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Estimation Projects
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Select or initialize a project
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary py-2 px-4 text-xs font-semibold cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Projects</div>
            <div className="text-xl font-bold text-white mt-0.5">{projects.length}</div>
          </div>
          <Briefcase className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Categories Configured</div>
            <div className="text-xl font-bold text-white mt-0.5">{categories.length}</div>
          </div>
          <Layers className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs font-mono">Loading estimation projects...</div>
      ) : projects.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3">
          <div className="text-sm font-semibold text-slate-300">No projects configured</div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-2 text-xs">
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, idx) => (
            <div
              key={project.id}
              className="glass-panel p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-all group relative"
            >
              <Link to={`/projects/${project.id}`} className="flex-1 block">
                <div className="flex items-start justify-between gap-3 pr-6">
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    #{idx + 1}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Client: <strong className="text-slate-300">{project.client}</strong>
                </div>

                <div className="mt-4 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-center font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] uppercase text-slate-300 font-semibold font-sans">Mine Life</div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5">
                        {project.total_mine_life_years || 26} Years
                      </div>
                    </div>
                    <div className="border-l border-slate-800">
                      <div className="text-[10px] uppercase text-slate-300 font-semibold font-sans">Phases</div>
                      <div className="text-xs font-bold text-cyan-400 mt-0.5">
                        {project.phases ? `${project.phases.length} Phases` : '3 Phases'}
                      </div>
                    </div>
                  </div>
                  {project.phases && project.phases.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap justify-center gap-1">
                      {project.phases.slice(0, 3).map((ph, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800">
                          {ph.name} ({ph.from_year}-{ph.to_year}y)
                        </span>
                      ))}
                      {project.phases.length > 3 && (
                        <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                          +{project.phases.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>

              {/* Absolute Delete Button on Card Top Right */}
              <button
                onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-400 transition-colors cursor-pointer p-1"
                title="Delete Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <Link to={`/projects/${project.id}`} className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/60 text-xs text-slate-300 block">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(project.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1 font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                  Enter <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel max-w-md w-full p-6 relative bg-slate-900 border border-slate-700">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-4">New Project</h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              {error && (
                <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g. GP-II"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  required
                  value={newProject.client}
                  onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                  placeholder="e.g. Client_X_India"
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div className="flex flex-col justify-end">
                  <label className="block text-[11px] leading-tight font-medium text-cyan-400 mb-1.5 min-h-[28px] flex items-end">
                    Total Mine Life (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newProject.total_mine_life_years}
                    onChange={(e) => setNewProject({ ...newProject, total_mine_life_years: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                    placeholder="e.g. 26"
                    className="input-field text-xs bg-slate-950 font-bold text-cyan-300 py-1.5 text-center"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="block text-[11px] leading-tight font-medium text-cyan-400 mb-1.5 min-h-[28px] flex items-end">
                    Number of Phases
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    required
                    value={newProject.phases.length || ''}
                    onChange={(e) => handlePhaseCountChange(e.target.value)}
                    placeholder="e.g. 3"
                    className="input-field text-xs bg-slate-950 font-bold text-cyan-300 py-1.5 text-center"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="block text-[11px] leading-tight font-medium text-cyan-400 mb-1.5 min-h-[28px] flex items-end">
                    Conveyor Length (R.Mtr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newProject.conveyor_length_mtr}
                    onChange={(e) => setNewProject({ ...newProject, conveyor_length_mtr: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                    placeholder="e.g. 2965"
                    className="input-field text-xs bg-slate-950 font-bold text-cyan-300 py-1.5 text-center"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Phase Period Configurations
                </div>
                {newProject.phases.map((ph, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-2 items-center">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Name</label>
                      <input
                        type="text"
                        value={ph.name}
                        onChange={(e) => handlePhaseItemChange(idx, 'name', e.target.value)}
                        className="input-field text-xs py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">From Year</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={ph.from_year}
                        onChange={(e) => handlePhaseItemChange(idx, 'from_year', e.target.value)}
                        placeholder="From"
                        className="input-field text-xs py-1 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">To Year</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={ph.to_year}
                        onChange={(e) => handlePhaseItemChange(idx, 'to_year', e.target.value)}
                        placeholder="To"
                        className="input-field text-xs py-1 text-center font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs py-1.5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary text-xs py-1.5 cursor-pointer"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
