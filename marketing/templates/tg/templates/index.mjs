// Template registry. To add a template: create templates/<id>.mjs (see puzzle.mjs), list it here,
// add a samples/<id>.json and document it in README.md.
import puzzle from './puzzle.mjs';
import trap from './trap.mjs';
import poll from './poll.mjs';
import news from './news.mjs';
import culture from './culture.mjs';
import tip from './tip.mjs';
import rules from './rules.mjs';
import product from './product.mjs';
import cover from './cover.mjs';
import reward from './reward.mjs';

export const TEMPLATES = Object.fromEntries([puzzle, trap, poll, news, culture, tip, rules, product, cover, reward].map((t) => [t.id, t]));
