'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

// This layout only handles auth redirect.
// DashboardLayout (with Sidebar+Header) is used inside each page directly.
export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, []);

  return <>{children}</>;
}