import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = path.join(websiteRoot, ".next", "server", "app");
const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://web3chess.online").replace(/\/$/, "");

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(fullPath);
    return entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1];
}

const sitemap = readFileSync(path.join(appRoot, "sitemap.xml.body"), "utf8");
const robots = readFileSync(path.join(appRoot, "robots.txt.body"), "utf8");
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
assert(robots.includes(`${baseUrl}/sitemap.xml`), "robots.txt must advertise the sitemap");

const pages = htmlFiles(appRoot).filter((file) => !/\/(?:_not-found|_global-error)\.html$/.test(file));
assert(pages.length >= 10, `Expected at least 10 public HTML pages, found ${pages.length}`);

for (const file of pages) {
  const route = path.relative(appRoot, file).replace(/\.html$/, "").replace(/(^|\/)index$/, "");
  const url = `${baseUrl}${route ? `/${route}` : ""}`;
  const html = readFileSync(file, "utf8");
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const descriptionTag = html.match(/<meta\b[^>]*\bname="description"[^>]*>/i)?.[0];
  const canonicalTags = [...html.matchAll(/<link\b[^>]*\brel="canonical"[^>]*>/gi)].map((match) => match[0]);
  const h1Count = [...html.matchAll(/<h1\b/gi)].length;

  assert(title && title.length <= 70, `${route || "/"}: missing or excessively long title`);
  assert(descriptionTag && attribute(descriptionTag, "content"), `${route || "/"}: missing description`);
  assert.equal(canonicalTags.length, 1, `${route || "/"}: expected one canonical`);
  assert.equal(attribute(canonicalTags[0], "href"), url, `${route || "/"}: canonical mismatch`);
  assert.equal(h1Count, 1, `${route || "/"}: expected one H1, found ${h1Count}`);
  assert(sitemapUrls.has(url), `${route || "/"}: missing from sitemap`);
}

const keywordPath = path.join(websiteRoot, "docs", "KEYWORD_MAP_150.csv");
const keywordLines = readFileSync(keywordPath, "utf8").trim().split(/\r?\n/);
assert.equal(keywordLines[0], "id,cluster,query,intent,target,status,priority", "Keyword map header changed");
assert.equal(keywordLines.length - 1, 150, "Keyword map must contain exactly 150 candidates");
const queries = keywordLines.slice(1).map((line) => {
  const fields = [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((match) => match[1].replaceAll('""', '"'));
  assert.equal(fields.length, 7, `Malformed keyword row: ${line}`);
  return fields[2].toLocaleLowerCase();
});
assert.equal(new Set(queries).size, 150, "Keyword map contains duplicate queries");

console.log(`SEO check passed: ${pages.length} public pages, ${sitemapUrls.size} sitemap URLs, 150 unique keyword candidates.`);
