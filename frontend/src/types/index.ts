export interface User {
  email: string;
}

export type ZoneType = 'Public' | 'Private';

export interface HostedZone {
  id: number;
  hosted_zone_id?: string | null;
  domain_name: string;
  description: string | null;
  zone_type: ZoneType;
  created_at: string;
  updated_at: string;
  record_count: number;
}

export type DNSRecordType = 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'PTR' | 'SRV' | 'CAA' | 'SOA';

export interface DNSRecord {
  id: number;
  zone_id: number;
  name: string;
  type: DNSRecordType;
  value: string;
  ttl: number;
  created_at: string;
}

export interface DashboardStats {
  total_hosted_zones: number;
  total_dns_records: number;
  public_zones: number;
  private_zones: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_hosted_zones: HostedZone[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}
