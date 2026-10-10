/** Rebuild all brand exports from the same native vector and outlined lettering. */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
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
const knight = (ink) => {
  const { x, y, radius: r } = BRAND.eye;
  const eye = `M${x + r} ${y}a${r} ${r} 0 1 0 ${-2 * r} 0a${r} ${r} 0 1 0 ${2 * r} 0Z`;
  return `<path d="${BRAND.markPath}${eye}" fill="${ink}" fill-rule="evenodd"/>`;
};
const mark = (inverse = false) => `<rect width="64" height="64" rx="16" fill="${inverse ? color.mintChip : color.ink}"/>${knight(inverse ? color.ink : color.mintChip)}`;
const symbol = svg(64, 64, mark());
const { wordmark } = BRAND_LETTERING;
const lockup = (inverse = false, mono = false) => svg(50 + wordmark.width, 40,
  `<g transform="scale(.625)">${mono ? knight(color.ink) : mark(inverse)}</g><path transform="translate(50 10)" d="${wordmark.path}" fill="${inverse ? color.paper : color.ink}"/>`);
await Promise.all([
  writeFile(join(out, "w3chess-mark.svg"), symbol),
  writeFile(join(out, "w3chess-mark-inverse.svg"), svg(64, 64, mark(true))),
  writeFile(join(out, "w3chess-symbol.svg"), svg(64, 64, knight(color.ink))),
  writeFile(join(out, "w3chess-logo.svg"), lockup()),
  writeFile(join(out, "w3chess-logo-inverse.svg"), lockup(true)),
  writeFile(join(out, "w3chess-logo-mono.svg"), lockup(false, true)),
  sharp(Buffer.from(symbol)).resize(128, 128).png().toFile(join(out, "w3chess-symbol.png")),
  sharp(Buffer.from(symbol)).resize(64, 64).png().toFile(join(root, "src/app/icon.png")),
  sharp(Buffer.from(symbol)).resize(180, 180).png().toFile(join(root, "src/app/apple-icon.png")),
  sharp(Buffer.from(symbol)).resize(512, 512).png().toFile(join(out, "w3chess-avatar.png")),
]);
console.log(`Brand exports regenerated: ${BRAND.wordmark}`);
