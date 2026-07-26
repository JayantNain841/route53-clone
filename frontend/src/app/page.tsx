'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f2f3f3] text-gray-500">
      <Loader2 className="w-8 h-8 animate-spin text-[#ff9900] mb-2" />
      <p className="text-xs font-medium">Redirecting to console...</p>
    </div>
  );
}
