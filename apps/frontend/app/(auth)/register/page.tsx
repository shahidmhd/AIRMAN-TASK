'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(['STUDENT', 'INSTRUCTOR']),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'STUDENT' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/auth/register', data);
      setSuccess(res.data.message);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      const apiErr = err.response?.data;
      if (apiErr?.details) {
        setError(apiErr.details.map((d: any) => d.message).join(', '));
      } else {
        setError(apiErr?.error || 'Registration failed');
      }
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
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <Alert type="error" message={error} />}
            {success && <Alert type="success" message={success} />}

            <Input
              id="name"
              label="Full Name"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name')}
            />

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
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Repeat password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Register as</label>
              <div className="grid grid-cols-2 gap-3">
                {['STUDENT', 'INSTRUCTOR'].map((role) => (
                  <label key={role} className="relative cursor-pointer">
                    <input type="radio" value={role} {...register('role')} className="peer sr-only" />
                    <div className="flex items-center justify-center px-4 py-3 border-2 rounded-xl text-sm font-medium transition-colors peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 border-gray-200 text-gray-600 hover:border-gray-300">
                      {role}
                    </div>
                  </label>
                ))}
              </div>
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
              <p className="mt-2 text-xs text-gray-500">
                Instructor accounts require admin approval before login.
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}