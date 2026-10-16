import { friendInvitationLink, isCampaignParameter, mainMiniAppLink, readLaunchParameter } from '@/lib/invitations';

test('normalizes the reported @bot URL and uses the configured Main Mini App', () => {
  expect(mainMiniAppLink('@chess_matbot', '4e044c66')).toBe('https://t.me/chess_matbot?startapp=4e044c66');
  expect(mainMiniAppLink('chess_matbot', 'ref_friend')).toBe('https://t.me/chess_matbot?startapp=ref_friend');
  expect(() => mainMiniAppLink('bot/evil', 'ref_friend')).toThrow();
  expect(() => mainMiniAppLink('chess_matbot', '../game')).toThrow();
  expect(() => mainMiniAppLink('chess_matbot', 'a'.repeat(65))).toThrow();
});

test('builds the personal ref_ invitation only from a valid referral code', () => {
  expect(friendInvitationLink('@chess_matbot', 'AbC_12-x')).toBe('https://t.me/chess_matbot?startapp=ref_AbC_12-x');
  expect(friendInvitationLink('chess_matbot', undefined)).toBeNull();
  expect(friendInvitationLink('chess_matbot', '')).toBeNull();
  expect(friendInvitationLink('chess_matbot', 'bad code')).toBeNull();
  expect(friendInvitationLink('chess_matbot', 'a'.repeat(61))).toBeNull();
  expect(friendInvitationLink('bot/evil', 'friend')).toBeNull();
});

test('preserves URL intent before a stale SDK parameter and accepts Telegram query/hash formats', () => {
  expect(readLaunchParameter({ search: '?startapp=ref_new', hash: '' }, 'ref_old')).toBe('ref_new');
  expect(readLaunchParameter({ search: '?tgWebAppStartParam=4e044c66', hash: '' })).toBe('4e044c66');
  expect(readLaunchParameter({ search: '?start=ref_old', hash: '' })).toBe('ref_old');
  expect(readLaunchParameter({ search: '', hash: '#tgWebAppStartParam=go_secret' })).toBe('go_secret');
  expect(readLaunchParameter({ search: '', hash: '' }, 'fi_request')).toBe('fi_request');
  expect(readLaunchParameter({ search: '', hash: '' })).toBe('');
});

test('recognises content campaign links without treating invitations as campaigns', () => {
  expect(isCampaignParameter('mk_tg_2026_10_14_tg_community')).toBe(true);
  expect(isCampaignParameter('mk_X-Post_1')).toBe(true);
  expect(isCampaignParameter('mk_')).toBe(false);
  expect(isCampaignParameter(`mk_${'a'.repeat(62)}`)).toBe(false);
  expect(isCampaignParameter('ref_friend')).toBe(false);
  expect(isCampaignParameter('go_secret')).toBe(false);
  expect(isCampaignParameter('arena')).toBe(false);
});
