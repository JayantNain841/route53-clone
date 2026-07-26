'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { zoneService, recordService, getErrorMessage } from '@/services/api';
import { HostedZone, DNSRecord, DNSRecordType } from '@/types';
import Breadcrumbs from '@/components/Breadcrumbs';
import {
  Globe,
  Lock,
  Search,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Loader2,
  X,
  Download,
  Upload,
  FileJson,
  FileCode,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Layers,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// DNS record schema
const RECORD_NAME_REGEX =
  /^(\*|@|([a-zA-Z0-9*_-](([a-zA-Z0-9-]){0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\.?)$/;

const recordSchema = zod.object({
  name: zod
    .string()
    .min(1, 'Record name is required')
    .refine((v) => {
      const val = v.trim().toLowerCase();
      if (val === '@' || val === '*') return true;
      if (/^[a-zA-Z0-9*_-]+$/.test(val)) return true;
      return RECORD_NAME_REGEX.test(val) || val.startsWith('*.');
    }, 'Must be a valid subdomain or @'),
  type: zod.enum(['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA', 'SOA']),
  value: zod.string().min(1, 'Value is required'),
  ttl: zod.preprocess(
    (val) => (typeof val === 'string' ? (val.trim() === '' ? NaN : Number(val)) : val),
    zod
      .number()
      .refine((v) => !Number.isNaN(v), { message: 'TTL must be a number' })
      .positive('TTL must be positive')
      .int('TTL must be an integer')
  ),
});

type RecordFormData = zod.infer<typeof recordSchema>;

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA', 'SOA'] as const;

const TYPE_COLORS: Record<string, string> = {
  A: '#0066cc',
  AAAA: '#0066cc',
  CNAME: '#0073bb',
  TXT: '#d13212',
  MX: '#6b21a8',
  NS: '#1d8102',
  PTR: '#854d0e',
  SRV: '#0f766e',
  CAA: '#9a3412',
  SOA: '#545b64',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ZoneDetailPage({ params }: PageProps) {
  const { id: zoneIdStr } = use(params);
  const zoneId = parseInt(zoneIdStr);

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingZone, setLoadingZone] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Row selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DNSRecord | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const [createdBanner, setCreatedBanner] = useState<string | null>(null);

  const fetchZoneDetails = useCallback(async () => {
    try {
      setLoadingZone(true);
      setZone(await zoneService.getZone(zoneId));
    } catch {
      toast.error('Failed to load hosted zone details.');
    } finally {
      setLoadingZone(false);
    }
  }, [zoneId]);

  const fetchRecords = useCallback(async () => {
    try {
      setLoadingRecords(true);
      const skip = (page - 1) * limit;
      const data = await recordService.getRecords(zoneId, skip, limit, search, filterType);
      setRecords(data.items);
      setTotal(data.total);
      setSelectedIds(new Set());
    } catch {
      toast.error('Failed to load DNS records.');
    } finally {
      setLoadingRecords(false);
    }
  }, [zoneId, page, filterType]);

  useEffect(() => { fetchZoneDetails(); }, [fetchZoneDetails]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    try {
      if (searchParams?.get('created') === '1') {
        const name = searchParams.get('name') || '';
        setCreatedBanner(`${name} was successfully created.`);
      }
    } catch (e) {
      // ignore
    }
  }, [searchParams]);

  const handleRefresh = () => {
    fetchZoneDetails();
    fetchRecords();
    toast.success('Refreshed.');
  };

  const dismissBanner = () => setCreatedBanner(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  // Forms
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm({ resolver: zodResolver(recordSchema), defaultValues: { name: '', type: 'A', value: '', ttl: 300 } });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm({ resolver: zodResolver(recordSchema) });

  const handleOpenEdit = (record: DNSRecord) => {
    setEditingRecord(record);
    resetEdit({ name: record.name, type: record.type as DNSRecordType, value: record.value, ttl: record.ttl });
  };

  const onSubmitCreate = async (data: RecordFormData) => {
    setIsSubmitting(true);
    try {
      await recordService.createRecord(zoneId, data.name.trim() || '@', data.type, data.value.trim(), data.ttl);
      toast.success('DNS record created.');
      resetCreate();
      setIsCreateOpen(false);
      fetchZoneDetails();
      fetchRecords();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create record.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitEdit = async (data: RecordFormData) => {
    if (!editingRecord) return;
    setIsSubmitting(true);
    try {
      await recordService.updateRecord(editingRecord.id, data.name.trim(), data.type, data.value.trim(), data.ttl);
      toast.success('DNS record updated.');
      setEditingRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update record.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    setIsSubmitting(true);
    try {
      await recordService.deleteRecord(deletingRecord.id);
      toast.success('DNS record deleted.');
      setDeletingRecord(null);
      fetchZoneDetails();
      fetchRecords();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete record.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) { toast.error('Please select a file.'); return; }
    setImporting(true);
    try {
      const res = await recordService.importBindFile(zoneId, importFile);
      if (res.success) {
        toast.success(`Imported ${res.imported_records} records.`);
        setIsImportOpen(false);
        setImportFile(null);
        fetchZoneDetails();
        fetchRecords();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to import BIND file.'));
    } finally {
      setImporting(false);
    }
  };

  const handleExportJson = async () => {
    if (!zone) return;
    const res = await recordService.exportJsonFile(zoneId);
    const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${zone.domain_name}_records.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success('Exported JSON.');
    setExportMenuOpen(false);
  };

  const handleExportBind = async () => {
    if (!zone) return;
    const res = await recordService.exportBindFile(zoneId);
    const blob = new Blob([res.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = res.filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success('Exported BIND format.');
    setExportMenuOpen(false);
  };

  // Checkbox logic
  const allSelected = records.length > 0 && records.every((r) => selectedIds.has(r.id));
  const someSelected = records.some((r) => selectedIds.has(r.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(records.map((r) => r.id)));
  };
  const toggleRow = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const selectedCount = selectedIds.size;
  const firstSelected = records.find((r) => selectedIds.has(r.id)) || null;
  const isSystemRecord = (r: DNSRecord) => r.name === '@' && (r.type === 'NS' || r.type === 'SOA');

  const totalPages = Math.ceil(total / limit);
  const breadcrumbs = [
    { label: 'Route 53', href: '/dashboard' },
    { label: 'Hosted zones', href: '/dashboard/zones' },
    { label: zone?.domain_name || '...' },
  ];

  const fqdnDisplay = (record: DNSRecord) => {
    if (!zone) return record.name;
    if (record.name === '@') return `${zone.domain_name}.`;
    if (record.name.endsWith(zone.domain_name)) return `${record.name}.`;
    return `${record.name}.${zone.domain_name}.`;
  };

  return (
    <div className="zone-detail-page">
      {/* Breadcrumb */}
      <Breadcrumbs items={breadcrumbs} />

      {/* Created success banner (shown after creating a zone) */}
      {createdBanner && (
        <div className="mb-4">
          <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--aws-green)', color: '#fff' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{createdBanner}</div>
                <div className="text-sm">Now you can create records in the hosted zone to specify how you want Route 53 to route traffic for your domain.</div>
              </div>
              <button onClick={dismissBanner} className="ml-4" style={{ color: '#fff', background: 'transparent', border: 'none' }} aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Zone Detail Header ── */}
      <div className="mb-5">
        {loadingZone ? (
          <div className="h-8 bg-gray-200 w-72 animate-pulse rounded mb-2" />
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link href="/dashboard/zones" className="text-[#545b64] hover:text-[#16191f]" title="Back">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-[20px] font-semibold text-[#16191f]">{zone?.domain_name}</h1>
                {zone?.zone_type === 'Public' ? (
                  <span className="aws-badge-public"><Globe className="w-2.5 h-2.5" />Public</span>
                ) : (
                  <span className="aws-badge-private"><Lock className="w-2.5 h-2.5" />Private</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-[12px] text-[#545b64] ml-7">
                <span>
                  <span className="font-semibold">Hosted zone ID:</span>{' '}
                  <span className="aws-zone-id">
                    {(zone as any)?.hosted_zone_id || `Z${String(zone?.id || 0).padStart(13, '0')}`}
                  </span>
                </span>
                <span>
                  <span className="font-semibold">Record count:</span> {zone?.record_count}
                </span>
                {zone?.description && (
                  <span>
                    <span className="font-semibold">Description:</span> {zone.description}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Export dropdown */}
              <div className="relative">
                <button
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  className="aws-btn-secondary"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                  <ChevronDown className="w-3 h-3" />
                </button>
                {exportMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 bg-white border border-[#d5dbdb] shadow-md z-20 animate-fadeIn"
                    style={{ borderRadius: '2px', minWidth: '160px' }}
                  >
                    <button
                      onClick={handleExportJson}
                      className="flex items-center gap-2 w-full px-4 py-2 text-[13px] hover:bg-[#f2f3f3] text-left"
                    >
                      <FileJson className="w-3.5 h-3.5 text-gray-400" />
                      Export as JSON
                    </button>
                    <button
                      onClick={handleExportBind}
                      className="flex items-center gap-2 w-full px-4 py-2 text-[13px] hover:bg-[#f2f3f3] text-left"
                    >
                      <FileCode className="w-3.5 h-3.5 text-gray-400" />
                      Export BIND format
                    </button>
                  </div>
                )}
              </div>

              {/* Import BIND */}
              <button
                onClick={() => setIsImportOpen(true)}
                className="aws-btn-secondary"
              >
                <Upload className="w-3.5 h-3.5" />
                Import zone file
              </button>

              {/* Create record */}
              <button
                onClick={() => { resetCreate(); setIsCreateOpen(true); }}
                className="aws-btn-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                Create record
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Hosted zone details (three-column panel) ── */}
      <div className="aws-card mb-6 zone-details-card">
        <div className="aws-card-header flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">Hosted zone details</h2>
          <button className="aws-btn-secondary">Edit hosted zone</button>
        </div>
        <div className="p-5 grid grid-cols-3 gap-6">
          <div>
            <div className="text-[13px] font-semibold mb-1">Hosted zone name</div>
            <div className="text-[13px] mb-3">{zone?.domain_name || '-'}</div>

            <div className="text-[13px] font-semibold mb-1">Hosted zone ID</div>
            <div className="text-[13px] mb-3">{(zone as any)?.hosted_zone_id || `Z${String(zone?.id || 0).padStart(13, '0')}`}</div>

            <div className="text-[13px] font-semibold mb-1">Description</div>
            <div className="text-[13px]">{zone?.description || '-'}</div>
          </div>

          <div>
            <div className="text-[13px] font-semibold mb-1">Query log</div>
            <div className="text-[13px] mb-3">-</div>

            <div className="text-[13px] font-semibold mb-1">Type</div>
            <div className="text-[13px] mb-3">{zone?.zone_type ? `${zone.zone_type} hosted zone` : '-'}</div>

            <div className="text-[13px] font-semibold mb-1">Record count</div>
            <div className="text-[13px]">{zone?.record_count ?? 0}</div>
          </div>

          <div>
            <div className="text-[13px] font-semibold mb-1">Name servers</div>
            <div className="text-[13px] leading-relaxed">
              {records.filter(r => r.type === 'NS').length > 0 ? (
                records.filter(r => r.type === 'NS').flatMap(r => r.value.split(/[,\s]+/)).map((ns, i) => (
                  <div key={i}>{ns}</div>
                ))
              ) : (
                <div>-</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Records Table Card ── */}
      <div className="aws-card overflow-hidden">

        {/* Action Bar */}
        <div className="aws-action-bar">
          <button
            disabled={selectedCount !== 1 || (firstSelected ? isSystemRecord(firstSelected) : true)}
            onClick={() => firstSelected && handleOpenEdit(firstSelected)}
            className="aws-btn-secondary"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit record
          </button>

          <button
            disabled={selectedCount === 0 || (firstSelected ? isSystemRecord(firstSelected) : true)}
            onClick={() => firstSelected && setDeletingRecord(firstSelected)}
            className="aws-btn-danger"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete{selectedCount > 1 ? ` (${selectedCount})` : ''}
          </button>

          <button
            onClick={handleRefresh}
            className="aws-btn-secondary ml-auto"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {selectedCount > 0 && (
            <span className="text-[12px] text-[#545b64]">{selectedCount} selected</span>
          )}
        </div>

        {/* Filter Bar */}
        <div className="aws-filter-bar">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-0 flex-1 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Filter records by name or value"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="aws-input"
                style={{ paddingLeft: '30px', borderRadius: '2px 0 0 2px' }}
              />
            </div>
            <button
              type="submit"
              className="aws-btn-secondary"
              style={{ borderRadius: '0 2px 2px 0', borderLeft: 'none', padding: '5px 10px' }}
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center gap-2 text-[13px]">
            <label className="text-[#545b64] font-medium whitespace-nowrap">Record type:</label>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="aws-select"
              style={{ paddingLeft: '8px' }}
            >
              <option value="All">All</option>
              {RECORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <span className="text-[12px] text-[#545b64] ml-auto whitespace-nowrap">
            {total} record{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        {loadingRecords ? (
          <div className="p-12 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 bg-gray-100 rounded" />)}
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="aws-table w-full border-collapse">
              <thead>
                <tr>
                  <th style={{ width: '36px', padding: '8px 0 8px 16px' }}>
                    <input
                      type="checkbox"
                      className="aws-checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Record name</th>
                  <th style={{ width: '70px' }}>Type</th>
                  <th style={{ width: '120px' }}>Routing policy</th>
                  <th>Value/Route traffic to</th>
                  <th style={{ width: '110px' }}>TTL (seconds)</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Alias</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const selected = selectedIds.has(record.id);
                  const sysRecord = isSystemRecord(record);
                  const typeColor = TYPE_COLORS[record.type] || '#545b64';

                  return (
                    <tr
                      key={record.id}
                      className={selected ? 'selected' : ''}
                      onClick={() => toggleRow(record.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ padding: '10px 0 10px 16px' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="aws-checkbox"
                          checked={selected}
                          onChange={() => toggleRow(record.id)}
                        />
                      </td>

                      {/* Record name */}
                      <td>
                        <span className="font-medium text-[#16191f]">{fqdnDisplay(record)}</span>
                        {sysRecord && (
                          <span className="ml-2 text-[10px] text-[#545b64] bg-[#f2f3f3] border border-[#d5dbdb] px-1.5 py-0.5" style={{ borderRadius: '10px' }}>
                            system
                          </span>
                        )}
                      </td>

                      {/* Type */}
                      <td>
                        <span
                          className="inline-block text-[11px] font-bold px-1.5 py-0.5 font-mono"
                          style={{
                            backgroundColor: `${typeColor}15`,
                            color: typeColor,
                            border: `1px solid ${typeColor}40`,
                            borderRadius: '2px',
                          }}
                        >
                          {record.type}
                        </span>
                      </td>

                      {/* Routing policy */}
                      <td className="text-[#545b64]">Simple</td>

                      {/* Value */}
                      <td>
                        <span
                          className="block font-mono text-[12px] text-[#16191f] max-w-[280px] truncate"
                          title={record.value}
                        >
                          {record.value}
                        </span>
                      </td>

                      {/* TTL */}
                      <td className="text-[#545b64]">{record.ttl}</td>

                      {/* Alias */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="text-[12px] text-[#545b64]">No</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center">
            <Layers className="w-12 h-12 text-[#aab7c4] mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-[#16191f]">No records found</p>
            <p className="text-[13px] text-[#545b64] mt-1 mb-5">
              {search || filterType !== 'All' ? 'Try broadening your filter.' : 'Create your first DNS record.'}
            </p>
            {!search && filterType === 'All' && (
              <button
                onClick={() => { resetCreate(); setIsCreateOpen(true); }}
                className="aws-btn-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                Create record
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-2.5 bg-[#fafafa] border-t border-[#eaeded] flex items-center justify-between text-[12px] text-[#545b64] select-none">
            <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="aws-btn-secondary" style={{ padding: '4px 8px' }}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="aws-btn-secondary" style={{ padding: '4px 8px' }}>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
           SLIDE-OVER: Create Record
      ══════════════════════════════════════════════════════════════════════ */}
      {isCreateOpen && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsCreateOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div
              className="w-screen max-w-lg bg-white shadow-xl flex flex-col border-l border-[#eaeded] animate-fadeIn"
              style={{ marginTop: '50px' }}
            >
              <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
                <h2 className="text-[15px] font-semibold text-[#16191f]">Create record</h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleSubmitCreate(onSubmitCreate)}
                className="flex-1 overflow-y-auto p-6 space-y-5"
              >
                {/* Record name */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    Record name <span className="text-[#d13212]">*</span>
                  </label>
                  <div className="flex items-stretch">
                    <input
                      type="text"
                      {...registerCreate('name')}
                      placeholder="www"
                      className="aws-input"
                      style={{ borderRadius: '2px 0 0 2px', flex: 1 }}
                    />
                    <span
                      className="bg-[#f2f3f3] border border-l-0 border-[#aab7c4] px-3 text-[12px] text-[#545b64] font-medium flex items-center whitespace-nowrap"
                      style={{ borderRadius: '0 2px 2px 0' }}
                    >
                      .{zone?.domain_name}.
                    </span>
                  </div>
                  {createErrors.name ? (
                    <p className="mt-1 text-[12px] text-[#d13212]">{createErrors.name.message}</p>
                  ) : (
                    <p className="mt-1 text-[12px] text-[#545b64]">Use @ for the zone apex.</p>
                  )}
                </div>

                {/* Record type */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    Record type <span className="text-[#d13212]">*</span>
                  </label>
                  <select
                    {...registerCreate('type')}
                    className="aws-select"
                    style={{ width: '100%', paddingLeft: '10px' }}
                  >
                    {RECORD_TYPES.map((t) => <option key={t} value={t}>{t} — {getRecordTypeDesc(t)}</option>)}
                  </select>
                </div>

                {/* Routing policy (mocked) */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">Routing policy</label>
                  <select
                    disabled
                    className="aws-select"
                    style={{ width: '100%', paddingLeft: '10px' }}
                  >
                    <option>Simple routing</option>
                  </select>
                  <p className="mt-1 text-[12px] text-[#545b64]">
                    Routing policy determines how Route 53 responds to queries. (Simple routing only in demo)
                  </p>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    Value <span className="text-[#d13212]">*</span>
                  </label>
                  <textarea
                    {...registerCreate('value')}
                    placeholder="e.g. 192.0.2.1"
                    rows={4}
                    className="aws-input"
                    style={{ resize: 'vertical', minHeight: '80px', fontFamily: "'Courier New', monospace" }}
                  />
                  {createErrors.value ? (
                    <p className="mt-1 text-[12px] text-[#d13212]">{createErrors.value.message}</p>
                  ) : (
                    <p className="mt-1 text-[12px] text-[#545b64]">
                      Enter one value per line (IP address, hostname, etc.).
                    </p>
                  )}
                </div>

                {/* TTL */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    TTL (seconds)
                  </label>
                  <input
                    type="number"
                    {...registerCreate('ttl', { valueAsNumber: true })}
                    className="aws-input"
                    style={{ maxWidth: '200px' }}
                  />
                  {createErrors.ttl ? (
                    <p className="mt-1 text-[12px] text-[#d13212]">{createErrors.ttl.message}</p>
                  ) : (
                    <p className="mt-1 text-[12px] text-[#545b64]">
                      Time to live: how long resolvers cache this record. Recommended: 300.
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#eaeded] flex items-center gap-3">
                  <button type="submit" disabled={isSubmitting} className="aws-btn-primary">
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Create records
                  </button>
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="aws-btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           SLIDE-OVER: Edit Record
      ══════════════════════════════════════════════════════════════════════ */}
      {editingRecord && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingRecord(null)} />
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div
              className="w-screen max-w-lg bg-white shadow-xl flex flex-col border-l border-[#eaeded] animate-fadeIn"
              style={{ marginTop: '50px' }}
            >
              <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
                <h2 className="text-[15px] font-semibold text-[#16191f]">Edit record</h2>
                <button onClick={() => setEditingRecord(null)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleSubmitEdit(onSubmitEdit)}
                className="flex-1 overflow-y-auto p-6 space-y-5"
              >
                {/* Record name */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">Record name</label>
                  <div className="flex items-stretch">
                    <input
                      type="text"
                      {...registerEdit('name')}
                      className="aws-input"
                      style={{ borderRadius: '2px 0 0 2px', flex: 1 }}
                    />
                    <span
                      className="bg-[#f2f3f3] border border-l-0 border-[#aab7c4] px-3 text-[12px] text-[#545b64] font-medium flex items-center whitespace-nowrap"
                      style={{ borderRadius: '0 2px 2px 0' }}
                    >
                      .{zone?.domain_name}.
                    </span>
                  </div>
                  {editErrors.name && <p className="mt-1 text-[12px] text-[#d13212]">{editErrors.name.message}</p>}
                </div>

                {/* Record type */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">Record type</label>
                  <select {...registerEdit('type')} className="aws-select" style={{ width: '100%', paddingLeft: '10px' }}>
                    {RECORD_TYPES.map((t) => <option key={t} value={t}>{t} — {getRecordTypeDesc(t)}</option>)}
                  </select>
                  {editErrors.type && <p className="mt-1 text-[12px] text-[#d13212]">{editErrors.type.message}</p>}
                </div>

                {/* Value */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">Value</label>
                  <textarea
                    {...registerEdit('value')}
                    rows={4}
                    className="aws-input"
                    style={{ resize: 'vertical', minHeight: '80px', fontFamily: "'Courier New', monospace" }}
                  />
                  {editErrors.value && <p className="mt-1 text-[12px] text-[#d13212]">{editErrors.value.message}</p>}
                </div>

                {/* TTL */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">TTL (seconds)</label>
                  <input type="number" {...registerEdit('ttl', { valueAsNumber: true })} className="aws-input" style={{ maxWidth: '200px' }} />
                  {editErrors.ttl && <p className="mt-1 text-[12px] text-[#d13212]">{editErrors.ttl.message}</p>}
                </div>

                <div className="pt-4 border-t border-[#eaeded] flex items-center gap-3">
                  <button type="submit" disabled={isSubmitting} className="aws-btn-primary">
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save changes
                  </button>
                  <button type="button" onClick={() => setEditingRecord(null)} className="aws-btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           MODAL: Delete Record
      ══════════════════════════════════════════════════════════════════════ */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white border border-[#eaeded] max-w-md w-full shadow-xl animate-fadeIn" style={{ borderRadius: '2px' }}>
            <div className="px-5 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <span className="flex items-center gap-2 text-[14px] font-semibold text-[#16191f]">
                <AlertTriangle className="w-4 h-4 text-[#d13212]" />
                Delete record
              </span>
              <button onClick={() => setDeletingRecord(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[13px] text-[#16191f]">
                Are you sure you want to delete the{' '}
                <strong>{deletingRecord.type}</strong> record{' '}
                <strong>{fqdnDisplay(deletingRecord)}</strong>?
              </p>
              <div className="bg-[#fff8f0] border border-[#f0b429] p-3 text-[12px] text-[#805105] leading-relaxed" style={{ borderRadius: '2px' }}>
                <p className="font-semibold mb-0.5">Warning</p>
                <p>This record will be permanently deleted and cannot be recovered.</p>
              </div>
            </div>
            <div className="px-5 py-4 bg-[#f2f3f3] border-t border-[#eaeded] flex items-center gap-3 justify-end">
              <button disabled={isSubmitting} onClick={() => setDeletingRecord(null)} className="aws-btn-secondary">Cancel</button>
              <button
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
                className="aws-btn-primary"
                style={{ backgroundColor: '#d13212', borderColor: '#a52100', color: '#fff' }}
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           MODAL: Import BIND File
      ══════════════════════════════════════════════════════════════════════ */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white border border-[#eaeded] max-w-md w-full shadow-xl animate-fadeIn" style={{ borderRadius: '2px' }}>
            <div className="px-5 py-4 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
              <h2 className="text-[14px] font-semibold text-[#16191f]">Import zone file</h2>
              <button onClick={() => setIsImportOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleImportSubmit}>
              <div className="p-5 space-y-4">
                <p className="text-[13px] text-[#545b64]">
                  Upload a BIND-format zone file to import DNS records into{' '}
                  <strong>{zone?.domain_name}</strong>.
                </p>
                <div
                  className="border-2 border-dashed border-[#aab7c4] p-6 text-center cursor-pointer hover:bg-[#f8f9fa] transition-colors"
                  style={{ borderRadius: '2px' }}
                  onClick={() => document.getElementById('bind-file')?.click()}
                >
                  <Upload className="w-8 h-8 text-[#aab7c4] mx-auto mb-2" />
                  {importFile ? (
                    <p className="text-[13px] font-medium text-[#0066cc]">{importFile.name}</p>
                  ) : (
                    <>
                      <p className="text-[13px] text-[#16191f]">Click to select a zone file</p>
                      <p className="text-[12px] text-[#545b64] mt-0.5">BIND format (.zone, .txt)</p>
                    </>
                  )}
                </div>
                <input
                  id="bind-file"
                  type="file"
                  accept=".zone,.txt,.bind"
                  className="hidden"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="px-5 py-4 bg-[#f2f3f3] border-t border-[#eaeded] flex items-center gap-3 justify-end">
                <button type="button" onClick={() => setIsImportOpen(false)} className="aws-btn-secondary">Cancel</button>
                <button type="submit" disabled={!importFile || importing} className="aws-btn-primary">
                  {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: short record type descriptions
function getRecordTypeDesc(type: string): string {
  const descs: Record<string, string> = {
    A: 'IPv4 address',
    AAAA: 'IPv6 address',
    CNAME: 'Canonical name',
    TXT: 'Text record',
    MX: 'Mail exchange',
    NS: 'Name server',
    PTR: 'Pointer record',
    SRV: 'Service locator',
    CAA: 'Certification authority',
    SOA: 'Start of authority',
  };
  return descs[type] || type;
}
