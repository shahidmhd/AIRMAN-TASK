'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, BookOpen, Calendar,
  LogOut, GraduationCap, Settings
} from 'lucide-react';

const navItems = {
  ADMIN: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  ],
  INSTRUCTOR: [
    { href: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/instructor/courses', label: 'My Courses', icon: BookOpen },
    { href: '/instructor/schedule', label: 'Schedule', icon: Calendar },
  ],
  STUDENT: [
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/courses', label: 'Courses', icon: BookOpen },
    { href: '/student/bookings', label: 'Bookings', icon: Calendar },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const items = navItems[user.role] || [];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-blue-400" />
          <span className="text-xl font-bold">AIRMAN</span>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
            {user.name.charAt(0).toUpperCase()}
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