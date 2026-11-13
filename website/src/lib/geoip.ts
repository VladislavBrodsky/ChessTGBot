import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import { Reader, type CountryResponse } from "mmdb-lib";

/**
 * Visitor country lookup for the Google tag gateway.
 *
 * Railway's edge sends no geolocation headers, and once tags are served from
 * our own domain Google only sees this server's IP. Without an explicit
 * country, every visitor would be reported from the server's region and
 * region-scoped Consent Mode defaults would never apply.
 *
 * The database is DB-IP "IP to Country Lite" (CC BY 4.0, https://db-ip.com),
 * downloaded into the image at build time (see website/Dockerfile). If it is
 * missing, lookups return null and the gateway forwards no geo header.
 */

const DEFAULT_DB_PATH = "/app/geoip/dbip-country-lite.mmdb";

let reader: Reader<CountryResponse> | null | undefined;

function getReader(): Reader<CountryResponse> | null {
  if (reader !== undefined) return reader;
  const path = process.env.GEOIP_DB_PATH || DEFAULT_DB_PATH;
  try {
    reader = new Reader<CountryResponse>(readFileSync(path));
  } catch (error) {
    console.warn(
      `[geoip] country database unavailable at ${path}; analytics geo headers disabled`,
      error instanceof Error ? error.message : error,
    );
    reader = null;
  }
  return reader;
}

/** Returns an ISO 3166-1 alpha-2 country code, or null when unknown. */
export function lookupCountry(ip: string | null | undefined): string | null {
  if (!ip || !isIP(ip)) return null;
  const db = getReader();
  if (!db) return null;
  try {
    const code = db.get(ip)?.country?.iso_code;
    return code && /^[A-Z]{2}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

/**
 * The requesting visitor's country. Local dev has no public client IP, so
 * GEOIP_DEV_COUNTRY can stand in outside production.
 */
export function visitorCountry(headers: Headers): string | null {
  return (
    lookupCountry(clientIp(headers)) ??
    (process.env.NODE_ENV !== "production"
      ? process.env.GEOIP_DEV_COUNTRY || null
      : null)
  );
}

/**
 * The visitor's IP as seen by Railway's edge. Railway appends the client
 * address to X-Forwarded-For and also sets X-Real-IP; the left-most
 * X-Forwarded-For entry is client-controlled, so prefer X-Real-IP.
 */
export function clientIp(headers: Headers): string | null {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for");
  if (!forwarded) return null;
  const hops = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
  return hops.at(-1) ?? null;
}
