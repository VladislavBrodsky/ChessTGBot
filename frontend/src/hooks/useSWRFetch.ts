import useSWR from 'swr';
import { apiFetch } from '@/lib/api';

/**
 * Global fetcher function that uses our apiFetch utility, which already injects
 * X-Telegram-Init-Data, X-Request-ID, bypass-tunnel-reminder, and handles 401s.
 */
export const swrFetcher = async (url: string) => {
    // Some POST requests (like users/sync) should be handled manually, 
    // but if it's passed as an array [url, options] we could handle it.
    // For now we assume standard GET.
    const res = await apiFetch(url);
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        try {
            (error as any).info = await res.json();
        } catch {
            (error as any).info = { message: res.statusText };
        }
        (error as any).status = res.status;
        throw error;
    }
    return res.json();
};

export const swrPostFetcher = async ([url, body]: [string, any]) => {
    const res = await apiFetch(url, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
        throw new Error('An error occurred while posting data.');
    }
    return res.json();
};

/**
 * A custom hook wrapping useSWR to use our custom swrFetcher.
 * 
 * @param key The API endpoint path (e.g., '/api/v1/users/sync')
 * @param options Additional SWR options
 */
export function useSWRFetch<Data = any, Error = any>(key: string | null | any[], options = {}) {
    // If the key is an array like ['/api/endpoint', body], we use the post fetcher
    const fetcher = Array.isArray(key) ? swrPostFetcher : swrFetcher;
    
    return useSWR<Data, Error>(key, fetcher as any, {
        revalidateOnFocus: true, // Fetch when the user switches tabs/focuses window
        errorRetryCount: 2,
        ...options
    });
}
