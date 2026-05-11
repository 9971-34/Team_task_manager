import { useLocation } from 'react-router-dom';
import { Badge } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your workspace' },
  '/projects': { title: 'Projects', subtitle: 'Manage your team projects' },
  '/tasks': { title: 'Tasks', subtitle: 'Track and manage tasks' },
  '/users': { title: 'Team', subtitle: 'Manage team members' }
};

const Header = () => {
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();
  const base = '/' + pathname.split('/')[1];
  const page = PAGE_TITLES[base] || { title: 'TaskFlow', subtitle: '' };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-display font-semibold text-slate-800 dark:text-white">{page.title}</h1>
        {page.subtitle && <p className="text-xs text-slate-400 mt-0.5">{page.subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Badge className={isAdmin ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'} dot={isAdmin ? 'bg-indigo-500' : 'bg-slate-400'}>
          {isAdmin ? 'Admin' : 'Member'}
        </Badge>
      </div>
    </header>
  );
};

export default Header;