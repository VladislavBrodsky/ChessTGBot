'use client';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { GramQuote, validGramQuote } from '@/lib/gram';

export function useGramQuote() {
  const { data, error, isLoading } = useSWRFetch<{ available: boolean; quote: GramQuote | null }>('/api/v1/wallet/gram-quote', {
    dedupingInterval: 60_000, refreshInterval: 300_000, refreshWhenHidden: false, revalidateOnFocus: true, focusThrottleInterval: 60_000,
  });
  return { quote: !error && data?.available && validGramQuote(data.quote) ? data.quote : null, loading: isLoading };
}
