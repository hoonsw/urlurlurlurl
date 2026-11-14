import { isValidSlug, NOT_FOUND_MESSAGE } from "../src/url.js";

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405 });
  }

  const slug = params.slug;

  if (!env.URLS || !isValidSlug(slug)) {
    return notFound(request.method);
  }

  const originalUrl = await env.URLS.get(slug);

  if (!originalUrl) {
    return notFound(request.method);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: originalUrl,
      "Cache-Control": "no-store"
    }
  });
}

function notFound(method) {
  return new Response(method === "HEAD" ? null : notFoundHtml(), {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function notFoundHtml() {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>urlurlurlurl</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: "Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", "Segoe UI", sans-serif;
      color: #000;
      background: #fff;
    }

    main {
      width: min(100% - 40px, 560px);
    }

    h1 {
      margin: 0 0 16px;
      font-size: clamp(32px, 9vw, 72px);
      line-height: 0.95;
      font-weight: 700;
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }

    p {
      margin: 0;
      font-size: 16px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <main>
    <h1>urlurlurlurl</h1>
    <p>${NOT_FOUND_MESSAGE}</p>
  </main>
</body>
</html>`;
}
