'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import api from '@/lib/api';
import { Plus, Trash2, Calendar, Clock, RefreshCw } from 'lucide-react';

const statusBadge: Record<string, any> = {
  REQUESTED: 'yellow',
  APPROVED: 'green',
  COMPLETED: 'blue',
  CANCELLED: 'red',
};

export default function InstructorSchedulePage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '' });
  const [activeTab, setActiveTab] = useState<'bookings' | 'availability'>('bookings');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, availRes] = await Promise.all([
        api.get('/scheduling/bookings'),
        api.get('/scheduling/availability'),
      ]);
      setBookings(bookingsRes.data.bookings || []);
      setAvailability(availRes.data.slots || []);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load schedule' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addAvailability = async () => {
    if (!form.date || !form.startTime || !form.endTime) {
      setAlert({ type: 'error', message: 'All fields required' });
      return;
    }
    try {
      await api.post('/scheduling/availability', form);
      setAlert({ type: 'success', message: 'Availability added!' });
      setShowModal(false);
      setForm({ date: '', startTime: '', endTime: '' });
      fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Failed' });
    }
  };

  const deleteAvailability = async (id: string) => {
    try {
      await api.delete(`/scheduling/availability/${id}`);
      setAlert({ type: 'success', message: 'Slot removed' });
      fetchData();
    } catch {
      setAlert({ type: 'error', message: 'Failed to remove slot' });
    }
  };

  const updateStatus = async (bookingId: string, status: string) => {
    try {
      await api.patch(`/scheduling/bookings/${bookingId}/status`, { status });
      setAlert({ type: 'success', message: `Booking ${status.toLowerCase()}` });
      fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Failed' });
    }
  };

  return (
    <DashboardLayout title="My Schedule">
      <div className="space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {(['bookings', 'availability'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab} {tab === 'bookings' ? `(${bookings.length})` : `(${availability.length})`}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pb-2">
            <Button variant="secondary" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            {activeTab === 'availability' && (
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Slot
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : activeTab === 'bookings' ? (
          /* Bookings Tab */
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No bookings yet</div>
            ) : bookings.map((b) => (
              <Card key={b.id}>
                <CardBody>
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
                      </p>
                      {b.notes && (
                        <p className="text-sm text-gray-500 italic">"{b.notes}"</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge label={b.status} variant={statusBadge[b.status]} />
                      {b.status === 'APPROVED' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateStatus(b.id, 'COMPLETED')}
                        >
                          Mark Complete
                        </Button>
                      )}
                      {['REQUESTED', 'APPROVED'].includes(b.status) && (
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
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          /* Availability Tab */
          <div className="space-y-3">
            {availability.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No availability set. Add slots so students can book you.
              </div>
            ) : availability.map((slot) => (
              <Card key={slot.id}>
                <CardBody className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(slot.date).toLocaleDateString('en-US', {
                          weekday: 'long', year: 'numeric',
                          month: 'long', day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {slot.startTime} – {slot.endTime}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteAvailability(slot.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Add Availability Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Add Availability Slot</h2>
              <div className="space-y-3">
                <Input
                  label="Date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Input
                  label="Start Time"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={addAvailability}>
                  Add Slot
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}