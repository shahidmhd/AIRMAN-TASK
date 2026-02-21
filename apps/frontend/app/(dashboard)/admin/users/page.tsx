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
import { CheckCircle, Plus, Search, UserPlus } from 'lucide-react';

interface CreateInstructorForm {
  name: string;
  email: string;
  password: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateInstructorForm>({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const approveUser = async (userId: string) => {
    try {
      await api.patch(`/users/${userId}/approve`);
      setAlert({ type: 'success', message: 'User approved successfully' });
      fetchUsers();
    } catch {
      setAlert({ type: 'error', message: 'Failed to approve user' });
    }
  };

  const createInstructor = async () => {
    setCreating(true);
    try {
      await api.post('/users/instructors', form);
      setAlert({ type: 'success', message: 'Instructor created successfully' });
      setShowModal(false);
      setForm({ name: '', email: '', password: '' });
      fetchUsers();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Failed to create instructor' });
    } finally {
      setCreating(false);
    }
  };

  const roleBadge = { ADMIN: 'red' as const, INSTRUCTOR: 'blue' as const, STUDENT: 'green' as const };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button onClick={() => setShowModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add Instructor
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
                        <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
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
                          {!user.isApproved && (
                            <Button
                              size="sm"
                              variant="secondary"
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

        {/* Create Instructor Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Create Instructor</h2>
              </div>
              <div className="space-y-3">
                <Input
                  label="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="instructor@example.com"
                />
                <Input
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" isLoading={creating} onClick={createInstructor}>
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}