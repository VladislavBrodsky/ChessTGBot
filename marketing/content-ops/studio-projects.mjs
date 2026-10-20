/** Map a reviewed campaign brief into the editable /CREATIVES project schema. */

export const STUDIO_FORMATS = {
  square: { format: 'square', width: 1080, height: 1080 },
  portrait: { format: 'portrait', width: 1080, height: 1350 },
  story: { format: 'story', width: 1080, height: 1920 },
  wide: { format: 'wide', width: 1920, height: 1080 },
  blog: { format: 'custom', width: 1200, height: 630 },
};

const ART = new Set(['sculpture', 'academy', 'clock', 'stakes', 'fair-play', 'castling']);
const ICONS = new Set(['target', 'strategy', 'book-open-text', 'graduation-cap', 'lightning', 'clock',
  'coins', 'telegram-logo', 'shield-check', 'trophy', 'users-three']);

function reviewedCopy(value, label, limit) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) {
    throw new Error(`${label} must contain 1–${limit} reviewed characters`);
  }
  return value;
}

export function fromEditorialCreative(brief, formatName) {
  const dimensions = STUDIO_FORMATS[formatName];
  if (!dimensions) throw new Error(`Unknown Studio format: ${formatName}`);
  if (!ART.has(brief.art)) throw new Error(`Choose an approved 3D artwork for ${brief.name || 'this campaign'}`);
  const proofs = brief.proof;
  if (!Array.isArray(proofs) || proofs.length !== 3 || proofs.some((item) => typeof item !== 'string' || !item.trim() || item.length > 80)) {
    throw new Error('Creative requires exactly three reviewed proof lines');
  }
  const icons = brief.proofIcons;
  if (!Array.isArray(icons) || icons.length !== 3 || icons.some((item) => !ICONS.has(item))) {
    throw new Error('Creative requires three contextual icons from the Studio library');
  }
  if (!['canvas', 'paper', 'ink'].includes(brief.theme)) throw new Error('Creative needs a Studio canvas, paper, or ink theme');
  const destination = new URL(brief.destination);
  if (destination.protocol !== 'https:' || !['web3chess.online', 'app.web3chess.online', 't.me'].includes(destination.hostname)) {
    throw new Error('Creative destination must be a verified HTTPS Web3Chess or Telegram URL');
  }
  const isBlog = formatName === 'blog';
  return {
    version: 1,
    name: reviewedCopy(brief.name, 'Creative name', 80),
    ...dimensions,
    theme: brief.theme,
    tag: reviewedCopy(brief.tag, 'Tag', 50),
    title: reviewedCopy(brief.headline, 'Headline', 140),
    subtitle: reviewedCopy(brief.body, 'Subtitle', 180),
    proofs,
    proofIcons: icons,
    cta: reviewedCopy(brief.cta, 'Action', 70),
    urlLabel: destination.hostname,
    note: reviewedCopy(brief.note, 'Footer note', 140),
    layers: [{ id: 'art-1', kind: brief.art, x: isBlog ? 0.79 : 0.75,
      y: isBlog ? 0.46 : formatName === 'story' ? 0.57 : 0.56,
      size: isBlog ? 0.32 : formatName === 'wide' ? 0.31 : 0.43, rotation: 0 }],
  };
}
