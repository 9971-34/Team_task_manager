import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Search, Calendar, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { projectApi, userApi } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { AvatarGroup, Badge, ProgressBar, EmptyState } from '../../components/common/Avatar';
import { PROJECT_STATUS_CONFIG, PRIORITY_CONFIG, formatDate, calcProgress } from '../../utils/helpers';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const ProjectCard = ({ project, onDelete, isAdmin }) => {
  const statusCfg = PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG.active;
  const priCfg = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium;
  const stats = project.task_stats || { total: 0, completed: 0 };
  const progress = calcProgress(stats);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="card p-5 hover:shadow-md transition-all flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: project.color + '20' }}>
            <FolderKanban size={18} style={{ color: project.color }} />
          </div>
          <div className="min-w-0">
            <Link to={`/projects/${project.id}`} className="font-display font-semibold text-slate-800 dark:text-white hover:text-indigo-600 transition-colors line-clamp-1">{project.name}</Link>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{project.description || 'No description'}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="relative shrink-0">
            <button onClick={() => setMenuOpen(p => !p)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-32 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg z-10">
                <button onClick={() => { onDelete(project); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50">Delete</button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
        <Badge className={priCfg.color}>{priCfg.label}</Badge>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">{stats.completed || 0}/{stats.total || 0} tasks</span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{progress}%</span>
        </div>
        <ProgressBar value={progress} color={progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'} />
      </div>
      <div className="flex items-center justify-between pt-1">
        <AvatarGroup users={project.members || []} max={4} size="xs" />
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar size={12} />
          {project.due_date ? formatDate(project.due_date) : 'No deadline'}
        </div>
      </div>
    </div>
  );
};

const Projects = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active', priority: 'medium', color: '#6366f1', due_date: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await projectApi.getAll({ search, status: statusFilter });
      setProjects(data.data.projects || []);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Project name required');
    setFormLoading(true);
    try {
      await projectApi.create(formData);
      toast.success('Project created');
      setShowForm(false);
      setFormData({ name: '', description: '', status: 'active', priority: 'medium', color: '#6366f1', due_date: '' });
      load();
    } catch { toast.error('Failed to create project'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await projectApi.delete(deleteTarget.id);
      setProjects(p => p.filter(x => x.id !== deleteTarget.id));
      toast.success('Project deleted');
      setDeleteTarget(null);
    } catch { toast.error('Failed to delete project'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="py-2 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
        {isAdmin && <Button icon={Plus} onClick={() => setShowForm(true)}>New Project</Button>}
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : projects.length === 0 ? <EmptyState icon={FolderKanban} title="No projects found" description={isAdmin ? 'Create your first project.' : 'No projects assigned yet.'} action={isAdmin && <Button icon={Plus} onClick={() => setShowForm(true)}>Create Project</Button>} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => <ProjectCard key={p.id} project={p} isAdmin={isAdmin} onDelete={setDeleteTarget} />)}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Project" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Project Name</label>
            <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Website Redesign" required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-xl border bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="What is this project about?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800">
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
            <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} className="px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Due Date</label>
            <input type="date" value={formData.due_date} onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))} className="w-full rounded-xl border bg-white dark:bg-slate-800 px-4 py-2.5 text-sm" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Create Project</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Projects;