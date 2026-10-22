/** Main Mini App links work without assuming a BotFather short name. */
export function mainMiniAppLink(bot: string, parameter: string): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(parameter)) throw new Error('Invalid invitation');
  const username = bot.trim().replace(/^@+/, '');
  if (!/^[A-Za-z0-9_]+$/.test(username)) throw new Error('Invalid bot');
  return `https://t.me/${username}?startapp=${encodeURIComponent(parameter)}`;
}

/** A player's referral link (ref_): attributes the visit and opens free computer practice. Null without a valid code. */
export function friendInvitationLink(bot: string, referralCode: unknown): string | null {
  if (typeof referralCode !== 'string' || !/^[A-Za-z0-9_-]{1,60}$/.test(referralCode)) return null;
  try { return mainMiniAppLink(bot, `ref_${referralCode}`); } catch { return null; }
}

export function readLaunchParameter(location: Pick<Location, 'search' | 'hash'>, sdkParameter?: string): string {
  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  return query.get('startapp') || query.get('start') || query.get('tgWebAppStartParam')
    || sdkParameter || hash.get('tgWebAppStartParam') || '';
}

/** Marketing links label first touch; the server may also select a route. */
export function isCampaignParameter(parameter: string): boolean {
  return /^mk_[A-Za-z0-9_-]{1,61}$/.test(parameter);
}

export function shareInvitation(url: string, text: string) {
  const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(share);
  else window.open(share, '_blank', 'noopener,noreferrer');
}
