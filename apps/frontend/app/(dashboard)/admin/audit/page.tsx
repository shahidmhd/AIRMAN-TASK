'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { RefreshCw } from 'lucide-react';

const ACTION_BADGE: Record<string, 'green'|'blue'|'yellow'|'red'|'gray'> = {
  USER_LOGIN: 'blue', USER_REGISTER: 'green', USER_APPROVED: 'green',
  BOOKING_CREATED: 'yellow', BOOKING_APPROVED: 'blue', BOOKING_CANCELLED: 'red',
  BOOKING_ESCALATED: 'red', FEATURE_FLAG_UPDATED: 'gray',
};

export default function AuditLogsPage() {
  const [logs, setLogs]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [action, setAction]     = useState('');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotal]  = useState(1);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (action) params.append('action', action);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.pagination?.totalPages || 1);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page, action]);

  const actions = ['USER_LOGIN','USER_REGISTER','USER_APPROVED','BOOKING_CREATED','BOOKING_APPROVED','BOOKING_CANCELLED','BOOKING_ESCALATED','FEATURE_FLAG_UPDATED'];

  return (
    <DashboardLayout title="Audit Logs">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Actions</option>
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <Button size="sm" variant="secondary" onClick={fetchLogs}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Action','Entity','User','Correlation ID','Time'].map(h => (
                    <th key={h} className="text-left px-6 py-3 font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">No audit logs found</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Badge label={log.action} variant={ACTION_BADGE[log.action] || 'gray'} />
                    </td>
                    <td className="px-6 py-4 text-gray-700">{log.entity}</td>
                    <td className="px-6 py-4 text-gray-600">{log.user?.name || 'System'}</td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">{log.correlationId?.slice(0,16)}...</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}