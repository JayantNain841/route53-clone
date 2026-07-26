'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  HeartPulse,
  GitMerge,
  Shuffle,
  Globe,
  FileText,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';

// ── Nav structure matching real AWS Route 53 sidebar ──────────────────────
const NAV_SECTIONS = [
  {
    id: 'root',
    label: null, // no section header for top-level
    items: [
      {
        name: 'Route 53 dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        disabled: false,
        exact: true,
      },
    ],
  },
  {
    id: 'dns',
    label: 'DNS management',
    items: [
      {
        name: 'Hosted zones',
        href: '/dashboard/zones',
        icon: Layers,
        disabled: false,
        exact: false,
      },
      {
        name: 'Resolver',
        href: '/dashboard/coming-soon',
        icon: GitMerge,
        disabled: false,
        comingSoon: true,
        exact: false,
      },
      {
        name: 'Route 53 Profiles',
        href: '/dashboard/coming-soon',
        icon: FileText,
        disabled: false,
        comingSoon: true,
        exact: false,
      },
    ],
  },
  {
    id: 'traffic',
    label: 'Traffic management',
    items: [
      {
        name: 'Traffic flow',
        href: '/dashboard/coming-soon',
        icon: Shuffle,
        disabled: false,
        comingSoon: true,
        exact: false,
      },
      {
        name: 'Health checks',
        href: '/dashboard/coming-soon',
        icon: HeartPulse,
        disabled: false,
        comingSoon: true,
        exact: false,
      },
    ],
  },
  {
    id: 'domains',
    label: 'Domains',
    items: [
      {
        name: 'Registered domains',
        href: '/dashboard/coming-soon',
        icon: Globe,
        disabled: false,
        comingSoon: true,
        exact: false,
      },
      {
        name: 'Transfer domains',
        href: '/dashboard/coming-soon',
        icon: Globe,
        disabled: false,
        comingSoon: true,
        exact: false,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname() || '';
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    // Hosted zones: active when on /dashboard/zones or /dashboard/zones/*
    if (href === '/dashboard/zones') {
      return pathname.startsWith('/dashboard/zones');
    }
    return pathname === href;
  };

  if (collapsed) {
    return (
      <aside
        className="w-12 aws-sidebar collapsed flex flex-col fixed top-[50px] bottom-0 left-0 z-40 transition-all"
      >
        <div className="flex-1 py-2">
          {NAV_SECTIONS.flatMap((s) =>
            s.items.map((item) => {
              const active = isActive(item.href, item.exact ?? false);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.name}
                  className={`flex items-center justify-center h-9 w-full border-l-[3px] transition-colors ${
                    active
                      ? 'border-l-[#ff9900] aws-sidebar-item-active-collapsed'
                      : 'border-l-transparent aws-sidebar-item-collapsed'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                </Link>
              );
            })
          )}
        </div>
        <button
          onClick={() => setCollapsed(false)}
          className="h-8 flex items-center justify-center aws-sidebar-collapse-btn"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="w-[220px] aws-sidebar flex flex-col fixed top-[50px] bottom-0 left-0 z-40 overflow-y-auto transition-all"
      style={{ fontFamily: "'Inter', 'Amazon Ember', Arial, sans-serif" }}
    >
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            {/* Section header */}
            {section.label && (
              <div className="aws-sidebar-section-header">{section.label}</div>
            )}

            {/* Items */}
            {section.items.map((item) => {
              const active = isActive(item.href, item.exact ?? false);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`aws-sidebar-item group ${
                    active ? 'aws-sidebar-item-active' : ''
                  }`}
                  style={{
                    fontSize: '13px',
                    paddingLeft: section.label ? '24px' : '16px',
                  }}
                >
                  <item.icon
                    className={`w-3.5 h-3.5 mr-2 shrink-0 aws-sidebar-icon ${
                      active ? 'aws-sidebar-icon-active' : 'aws-sidebar-icon-inactive'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.comingSoon && (
                    <ChevronRight className="w-3 h-3 opacity-30 ml-1" />
                  )}
                </Link>
              );
            })}

            {/* Divider between sections (except last) */}
            {section.id !== 'domains' && section.label && (
              <div className="mx-4 my-1 aws-sidebar-divider" />
            )}
          </div>
        ))}
      </nav>

      {/* Collapse button at bottom */}
      <div className="border-t border-[#253345] shrink-0">
        <button
          onClick={() => setCollapsed(true)}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] text-[#7b8a98] hover:text-white hover:bg-[#253345] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Collapse</span>
        </button>
      </div>
    </aside>
  );
}
