import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectCatalogs, inspectSource, messageArguments } from './message-audit.mjs';
test('missing nested keys fail', () => {
  assert.deepEqual(inspectCatalogs({ en: { Game: { review: { count: 'Move {current} of {total}' } } }, es: { Game: { review: {} } } }), ['es: missing Game.review.count']);
});
test('ICU branch text is not an argument; malformed messages and renamed arguments fail', () => {
  assert.deepEqual(messageArguments('{count, plural, one {One game left} other {# games left}}'), ['count']);
  assert.equal(inspectCatalogs({ en: { label: '{count}' }, es: { label: '{total}' } }).length, 1);
  assert.match(inspectCatalogs({ en: { label: '{count, plural, other {# games}' } })[0], /invalid ICU/);
});
test('namespaces respect function scope', () => {
  const content = "function first(){const t=useTranslations('Game'); return t('review.count')} function second(){const t=useTranslations('Academy'); return t('title')}";
  assert.deepEqual(inspectSource(content, 'screen.tsx', { Game: { review: { count: 'Move' } }, Academy: { title: 'Learn' } }), []);
});
test('async and root translators catch missing keys', () => {
  assert.match(inspectSource("async function page(){const t=await getTranslations({namespace:'Game'}); return t(`missing`)}", 'page.tsx', { Game: { title: 'Play' } })[0], /missing Game.missing/);
  assert.match(inspectSource("function page(){const t=useTranslations(); return t('Game.missing')}", 'page.tsx', { Game: { title: 'Play' } })[0], /missing Game.missing/);
});

test('the review move count renders in every language without exposing a key or placeholder', async () => {
  const { createTranslator } = await import('next-intl');
  const { readFileSync, readdirSync } = await import('node:fs');
  for (const file of readdirSync(new URL('../src/messages', import.meta.url)).filter(name => name.endsWith('.json'))) {
    const locale = file.replace('.json', '');
    const messages = JSON.parse(readFileSync(new URL(`../src/messages/${file}`, import.meta.url), 'utf8'));
    const errors = [];
    const t = createTranslator({ locale, messages, namespace: 'Game', onError: error => errors.push(error) });
    for (const [current, total] of [[0, 0], [1, 1], [4, 4], [12, 40]]) {
      const output = t('review_move_count', { current, total });
      assert.doesNotMatch(output, /Game\.|review_move_count|\{\w+\}/);
      assert.ok(output.includes(String(current)) && output.includes(String(total)));
    }
    assert.deepEqual(errors, [], locale);
  }
});
