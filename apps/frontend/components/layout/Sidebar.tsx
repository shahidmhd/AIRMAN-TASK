'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, BookOpen, Calendar,
  LogOut, GraduationCap, CalendarDays, Shield, Flag,
} from 'lucide-react';

const navItems: Record<string, { href: string; label: string; icon: any }[]> = {
  ADMIN: [
    { href: '/admin',          label: 'Dashboard',     icon: LayoutDashboard },
    { href: '/admin/users',    label: 'Users',         icon: Users },
    { href: '/admin/bookings', label: 'Bookings',      icon: Calendar },
    { href: '/admin/schedule', label: 'Schedule',      icon: CalendarDays },
    { href: '/admin/audit',    label: 'Audit Logs',    icon: Shield },
    { href: '/admin/features', label: 'Feature Flags', icon: Flag },
  ],
  INSTRUCTOR: [
    { href: '/instructor',          label: 'Dashboard', icon: LayoutDashboard },
    { href: '/instructor/courses',  label: 'My Courses', icon: BookOpen },
    { href: '/instructor/schedule', label: 'Schedule',   icon: Calendar },
  ],
  STUDENT: [
    { href: '/student',          label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/courses',  label: 'Courses',   icon: BookOpen },
    { href: '/student/bookings', label: 'Bookings',  icon: Calendar },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, tenantSlug } = useAuthStore();

  if (!user) return null;

  const items = navItems[user.role] || [];

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {}
    logout();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-blue-400" />
          <span className="text-xl font-bold">AIRMAN</span>
        </div>
        {tenantSlug && (
          <p className="text-xs text-gray-400 mt-1 capitalize">
            {tenantSlug.replace(/-/g, ' ')}
          </p>
        )}
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}