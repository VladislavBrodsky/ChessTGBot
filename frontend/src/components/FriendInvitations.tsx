'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { InvitationContext, useInvitations, type Invitation } from '@/context/InvitationContext';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { isCampaignParameter, readLaunchParameter, shareInvitation } from '@/lib/invitations';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MetaLine } from '@/components/ui/MetaLine';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';

type Inbox = { launch?: string | null; invitations?: Invitation[] };

async function post(path: string, body: object) {
  const response = await apiFetch(`/api/v1/game/friends/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail?.code || 'unavailable');
  return data;
}

export function InvitationProvider({ children }: { children: ReactNode }) {
  const { stats } = useUser();
  const uid = stats?.telegram_id;
  const locale = useLocale(), pathname = usePathname(), router = useRouter();
  const isPublicRoute = Boolean(pathname && /\/(login|qr)(?:\/|$)/.test(pathname));
  const t = useTranslations('Invitations');
  const [initializing, setInitializing] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [inboxUnavailable, setInboxUnavailable] = useState(false);
  useEffect(() => setNavigating(false), [pathname]);
  const [items, setItems] = useState<Invitation[]>([]);
  const [selected, setSelected] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parameter, setParameter] = useState('');
  const [explicit, setExplicit] = useState(false);
  const handled = useRef(new Set<string>());
  const announced = useRef(new Set<string>());
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const key = useCallback((param: string) => `chess-invitation:${uid}:${param}`, [uid]);
  const consumed = useCallback((param: string) => {
    if (handled.current.has(key(param))) return true;
    try { return sessionStorage.getItem(key(param)) === '1'; } catch { return false; }
  }, [key]);
  const consume = useCallback((param: string) => {
    if (!param) return;
    handled.current.add(key(param));
    try { sessionStorage.setItem(key(param), '1'); } catch { /* unavailable storage */ }
    void post('dismiss', { parameter: param }).catch(() => {});
  }, [key]);
  const navigate = useCallback((gameId: string) => {
    const reviewingPaidGame = selectedRef.current?.kind === 'game' && !selectedRef.current.free && !selectedRef.current.member;
    setNavigating(true); setSelected(null); setExplicit(false); setLoading(false); setError('');
    // Reviewing a paid game is not acceptance. Keep the link reusable if the
    // guest leaves at the final stake confirmation; clear only the server inbox
    // intent so it does not reopen over the board in this session.
    if (reviewingPaidGame) void post('dismiss', { parameter }).catch(() => {});
    else consume(parameter);
    router.push(`/${locale}/game?id=${encodeURIComponent(gameId)}`);
  }, [consume, locale, parameter, router]);
  const resolve = useCallback(async (param: string) => {
    if (consumed(param)) return;
    // Mark in memory before the request so polling cannot open a second dialog.
    handled.current.add(key(param));
    // Content links never open a dialog: the server records the source and the player stays on Home.
    if (isCampaignParameter(param)) { void post('preview', { parameter: param }).then(() => consume(param), () => {}); return; }
    setParameter(param); setExplicit(true); setLoading(true); setError('');
    try {
      if (param === 'arena') { consume(param); setExplicit(false); setNavigating(true); router.push(`/${locale}/game`); return; }
      if (param === 'academy') { consume(param); setExplicit(false); setNavigating(true); router.push(`/${locale}/academy`); return; }
      if (param === 'box' || param === 'marketplace') { consume(param); setExplicit(false); setNavigating(true); router.push(`/${locale}/marketplace`); return; }
      if (param === 'practice') { consume(param); setExplicit(false); setNavigating(true); router.push(`/${locale}/game`); return; }
      if (param === 'home') { consume(param); setExplicit(false); router.push(`/${locale}/home`); return; }
      const view = await post('preview', { parameter: param });
      if (view.kind === 'route') {
        const destinations: Record<string, string> = { home: 'home', arena: 'game', practice: 'game', academy: 'academy', box: 'marketplace', marketplace: 'marketplace' };
        if (!destinations[view.destination]) throw new Error('invalid_invitation');
        consume(param); setExplicit(false);
        if (view.destination !== 'home') setNavigating(true);
        router.push(`/${locale}/${destinations[view.destination]}`);
      } else if (view.kind === 'game' && !view.free && view.game_id === new URLSearchParams(window.location.search).get('id')) {
        // A Telegram WebView may retain start_param across a board reload.
        // The board owns the final wager confirmation, so avoid stacking the
        // invitation preview over it.
        setExplicit(false);
      } else setSelected(view);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'unavailable'); }
    finally { setLoading(false); }
  }, [consume, consumed, key, locale, router]);
  const resolveRef = useRef(resolve);
  resolveRef.current = resolve;

  useEffect(() => {
    if (!uid || isPublicRoute) return;
    let active = true, inFlight = false;
    const initialParam = readLaunchParameter(window.location, window.Telegram?.WebApp?.initDataUnsafe?.start_param);
    if (initialParam) void resolveRef.current(initialParam);
    async function refresh() {
      if (inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      try {
        const response = await apiFetch('/api/v1/game/friends/inbox', { cache: 'no-store' });
        if (!response.ok) throw new Error('unavailable');
        const data: Inbox = await response.json();
        if (!active) return;
        const next = Array.isArray(data.invitations) ? data.invitations : [];
        setItems(next); setInboxUnavailable(false);
        const current = selectedRef.current;
        if (current?.id) {
          const updated = next.find(item => item.id === current.id);
          if (updated) setSelected(updated);
        }
        if (!initialParam && data.launch) await resolveRef.current(data.launch);
      } catch { if (active) setInboxUnavailable(true); }
      finally { inFlight = false; if (active) setInitializing(false); }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 12_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const socket = getSocket();
    socket.on('friend_invites_updated', refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); socket.off('friend_invites_updated', refresh); };
  }, [uid, isPublicRoute]);

  // Pending requests get priority over first-run prompts, but never cover a game
  // or another dialog. A closed request remains available in the Home inbox.
  useEffect(() => {
    if (initializing || selected || loading || explicit || !pathname?.replace(/\/$/, '').endsWith('/home')) return;
    const item = items.find(value => value.status === 'pending' && value.role === 'host' && !announced.current.has(`${value.id}:${value.status}`));
    if (!item || document.querySelector('[aria-modal="true"]')) return;
    announced.current.add(`${item.id}:${item.status}`);
    setSelected(item);
  }, [initializing, items, selected, loading, explicit, pathname]);

  const close = () => { if (loading) return; consume(parameter); setSelected(null); setExplicit(false); setError(''); };
  const act = async (action: 'request' | 'accept' | 'decline' | 'cancel') => {
    if (!selected) return;
    setLoading(true); setError('');
    try {
      const next: Invitation = action === 'request'
        ? await post('requests', { parameter: selected.parameter })
        : await post(`${selected.id}/respond`, { action });
      consume(parameter); setSelected(next);
      setItems(previous => [next, ...previous.filter(item => item.id !== next.id)]);
      if (action === 'accept' && next.game_id) navigate(next.game_id);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'unavailable'); }
    finally { setLoading(false); }
  };
  const errorKey = ['invalid_invitation', 'expired_invitation', 'invitation_full', 'player_busy', 'invite_cooldown', 'self_invitation'].includes(error) ? error : 'unavailable';
  const status = selected?.status;
  const title = selected?.self ? t('own_link') : selected?.kind === 'friend' ? t('invited', { name: selected.opponent.name })
    : selected?.kind === 'game' ? t('join_title') : status === 'ready' ? t('ready')
    : status === 'pending' ? t(selected?.role === 'host' ? 'request_title' : 'waiting_title')
    : status ? t(status) : t('title');
  const open = (item: Invitation) => { setParameter(''); setSelected(item); setExplicit(false); setError(''); };
  // Block first-run prompts during the initial inbox lookup and while handling a
  // launch. This avoids onboarding covering an invitation on first app open.
  const busy = initializing || navigating || Boolean(selected) || explicit || loading;
  return <InvitationContext.Provider value={{ busy, items, open, unavailable: inboxUnavailable }}>
    {children}
    <Modal isOpen={!isPublicRoute && (Boolean(selected) || explicit)} onClose={close} title={title} showCloseButton={!loading} maxWidth="sm">
      <div className="space-y-4">
        {selected && <>
          <div className="flex min-w-0 items-center gap-3"><Avatar name={selected.opponent.name} size="lg" /><div className="min-w-0"><p className="break-words font-semibold text-brand-primary">{selected.opponent.name}</p>{selected.opponent.elo != null && <p className="text-sm text-brand-muted">{t('rating', { rating: selected.opponent.elo })}</p>}</div></div>
          <Card variant="solid" className="space-y-1 p-3"><MetaLine className="font-semibold text-brand-primary"><span>{selected.free ? t('free_game') : t('paid_game', { amount: ((selected.wager || 0) / 100).toFixed(2) })}</span><span>{t('minutes', { minutes: Math.round(selected.time_control / 60) })}</span></MetaLine><p className="text-sm text-brand-muted">{selected.free ? t('no_wallet') : t('paid_notice')}</p></Card>
          <p className="text-sm leading-relaxed text-brand-muted" role="status">{selected.self ? t('own_help') : selected.kind === 'friend' ? t('request_help') : selected.kind === 'game' ? t('join_help') : status === 'ready' ? t('ready_help') : status === 'pending' ? t(selected.role === 'host' ? 'accept_help' : 'waiting_help') : t('closed_help')}</p>
        </>}
        {inboxUnavailable && selected && !error && <ErrorState title={t('error_title')} message={t('unavailable')} onRetry={() => window.dispatchEvent(new Event('focus'))} retryLabel={t('retry')} />}
        {error && <ErrorState title={t('error_title')} message={t(errorKey)} onRetry={!selected ? () => { handled.current.delete(key(parameter)); void resolve(parameter); } : undefined} retryLabel={t('retry')} />}
        {loading && !selected && <p role="status" className="text-sm text-brand-muted">{t('loading')}</p>}
        {selected?.kind === 'friend' && !selected.self && <Button variant="primary" className="w-full" isLoading={loading} onClick={() => void act('request')}>{t('send_request')}</Button>}
        {selected?.kind === 'game' && selected.game_id && <Button variant="primary" className="w-full" onClick={() => navigate(selected.game_id!)}>{t(selected.free ? 'join_game' : 'review_game', { amount: ((selected.wager || 0) / 100).toFixed(2) })}</Button>}
        {selected?.kind === 'request' && status === 'pending' && <div className="space-y-2">
          {selected.role === 'host' ? <><Button variant="primary" className="w-full" isLoading={loading} onClick={() => void act('accept')}>{t('accept')}</Button><Button variant="secondary" className="w-full" disabled={loading} onClick={() => void act('decline')}>{t('decline')}</Button></> : <>
            <Button variant="primary" className="w-full" disabled={loading} onClick={() => selected.url && shareInvitation(selected.url, t('share_text'))}>{t('notify_friend')}</Button>
            <Button variant="secondary" className="w-full" isLoading={loading} onClick={() => void act('cancel')}>{t('cancel')}</Button>
          </>}
        </div>}
        {status === 'ready' && selected?.game_id && <Button variant="primary" className="w-full" onClick={() => navigate(selected.game_id!)}>{t('open_game')}</Button>}
        {(!selected || selected.self || (status && !['ready', 'pending'].includes(status))) && !loading && <Button variant="secondary" className="w-full" onClick={close}>{t('close')}</Button>}
      </div>
    </Modal>
  </InvitationContext.Provider>;
}

export function InvitationInboxCard() {
  const { items, open, unavailable } = useInvitations();
  const t = useTranslations('Invitations');
  const current = [
    ...items.filter(item => item.status === 'pending' || item.status === 'ready'),
    ...items.filter(item => item.status === 'declined' || item.status === 'cancelled').slice(0, 3),
  ];
  if (unavailable && !current.length) return <ErrorState title={t('inbox')} message={t('unavailable')} onRetry={() => window.dispatchEvent(new Event('focus'))} retryLabel={t('retry')} />;
  if (!current.length) return null;
  return <Card variant="solid" className="space-y-3 p-4"><h2 className="font-semibold text-brand-primary">{t('inbox')}</h2>{current.map(item => <div key={item.id} className="flex min-w-0 items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-brand-primary">{item.opponent.name}</p><p className="text-caption text-brand-muted">{t(item.status && item.status !== 'pending' ? item.status : item.role === 'host' ? 'request_title' : 'waiting_title')}</p></div><Button variant="secondary" size="sm" onClick={() => open(item)}>{t('view')}</Button></div>)}</Card>;
}
