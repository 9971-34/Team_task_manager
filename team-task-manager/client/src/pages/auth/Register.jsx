import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input, { Select } from '../../components/common/Input';
import Button from '../../components/common/Button';
import { getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name || form.name.length < 2) errs.name = 'Name must be at least 2 chars';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    if (!form.password || form.password.length < 8) errs.password = 'Password min 8 chars';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
      <div className="w-full max-w-md animate-[slideUp_0.3s_ease-out]">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-slate-800 dark:text-white">TaskFlow</span>
        </div>

        <div className="card p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-1">Create Account</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Join your team on TaskFlow</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" name="name" type="text" placeholder="Alex Morgan" value={form.name} onChange={handleChange} icon={User} error={errors.name} required />
            <Input label="Email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} icon={Mail} error={errors.email} required />
            <div className="relative">
              <Input label="Password" name="password" type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={handleChange} icon={Lock} error={errors.password} required />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-9 text-slate-400">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            <Select label="Role" name="role" value={form.role} onChange={handleChange}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </Select>
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">Create Account</Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account? <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-400">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;