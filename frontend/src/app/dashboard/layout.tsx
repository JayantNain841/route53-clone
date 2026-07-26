'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f2f3f3] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff9900] mb-2" />
        <p className="text-[13px] font-medium">Loading AWS Management Console...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f3f3]">
      <Header />
      <div className="flex flex-1 pt-[50px]">
        <Sidebar />
        {/* Main content: offset by sidebar width (220px or 48px when collapsed) */}
        <main
          className="flex-1 min-h-[calc(100vh-50px)] overflow-x-hidden"
          style={{
            marginLeft: '220px',
            padding: '20px 24px',
            transition: 'margin-left 0.2s',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
