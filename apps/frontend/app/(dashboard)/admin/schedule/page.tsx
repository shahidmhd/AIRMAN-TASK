'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import api from '@/lib/api';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const statusBadge: Record<string, any> = {
  REQUESTED: 'yellow',
  APPROVED: 'green',
  COMPLETED: 'blue',
  CANCELLED: 'red',
};

const getMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

export default function WeeklySchedulePage() {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [schedule, setSchedule] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/scheduling/schedule/weekly?weekStart=${weekStart}`)
      .then((res) => setSchedule(res.data.schedule || {}))
      .finally(() => setLoading(false));
  }, [weekStart]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  // Generate 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <DashboardLayout title="Weekly Schedule">
      <div className="space-y-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={prevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <p className="font-semibold text-gray-900">
              {new Date(weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              {' – '}
              {weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={nextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Days */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading schedule...</div>
        ) : (
          <div className="space-y-3">
            {days.map((day) => {
              const dayBookings = schedule[day] || [];
              const dateObj = new Date(day);
              const isToday = day === new Date().toISOString().split('T')[0];

              return (
                <Card key={day} className={isToday ? 'border-blue-300' : ''}>
                  <CardBody>
                    <div className="flex items-start gap-4">
                      <div className={`min-w-24 text-center p-2 rounded-xl ${
                        isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        <p className="text-xs font-medium">
                          {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-2xl font-bold">{dateObj.getDate()}</p>
                        <p className="text-xs">
                          {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                      </div>

                      <div className="flex-1">
                        {dayBookings.length === 0 ? (
                          <p className="text-sm text-gray-400 py-3">No bookings</p>
                        ) : (
                          <div className="space-y-2">
                            {dayBookings.map((b: any) => (
                              <div
                                key={b.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {b.startTime} – {b.endTime}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {b.student?.name} with {b.instructor?.name}
                                  </p>
                                </div>
                                <Badge label={b.status} variant={statusBadge[b.status]} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}