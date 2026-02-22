'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import api from '@/lib/api';
import { CheckCircle, UserPlus, Search, X, Eye, EyeOff } from 'lucide-react';

const ROLES = ['INSTRUCTOR', 'STUDENT', 'ADMIN'] as const;
type Role = typeof ROLES[number];

const roleBadge: Record<Role, 'red' | 'blue' | 'green'> = {
  ADMIN:      'red',
  INSTRUCTOR: 'blue',
  STUDENT:    'green',
};

const roleLabel: Record<Role, string> = {
  ADMIN:      'Admin',
  INSTRUCTOR: 'Instructor',
  STUDENT:    'Student',
};

export default function UsersPage() {
  const [users, setUsers]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [alert, setAlert]       = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [search, setSearch]     = useState('');
  const [approving, setApproving] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' as Role });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?limit=100');
      setUsers(res.data.users || []);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const approveUser = async (userId: string) => {
    setApproving(userId);
    try {
      await api.patch(`/users/${userId}/approve`);
      setAlert({ type: 'success', message: 'User approved successfully' });
      fetchUsers();
    } catch {
      setAlert({ type: 'error', message: 'Failed to approve user' });
    } finally {
      setApproving(null);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Valid email required';
    if (!form.password || form.password.length < 8)
      e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createUser = async () => {
    if (!validate()) return;
    setCreating(true);
    try {
      // Admin + Instructor → /users/instructors (auto-approved)
      // Student → /auth/register then auto-approve
      if (form.role === 'INSTRUCTOR' || form.role === 'ADMIN') {
        await api.post('/users/instructors', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
      } else {
        // Register student then approve immediately
        const reg = await api.post('/auth/register', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: 'STUDENT',
        });
        if (reg.data?.user?.id) {
          await api.patch(`/users/${reg.data.user.id}/approve`);
        }
      }
      setAlert({ type: 'success', message: `${roleLabel[form.role]} "${form.name}" created successfully` });
      closeModal();
      fetchUsers();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Failed to create user' });
    } finally {
      setCreating(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ name: '', email: '', password: '', role: 'STUDENT' });
    setErrors({});
    setShowPassword(false);
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:       users.length,
    instructors: users.filter(u => u.role === 'INSTRUCTOR').length,
    students:    users.filter(u => u.role === 'STUDENT').length,
    pending:     users.filter(u => !u.isApproved).length,
  };

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total',       value: stats.total,       color: 'bg-gray-50   text-gray-700'  },
            { label: 'Instructors', value: stats.instructors, color: 'bg-blue-50   text-blue-700'  },
            { label: 'Students',    value: stats.students,    color: 'bg-green-50  text-green-700' },
            { label: 'Pending',     value: stats.pending,     color: 'bg-yellow-50 text-yellow-700'},
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-4 ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ✅ CREATE BUTTON — top right */}
              <Button className="ml-auto" onClick={() => setShowModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </CardHeader>

          <CardBody className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-6 py-3 font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <Badge label={user.role} variant={roleBadge[user.role as Role] ?? 'gray'} />
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            label={user.isApproved ? 'Approved' : 'Pending'}
                            variant={user.isApproved ? 'green' : 'yellow'}
                          />
                        </td>
                        <td className="px-6 py-4">
                          {!user.isApproved && (
                            <Button
                              size="sm"
                              variant="secondary"
                              isLoading={approving === user.id}
                              onClick={() => approveUser(user.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-gray-400">No users found</div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ✅ CREATE USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Create New User</h2>
                  <p className="text-xs text-gray-500">User will be auto-approved</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">

              {/* Role selector — pill tabs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={() => setForm({ ...form, role })}
                      className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.role === role
                          ? role === 'ADMIN'
                            ? 'border-red-500   bg-red-50   text-red-700'
                            : role === 'INSTRUCTOR'
                            ? 'border-blue-500  bg-blue-50  text-blue-700'
                            : 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {roleLabel[role]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={
                    form.role === 'INSTRUCTOR' ? 'e.g. Captain John Smith' :
                    form.role === 'ADMIN'      ? 'e.g. Sarah Admin' :
                                                 'e.g. Alex Student'
                  }
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@yourschool.com"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* Info box — changes based on selected role */}
              <div className={`rounded-xl p-3 text-sm ${
                form.role === 'ADMIN'      ? 'bg-red-50   text-red-700'   :
                form.role === 'INSTRUCTOR' ? 'bg-blue-50  text-blue-700'  :
                                             'bg-green-50 text-green-700'
              }`}>
                {form.role === 'ADMIN' && (
                  <p><strong>Admin</strong> — full access to all users, bookings, audit logs and feature flags.</p>
                )}
                {form.role === 'INSTRUCTOR' && (
                  <p><strong>Instructor</strong> — can create courses, manage availability and mark bookings complete.</p>
                )}
                {form.role === 'STUDENT' && (
                  <p><strong>Student</strong> — can browse courses, attempt quizzes and request flight bookings.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button variant="secondary" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
              <Button className="flex-1" isLoading={creating} onClick={createUser}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create {roleLabel[form.role]}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}