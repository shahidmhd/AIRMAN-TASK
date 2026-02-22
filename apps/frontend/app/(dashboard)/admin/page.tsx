'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Users, Calendar, BookOpen, Shield, Flag, CalendarDays } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const cards = [
    { href: '/admin/users',    label: 'Manage Users',    desc: 'Approve and manage accounts',  icon: Users,        color: 'bg-blue-50 text-blue-600' },
    { href: '/admin/bookings', label: 'Bookings',        desc: 'Review and approve sessions',  icon: Calendar,     color: 'bg-green-50 text-green-600' },
    { href: '/admin/schedule', label: 'Weekly Schedule', desc: 'View all sessions this week',  icon: CalendarDays, color: 'bg-yellow-50 text-yellow-600' },
    { href: '/admin/audit',    label: 'Audit Logs',      desc: 'Track all system actions',     icon: Shield,       color: 'bg-purple-50 text-purple-600' },
    { href: '/admin/features', label: 'Feature Flags',   desc: 'Toggle features per tenant',   icon: Flag,         color: 'bg-indigo-50 text-indigo-600' },
  ];

  return (
    <DashboardLayout title="Admin Dashboard">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Welcome, {user?.name} 👋
      </h1>
      <p className="text-gray-500 mb-8">Manage your flight school from here.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-gray-900">{c.label}</h2>
              <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
            </Link>
          );
        })}
      </div>
    </DashboardLayout>
  );
}