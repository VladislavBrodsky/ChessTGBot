interface ReadCacheEntry {
  response: Response;
  expiresAt: number;
}

// A short-lived in-memory cache makes revisiting client-rendered screens feel
// immediate without persisting sensitive data to disk. Mutations clear it, and
// the paths below always bypass it because they can affect money, live games,
// or privileged state.
const READ_CACHE_TTL_MS = 45_000;
const MAX_READ_CACHE_ENTRIES = 80;
const readCache = new Map<string, ReadCacheEntry>();
const NON_CACHEABLE_READ_PATH = /\/(?:admin(?:\/|$)|game\/active(?:\/|$)|wallet(?:\/|$)|stripe(?:\/|$)|withdraw(?:\/|$)|onchain-balances(?:\/|$))/;

function canUseReadCache(path: string, options: RequestInit): boolean {
  const method = (options.method || 'GET').toUpperCase();
  return typeof window !== 'undefined'
    && method === 'GET'
    && options.cache !== 'no-store'
    && !NON_CACHEABLE_READ_PATH.test(path);
}

function trimReadCache(now: number) {
  readCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) readCache.delete(key);
  });

  while (readCache.size > MAX_READ_CACHE_ENTRIES) {
    const oldestKey = readCache.keys().next().value;
    if (!oldestKey) break;
    readCache.delete(oldestKey);
  }
}

export const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    
    // 1. Hardcoded production fallback
    if (host === "chesstgbot-frontend-production.up.railway.app" || host === "web3chess.online" || host === "www.web3chess.online") {
      return "https://chesstgbot-backend-production.up.railway.app";
    }

    // 2. Dynamic Railway URL resolution (e.g. chesstgbot-frontend-xxx.up.railway.app -> chesstgbot-backend-xxx.up.railway.app)
    if (host.includes("-frontend")) {
      const protocol = window.location.protocol;
      const backendHost = host.replace("-frontend", "-backend");
      return `${protocol}//${backendHost}`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "";
};

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;
  const cacheableRead = canUseReadCache(cleanPath, options);

  // Retrieve Telegram Init Data automatically if in client-side WebApp
  let initData = "";
  if (typeof window !== "undefined") {
    if (window.Telegram?.WebApp && (window.Telegram.WebApp as any).initData) {
      initData = (window.Telegram.WebApp as any).initData;
    } else {
      initData = localStorage.getItem('telegram_web_auth') || "";
    }
  }

  // Scope cache entries to the active authentication material. A signed-out
  // browser can therefore never receive a previous account's cached response.
  const cacheKey = `${url}::${initData}`;
  const now = Date.now();

  if (cacheableRead) {
    const cached = readCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.response.clone();
    }
    trimReadCache(now);
  }

  const headers = new Headers(options.headers || {});
  headers.set('bypass-tunnel-reminder', 'true');
  
  // Generate and set unique request ID for correlation tracking
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  headers.set('X-Request-ID', requestId);

  if (initData) {
    headers.set('X-Telegram-Init-Data', initData);
  }
  if (!headers.has('Content-Type') && options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // A request that never settles is worse than a recoverable error in a mobile
  // webview: it can strand a screen in a loading state after navigation.
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 20_000);
  const externalSignal = options.signal;
  const abortFromExternalSignal = () => controller.abort();
  externalSignal?.addEventListener('abort', abortFromExternalSignal, { once: true });

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', abortFromExternalSignal);
  }

  if (cacheableRead && res.ok) {
    readCache.set(cacheKey, { response: res.clone(), expiresAt: Date.now() + READ_CACHE_TTL_MS });
    trimReadCache(Date.now());
  } else if (!cacheableRead && (options.method || 'GET').toUpperCase() !== 'GET' && res.ok) {
    // Any successful mutation can change data shown by several screens.
    readCache.clear();
  }

  // Global 401 Unauthorized handler
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem('telegram_web_auth');
      const localeMatch = window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/);
      const locale = localeMatch ? localeMatch[1] : 'en';
      if (!window.location.pathname.includes('/login')) {
         window.location.href = `/${locale}/login`;
      }
    }
  }

  return res;
};

export const getFullPhotoUrl = (url?: string | null): string | undefined => {
  if (!url || url === 'null' || url === 'undefined' || url === 'None' || url === '') return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${getApiBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
};
