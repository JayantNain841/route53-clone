'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="aws-breadcrumb mb-3 select-none">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;

        return (
          <span key={idx} className="flex items-center gap-1">
            {idx > 0 && (
              <span className="text-[#545b64] mx-1 font-normal">&gt;</span>
            )}
            {item.href && !isLast ? (
              <Link href={item.href} className="text-[#0066cc] hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-[#545b64]">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
