/** Native GRAM rewards are exact nano units. USDT estimates never credit them. */
export function formatGramNano(value: string, locale: string): string | null {
  if (!/^\d+$/.test(value)) return null;
  const nano = BigInt(value);
  const whole = nano / BigInt(1_000_000_000);
  const fraction = (nano % BigInt(1_000_000_000)).toString().padStart(9, '0').replace(/0+$/, '');
  const number = new Intl.NumberFormat(locale);
  const decimal = new Intl.NumberFormat(locale).formatToParts(1.1).find(part => part.type === 'decimal')?.value ?? '.';
  const digitFormatter = new Intl.NumberFormat(locale, { useGrouping: false });
  const digits = fraction.replace(/\d/g, digit => digitFormatter.format(Number(digit)));
  return number.format(whole) + (fraction ? decimal + digits : '');
}

export interface GramQuote {
  gram_per_usdt: string; fetched_at: string; provider: string; stale: boolean; display_only: boolean;
}
export function validGramQuote(quote?: GramQuote | null): quote is GramQuote {
  if (!quote || quote.display_only !== true) return false;
  const rate = Number(quote.gram_per_usdt);
  const age = Date.now() - Date.parse(quote.fetched_at);
  return Number.isFinite(rate) && rate > 0 && Number.isFinite(age) && age >= -30_000 && age <= 900_000;
}
