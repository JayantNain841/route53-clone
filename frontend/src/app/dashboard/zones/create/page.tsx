'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { zoneService, getErrorMessage } from '@/services/api';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Loader2, Globe, Lock, Info, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const DOMAIN_REGEX =
  /^([a-zA-Z0-9](([a-zA-Z0-9-]){0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

const createZoneSchema = zod.object({
  domain_name: zod
    .string()
    .min(1, 'Domain name is required')
    .regex(DOMAIN_REGEX, 'Must be a valid domain name (e.g. example.com)'),
  description: zod
    .string()
    .max(255, 'Description too long')
    .optional()
    .or(zod.literal('')),
  zone_type: zod.enum(['Public', 'Private']),
});

type CreateZoneFormData = zod.infer<typeof createZoneSchema>;

export default function CreateHostedZonePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);

  const breadcrumbs = [
    { label: 'Route 53', href: '/dashboard' },
    { label: 'Hosted zones', href: '/dashboard/zones' },
    { label: 'Create hosted zone' },
  ];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateZoneFormData>({
    resolver: zodResolver(createZoneSchema),
    defaultValues: {
      domain_name: '',
      description: '',
      zone_type: 'Public',
    },
  });

  const watchedType = watch('zone_type');

  const onSubmit = async (data: CreateZoneFormData) => {
    setIsSubmitting(true);
    try {
      // include tags if present — backend may ignore them if not supported
      const payload = {
        domain_name: data.domain_name,
        description: data.description || null,
        zone_type: data.zone_type,
        tags: tags.length ? tags : undefined,
      } as any;
      const zone = await zoneService.createZone(payload.domain_name, payload.description, payload.zone_type);
      // Navigate to the newly created zone detail page and show a success banner
      router.push(`/dashboard/zones/${zone.id}?created=1&name=${encodeURIComponent(zone.domain_name)}`);
    } catch (error) {
      const msg = getErrorMessage(error, 'Failed to create hosted zone.');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-hosted-zone-page">
      <Breadcrumbs items={breadcrumbs} />

      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/zones"
          className="text-[#545b64] hover:text-[#16191f] transition-colors"
          title="Back to Hosted zones"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-[20px] font-semibold text-[#16191f]">Create hosted zone</h1>
      </div>

      <div className="flex gap-6 max-w-5xl">
        {/* ── LEFT: Form ── */}
        <div className="flex-1">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* ── Section 1: Domain configuration ── */}
            <div className="aws-card mb-5">
              <div className="aws-card-header">
                <h2 className="text-[14px] font-semibold text-[#16191f]">Domain name</h2>
              </div>
              <div className="p-5 space-y-5">
                {/* Domain Name */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    Domain name <span className="text-[#d13212]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('domain_name')}
                    placeholder="example.com"
                    className="aws-input"
                    style={{ maxWidth: '400px' }}
                  />
                  {errors.domain_name ? (
                    <p className="mt-1.5 text-[12px] text-[#d13212] flex items-center gap-1">
                      <span className="inline-block w-3.5 h-3.5 bg-[#d13212] text-white text-[9px] font-bold rounded-full text-center leading-[14px]">!</span>
                      {errors.domain_name.message}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[12px] text-[#545b64]">
                      Enter the domain name that you want to route traffic for, such as{' '}
                      <code className="bg-gray-100 px-1 rounded text-[11px]">example.com</code>.
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    Description <span className="text-[#545b64] font-normal">(Optional)</span>
                  </label>
                  <textarea
                    {...register('description')}
                    placeholder="A brief description of this hosted zone"
                    rows={3}
                    className="aws-input"
                    style={{ maxWidth: '500px', resize: 'vertical', minHeight: '70px' }}
                  />
                  {errors.description && (
                    <p className="mt-1.5 text-[12px] text-[#d13212]">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section 2: Type ── */}
            <div className="aws-card mb-5">
              <div className="aws-card-header">
                <h2 className="text-[14px] font-semibold text-[#16191f]">Type</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Public Zone */}
                <label
                  className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                    watchedType === 'Public'
                      ? 'selected border-[#0073bb] bg-[#f0f8ff]'
                      : 'border-[#d5dbdb] hover:border-[#aab7c4]'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <input
                    type="radio"
                    value="Public"
                    {...register('zone_type')}
                    className="mt-0.5 accent-[#0073bb]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-[#0066cc]" />
                      <span className="text-[13px] font-semibold text-[#16191f]">Public hosted zone</span>
                    </div>
                    <p className="text-[12px] text-[#545b64] leading-relaxed">
                      Routes internet traffic to your resources. DNS queries for this domain name
                      will be answered from the internet. The domain name must be registered with a
                      domain registrar.
                    </p>
                  </div>
                </label>

                {/* Private Zone */}
                <label
                  className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                    watchedType === 'Private'
                      ? 'selected border-[#0073bb] bg-[#f0f8ff]'
                      : 'border-[#d5dbdb] hover:border-[#aab7c4]'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <input
                    type="radio"
                    value="Private"
                    {...register('zone_type')}
                    className="mt-0.5 accent-[#0073bb]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4 text-[#545b64]" />
                      <span className="text-[13px] font-semibold text-[#16191f]">Private hosted zone</span>
                    </div>
                    <p className="text-[12px] text-[#545b64] leading-relaxed">
                      Routes DNS queries within one or more Amazon Virtual Private Clouds (VPCs).
                      DNS queries for this domain name will be answered within the specified VPCs.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* ── Section 3: Tags (mocked) ── */}
            <div className="aws-card mb-6">
              <div className="aws-card-header flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[#16191f]">Tags</h2>
                <span className="text-[12px] text-[#545b64]">Optional</span>
              </div>
              <div className="p-5">
                <p className="text-[12px] text-[#545b64] mb-4">
                  Tags are key-value pairs that let you categorize resources for cost allocation, security, and automation.
                </p>
                <div className="flex flex-col gap-2">
                  {tags.length === 0 && (
                    <p className="text-[12px] text-[#545b64]">No tags associated with the resource.</p>
                  )}

                  {tags.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 max-w-[200px]">
                        <label className="block text-[12px] font-semibold text-[#545b64] mb-1">Key</label>
                        <input
                          type="text"
                          placeholder="Name"
                          className="aws-input"
                          value={t.key}
                          onChange={(e) => {
                            const next = [...tags];
                            next[idx] = { ...next[idx], key: e.target.value };
                            setTags(next);
                          }}
                        />
                      </div>
                      <div className="flex-1 max-w-[200px]">
                        <label className="block text-[12px] font-semibold text-[#545b64] mb-1">Value <span className="font-normal">(Optional)</span></label>
                        <input
                          type="text"
                          placeholder="Value"
                          className="aws-input"
                          value={t.value}
                          onChange={(e) => {
                            const next = [...tags];
                            next[idx] = { ...next[idx], value: e.target.value };
                            setTags(next);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="text-[12px] text-[#d13212] ml-1"
                        onClick={() => setTags((s) => s.filter((_, i) => i !== idx))}
                        title="Remove tag"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <div className="mt-3">
                    <button
                      type="button"
                      className="text-[12px] text-[#0066cc]"
                      onClick={() => setTags((s) => [...s, { key: '', value: '' }])}
                    >
                      + Add tag
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="aws-btn-primary"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create hosted zone
              </button>
              <Link
                href="/dashboard/zones"
                className="aws-btn-secondary"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* ── RIGHT: Info Panel ── */}
        <div className="w-72 shrink-0 space-y-4">
          {/* How it works */}
          <div className="aws-card p-4">
            <div className="flex items-start gap-2 mb-3">
              <Info className="w-4 h-4 text-[#0066cc] mt-0.5 shrink-0" />
              <h3 className="text-[13px] font-semibold text-[#16191f]">How hosted zones work</h3>
            </div>
            <div className="space-y-2 text-[12px] text-[#545b64] leading-relaxed">
              <p>
                A hosted zone is a container for records that define how Route 53 responds to
                DNS queries for a specific domain.
              </p>
              <p>
                After you create a hosted zone, you create records that specify how you want
                Route 53 to respond to DNS queries for that domain.
              </p>
            </div>
          </div>

          {/* Zone costs note */}
          <div className="aws-card p-4">
            <h3 className="text-[13px] font-semibold text-[#16191f] mb-2">Pricing info</h3>
            <div className="space-y-1 text-[12px] text-[#545b64]">
              <p>• $0.50 per hosted zone / month (first 25 zones)</p>
              <p>• $0.10 per hosted zone / month (over 25 zones)</p>
              <p className="mt-2 italic">Note: This is a demo. No charges apply.</p>
            </div>
          </div>

          {/* Record types */}
          <div className="aws-card p-4">
            <h3 className="text-[13px] font-semibold text-[#16191f] mb-2">Supported record types</h3>
            <div className="flex flex-wrap gap-1.5">
              {['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA', 'SOA'].map(
                (t) => (
                  <span key={t} className="aws-record-type-badge">{t}</span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
