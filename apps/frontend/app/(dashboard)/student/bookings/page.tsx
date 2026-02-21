'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import api from '@/lib/api';
import { Calendar, Clock, Plus, RefreshCw } from 'lucide-react';

const statusBadge: Record<string, any> = {
  REQUESTED: 'yellow',
  APPROVED: 'green',
  COMPLETED: 'blue',
  CANCELLED: 'red',
};

export default function StudentBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    instructorId: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, instructorsRes] = await Promise.all([
        api.get('/scheduling/bookings'),
        api.get('/scheduling/instructors'),
      ]);
      setBookings(bookingsRes.data.bookings || []);
      setInstructors(instructorsRes.data.instructors || []);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load bookings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Load availability when instructor selected
  useEffect(() => {
    if (!form.instructorId) return;
    api.get(`/scheduling/availability?instructorId=${form.instructorId}`)
      .then((res) => setAvailability(res.data.slots || []))
      .catch(() => setAvailability([]));
  }, [form.instructorId]);

  const createBooking = async () => {
    if (!form.instructorId || !form.date || !form.startTime || !form.endTime) {
      setAlert({ type: 'error', message: 'All fields required' });
      return;
    }
    setCreating(true);
    try {
      await api.post('/scheduling/bookings', form);
      setAlert({ type: 'success', message: 'Booking requested! Waiting for admin approval.' });
      setShowModal(false);
      setForm({ instructorId: '', date: '', startTime: '', endTime: '', notes: '' });
      fetchData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Failed to create booking' });
    } finally {
      setCreating(false);
    }
  };

  const cancelBooking = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.patch(`/scheduling/bookings/${id}/status`, { status: 'CANCELLED' });
      setAlert({ type: 'success', message: 'Booking cancelled' });
      fetchData();
    } catch {
      setAlert({ type: 'error', message: 'Failed to cancel' });
    }
  };

  return (
    <DashboardLayout title="My Bookings">
      <div className="space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{bookings.length} booking(s)</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Book Session
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No bookings yet.</p>
            <Button className="mt-4" onClick={() => setShowModal(true)}>
              Book Your First Session
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
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
                        Instructor: <span className="font-medium">{b.instructor?.name}</span>
                      </p>
                      {b.notes && (
                        <p className="text-sm text-gray-500 italic">"{b.notes}"</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge label={b.status} variant={statusBadge[b.status]} />
                      {['REQUESTED', 'APPROVED'].includes(b.status) && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => cancelBooking(b.id)}
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
        )}

        {/* Book Session Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">Book a Session</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor
                  </label>
                  <select
                    value={form.instructorId}
                    onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select instructor...</option>
                    {instructors.map((i) => (
                      <option key={i.id} value={i.id}>{i.name} ({i.email})</option>
                    ))}
                  </select>
                </div>

                {form.instructorId && availability.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    <p className="font-medium mb-1">Available slots:</p>
                    {availability.slice(0, 3).map((s: any) => (
                      <p
                        key={s.id}
                        className="cursor-pointer hover:underline"
                        onClick={() => setForm({
                          ...form,
                          date: s.date.split('T')[0],
                          startTime: s.startTime,
                          endTime: s.endTime,
                        })}
                      >
                        {new Date(s.date).toLocaleDateString()} {s.startTime}–{s.endTime} (click to fill)
                      </p>
                    ))}
                  </div>
                )}

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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    placeholder="Any notes for the instructor..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" isLoading={creating} onClick={createBooking}>
                  Request Booking
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}