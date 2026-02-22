'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function InstructorDashboard() {
  const cards = [
    { href: '/instructor/courses',  label: 'My Courses', desc: 'Create and manage your courses',  icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { href: '/instructor/schedule', label: 'Schedule',   desc: 'Manage your availability',         icon: Calendar, color: 'text-green-600 bg-green-50' },
  ];
  return (
    <DashboardLayout title="Instructor Dashboard">
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
    </DashboardLayout>
  );
}