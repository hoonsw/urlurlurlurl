export const ERROR_MESSAGE = "URL을 확인해 주세요.";
export const NOT_FOUND_MESSAGE = "URL이 없습니다.";
export const TARGET_URL_LENGTH = 500;
export const MAX_ORIGINAL_URL_LENGTH = 2048;

const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const INTERNAL_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".lan",
  ".home",
  ".corp"
];

export class UrlValidationError extends Error {
  constructor() {
    super(ERROR_MESSAGE);
    this.name = "UrlValidationError";
  }
}

export function normalizeSubmittedUrl(input, serviceUrl) {
  const raw = typeof input === "string" ? input.trim() : "";

  if (!raw || raw.length > MAX_ORIGINAL_URL_LENGTH) {
    throw new UrlValidationError();
  }

  const candidate = raw.includes("://") ? raw : `https://${raw}`;
  let url;

  try {
    url = new URL(candidate);
  } catch {
    throw new UrlValidationError();
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UrlValidationError();
  }

  if (url.username || url.password) {
    throw new UrlValidationError();
  }

  const host = normalizeHostname(url.hostname);
  const serviceHost = normalizeHostname(new URL(serviceUrl).hostname);

  if (!host || host === serviceHost || isBlockedHostname(host)) {
    throw new UrlValidationError();
  }

  return url.href;
}

export function getSlugLengthForOrigin(origin, targetLength = TARGET_URL_LENGTH) {
  return Math.max(64, targetLength - origin.length - 1);
}

export function randomSlug(length) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);

  let slug = "";
  for (const byte of bytes) {
    slug += SLUG_ALPHABET[byte % SLUG_ALPHABET.length];
  }

  return slug;
}

export function isValidSlug(slug) {
  return typeof slug === "string" && /^[a-z0-9]{1,1024}$/.test(slug);
}

export function isBlockedHostname(hostname) {
  const host = normalizeHostname(hostname);

  if (!host) {
    return true;
  }

  const ipv4 = parseIPv4(host);
  if (ipv4) {
    return isBlockedIPv4(ipv4);
  }

  if (isIPv6(host)) {
    return isBlockedIPv6(host);
  }

  if (host === "localhost" || !host.includes(".")) {
    return true;
  }

  return INTERNAL_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

function normalizeHostname(hostname) {
  return hostname.replace(/^\[/, "").replace(/\]$/, "").replace(/\.$/, "").toLowerCase();
}

function parseIPv4(host) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    return null;
  }

  const parts = host.split(".").map((part) => Number(part));

  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }

  return parts;
}

function isBlockedIPv4(parts) {
  const [a, b, c] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function isIPv6(host) {
  return host.includes(":");
}

function isBlockedIPv6(host) {
  const lowerHost = host.toLowerCase();
  const firstHextet = Number.parseInt(lowerHost.split(":")[0] || "0", 16);

  if (
    lowerHost === "::" ||
    lowerHost === "::1" ||
    lowerHost === "0:0:0:0:0:0:0:0" ||
    lowerHost === "0:0:0:0:0:0:0:1"
  ) {
    return true;
  }

  if (lowerHost.startsWith("::ffff:")) {
    const ipv4 = parseIPv4(lowerHost.slice(7));
    return Boolean(ipv4 && isBlockedIPv4(ipv4));
  }

  return (
    lowerHost.startsWith("fc") ||
    lowerHost.startsWith("fd") ||
    (Number.isInteger(firstHextet) && (firstHextet & 0xffc0) === 0xfe80)
  );
}
