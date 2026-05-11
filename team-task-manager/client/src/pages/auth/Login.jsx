import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setErrors({ email: !form.email ? 'Email required' : '', password: !form.password ? 'Password required' : '' });
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@taskflow.com', password: 'Admin1234' });
    else setForm({ email: 'member@test.com', password: 'Member1234' });
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-indigo-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">TaskFlow</span>
          </div>
        </div>
        <div className="relative space-y-6">
          <h2 className="font-display font-bold text-4xl text-white leading-tight">Manage your team<br />like a pro.</h2>
          <p className="text-indigo-200 text-lg">Role-based task management with real-time collaboration.</p>
        </div>
        <p className="relative text-indigo-300 text-sm">© 2024 TaskFlow.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md animate-[slideUp_0.3s_ease-out]">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-slate-800 dark:text-white">TaskFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-slate-800 dark:text-white mb-2">Welcome back</h1>
            <p className="text-slate-500 dark:text-slate-400">Sign in to continue.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button type="button" onClick={() => fillDemo('admin')} className="py-2 px-3 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-100">Demo Admin</button>
            <button type="button" onClick={() => fillDemo('member')} className="py-2 px-3 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100">Demo Member</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} icon={Mail} error={errors.email} required />
            <div className="relative">
              <Input label="Password" name="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={handleChange} icon={Lock} error={errors.password} required />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-9 text-slate-400">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">Sign In</Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account? <Link to="/register" className="font-medium text-indigo-600 dark:text-indigo-400">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;