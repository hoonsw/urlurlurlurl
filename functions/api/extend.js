import {
  ERROR_MESSAGE,
  getSlugLengthForOrigin,
  normalizeSubmittedUrl,
  randomSlug
} from "../../src/url.js";

const COLLISION_ATTEMPTS = 5;

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.URLS) {
    return json({ error: "저장소 설정을 확인해 주세요." }, 500);
  }

  let originalUrl;

  try {
    const inputUrl = await readInputUrl(request);
    originalUrl = normalizeSubmittedUrl(inputUrl, request.url);
  } catch {
    return json({ error: ERROR_MESSAGE }, 400);
  }

  const origin = new URL(request.url).origin;
  const slugLength = getSlugLengthForOrigin(origin);

  for (let attempt = 0; attempt < COLLISION_ATTEMPTS; attempt += 1) {
    const slug = randomSlug(slugLength);
    const exists = await env.URLS.get(slug);

    if (!exists) {
      await env.URLS.put(slug, originalUrl);
      return json({ url: `${origin}/${slug}` }, 201);
    }
  }

  return json({ error: "다시 시도해 주세요." }, 500);
}

async function readInputUrl(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return body?.url;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return formData.get("url");
  }

  return request.text();
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
