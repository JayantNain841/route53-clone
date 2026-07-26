'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardService } from '@/services/api';
import { DashboardData, HostedZone } from '@/types';
import Breadcrumbs from '@/components/Breadcrumbs';
import { 
  Globe, 
  Lock, 
  Layers, 
  FileText, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Settings,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getStats();
      setData(res);
    } catch (error) {
      toast.error('Failed to load dashboard data.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const breadcrumbs = [{ label: 'Route 53', href: '/dashboard' }, { label: 'Dashboard' }];

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        {/* Loading Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-[#eaeded] p-5 h-28 animate-pulse rounded-sm">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 bg-white border border-[#eaeded] p-6 animate-pulse h-96 rounded-sm">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#eaeded] p-6 animate-pulse h-80 rounded-sm">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    total_hosted_zones: 0,
    total_dns_records: 0,
    public_zones: 0,
    private_zones: 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <Breadcrumbs items={breadcrumbs} />
          <h1 className="text-2xl font-semibold text-[#16191f]">Route 53 Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Amazon Route 53 is a highly available and scalable Domain Name System (DNS) web service. 
            Manage your hosted zones, DNS records, and routing configurations.
          </p>
        </div>
        
        <Link
          href="/dashboard/zones"
          className="flex items-center space-x-1.5 bg-[#ff9900] hover:bg-[#ec8b00] active:bg-[#d67d00] text-black text-xs font-semibold py-1.5 px-3 border border-[#a16000] rounded-sm transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create hosted zone</span>
        </Link>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Hosted Zones */}
        <div className="bg-white border-l-4 border-l-[#ff9900] border border-[#eaeded] p-5 shadow-sm hover:shadow transition-shadow flex items-center justify-between rounded-sm">
          <div>
            <span className="block text-xs font-semibold text-[#545b64] uppercase tracking-wider">Total Hosted Zones</span>
            <span className="block text-2xl font-semibold text-[#16191f] mt-1">{stats.total_hosted_zones}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#fcf2e3] flex items-center justify-center text-[#ff9900]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total DNS Records */}
        <div className="bg-white border-l-4 border-l-[#0066cc] border border-[#eaeded] p-5 shadow-sm hover:shadow transition-shadow flex items-center justify-between rounded-sm">
          <div>
            <span className="block text-xs font-semibold text-[#545b64] uppercase tracking-wider">Total DNS Records</span>
            <span className="block text-2xl font-semibold text-[#16191f] mt-1">{stats.total_dns_records}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#e3effc] flex items-center justify-center text-[#0066cc]">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Public Zones */}
        <div className="bg-white border-l-4 border-l-[#1d8102] border border-[#eaeded] p-5 shadow-sm hover:shadow transition-shadow flex items-center justify-between rounded-sm">
          <div>
            <span className="block text-xs font-semibold text-[#545b64] uppercase tracking-wider">Public Zones</span>
            <span className="block text-2xl font-semibold text-[#16191f] mt-1">{stats.public_zones}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#e8f7e5] flex items-center justify-center text-[#1d8102]">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Private Zones */}
        <div className="bg-white border-l-4 border-l-[#545b64] border border-[#eaeded] p-5 shadow-sm hover:shadow transition-shadow flex items-center justify-between rounded-sm">
          <div>
            <span className="block text-xs font-semibold text-[#545b64] uppercase tracking-wider">Private Zones</span>
            <span className="block text-2xl font-semibold text-[#16191f] mt-1">{stats.private_zones}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#f2f3f3] flex items-center justify-center text-[#545b64]">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Zones Table & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Hosted Zones Table */}
        <div className="lg:col-span-2 bg-white border border-[#eaeded] shadow-sm rounded-sm">
          <div className="aws-card-header px-5 py-3.5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#16191f]">Recent Hosted Zones</h3>
            <Link 
              href="/dashboard/zones"
              className="text-[#0066cc] hover:underline text-xs font-medium flex items-center"
            >
              <span>View all zones</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {data && data.recent_hosted_zones.length > 0 ? (
              <table className="w-full text-left text-xs font-normal border-collapse">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                    <th className="py-2.5 px-4">Domain name</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-center">Records</th>
                    <th className="py-2.5 px-4">Created at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                  {data.recent_hosted_zones.map((zone: HostedZone) => (
                    <tr 
                      key={zone.id} 
                      className="hover:bg-[#f2f8fc]/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-[#0066cc] hover:underline cursor-pointer">
                        <Link href={`/dashboard/zones/${zone.id}`}>{zone.domain_name}</Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          zone.zone_type === 'Public' 
                            ? 'bg-[#e8f7e5] text-[#1d8102] border border-[#d3ecd0]' 
                            : 'bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]'
                        }`}>
                          {zone.zone_type === 'Public' ? (
                            <Globe className="w-2.5 h-2.5 mr-1" />
                          ) : (
                            <Lock className="w-2.5 h-2.5 mr-1" />
                          )}
                          {zone.zone_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate text-gray-500">
                        {zone.description || <span className="text-gray-400 italic">No description</span>}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{zone.record_count}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(zone.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Layers className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="font-medium text-sm">No hosted zones found</p>
                <p className="text-xs text-gray-400 mt-1">Get started by creating your first hosted zone.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Navigation & Help */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white border border-[#eaeded] shadow-sm rounded-sm">
            <div className="aws-card-header px-5 py-3.5">
              <h3 className="text-sm font-semibold text-[#16191f]">Quick Navigation</h3>
            </div>
            <div className="p-4 space-y-2">
              <Link 
                href="/dashboard/zones"
                className="flex items-center justify-between p-2.5 rounded hover:bg-[#f2f3f3] border border-[#eaeded] hover:border-gray-300 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <Layers className="w-4 h-4 text-[#ff9900]" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-[#16191f]">View Hosted Zones</p>
                    <p className="text-[10px] text-gray-500">Manage domains and subdomains</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-black transition-colors" />
              </Link>
              
              <div
                className="flex items-center justify-between p-2.5 rounded border border-[#eaeded] bg-gray-50 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <Activity className="w-4 h-4 text-[#1d8102]" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-400">Health Checks (Coming Soon)</p>
                    <p className="text-[10px] text-gray-400">Monitor website and endpoint health</p>
                  </div>
                </div>
              </div>

              <div
                className="flex items-center justify-between p-2.5 rounded border border-[#eaeded] bg-gray-50 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-4 h-4 text-purple-600" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-400">Route 53 Resolver (Coming Soon)</p>
                    <p className="text-[10px] text-gray-400">Hybrid DNS configurations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help Resource Card */}
          <div className="bg-white border border-[#eaeded] shadow-sm p-5 rounded-sm">
            <div className="flex items-start space-x-3">
              <HelpCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-[#16191f]">Learn about DNS Routing</h4>
                <p className="text-[11px] text-[#545b64] mt-1 leading-relaxed">
                  Route 53 supports various routing policies like Simple routing, Weighted routing, and Latency routing. 
                  DNS records resolve queries to IP addresses of resources.
                </p>
                <a 
                  href="#" 
                  className="inline-flex items-center text-[#0066cc] hover:underline text-[11px] font-medium mt-2"
                >
                  <span>Route 53 Developer Guide</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
