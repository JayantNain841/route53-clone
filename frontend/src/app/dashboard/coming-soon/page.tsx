'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, ArrowLeft, Wrench } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';

// Map paths to section names
const SECTION_NAMES: Record<string, string> = {
  resolver: 'Resolver',
  'route53-profiles': 'Route 53 Profiles',
  'traffic-flow': 'Traffic flow',
  'health-checks': 'Health checks',
  'registered-domains': 'Registered domains',
  'transfer-domains': 'Transfer domains',
};

export default function ComingSoonPage() {
  const pathname = usePathname() || '';
  const sectionKey = pathname.split('/').pop() || '';
  const sectionName = SECTION_NAMES[sectionKey] || 'This feature';

  const breadcrumbs = [
    { label: 'Route 53', href: '/dashboard' },
    { label: sectionName },
  ];

  return (
    <div>
      <Breadcrumbs items={breadcrumbs} />

      <div className="mt-8 flex flex-col items-center justify-center py-20 px-4">
        {/* Icon */}
        <div className="w-16 h-16 bg-[#f2f3f3] border-2 border-dashed border-[#aab7c4] rounded-full flex items-center justify-center mb-6">
          <Wrench className="w-7 h-7 text-[#7b8a98]" />
        </div>

        {/* Title */}
        <h1 className="text-[22px] font-semibold text-[#16191f] mb-2">{sectionName}</h1>
        <p className="text-[13px] text-[#545b64] text-center max-w-md leading-relaxed">
          This section is not implemented in this demo. In the real AWS Route 53 console,{' '}
          <span className="font-medium text-[#16191f]">{sectionName}</span> provides advanced
          DNS routing, monitoring, and traffic management capabilities.
        </p>

        {/* Info box */}
        <div className="mt-8 bg-[#f2f8fc] border border-[#bee3f8] p-4 max-w-md w-full" style={{ borderRadius: '2px' }}>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#0066cc] flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-white text-[11px] font-bold">i</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#16191f] mb-1">Demo Note</p>
              <p className="text-[12px] text-[#545b64] leading-relaxed">
                This Route 53 clone implements full CRUD for <strong>Hosted Zones</strong> and{' '}
                <strong>DNS Records</strong>. Traffic policies, health checks, resolver, and domain
                registration are shown as placeholders per the assignment scope.
              </p>
            </div>
          </div>
        </div>

        {/* Back link */}
        <Link
          href="/dashboard/zones"
          className="mt-8 flex items-center gap-2 text-[13px] text-[#0066cc] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to Hosted zones
        </Link>
      </div>
    </div>
  );
}
