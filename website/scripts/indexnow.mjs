// Tells IndexNow engines (Bing, Yandex, Seznam, Naver, Yep) which public URLs
// exist or changed, so they recrawl within hours instead of waiting for the
// sitemap. Bing's index also feeds Copilot, ChatGPT search and DuckDuckGo.
//
//   npm run seo:indexnow                 -> every URL in the live sitemap
//   npm run seo:indexnow -- /blog/a /play -> only these paths
//   DRY_RUN=1 npm run seo:indexnow        -> print the payload, send nothing
//
// The key file public/<KEY>.txt must already be live on the site (deploy first),
// otherwise engines reject the submission with 403.
const KEY = "4c121be8e56adb6686d9b061c044d9fa";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://web3chess.online").replace(/\/$/, "");
const host = new URL(SITE_URL).host;

async function sitemapUrls() {
  const response = await fetch(`${SITE_URL}/sitemap.xml`);
  if (!response.ok) throw new Error(`sitemap.xml returned HTTP ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

const paths = process.argv.slice(2);
const urlList = paths.length
  ? paths.map((item) => (item.startsWith("http") ? item : `${SITE_URL}${item.startsWith("/") ? "" : "/"}${item}`))
  : await sitemapUrls();

const foreign = urlList.filter((url) => new URL(url).host !== host);
if (foreign.length) throw new Error(`URLs outside ${host}: ${foreign.join(", ")}`);
if (!urlList.length) throw new Error("No URLs to submit");

const keyLocation = `${SITE_URL}/${KEY}.txt`;
const keyResponse = await fetch(keyLocation);
const liveKey = keyResponse.ok ? (await keyResponse.text()).trim() : "";
if (liveKey !== KEY) throw new Error(`${keyLocation} is not live yet (HTTP ${keyResponse.status}); deploy the website first`);

const payload = { host, key: KEY, keyLocation, urlList };
if (process.env.DRY_RUN) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});
// 200 = accepted, 202 = accepted and the key is still being validated.
console.log(`IndexNow: HTTP ${response.status} for ${urlList.length} URL(s)`);
if (response.status !== 200 && response.status !== 202) {
  console.error(await response.text());
  process.exit(1);
}
