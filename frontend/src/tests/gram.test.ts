import { formatGramNano, validGramQuote } from '@/lib/gram';

test('native rewards retain exact nano precision, grouping, and localized digits', () => {
  expect(formatGramNano('500000000', 'en')).toBe('0.5');
  expect(formatGramNano('1000000000000000001', 'en')).toBe('1,000,000,000.000000001');
  expect(formatGramNano('500000000', 'ar')).toBe(new Intl.NumberFormat('ar').format(0.5));
  expect(formatGramNano('NaN', 'en')).toBeNull();
});
test('only recent positive display-only quotes can estimate USDT', () => {
  const quote = { gram_per_usdt: '0.5', fetched_at: new Date().toISOString(), provider: 'TonAPI', stale: false, display_only: true };
  expect(validGramQuote(quote)).toBe(true);
  expect(validGramQuote({ ...quote, fetched_at: new Date(Date.now() - 901000).toISOString() })).toBe(false);
  expect(validGramQuote({ ...quote, gram_per_usdt: 'NaN' })).toBe(false);
  expect(validGramQuote({ ...quote, display_only: false })).toBe(false);
});
