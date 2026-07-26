'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('NextJS Error Boundary caught error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f2f3f3] flex flex-col justify-between text-xs">
      {/* Top Console Header */}
      <header className="h-12 bg-[#232f3e] flex items-center px-6">
        <div className="flex items-center space-x-1.5 cursor-pointer">
          <div className="w-5 h-5 bg-[#ff9900] rounded flex items-center justify-center font-bold text-black text-[10px]">
            a
          </div>
          <span className="font-semibold text-sm text-white tracking-tight">aws</span>
          <span className="text-gray-300 text-xs px-2 border-l border-gray-600 font-normal">Console Error</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#eaeded] shadow-sm p-8 text-center rounded-sm">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-[#16191f]">Something went wrong!</h2>
          <p className="text-gray-500 mt-2 leading-relaxed font-normal">
            An unexpected error occurred in the Route 53 Console client interface. 
            Details: <span className="font-mono text-[10px] text-red-600 block mt-1 bg-red-50 p-2 rounded border border-red-100 truncate">{error.message || 'Unknown internal error'}</span>
          </p>

          <button
            onClick={() => reset()}
            className="mt-6 inline-flex items-center space-x-2 bg-[#ff9900] hover:bg-[#ec8b00] active:bg-[#d67d00] text-black font-semibold py-1.5 px-4 border border-[#a16000] rounded-sm transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 bg-white border-t border-[#eaeded] flex items-center justify-center text-gray-400">
        <span>© 2026, Amazon Web Services, Inc. or its affiliates.</span>
      </footer>
    </div>
  );
}
