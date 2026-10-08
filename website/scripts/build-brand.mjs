/** Rebuild exports and metadata icons from the same vectors used by the UI. */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// The deployment runtime is Node 20, which cannot import TypeScript directly.
// Compile these self-contained constant modules with the installed TS compiler.
const loadConstants = async (file) => {
  const source = await readFile(join(root, file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
};
const [{ BRAND }, { BRAND_LETTERING }, { color }] = await Promise.all([
  loadConstants("src/lib/brand.ts"),
  loadConstants("src/lib/brand-lettering.ts"),
  loadConstants("../design-system/website/tokens.ts"),
]);
const out = join(root, "public/brand");
await mkdir(out, { recursive: true });
const svg = (width, height, content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none">${content}</svg>\n`;
const crown = (ink, avatar = false) =>
  `<g transform="${avatar ? BRAND.avatarTransform : BRAND.symbolTransform}" stroke="${ink}" stroke-width="${BRAND.strokeWidth}"><path d="${BRAND.crownPath}" stroke-linejoin="round"/><path d="${BRAND.basePath}" stroke-linecap="round"/></g>`;
const avatar = svg(64, 64,
  `<rect width="64" height="64" rx="16" fill="${color.brandTile}"/>${crown(color.brandCrown, true)}`);
const { wordmark, tagline } = BRAND_LETTERING;
const wordmarkTop = (48 - wordmark.height - 6 - tagline.height) / 2;
const taglineTop = wordmarkTop + wordmark.height + 6;
const lockup = (markInk, textInk, secondary) => svg(58 + Math.max(wordmark.width, tagline.width), 48,
  `<g transform="scale(.75)">${crown(markInk)}</g><path transform="translate(58 ${wordmarkTop})" d="${wordmark.path}" fill="${textInk}"/><path transform="translate(58 ${taglineTop})" d="${tagline.path}" fill="${secondary}"/>`);

await Promise.all([
  writeFile(join(root, "src/app/icon.svg"), avatar),
  writeFile(join(out, "w3chess-mark.svg"), avatar),
  writeFile(join(out, "w3chess-crown.svg"), svg(64, 64, crown(color.brandInk))),
  writeFile(join(out, "w3chess-logo.svg"), lockup(color.brandInk, color.ink, color.slate)),
  writeFile(join(out, "w3chess-logo-inverse.svg"), lockup(color.brandCrown, color.paper, color.smoke)),
  writeFile(join(out, "w3chess-logo-mono.svg"), lockup(color.ink, color.ink, color.ink)),
  sharp(Buffer.from(avatar)).resize(180, 180).png().toFile(join(root, "src/app/apple-icon.png")),
  sharp(Buffer.from(avatar)).resize(512, 512).png().toFile(join(out, "w3chess-avatar.png")),
]);
console.log(`Brand exports regenerated: ${BRAND.wordmark} · ${BRAND.tagline}`);
