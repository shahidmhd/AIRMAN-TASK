'use client';

import { useAuthStore } from '@/store/auth.store';
import Badge from '@/components/ui/Badge';

const roleBadge = {
  ADMIN:      'red'  as const,
  INSTRUCTOR: 'blue' as const,
  STUDENT:    'green' as const,
};

interface HeaderProps { title: string; }

export default function Header({ title }: HeaderProps) {
  const { user } = useAuthStore();
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {user && (
          <div className="flex items-center gap-3">
            <Badge label={user.role} variant={roleBadge[user.role]} />
            <span className="text-sm text-gray-600">{user.email}</span>
          </div>
        )}
      </div>
    </header>
  );
}