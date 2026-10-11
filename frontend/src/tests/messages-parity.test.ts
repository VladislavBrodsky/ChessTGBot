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
import { execFileSync } from 'child_process';

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

const localeFiles = fs
  .readdirSync(MESSAGES_DIR)
  .filter((f) => f.endsWith('.json'))
  .sort();

const load = (file: string): Map<string, string> =>
  flatten(JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, file), 'utf-8')));

const enKeys = load('en.json');
const otherLocales = localeFiles.filter((f) => f !== 'en.json');

describe('locale message parity', () => {
  test('all catalogs parse as ICU and translator calls resolve in their own namespace', () => {
    const output = execFileSync(process.execPath, [path.join(__dirname, '../../scripts/check-messages.mjs'), '--json'], { encoding: 'utf8' });
    expect(JSON.parse(output).errors).toEqual([]);
  });
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


  });
});
