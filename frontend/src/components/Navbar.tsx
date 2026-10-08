'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FiHome, FiShoppingBag, FiBookOpen, FiTarget, FiUser, FiSettings, FiLogOut, FiCreditCard } from 'react-icons/fi';
import { FaChessKnight } from 'react-icons/fa';
import { telegramHaptic } from '@/lib/telegram';
import { useDesktopNavigation } from '@/hooks/useDesktopNavigation';
import { Button } from './ui/Button';

const NAV_ITEMS = [
  { icon: FiHome, href: '/home', key: 'nav_home' },
  { icon: FaChessKnight, href: '/game', key: 'nav_play' },
  { icon: FiBookOpen, href: '/academy', key: 'nav_learn' },
  { icon: FiCreditCard, href: '/wallet', key: 'nav_wallet' },
  { icon: FiUser, href: '/profile', key: 'nav_profile' },
];
const prefetchedLocales = new Set<string>();

export default function Navbar({ hide = false }: { hide?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Index');
  const desktop = useDesktopNavigation();
  React.useEffect(() => {
    if (prefetchedLocales.has(locale)) return;
    const timer = window.setTimeout(() => {
      NAV_ITEMS.forEach(item => router.prefetch(`/${locale}${item.href}`));
      prefetchedLocales.add(locale);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [locale, router]);
  const currentPath = (pathname || '').replace(/\/$/, '');
  const items = desktop ? [...NAV_ITEMS,
    { icon: FiShoppingBag, href: '/marketplace', key: 'nav_marketplace' },
    { icon: FiTarget, href: '/challenges', key: 'nav_quests' },
    { icon: FiSettings, href: '/settings', key: 'nav_settings' },
  ] : NAV_ITEMS;

  return (
    <motion.nav data-app-navbar aria-label="Primary navigation" aria-hidden={hide || undefined} inert={hide || undefined}
      initial={false} animate={{ opacity: hide ? 0 : 1, y: hide && !desktop ? 112 : 0 }}
      transition={{ duration: 0.15 }}
      style={{ pointerEvents: hide ? 'none' : 'auto', ...(!desktop ? { bottom: 'calc(12px + var(--app-safe-bottom))' } : {}) }}
      className={desktop ? 'app-sidebar' : 'app-bottom-nav'}>
      {desktop && (
        <Link href={`/${locale}/home`} className="mb-10 flex min-h-11 items-center gap-3 px-3 font-semibold text-lg" onClick={() => telegramHaptic('selection')}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-action/10 text-brand-action"><FaChessKnight size={23} aria-hidden="true" /></span>
          <span>Web3Chess</span>
        </Link>
      )}
      <ul className={desktop ? 'flex flex-1 flex-col gap-1' : 'grid w-full grid-cols-5 gap-1'}>
        {items.map(item => {
          const href = `/${locale}${item.href}`;
          const active = currentPath === href || currentPath.startsWith(href + '/');
          const Icon = item.icon;
          return (
            <li key={href} className="min-w-0">
              <Link href={href} aria-label={t(item.key)} aria-current={active ? 'page' : undefined}
                onClick={() => { if (!active) telegramHaptic('selection'); }}
                className={`${desktop ? 'app-sidebar__link' : 'app-bottom-nav__link'} ${active ? 'is-active' : ''}`}>
                <Icon size={21} aria-hidden="true" className="shrink-0" />
                <span className={desktop ? 'text-sm font-medium' : 'text-nav-label font-medium leading-tight'}>{t(item.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {desktop && (
        <Button variant="ghost" className="mt-6 w-full justify-start" leftIcon={<FiLogOut size={18} />}
          onClick={() => { localStorage.removeItem('telegram_web_auth'); window.location.href = `/${locale}/login`; }}>
          {t('nav_logout')}
        </Button>
      )}
    </motion.nav>
  );
}
