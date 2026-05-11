import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, CheckCircle2, Clock, AlertTriangle, FolderKanban, TrendingUp, ArrowRight } from 'lucide-react';
import { taskApi } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import { Avatar } from '../../components/common/Avatar';
import { Badge, ProgressBar } from '../../components/common/Avatar';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatRelative, calcProgress } from '../../utils/helpers';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, sub, color, bgColor }) => (
  <div className="card p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center shrink-0`}>
      <Icon size={22} className={color} />
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-3xl font-display font-bold text-slate-800 dark:text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await taskApi.getDashboardStats();
        setStats(data.data);
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const { overview = {}, recentTasks = [] } = stats || {};
  const completionRate = overview.totalTasks > 0 ? Math.round((overview.completedTasks / overview.totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, <span className="text-indigo-600 dark:text-indigo-400">{user?.name?.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here's what's happening today.</p>
        </div>
        {isAdmin && (
          <Link to="/projects" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">New Project</Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Total Tasks" value={overview.totalTasks ?? 0} sub={`${overview.totalProjects ?? 0} projects`} color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-900/20" />
        <StatCard icon={CheckCircle2} label="Completed" value={overview.completedTasks ?? 0} sub={`${completionRate}% rate`} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-900/20" />
        <StatCard icon={Clock} label="In Progress" value={overview.inProgressTasks ?? 0} sub={`${overview.todoTasks ?? 0} to do`} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overview.overdueTasks ?? 0} sub="Need attention" color={overview.overdueTasks > 0 ? 'text-red-600' : 'text-slate-400'} bgColor={overview.overdueTasks > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-700'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-slate-800 dark:text-white">Recent Tasks</h3>
            <Link to="/tasks" className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400"><CheckCircle2 size={32} className="mx-auto mb-2 opacity-40" /><p className="text-sm">No tasks yet</p></div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => {
                const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                const priCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                return (
                  <div key={task.id} className="block p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-1">{task.title}</p>
                      <Badge className={priCfg.color}>{priCfg.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                      {task.assignedTo && <Avatar name={task.assignedTo.name} size="xs" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-indigo-600" />
            <h3 className="font-display font-semibold text-slate-800 dark:text-white">Overall Completion</h3>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">{overview.completedTasks ?? 0} of {overview.totalTasks ?? 0} tasks</span>
            <span className="text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400">{completionRate}%</span>
          </div>
          <ProgressBar value={completionRate} color={completionRate === 100 ? 'bg-emerald-500' : 'bg-indigo-500'} className="h-3" />
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {overview.completedTasks ?? 0}</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> {overview.inProgressTasks ?? 0}</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300" /> {overview.todoTasks ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;