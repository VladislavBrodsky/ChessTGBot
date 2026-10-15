'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { copyToClipboard } from '@/lib/clipboard';
import { telegramHaptic } from '@/lib/telegram';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { SectionHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

interface PlayerMetrics {
  dau: number; wau: number; mau: number; coverage_start: string | null;
  unattributed_players: number;
  sources: { campaign: string; registrations: number; players: number }[];
  retention: Record<string, { eligible: number; returned: number; rate: number | null }>;
}

export default function PlayerTrackingPanel() {
  const t = useTranslations('PlayerTracking');
  const locale = useLocale();
  const { data, error, mutate } = useSWRFetch<PlayerMetrics>('/api/v1/admin/player-metrics');
  const [campaign, setCampaign] = useState('');
  const [destination, setDestination] = useState<'practice' | 'arena'>('practice');
  const [creating, setCreating] = useState(false);
  const [createFailed, setCreateFailed] = useState(false);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  async function createLink() {
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(campaign) || creating) return;
    setCreating(true);
    setCreateFailed(false);
    try {
      const response = await apiFetch('/api/v1/admin/player-campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign, destination }),
      });
      if (!response.ok) throw new Error('Campaign unavailable');
      const result = await response.json();
      if (typeof result.url !== 'string' || !result.url.startsWith('https://t.me/')) throw new Error('Invalid campaign link');
      setLink(result.url);
      setCopied(false);
      telegramHaptic('success');
    } catch { setCreateFailed(true); }
    finally { setCreating(false); }
  }
  const number = (value: number) => value.toLocaleString(locale);
  if (error && !data) return <ErrorState title={t('error')} message={t('description')} onRetry={() => void mutate()} retryLabel={t('retry')} />;
  if (!data) return <div aria-busy="true"><SkeletonList count={3} /></div>;
  return <section className="space-y-4" aria-label={t('title')}>
    <SectionHeader title={t('title')} />
    {error && <p role="status" className="t-body text-brand-muted">{t('refresh_failed')}</p>}
    <p className="t-body text-brand-muted">{t('description')}</p>
    <Button variant="secondary" onClick={() => void mutate()}>{t('refresh')}</Button>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {(['dau', 'wau', 'mau'] as const).map(key => <Card key={key} variant="solid" className="p-4 space-y-2">
        <h3 className="t-title-3">{t(key)}</h3>
        <p className="t-numeric-lg">{data.coverage_start ? number(data[key]) : '—'}</p>
      </Card>)}
    </div>
    <p className="t-caption text-brand-muted">{t('coverage')}: {data.coverage_start ?? t('unmeasured')}</p>
    <Card variant="solid" className="p-4 space-y-3">
      <h3 className="t-title-3">{t('create_link')}</h3>
      <Input label={t('campaign')} value={campaign} maxLength={64} onChange={event => setCampaign(event.target.value)} disabled={creating} />
      <SegmentedControl value={destination} onChange={setDestination} aria-label={t('destination')}
        options={[{ value: 'practice', label: t('practice') }, { value: 'arena', label: t('arena') }]} />
      <Button variant="secondary" isLoading={creating} disabled={!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(campaign)} onClick={() => void createLink()}>{t('create_link')}</Button>
      {createFailed && <p role="alert" className="t-body text-brand-muted">{t('create_failed')}</p>}
      {link && <>
        <Input label={t('copy_link')} value={link} readOnly />
        <Button variant="secondary" onClick={async () => { if (await copyToClipboard(link)) { setCopied(true); telegramHaptic('success'); } }}>{copied ? t('copied') : t('copy_link')}</Button>
      </>}
    </Card>
    <Card variant="solid" className="p-4 space-y-3">
      <h3 className="t-title-3">{t('retention')}</h3>
      {Object.entries(data.retention).map(([day, cohort]) => <dl key={day} className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3">
        <dt className="t-label">{day.toUpperCase()}</dt>
        <dd className="t-body">{cohort.rate === null ? '—' : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(cohort.rate)}</dd>
        <dd className="t-caption text-brand-muted">{t('returned')}: {number(cohort.returned)} / {t('eligible')}: {number(cohort.eligible)}</dd>
      </dl>)}
    </Card>
    <Card variant="solid" className="p-4 space-y-3">
      <h3 className="t-title-3">{t('source')}</h3>
      {data.sources.length === 0 && <p className="t-body text-brand-muted">{t('empty_sources')}</p>}
      {data.sources.map(source => <div key={source.campaign} className="space-y-1 border-b border-brand-border pb-3">
        <p className="t-label break-words">{source.campaign}</p>
        <p className="t-caption text-brand-muted">{t('registrations')}: {number(source.registrations)} · {t('players')}: {number(source.players)}</p>
      </div>)}
      <p className="t-caption text-brand-muted">{t('unattributed')}: {number(data.unattributed_players)}</p>
    </Card>
  </section>;
}
