/** Rebuild optimized crown artwork, lockups, and metadata icons from shared sources. */
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
const source = join(out, "chess-crown-source.png");
const symbolPng = await sharp(source).resize(128, 128).png({ compressionLevel: 9 }).toBuffer();
const symbolData = `data:image/png;base64,${symbolPng.toString("base64")}`;
const sourceData = `data:image/png;base64,${(await readFile(source)).toString("base64")}`;
const mark = () => `<image href="${symbolData}" width="64" height="64"/>`;
const monochrome = (ink) => `<path d="${BRAND.markPath}" fill="${ink}"/>`;
const avatar = svg(64, 64,
  `<rect width="64" height="64" rx="16" fill="${color.brandTile}"/><image href="${symbolData}" x="8" y="8" width="48" height="48"/>`);
const rasterAvatar = avatar.replace(symbolData, sourceData);
const { wordmark, tagline } = BRAND_LETTERING;
const wordmarkTop = (48 - wordmark.height - 6 - tagline.height) / 2;
const taglineTop = wordmarkTop + wordmark.height + 6;
const lockup = (textInk, secondary, mono = false) => svg(58 + Math.max(wordmark.width, tagline.width), 48,
  `<g transform="scale(.75)">${mono ? monochrome(textInk) : mark()}</g><path transform="translate(58 ${wordmarkTop})" d="${wordmark.path}" fill="${textInk}"/><path transform="translate(58 ${taglineTop})" d="${tagline.path}" fill="${secondary}"/>`);

await Promise.all([
  sharp(Buffer.from(avatar)).resize(64, 64).png({ compressionLevel: 9 }).toFile(join(root, "src/app/icon.png")),
  writeFile(join(out, "chess-crown-3d.png"), symbolPng),
  sharp(source).resize(128, 128).webp({ quality: 92, effort: 6 }).toFile(join(out, "chess-crown-3d.webp")),
  writeFile(join(out, "w3chess-mark.svg"), avatar),
  writeFile(join(out, "w3chess-symbol.svg"), svg(64, 64, mark())),
  writeFile(join(out, "w3chess-logo.svg"), lockup(color.ink, color.slate)),
  writeFile(join(out, "w3chess-logo-inverse.svg"), lockup(color.paper, color.smoke)),
  writeFile(join(out, "w3chess-logo-mono.svg"), lockup(color.ink, color.ink, true)),
  sharp(Buffer.from(rasterAvatar)).resize(180, 180).png({ compressionLevel: 9 }).toFile(join(root, "src/app/apple-icon.png")),
  sharp(Buffer.from(rasterAvatar)).resize(512, 512).png({ compressionLevel: 9 }).toFile(join(out, "w3chess-avatar.png")),
]);
console.log(`Brand exports regenerated: ${BRAND.wordmark} · ${BRAND.tagline}`);
