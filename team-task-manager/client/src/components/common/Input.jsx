import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon: Icon, required = false, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <div className="relative">
      {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon size={16} /></div>}
      <input
        ref={ref}
        className={`w-full rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all px-4 py-2.5 text-sm ${error ? 'border-red-400' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'} ${Icon ? 'pl-10' : ''} ${className}`}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));

Input.displayName = 'Input';

export const Select = forwardRef(({ label, error, required = false, children, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <select ref={ref} className={`w-full rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-4 py-2.5 text-sm ${error ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'} ${className}`} {...props}>{children}</select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));

Select.displayName = 'Select';

export const Textarea = forwardRef(({ label, error, required = false, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <textarea ref={ref} className={`w-full rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-4 py-2.5 text-sm resize-none ${error ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'} ${className}`} {...props} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));

Textarea.displayName = 'Textarea';

export default Input;