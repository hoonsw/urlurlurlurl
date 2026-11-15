import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import test from "node:test";
import {
  getSlugLengthForOrigin,
  isValidSlug,
  normalizeSubmittedUrl,
  randomSlug,
  TARGET_URL_LENGTH
} from "../src/url.js";

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const serviceUrl = "https://urlurlurlurl.pages.dev/api/extend";

test("normalizes bare domains to https", () => {
  assert.equal(normalizeSubmittedUrl("example.com", serviceUrl), "https://example.com/");
  assert.equal(
    normalizeSubmittedUrl("example.com/path?q=1", serviceUrl),
    "https://example.com/path?q=1"
  );
});

test("preserves query and fragment when normalizing a bare domain path to https", () => {
  assert.equal(
    normalizeSubmittedUrl("example.com/path?q=1#section", serviceUrl),
    "https://example.com/path?q=1#section"
  );
});

test("allows http and https urls", () => {
  assert.equal(normalizeSubmittedUrl("http://example.com", serviceUrl), "http://example.com/");
  assert.equal(normalizeSubmittedUrl("https://example.com", serviceUrl), "https://example.com/");
});

test("rejects invalid or unsafe schemes", () => {
  assert.throws(() => normalizeSubmittedUrl("", serviceUrl));
  assert.throws(() => normalizeSubmittedUrl("javascript:alert(1)", serviceUrl));
  assert.throws(() => normalizeSubmittedUrl("data:text/html,hello", serviceUrl));
  assert.throws(() => normalizeSubmittedUrl("file:///tmp/a", serviceUrl));
  assert.throws(() => normalizeSubmittedUrl("ftp://example.com", serviceUrl));
});

test("rejects self domain and internal hosts", () => {
  const blocked = [
    "https://urlurlurlurl.pages.dev/test",
    "localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://10.0.0.1",
    "http://172.16.0.1",
    "http://192.168.0.1",
    "http://169.254.0.1",
    "http://[::1]",
    "http://[fc00::1]",
    "http://printer"
  ];

  for (const url of blocked) {
    assert.throws(() => normalizeSubmittedUrl(url, serviceUrl), url);
  }
});

test("creates a slug length that makes the full url about 500 characters", () => {
  const origin = "https://urlurlurlurl.pages.dev";
  const slugLength = getSlugLengthForOrigin(origin);

  assert.equal(origin.length + 1 + slugLength, TARGET_URL_LENGTH);
});

test("validates and generates slug strings", () => {
  const slug = randomSlug(96);

  assert.equal(slug.length, 96);
  assert.equal(isValidSlug(slug), true);
  assert.equal(isValidSlug("abc123"), true);
  assert.equal(isValidSlug("abc-123"), false);
  assert.equal(isValidSlug("ABC123"), false);
  assert.equal(isValidSlug("abc/123"), false);
});
