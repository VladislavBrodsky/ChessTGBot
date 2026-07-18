import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

const handleI18nRouting = createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'es', 'fr', 'de', 'ru', 'pt', 'zh', 'hi', 'ar', 'ja'],

    // Used when no locale matches
    defaultLocale: 'en'
});

export default function middleware(request: NextRequest) {
    const response = handleI18nRouting(request);

    // Force HTML documents to always revalidate.
    //
    // Next.js serves statically prerendered pages (all our /[locale]/* routes are
    // SSG) with `Cache-Control: s-maxage=31536000` — a ONE YEAR shared-cache lifetime.
    // Railway's edge and Telegram's iOS WKWebView both honor that, so after a deploy
    // the old HTML (which references the previous /_next/static chunk hashes) keeps
    // being served and users never receive the new build — clearing the *build* cache
    // does nothing because this is an *HTTP* cache. The FastAPI static server already
    // sets this exact no-cache policy for the monolith path (see CLAUDE.md, "Caching");
    // the `next start` frontend was missing it. Middleware runs per request (it is not
    // itself cached) and its header wins over the page's built-in Cache-Control.
    //
    // Hashed /_next/static/* assets stay `immutable` and are unaffected — this
    // matcher only covers `/` and locale-prefixed document routes, not asset paths.
    response.headers.set('Cache-Control', 'no-cache, must-revalidate');

    return response;
}

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(en|es|fr|de|ru|pt|zh|hi|ar|ja)/:path*']
};
