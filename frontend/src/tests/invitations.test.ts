import { mainMiniAppLink, readLaunchParameter } from '@/lib/invitations';

test('normalizes the reported @bot URL and uses the configured Main Mini App', () => {
  expect(mainMiniAppLink('@chess_matbot', '4e044c66')).toBe('https://t.me/chess_matbot?startapp=4e044c66');
  expect(mainMiniAppLink('chess_matbot', 'ref_friend')).toBe('https://t.me/chess_matbot?startapp=ref_friend');
  expect(() => mainMiniAppLink('bot/evil', 'ref_friend')).toThrow();
  expect(() => mainMiniAppLink('chess_matbot', '../game')).toThrow();
  expect(() => mainMiniAppLink('chess_matbot', 'a'.repeat(65))).toThrow();
});

test('preserves URL intent before a stale SDK parameter and accepts Telegram query/hash formats', () => {
  expect(readLaunchParameter({ search: '?startapp=ref_new', hash: '' }, 'ref_old')).toBe('ref_new');
  expect(readLaunchParameter({ search: '?tgWebAppStartParam=4e044c66', hash: '' })).toBe('4e044c66');
  expect(readLaunchParameter({ search: '?start=ref_old', hash: '' })).toBe('ref_old');
  expect(readLaunchParameter({ search: '', hash: '#tgWebAppStartParam=go_secret' })).toBe('go_secret');
  expect(readLaunchParameter({ search: '', hash: '' }, 'fi_request')).toBe('fi_request');
  expect(readLaunchParameter({ search: '', hash: '' })).toBe('');
});
