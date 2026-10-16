/** Main Mini App links work without assuming a BotFather short name. */
export function mainMiniAppLink(bot: string, parameter: string): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(parameter)) throw new Error('Invalid invitation');
  const username = bot.trim().replace(/^@+/, '');
  if (!/^[A-Za-z0-9_]+$/.test(username)) throw new Error('Invalid bot');
  return `https://t.me/${username}?startapp=${encodeURIComponent(parameter)}`;
}

export function readLaunchParameter(location: Pick<Location, 'search' | 'hash'>, sdkParameter?: string): string {
  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  return query.get('startapp') || query.get('start') || query.get('tgWebAppStartParam')
    || sdkParameter || hash.get('tgWebAppStartParam') || '';
}

/** Content links (mk_<channel>_<post>) only label where a player came from. */
export function isCampaignParameter(parameter: string): boolean {
  return /^mk_[A-Za-z0-9_-]{1,61}$/.test(parameter);
}

export function shareInvitation(url: string, text: string) {
  const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(share);
  else window.open(share, '_blank', 'noopener,noreferrer');
}
