'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FaTrophy } from 'react-icons/fa';
import { Badge } from '@/components/ui/Badge';
import { MetaLine } from '@/components/ui/MetaLine';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface StandingRow { rank: number; user_id: number; name: string; score: number }
interface ArenaStatus {
  status: 'scheduled' | 'live' | 'settling' | 'finished'; starts_at: string; ends_at: string; server_now: string;
  prizes_xp: number[]; standings: StandingRow[]; me: StandingRow | null; in_pool: boolean;
}
const countdown = (ms: number) => {
  if (!Number.isFinite(ms)) return '—';
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const parts = [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60];
  return (parts[0] ? parts : parts.slice(1)).map((n, i) => i === 0 && parts[0] ? String(n) : String(n).padStart(2, '0')).join(':');
};

export default function ArenaBanner() {
  const t = useTranslations('Arena'), tc = useTranslations('Common'), locale = useLocale();
  const [arena, setArena] = useState<ArenaStatus | null>(null);
  const [settled, setSettled] = useState(false);
  const [failed, setFailed] = useState(false);
  const [joined, setJoined] = useState(false);
  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const offset = useRef(0), mounted = useRef(false), fetching = useRef(false);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refresh = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const response = await apiFetch('/api/v1/arena/status');
      if (!response.ok) throw new Error('Arena status unavailable');
      const data: ArenaStatus = await response.json();
      if (!data || !['scheduled', 'live', 'settling', 'finished'].includes(data.status) || !Number.isFinite(Date.parse(data.starts_at)) || !Number.isFinite(Date.parse(data.ends_at)) || !Number.isFinite(Date.parse(data.server_now))) throw new Error('Invalid arena status');
      if (!mounted.current) return;
      offset.current = Date.parse(data.server_now) - Date.now();
      setNow(Date.now()); setArena(data); setJoined(Boolean(data.in_pool)); setFailed(false);
    } catch { if (mounted.current) setFailed(true); }
    finally { fetching.current = false; if (mounted.current) setSettled(true); }
  }, []);
  useEffect(() => { mounted.current = true; void refresh(); return () => { mounted.current = false; if (pendingTimer.current) clearTimeout(pendingTimer.current); }; }, [refresh]);
  useEffect(() => {
    const visibleRefresh = () => { if (!document.hidden) void refresh(); };
    const timer = setInterval(visibleRefresh, arena?.status === 'live' ? 10000 : 30000);
    document.addEventListener('visibilitychange', visibleRefresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibleRefresh); };
  }, [refresh, arena?.status]);
  const arenaStatus = arena?.status;
  useEffect(() => {
    if (!arenaStatus || !['scheduled', 'live'].includes(arenaStatus)) return;
    const timer = setInterval(() => { if (!document.hidden) setNow(Date.now()); }, 1000);
    return () => clearInterval(timer);
  }, [arenaStatus]);
  useEffect(() => {
    const socket = getSocket();
    const confirmed = (data: { status?: string }) => {
      if (data.status !== 'joined' && data.status !== 'left') return;
      setJoined(data.status === 'joined'); setPending(false);
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      void refresh();
    };
    socket.on('arena_status', confirmed);
    return () => { socket.off('arena_status', confirmed); };
  }, [refresh]);
  const togglePool = () => {
    if (pending) return;
    setPending(true);
    getSocket().emit(joined ? 'leave_arena' : 'join_arena', {});
    pendingTimer.current = setTimeout(() => { setPending(false); void refresh(); }, 10000);
  };
  const live = arena?.status === 'live';
  const countdownMs = arena ? Date.parse(live ? arena.ends_at : arena.starts_at) - now - offset.current : 0;
  const rows = arena?.standings?.slice(0, 3) ?? [];
  if (arena?.me && arena.me.rank > 3) rows.push(arena.me);
  return <Card variant="solid" className="arena-event-banner p-4 space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <span className="ui-icon-tile ui-icon-tile--premium shrink-0"><FaTrophy aria-hidden="true" /></span>
      <div className="flex-1 min-w-[7rem] space-y-1">
        <h2 className="t-body font-semibold">{t('title')}</h2>
        {!settled ? <Skeleton textRole="caption" width="14ch" /> : !arena || failed ? <p className="t-caption text-brand-muted" role="status">{t('status_unavailable')}</p>
          : <MetaLine className="t-caption text-brand-muted">
              {live && <span>{t('live_now')}</span>}
              <span>{live ? t('ends_in') : arena.status === 'scheduled' ? t('starts_in') : t('finished')} {['scheduled', 'live'].includes(arena.status) && <bdi className="tabular-nums">{countdown(countdownMs)}</bdi>}</span>
            </MetaLine>}
      </div>
      {!settled ? <Skeleton textRole="caption" width="12ch" /> : failed ? <Button variant="secondary" size="sm" onClick={() => void refresh()}>{tc('retry')}</Button>
        : live ? <Button variant={joined ? 'secondary' : 'primary'} size="sm" isLoading={pending} onClick={togglePool}>{joined ? t('leave') : t('join')}</Button>
        : arena?.prizes_xp?.length ? <Badge variant="purple" className="max-w-full"><bdi className="tabular-nums">{arena.prizes_xp.map(n => n.toLocaleString(locale)).join(' / ')} XP</bdi></Badge> : null}
    </div>
    {live && joined && <p className="t-caption text-brand-muted rounded-xl border border-brand-border p-3">{t('waiting_hint')}</p>}
    {live && rows.length > 0 && <ol className="space-y-2">{rows.map(row => <li key={row.user_id} className="flex items-center gap-3 rounded-xl bg-brand-elevated p-3 t-caption">
      <bdi className="tabular-nums text-brand-muted">{row.rank.toLocaleString(locale)}.</bdi><span className="flex-1 min-w-0 truncate">{row.name}{row.user_id === arena?.me?.user_id && ` (${t('you')})`}</span><Badge><bdi>{row.score.toLocaleString(locale)} {t('pts')}</bdi></Badge>
    </li>)}</ol>}
  </Card>;
}
