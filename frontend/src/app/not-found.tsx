'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f2f3f3] flex flex-col justify-between text-xs">
      {/* Top Console Header */}
      <header className="h-12 bg-[#232f3e] flex items-center px-6">
        <div className="flex items-center space-x-1.5 cursor-pointer">
          <div className="w-5 h-5 bg-[#ff9900] rounded flex items-center justify-center font-bold text-black text-[10px]">
            a
          </div>
          <span className="font-semibold text-sm text-white tracking-tight">aws</span>
          <span className="text-gray-300 text-xs px-2 border-l border-gray-600 font-normal">Console</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#eaeded] shadow-sm p-8 text-center rounded-sm">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4 border border-amber-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-[#16191f]">404 - Page not found</h2>
          <p className="text-gray-500 mt-2 leading-relaxed font-normal">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center space-x-2 bg-[#ff9900] hover:bg-[#ec8b00] active:bg-[#d67d00] text-black font-semibold py-1.5 px-4 border border-[#a16000] rounded-sm transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 bg-white border-t border-[#eaeded] flex items-center justify-center text-gray-400">
        <span>© 2026, Amazon Web Services, Inc. or its affiliates.</span>
      </footer>
    </div>
  );
}
