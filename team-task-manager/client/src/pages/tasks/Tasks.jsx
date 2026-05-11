import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, CheckSquare, X } from 'lucide-react';
import { taskApi, projectApi } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { Select } from '../../components/common/Input';
import { EmptyState } from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import { Avatar, Badge } from '../../components/common/Avatar';
import { STATUS_CONFIG, PRIORITY_CONFIG, getDueDateLabel, isOverdue } from '../../utils/helpers';
import toast from 'react-hot-toast';

const TaskCard = ({ task, onStatusUpdate, isAdmin }) => {
  const [updating, setUpdating] = useState(false);
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const priCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const overdue = isOverdue(task.due_date, task.status);

  const cycleStatus = async () => {
    const cycle = { 'todo': 'in-progress', 'in-progress': 'completed', 'completed': 'todo' };
    const next = cycle[task.status];
    setUpdating(true);
    try { await onStatusUpdate(task.id, next); }
    finally { setUpdating(false); }
  };

  return (
    <div className={`card p-4 hover:shadow-md transition-all ${overdue ? 'border-red-200 dark:border-red-800/50' : ''}`}>
      <div className="flex items-start gap-3">
        <button onClick={cycleStatus} disabled={updating} className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : task.status === 'in-progress' ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-indigo-400'}`}>
          {task.status === 'completed' && <span className="text-white text-xs">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{task.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className={priCfg.color}>{priCfg.label}</Badge>
            <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
            {task.project && <span className="text-xs text-slate-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color || '#6366f1' }} />{task.project.name}</span>}
            {task.due_date && <span className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>{getDueDateLabel(task.due_date)}</span>}
          </div>
        </div>
        {task.assigned_to && <Avatar name={task.assigned_to.name} size="xs" />}
      </div>
    </div>
  );
};

const Tasks = () => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', project: '' });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', status: 'todo', priority: 'medium', project: '', due_date: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [projects, setProjects] = useState([]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.project) params.project = filters.project;
      const { data } = await taskApi.getAll(params);
      setTasks(data.data.tasks || []);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    projectApi.getAll({ limit: 100 }).then(r => setProjects(r.data.data.projects || [])).catch(() => {});
    loadTasks();
  }, [loadTasks]);

  const handleStatusUpdate = async (taskId, status) => {
    try {
      await taskApi.updateStatus(taskId, status);
      setTasks(p => p.map(t => t.id === taskId ? { ...t, status } : t));
    } catch { toast.error('Failed to update task'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.project) return toast.error('Title and project required');
    setFormLoading(true);
    try {
      await taskApi.create(formData);
      toast.success('Task created');
      setShowForm(false);
      setFormData({ title: '', description: '', status: 'todo', priority: 'medium', project: '', due_date: '' });
      loadTasks();
    } catch { toast.error('Failed to create task'); }
    finally { setFormLoading(false); }
  };

  const grouped = { todo: tasks.filter(t => t.status === 'todo'), 'in-progress': tasks.filter(t => t.status === 'in-progress'), completed: tasks.filter(t => t.status === 'completed') };

  const COLUMNS = [
    { key: 'todo', label: 'To Do', color: 'bg-slate-100 dark:bg-slate-700/50', dot: 'bg-slate-400' },
    { key: 'in-progress', label: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/10', dot: 'bg-blue-500' },
    { key: 'completed', label: 'Completed', color: 'bg-emerald-50 dark:bg-emerald-900/10', dot: 'bg-emerald-500' }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} containerClass="sm:w-36">
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </Select>
        <Select value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))} containerClass="sm:w-36">
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <Select value={filters.project} onChange={e => setFilters(p => ({ ...p, project: e.target.value }))} containerClass="sm:w-44">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        {isAdmin && <Button icon={Plus} onClick={() => setShowForm(true)}>New Task</Button>}
      </div>

      {loading ? <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div> : tasks.length === 0 ? <EmptyState icon={CheckSquare} title="No tasks found" description={isAdmin ? 'Create your first task.' : 'No tasks assigned to you.'} action={isAdmin && <Button icon={Plus} onClick={() => setShowForm(true)}>Create Task</Button>} /> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {COLUMNS.map(col => (
            <div key={col.key} className={`${col.color} rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <h3 className="font-display font-semibold text-sm text-slate-600 dark:text-slate-300">{col.label}</h3>
                <span className="ml-auto text-xs font-medium text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">{grouped[col.key].length}</span>
              </div>
              <div className="space-y-2">
                {grouped[col.key].length === 0 ? <p className="text-xs text-slate-400 text-center py-6">No tasks here</p> : grouped[col.key].map(task => <TaskCard key={task.id} task={task} onStatusUpdate={handleStatusUpdate} isAdmin={isAdmin} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create New Task" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Title</label>
            <input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full rounded-xl border bg-white dark:bg-slate-800 px-4 py-2.5 text-sm" placeholder="Task title" required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-xl border bg-white dark:bg-slate-800 px-4 py-2.5 text-sm" placeholder="Task description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800">
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} className="px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Project</label>
            <select value={formData.project} onChange={e => setFormData(p => ({ ...p, project: e.target.value }))} className="w-full px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800" required>
              <option value="">Select project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Due Date</label>
            <input type="date" value={formData.due_date} onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))} className="w-full rounded-xl border bg-white dark:bg-slate-800 px-4 py-2.5 text-sm" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Create Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;