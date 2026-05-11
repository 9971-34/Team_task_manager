const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

const Spinner = ({ size = 'md', className = '' }) => (
  <div className={`${sizes[size]} border-2 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin ${className}`} role="status" />
);

export default Spinner;