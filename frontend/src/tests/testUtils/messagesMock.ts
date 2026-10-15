import messages from '@/messages/en.json';
import { asTranslator } from './nextIntlMock';

/** English-only subset of ICU: `{name}` arguments and `{n, plural, one {…} other {…}}` with `#`. Enough for the catalogue's copy. */
function formatEnglish(message: string, values: Record<string, unknown>): string {
  const plural = message.replace(/\{(\w+), plural,\s*one \{([^}]*)\}\s*other \{([^}]*)\}\}/g, (_, name: string, one: string, other: string) =>
    (Number(values[name]) === 1 ? one : other).replace(/#/g, String(values[name])));
  return plural.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`));
}

/**
 * A `useTranslations(namespace)` stand-in backed by the real English catalogue, so a test asserts the copy players
 * actually read. A missing key throws, which turns a typo'd key into a failing test.
 */
export function translatorFor(namespace: string) {
  const bag = (messages as unknown as Record<string, Record<string, string>>)[namespace] ?? {};
  return asTranslator(
    (key, values = {}) => {
      const message = bag[key];
      if (message === undefined) throw new Error(`Missing message ${namespace}.${key}`);
      return formatEnglish(message, values);
    },
    key => key in bag,
  );
}
