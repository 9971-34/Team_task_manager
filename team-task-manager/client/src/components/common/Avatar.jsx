import { getInitials, getAvatarColor } from '../../utils/helpers';

const avatarSizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };

export const Avatar = ({ name = '', avatar, size = 'md', className = '' }) => {
  if (avatar) return <img src={avatar} alt={name} className={`${avatarSizes[size]} rounded-full object-cover ring-2 ring-white dark:ring-slate-800 ${className}`} />;
  return (
    <div className={`${avatarSizes[size]} ${getAvatarColor(name)} rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white dark:ring-slate-800 shrink-0 ${className}`} title={name}>
      {getInitials(name)}
    </div>
  );
};

export const AvatarGroup = ({ users = [], max = 3, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map((user, i) => <Avatar key={user.id || i} name={user.name} avatar={user.avatar} size={size} />)}
      {remaining > 0 && <div className={`${avatarSizes[size]} bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-800`}>+{remaining}</div>}
    </div>
  );
};

export const Badge = ({ children, className = '', dot }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}{children}</span>
);

export const ProgressBar = ({ value = 0, color = 'bg-indigo-500', className = '' }) => (
  <div className={`w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden ${className}`}>
    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4"><Icon size={28} className="text-slate-400" /></div>}
    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-400 mb-6 max-w-xs">{description}</p>}
    {action}
  </div>
);

export default Avatar;