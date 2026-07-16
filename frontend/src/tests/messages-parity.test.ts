/**
 * Locale message parity guard.
 *
 * Every locale file in src/messages must expose exactly the same leaf keys as
 * en.json (the source of truth), and every shared string must use the same ICU
 * placeholders as its English counterpart — a missing key falls back to
 * English mid-sentence, and a mistranslated {placeholder} crashes at runtime.
 */
import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');

type Messages = { [key: string]: string | Messages };

function flatten(obj: Messages, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      out.set(full, value);
    } else {
      flatten(value, full).forEach((v, k) => out.set(k, v));
    }
  }
  return out;
}

function placeholders(message: string): string[] {
  // ICU argument names: {name}, {count, plural, ...} — capture the identifier.
  const names = new Set<string>();
  let match: RegExpExecArray | null;
  const re = /\{\s*([a-zA-Z0-9_]+)/g;
  while ((match = re.exec(message)) !== null) {
    names.add(match[1]);
  }
  return Array.from(names).sort();
}

const localeFiles = fs
  .readdirSync(MESSAGES_DIR)
  .filter((f) => f.endsWith('.json'))
  .sort();

const load = (file: string): Map<string, string> =>
  flatten(JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, file), 'utf-8')));

const enKeys = load('en.json');
const otherLocales = localeFiles.filter((f) => f !== 'en.json');

describe('locale message parity', () => {
  test('messages directory contains en.json and at least one other locale', () => {
    expect(localeFiles).toContain('en.json');
    expect(otherLocales.length).toBeGreaterThan(0);
  });

  describe.each(otherLocales)('%s', (file) => {
    const keys = load(file);

    test('has every key en.json has', () => {
      const missing = Array.from(enKeys.keys()).filter((k) => !keys.has(k));
      expect(missing).toEqual([]);
    });

    test('has no keys en.json lacks', () => {
      const extra = Array.from(keys.keys()).filter((k) => !enKeys.has(k));
      expect(extra).toEqual([]);
    });

    test('every shared message uses the same ICU placeholders as en.json', () => {
      const mismatched: string[] = [];
      enKeys.forEach((enValue, key) => {
        const value = keys.get(key);
        if (value === undefined) return; // reported by the missing-keys test
        const expected = placeholders(enValue).join(',');
        const actual = placeholders(value).join(',');
        if (expected !== actual) {
          mismatched.push(`${key}: en has [${expected}], ${file} has [${actual}]`);
        }
      });
      expect(mismatched).toEqual([]);
    });
  });
});
