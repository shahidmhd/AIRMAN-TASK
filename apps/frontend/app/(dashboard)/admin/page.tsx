'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import api from '@/lib/api';
import { Users, CheckCircle, Clock, BookOpen } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalCourses: 0,
    totalBookings: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersRes = await api.get('/users?limit=100');
        const pending = usersRes.data.users.filter((u: any) => !u.isApproved).length;
        setStats((s) => ({
          ...s,
          totalUsers: usersRes.data.pagination.total,
          pendingApprovals: pending,
        }));
      } catch {}
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-green-600 bg-green-50' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: CheckCircle, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardBody className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}