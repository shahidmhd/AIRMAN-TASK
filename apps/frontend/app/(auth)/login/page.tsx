'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const res = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);

      // Redirect based on role
      const roleRedirect = {
        ADMIN: '/admin',
        INSTRUCTOR: '/instructor',
        STUDENT: '/student',
      };
      router.push(roleRedirect[user.role as keyof typeof roleRedirect] || '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AIRMAN</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Register
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-gray-600 font-mono">
              <p>admin@airman.com / Password123!</p>
              <p>instructor@airman.com / Password123!</p>
              <p>student@airman.com / Password123!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}