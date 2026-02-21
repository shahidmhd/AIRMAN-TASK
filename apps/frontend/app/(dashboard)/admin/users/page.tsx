'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import api from '@/lib/api';
import { User } from '@/types';
import { CheckCircle, Plus, Search, UserPlus, Trash2, RefreshCw } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [formErrors, setFormErrors] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.users);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Auto clear alert
  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  const validateForm = () => {
    const errors = { name: '', email: '', password: '' };
    let valid = true;

    if (form.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
      valid = false;
    }
    if (!form.email.includes('@')) {
      errors.email = 'Invalid email address';
      valid = false;
    }
    if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  const approveUser = async (userId: string) => {
    try {
      await api.patch(`/users/${userId}/approve`);
      setAlert({ type: 'success', message: 'User approved successfully' });
      fetchUsers();
    } catch {
      setAlert({ type: 'error', message: 'Failed to approve user' });
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) return;
    try {
      await api.delete(`/users/${userId}`);
      setAlert({ type: 'success', message: 'User deleted successfully' });
      fetchUsers();
    } catch {
      setAlert({ type: 'error', message: 'Failed to delete user' });
    }
  };

  const createInstructor = async () => {
    if (!validateForm()) return;

    setCreating(true);
    try {
      await api.post('/users/instructors', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setAlert({ type: 'success', message: 'Instructor created successfully' });
      setShowModal(false);
      setForm({ name: '', email: '', password: '' });
      setFormErrors({ name: '', email: '', password: '' });
      fetchUsers();
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.details) {
        setAlert({ type: 'error', message: errData.details.map((d: any) => d.message).join(', ') });
      } else {
        setAlert({ type: 'error', message: errData?.error || 'Failed to create instructor' });
      }
    } finally {
      setCreating(false);
    }
  };

  const roleBadge = {
    ADMIN: 'red' as const,
    INSTRUCTOR: 'blue' as const,
    STUDENT: 'green' as const,
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    pending: users.filter((u) => !u.isApproved).length,
    instructors: users.filter((u) => u.role === 'INSTRUCTOR').length,
    students: users.filter((u) => u.role === 'STUDENT').length,
  };

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Users', value: stats.total, color: 'bg-blue-50 text-blue-700' },
            { label: 'Pending Approval', value: stats.pending, color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Instructors', value: stats.instructors, color: 'bg-purple-50 text-purple-700' },
            { label: 'Students', value: stats.students, color: 'bg-green-50 text-green-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-4 ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-48 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Role filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="INSTRUCTOR">Instructors</option>
                  <option value="ADMIN">Admins</option>
                </select>

                {/* Refresh */}
                <Button variant="secondary" size="sm" onClick={fetchUsers}>
                  <RefreshCw className="w-4 h-4" />
                </Button>

                {/* Add Instructor */}
                <Button size="sm" onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Instructor
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading users...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Email</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Role</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <Badge label={user.role} variant={roleBadge[user.role]} />
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            label={user.isApproved ? 'Approved' : 'Pending'}
                            variant={user.isApproved ? 'green' : 'yellow'}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {!user.isApproved && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => approveUser(user.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            {user.role !== 'ADMIN' && (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => deleteUser(user.id, user.name)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-16 text-gray-400">
                    No users found
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Create Instructor Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Create Instructor</h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Instructor will be approved automatically.
                </p>
              </div>

              <div className="p-6 space-y-4">
                <Input
                  label="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  error={formErrors.name}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="instructor@example.com"
                  error={formErrors.email}
                />
                <Input
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  error={formErrors.password}
                />
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowModal(false);
                    setForm({ name: '', email: '', password: '' });
                    setFormErrors({ name: '', email: '', password: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1" isLoading={creating} onClick={createInstructor}>
                  Create Instructor
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}