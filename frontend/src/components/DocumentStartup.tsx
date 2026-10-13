'use client';

/* eslint-disable @next/next/no-before-interactive-script-outside-document -- Used only by app/[locale]/layout.tsx for the initial document. */

import Script from 'next/script';
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const clientSnapshot = () => false;
const serverSnapshot = () => true;

/** Initial HTML/hydration only. Client locale navigation must never create startup script tags. */
export default function DocumentStartup() {
  const initialDocument = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  if (!initialDocument) return null;
  return <>
                {/* Next runs these once, in order, before hydration; locale navigation preserves them. */}
                <Script id="telegram-webapp-sdk" src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
                <Script id="app-preferences-bootstrap" strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    if (window.Telegram && window.Telegram.WebApp) {
                                        window.Telegram.WebApp.ready();
                                        window.Telegram.WebApp.expand();
                                    }
                                } catch (e) {}
                                try {
                                    var savedTheme = localStorage.getItem('theme');
                                    if (savedTheme === 'light') {
                                        document.documentElement.setAttribute('data-theme', 'light');
                                    } else {
                                        document.documentElement.setAttribute('data-theme', 'dark');
                                    }
                                    var reduceMotion = localStorage.getItem('setting_reduce_motion') === 'true';
                                    document.documentElement.setAttribute('data-reduce-motion', String(reduceMotion));

                                    var lite = false;
                                    var n = navigator;
                                    if ((n.hardwareConcurrency || 8) <= 4) lite = true;
                                    if (typeof n.deviceMemory === 'number' && n.deviceMemory <= 4) lite = true;
                                    var pm = (location.hash || '').match(/tgWebAppPlatform=([a-z]+)/);
                                    var platform = pm ? pm[1] : (window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp.platform : '');
                                    if (platform === 'ios' || platform === 'android') lite = true;
                                    if (lite) document.documentElement.classList.add('lite-fx');
                                } catch (e) {}
                            })();
                        `
                    }}
                />
  </>;
}
