'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import { RefreshCw } from 'lucide-react';

const STATUS_BADGE: Record<string, 'yellow'|'blue'|'green'|'red'|'gray'> = {
  REQUESTED: 'yellow', APPROVED: 'blue', ASSIGNED: 'blue',
  COMPLETED: 'green',  CANCELLED: 'red',
};

export default function AdminBookingsPage() {
  const [bookings, setBookings]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [alert, setAlert]         = useState<{ type: 'success'|'error'; message: string } | null>(null);
  const [stats, setStats]         = useState({ REQUESTED: 0, APPROVED: 0, COMPLETED: 0, CANCELLED: 0 });

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scheduling/bookings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = data.bookings || [];
      setBookings(list);
      setStats({
        REQUESTED: list.filter((b: any) => b.status === 'REQUESTED').length,
        APPROVED:  list.filter((b: any) => b.status === 'APPROVED').length,
        COMPLETED: list.filter((b: any) => b.status === 'COMPLETED').length,
        CANCELLED: list.filter((b: any) => b.status === 'CANCELLED').length,
      });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scheduling/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setAlert({ type: 'success', message: `Booking ${status.toLowerCase()}` });
      fetchBookings();
    } catch {
      setAlert({ type: 'error', message: 'Failed to update booking' });
    }
  };

  const statCards = [
    { label: 'Requested', value: stats.REQUESTED, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Approved',  value: stats.APPROVED,  color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed', value: stats.COMPLETED, color: 'text-green-600 bg-green-50' },
    { label: 'Cancelled', value: stats.CANCELLED, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <DashboardLayout title="Booking Management">
      <div className="space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(s => (
            <Card key={s.label}>
              <CardBody className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.color}`}>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
                <p className="text-sm text-gray-500">{s.label}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Statuses</option>
                {['REQUESTED','APPROVED','ASSIGNED','COMPLETED','CANCELLED'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Button size="sm" variant="secondary" onClick={fetchBookings}>
                <RefreshCw className="w-4 h-4 mr-1" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {['Student','Instructor','Date','Time','Status','Actions'].map(h => (
                      <th key={h} className="text-left px-6 py-3 font-medium text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
                  ) : bookings.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">No bookings found</td></tr>
                  ) : bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{b.student?.name}</td>
                      <td className="px-6 py-4 text-gray-600">{b.instructor?.name}</td>
                      <td className="px-6 py-4 text-gray-600">{new Date(b.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-600">{b.startTime} – {b.endTime}</td>
                      <td className="px-6 py-4">
                        <Badge label={b.status} variant={STATUS_BADGE[b.status] || 'gray'} />
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        {b.status === 'REQUESTED' && (
                          <Button size="sm" onClick={() => updateStatus(b.id, 'APPROVED')}>Approve</Button>
                        )}
                        {b.status === 'APPROVED' && (
                          <Button size="sm" variant="secondary" onClick={() => updateStatus(b.id, 'ASSIGNED')}>Assign</Button>
                        )}
                        {!['COMPLETED','CANCELLED'].includes(b.status) && (
                          <Button size="sm" variant="danger" onClick={() => updateStatus(b.id, 'CANCELLED')}>Cancel</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}