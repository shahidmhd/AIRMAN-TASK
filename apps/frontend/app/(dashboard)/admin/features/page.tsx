'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import { RefreshCw } from 'lucide-react';

const FLAG_DESCRIPTIONS: Record<string, string> = {
  booking_system:     'Allow students to book sessions with instructors',
  quiz_attempts:      'Allow students to attempt quizzes',
  advanced_reporting: 'Enable advanced analytics dashboard',
  bulk_enrollment:    'Allow bulk student enrollment to courses',
};

const ALL_FLAGS = ['booking_system', 'quiz_attempts', 'advanced_reporting', 'bulk_enrollment'];

export default function FeatureFlagsPage() {
  const [flags, setFlags]     = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<string | null>(null);
  const [alert, setAlert]     = useState<{ type: 'success'|'error'; message: string } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/features`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFlags(data.flags || {});
    } finally { setLoading(false); }
  };

  const toggleFlag = async (key: string, current: boolean) => {
    setSaving(key);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/features/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: !current, roles: flags[key]?.roles || [] }),
      });
      setFlags(prev => ({ ...prev, [key]: { ...prev[key], enabled: !current } }));
      setAlert({ type: 'success', message: `Feature "${key}" ${!current ? 'enabled' : 'disabled'}` });
    } catch {
      setAlert({ type: 'error', message: 'Failed to update feature flag' });
    } finally { setSaving(null); }
  };

  useEffect(() => { fetchFlags(); }, []);

  return (
    <DashboardLayout title="Feature Flags">
      <div className="space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Toggle features on/off per tenant</p>
              <Button size="sm" variant="secondary" onClick={fetchFlags}>
                <RefreshCw className="w-4 h-4 mr-1" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {['Feature','Description','Status','Action'].map(h => (
                      <th key={h} className="text-left px-6 py-3 font-medium text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ALL_FLAGS.map(key => {
                    const enabled = flags[key]?.enabled ?? false;
                    return (
                      <tr key={key} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                          {key.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {FLAG_DESCRIPTIONS[key]}
                        </td>
                        <td className="px-6 py-4">
                          <Badge label={enabled ? 'Enabled' : 'Disabled'} variant={enabled ? 'green' : 'gray'} />
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            variant={enabled ? 'danger' : 'primary'}
                            isLoading={saving === key}
                            onClick={() => toggleFlag(key, enabled)}
                          >
                            {enabled ? 'Disable' : 'Enable'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}