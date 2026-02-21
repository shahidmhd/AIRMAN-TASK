'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import api from '@/lib/api';
import { Calendar, Clock, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const statusBadge: Record<string, any> = {
  REQUESTED: 'yellow',
  APPROVED: 'green',
  COMPLETED: 'blue',
  CANCELLED: 'red',
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/scheduling/bookings${params}`);
      setBookings(res.data.bookings || []);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load bookings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/scheduling/bookings/${id}/status`, { status });
      setAlert({ type: 'success', message: `Booking ${status.toLowerCase()}` });
      fetchBookings();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Failed' });
    }
  };

  const stats = {
    requested: bookings.filter(b => b.status === 'REQUESTED').length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
  };

  return (
    <DashboardLayout title="Booking Management">
      <div className="space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Requested', value: stats.requested, color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Approved', value: stats.approved, color: 'bg-green-50 text-green-700' },
            { label: 'Completed', value: stats.completed, color: 'bg-blue-50 text-blue-700' },
            { label: 'Cancelled', value: stats.cancelled, color: 'bg-red-50 text-red-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-4 ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="REQUESTED">Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <Button variant="secondary" size="sm" onClick={fetchBookings}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No bookings found</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <div key={b.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {new Date(b.date).toLocaleDateString('en-US', {
                              weekday: 'long', year: 'numeric',
                              month: 'long', day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {b.startTime} – {b.endTime}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Student: <span className="font-medium">{b.student?.name}</span>
                          {' · '}
                          Instructor: <span className="font-medium">{b.instructor?.name}</span>
                        </p>
                        {b.notes && (
                          <p className="text-sm text-gray-500 italic">"{b.notes}"</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge label={b.status} variant={statusBadge[b.status]} />
                        {b.status === 'REQUESTED' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateStatus(b.id, 'APPROVED')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => updateStatus(b.id, 'CANCELLED')}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                        {b.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => updateStatus(b.id, 'CANCELLED')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}