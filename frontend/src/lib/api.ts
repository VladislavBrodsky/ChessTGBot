export const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    
    // 1. Hardcoded production fallback
    if (host === "chesstgbot-frontend-production.up.railway.app") {
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

  // Retrieve Telegram Init Data automatically if in client-side WebApp
  let initData = "";
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    initData = (window.Telegram.WebApp as any).initData || "";
  }

  const headers = new Headers(options.headers || {});
  headers.set('bypass-tunnel-reminder', 'true');
  if (initData) {
    headers.set('X-Telegram-Init-Data', initData);
  }
  if (!headers.has('Content-Type') && options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  return res;
};
