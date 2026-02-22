'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';

const TENANTS = [
  { label: 'Skyways Aviation Academy', value: 'skyways-aviation' },
  { label: 'Eagle Flight School',      value: 'eagle-flight-school' },
];

export default function LoginPage() {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [tenantSlug, setTenantSlug] = useState('skyways-aviation');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id':  tenantSlug,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      const { user, accessToken, refreshToken } = data;
      setAuth(user, accessToken, refreshToken, tenantSlug);

      if (user.role === 'ADMIN')           router.push('/admin');
      else if (user.role === 'INSTRUCTOR') router.push('/instructor');
      else                                 router.push('/student');

    } catch {
      setError('Cannot connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    const map: Record<string, string> = {
      admin:      'admin@skyways.com',
      instructor: 'instructor@skyways.com',
      student:    'student@skyways.com',
    };
    setEmail(map[role]);
    setPassword('Password123!');
    setTenantSlug('skyways-aviation');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AIRMAN</h1>
          <p className="text-gray-500 mt-1">Aviation Training Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flight School</label>
              <select
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TENANTS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@skyways.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password123!"
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Quick fill demo */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-600 mb-2">Quick Demo Login:</p>
            <div className="flex gap-2">
              {['admin', 'instructor', 'student'].map((role) => (
                <button key={role} onClick={() => fillDemo(role)}
                  className="flex-1 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-white capitalize transition-colors">
                  {role}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Password: Password123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}