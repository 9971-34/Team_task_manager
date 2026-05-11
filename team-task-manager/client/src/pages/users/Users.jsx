import { useEffect, useState, useCallback } from 'react';
import { Users as UsersIcon, Search, Pencil, Trash2, Shield, User, MoreVertical, UserCheck } from 'lucide-react';
import { userApi } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { Avatar, Badge, EmptyState } from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { Select } from '../../components/common/Input';
import { formatDate, formatRelative, getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const UserRow = ({ user, onEdit, onDelete, currentUserId }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isSelf = user.id === currentUserId;

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="sm" />
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.name} {isSelf && <span className="text-xs text-indigo-500">(you)</span>}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'} dot={user.role === 'admin' ? 'bg-indigo-500' : 'bg-slate-400'}>
          {user.role === 'admin' ? 'Admin' : 'Member'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge className={user.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">{user.last_login ? formatRelative(user.last_login) : 'Never'}</td>
      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(user.created_at)}</td>
      <td className="px-4 py-3 text-right">
        {!isSelf && (
          <div className="relative inline-block">
            <button onClick={() => setMenuOpen(p => !p)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 transition-all">
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-10 py-1">
                <button onClick={() => { onEdit(user); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => { onDelete(user); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </td>
    </tr>
  );
};

const EditUserModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState({ name: user.name, role: user.role, is_active: user.is_active });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await userApi.update(user.id, form);
      onSaved(data.data.user);
      toast.success('User updated');
      onClose();
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={user.name} size="md" />
        <div>
          <p className="font-medium text-slate-800 dark:text-white">{user.name}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
        </div>
      </div>
      <Input label="Full Name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
      <Select label="Role" value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </Select>
      <Select label="Status" value={String(form.is_active)} onChange={(e) => setForm(p => ({ ...p, is_active: e.target.value === 'true' }))}>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </Select>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Changes</Button>
      </div>
    </form>
  );
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading users...');
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const [usersRes, statsRes] = await Promise.all([
        userApi.getAll(params),
        userApi.getStats(),
      ]);
      console.log('Users response:', usersRes);
      setUsers(usersRes.data.data.users || []);
      setStats(statsRes.data.data);
    } catch (err) {
      console.error('Failed to load users:', err);
      console.error('Response:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to load users');
    }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await userApi.delete(deleteUser.id);
      setUsers(p => p.filter(u => u.id !== deleteUser.id));
      setDeleteUser(null);
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: UsersIcon, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Admins', value: stats.adminCount, icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
          { label: 'Members', value: stats.memberCount, icon: User, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Active', value: stats.activeCount, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-slate-800 dark:text-white">{value ?? '—'}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} containerClass="sm:w-36">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </Select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  {['User', 'Role', 'Status', 'Last Login', 'Joined', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {users.map((u) => (
                  <UserRow key={u.id} user={u} onEdit={setEditUser} onDelete={setDeleteUser} currentUserId={currentUser?.id} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User" size="sm">
        {editUser && (
          <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={(updated) => setUsers(p => p.map(u => u.id === updated.id ? updated : u))} />
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteUser} onClose={() => setDeleteUser(null)} title="Delete User" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete <strong className="text-slate-800 dark:text-white">"{deleteUser?.name}"</strong>? This action cannot be undone.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;