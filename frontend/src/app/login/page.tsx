'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, KeyRound, Mail, AlertCircle } from 'lucide-react';

// Validation schema
const loginSchema = zod.object({
  email: zod.string().min(1, 'Email is required').email('Must be a valid email address'),
  password: zod.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitting(true);
    const success = await login(data.email, data.password);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f2f3f3] flex flex-col justify-between">
      {/* Top Banner (AWS-like Sign In Header) */}
      <header className="h-14 bg-[#232f3e] flex items-center px-6">
        <div className="flex items-center space-x-1.5 cursor-pointer">
          <div className="w-6 h-6 bg-[#ff9900] rounded flex items-center justify-center font-bold text-black text-xs">
            a
          </div>
          <span className="font-semibold text-base text-white tracking-tight">aws</span>
          <span className="text-gray-300 text-sm px-2 border-l border-gray-600 font-normal">Console Sign-In</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          <div className="bg-white py-8 px-10 border border-[#eaeded] shadow-sm rounded-sm">
            <h2 className="text-xl font-medium text-[#16191f] mb-6">Sign in</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#545b64] mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="text"
                    {...register('email')}
                    className={`w-full pl-9 pr-3 py-1.5 text-sm bg-white border rounded-sm outline-none transition-colors ${
                      errors.email 
                        ? 'border-[#d13212] focus:border-[#d13212]' 
                        : 'border-[#aab7c4] focus:border-[#0073bb]'
                    }`}
                    placeholder="admin@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 flex items-center text-xs text-[#d13212] font-normal">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#545b64] mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    {...register('password')}
                    className={`w-full pl-9 pr-3 py-1.5 text-sm bg-white border rounded-sm outline-none transition-colors ${
                      errors.password 
                        ? 'border-[#d13212] focus:border-[#d13212]' 
                        : 'border-[#aab7c4] focus:border-[#0073bb]'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 flex items-center text-xs text-[#d13212] font-normal">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || authLoading}
                className="w-full mt-2 bg-[#ff9900] hover:bg-[#ec8b00] active:bg-[#d67d00] disabled:bg-[#ff9900]/60 text-black text-sm font-medium py-2 px-4 border border-[#a16000] rounded-sm transition-all focus:outline-none flex items-center justify-center cursor-pointer shadow-sm"
              >
                {submitting || authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black mr-2" />
                ) : null}
                <span>Sign in</span>
              </button>
            </form>

            {/* Mock Credentials Box */}
            <div className="mt-6 p-4 bg-[#f2f8fc] border border-[#d2eaf8] text-xs text-[#16191f] rounded-sm">
              <p className="font-semibold text-[#0066cc] mb-1">Default Credentials</p>
              <div className="space-y-1 mt-1 text-[#545b64]">
                <p>
                  <span className="font-medium">Email:</span> admin@example.com
                </p>
                <p>
                  <span className="font-medium">Password:</span> password123
                </p>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.</p>
          </div>
        </div>
      </main>

      {/* Footer Links */}
      <footer className="h-10 bg-white border-t border-[#eaeded] flex items-center justify-center space-x-6 text-xs text-[#545b64]">
        <span className="cursor-pointer hover:underline">Terms of Use</span>
        <span className="cursor-pointer hover:underline">Privacy Policy</span>
        <span className="cursor-pointer hover:underline">Feedback</span>
      </footer>
    </div>
  );
}
