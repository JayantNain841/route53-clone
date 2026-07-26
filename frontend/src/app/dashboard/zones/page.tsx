'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { zoneService, getErrorMessage } from '@/services/api';
import { HostedZone } from '@/types';
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
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Layers,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const editZoneSchema = zod.object({
  description: zod.string().max(255).optional().or(zod.literal('')),
  zone_type: zod.enum(['Public', 'Private']),
});
type EditZoneFormData = zod.infer<typeof editZoneSchema>;

export default function HostedZonesPage() {
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Row selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modals
  const [editingZone, setEditingZone] = useState<HostedZone | null>(null);
  const [deletingZone, setDeletingZone] = useState<HostedZone | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * limit;
      const data = await zoneService.getZones(skip, limit, search, filterType);
      setZones(data.items);
      setTotal(data.total);
      setSelectedIds(new Set()); // clear selection on reload
    } catch (error) {
      toast.error('Failed to load hosted zones.');
    } finally {
      setLoading(false);
    }
  }, [page, filterType, search]);

  useEffect(() => {
    fetchZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchZones();
  };

  // Edit form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditZoneFormData>({
    resolver: zodResolver(editZoneSchema),
  });

  const handleOpenEdit = (zone: HostedZone) => {
    setEditingZone(zone);
    resetEdit({ description: zone.description || '', zone_type: zone.zone_type });
  };

  const onSubmitEdit = async (data: EditZoneFormData) => {
    if (!editingZone) return;
    setIsSubmitting(true);
    try {
      await zoneService.updateZone(editingZone.id, data.description || null, data.zone_type);
      toast.success(`Hosted zone '${editingZone.domain_name}' updated.`);
      setEditingZone(null);
      fetchZones();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update hosted zone.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingZone) return;
    setIsSubmitting(true);
    try {
      await zoneService.deleteZone(deletingZone.id);
      toast.success(`Hosted zone '${deletingZone.domain_name}' deleted.`);
      setDeletingZone(null);
      if (zones.length === 1 && page > 1) setPage(page - 1);
      else fetchZones();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete hosted zone.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Checkbox logic ──
  const allSelected = zones.length > 0 && zones.every((z) => selectedIds.has(z.id));
  const someSelected = zones.some((z) => selectedIds.has(z.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(zones.map((z) => z.id)));
    }
  };

  const toggleRow = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Get first selected zone for single-edit
  const firstSelected = zones.find((z) => selectedIds.has(z.id)) || null;
  const selectedCount = selectedIds.size;

  const totalPages = Math.ceil(total / limit);
  const breadcrumbs = [{ label: 'Route 53', href: '/dashboard' }, { label: 'Hosted zones' }];

  return (
    <div>
      {/* ── Breadcrumb + Title ── */}
      <Breadcrumbs items={breadcrumbs} />
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-[#16191f]">Hosted zones</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            A hosted zone is a container for records that define how you want to route traffic for a domain.
          </p>
        </div>
        <Link
          href="/dashboard/zones/create"
          className="aws-btn-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          Create hosted zone
        </Link>
      </div>

      {/* ── Main Table Card ── */}
      <div className="aws-card overflow-hidden">

        {/* ── Action Bar (context-sensitive) ── */}
        <div className="aws-action-bar">
          {/* Edit button — enabled only when exactly 1 row selected */}
          <button
            disabled={selectedCount !== 1}
            onClick={() => firstSelected && handleOpenEdit(firstSelected)}
            className="aws-btn-secondary"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit hosted zone
          </button>

          {/* Delete button */}
          <button
            disabled={selectedCount === 0}
            onClick={() => firstSelected && setDeletingZone(firstSelected)}
            className="aws-btn-danger"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete{selectedCount > 1 ? ` (${selectedCount})` : ''}
          </button>

          {/* Refresh */}
          <button
            onClick={() => { fetchZones(); toast.success('Refreshed.'); }}
            className="aws-btn-secondary ml-auto"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Selection info */}
          {selectedCount > 0 && (
            <span className="text-[12px] text-[#545b64]">
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* ── Filter Bar ── */}
        <div className="aws-filter-bar">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-0 flex-1 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Filter hosted zones by name or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="aws-input"
                style={{ paddingLeft: '30px', borderRadius: '2px 0 0 2px' }}
              />
            </div>
            <button
              type="submit"
              className="aws-btn-secondary"
              style={{ borderRadius: '0 2px 2px 0', borderLeft: 'none', paddingLeft: '12px', paddingRight: '12px' }}
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Type filter */}
          <div className="flex items-center gap-2 text-[13px]">
            <label className="text-[#545b64] font-medium whitespace-nowrap">Type:</label>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="aws-select"
              style={{ paddingLeft: '8px' }}
            >
              <option value="All">All</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
          </div>

          {/* Total count */}
          <span className="text-[12px] text-[#545b64] ml-auto whitespace-nowrap">
            {total} zone{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="p-12 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        ) : zones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="aws-table w-full border-collapse">
              <thead>
                <tr>
                  {/* Checkbox column */}
                  <th style={{ width: '36px', padding: '8px 0 8px 16px' }}>
                    <input
                      type="checkbox"
                      className="aws-checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Domain name</th>
                  <th style={{ width: '90px' }}>Type</th>
                  <th>Description</th>
                  <th style={{ width: '160px' }}>Hosted zone ID</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Record count</th>
                  <th style={{ width: '150px' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => {
                  const selected = selectedIds.has(zone.id);
                  return (
                    <tr
                      key={zone.id}
                      className={selected ? 'selected' : ''}
                      onClick={() => toggleRow(zone.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '10px 0 10px 16px' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="aws-checkbox"
                          checked={selected}
                          onChange={() => toggleRow(zone.id)}
                        />
                      </td>

                      {/* Domain name — clickable link */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/dashboard/zones/${zone.id}`}
                          className="text-[#0066cc] hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {zone.domain_name}
                        </Link>
                      </td>

                      {/* Type badge */}
                      <td>
                        {zone.zone_type === 'Public' ? (
                          <span className="aws-badge-public">
                            <Globe className="w-2.5 h-2.5" />
                            Public
                          </span>
                        ) : (
                          <span className="aws-badge-private">
                            <Lock className="w-2.5 h-2.5" />
                            Private
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="max-w-[200px]">
                        <span className="block truncate text-[#545b64]">
                          {zone.description || <span className="italic text-[#aab7c4]">—</span>}
                        </span>
                      </td>

                      {/* Hosted Zone ID */}
                      <td>
                        <span className="aws-zone-id">
                          {(zone as any).hosted_zone_id || `Z${String(zone.id).padStart(13, '0')}`}
                        </span>
                      </td>

                      {/* Record count */}
                      <td style={{ textAlign: 'center' }}>{zone.record_count}</td>

                      {/* Created */}
                      <td className="text-[#545b64]">
                        {new Date(zone.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
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
            <p className="text-[14px] font-semibold text-[#16191f]">No hosted zones found</p>
            <p className="text-[13px] text-[#545b64] mt-1 mb-5">
              {search || filterType !== 'All'
                ? 'No zones match your search. Try broadening your filter.'
                : 'Get started by creating your first hosted zone.'}
            </p>
            {!search && filterType === 'All' && (
              <Link href="/dashboard/zones/create" className="aws-btn-primary">
                <Plus className="w-3.5 h-3.5" />
                Create hosted zone
              </Link>
            )}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="px-4 py-2.5 bg-[#fafafa] border-t border-[#eaeded] flex items-center justify-between text-[12px] text-[#545b64] select-none">
            <span>
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="aws-btn-secondary"
                style={{ padding: '4px 8px' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="aws-btn-secondary"
                style={{ padding: '4px 8px' }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Zone Slide-Over ── */}
      {editingZone && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditingZone(null)}
          />
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div
              className="w-screen max-w-md bg-white shadow-xl flex flex-col border-l border-[#eaeded] animate-fadeIn"
              style={{ marginTop: '50px' }}
            >
              <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
                <h2 className="text-[15px] font-semibold text-[#16191f]">Edit hosted zone</h2>
                <button onClick={() => setEditingZone(null)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Zone ID info row */}
              <div className="px-6 py-3 bg-[#f2f3f3] border-b border-[#eaeded] text-[12px] text-[#545b64]">
                <span className="font-semibold">Zone ID:</span>{' '}
                <span className="aws-zone-id">
                  {(editingZone as any).hosted_zone_id || `Z${String(editingZone.id).padStart(13, '0')}`}
                </span>
              </div>

              <form
                onSubmit={handleSubmitEdit(onSubmitEdit)}
                className="flex-1 overflow-y-auto p-6 space-y-5"
              >
                {/* Domain name (read-only) */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    Domain name
                  </label>
                  <input
                    type="text"
                    value={editingZone.domain_name}
                    disabled
                    className="aws-input"
                  />
                  <p className="mt-1 text-[12px] text-[#545b64]">
                    Domain name cannot be changed after creation.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    Description <span className="font-normal text-[#545b64]">(Optional)</span>
                  </label>
                  <textarea
                    {...registerEdit('description')}
                    rows={3}
                    className="aws-input"
                    style={{ resize: 'vertical', minHeight: '70px' }}
                  />
                  {editErrors.description && (
                    <p className="mt-1 text-[12px] text-[#d13212]">{editErrors.description.message}</p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-2">Type</label>
                  <div className="space-y-2">
                    {(['Public', 'Private'] as const).map((t) => (
                      <label key={t} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          value={t}
                          {...registerEdit('zone_type')}
                          className="accent-[#0073bb]"
                        />
                        <span className="text-[13px] text-[#16191f]">
                          {t === 'Public' ? 'Public hosted zone' : 'Private hosted zone'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-[#eaeded] flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="aws-btn-primary"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingZone(null)}
                    className="aws-btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deletingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white border border-[#eaeded] max-w-md w-full shadow-xl animate-fadeIn" style={{ borderRadius: '2px' }}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <span className="flex items-center gap-2 text-[14px] font-semibold text-[#16191f]">
                <AlertTriangle className="w-4 h-4 text-[#d13212]" />
                Delete hosted zone
              </span>
              <button onClick={() => setDeletingZone(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[13px] text-[#16191f]">
                Are you sure you want to delete{' '}
                <strong>{deletingZone.domain_name}</strong>?
              </p>
              <div className="bg-[#fff8f0] border border-[#f0b429] p-3 text-[12px] text-[#805105] leading-relaxed" style={{ borderRadius: '2px' }}>
                <p className="font-semibold mb-0.5">Warning</p>
                <p>
                  Deleting this hosted zone will permanently remove it and all associated DNS
                  record sets. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="px-5 py-4 bg-[#f2f3f3] border-t border-[#eaeded] flex items-center gap-3 justify-end">
              <button
                disabled={isSubmitting}
                onClick={() => setDeletingZone(null)}
                className="aws-btn-secondary"
              >
                Cancel
              </button>
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
    </div>
  );
}
