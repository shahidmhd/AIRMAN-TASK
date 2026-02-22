'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const cards = [
    { href: '/student/courses',  label: 'Browse Courses',  desc: 'View and take courses',               icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { href: '/student/bookings', label: 'My Bookings',     desc: 'Manage flight session bookings',      icon: Calendar, color: 'text-green-600 bg-green-50' },
  ];
  return (
    <DashboardLayout title="Student Dashboard">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-semibold">Welcome back, {user?.name}! ✈️</h2>
          <p className="text-blue-100 mt-1 text-sm">Continue your aviation training journey.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map(({ href, label, desc, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardBody className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6" /></div>
                  <div>
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500 mt-1">{desc}</p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}