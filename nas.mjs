import http from "node:http";
import { mkdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { onRequestPost } from "./functions/api/extend.js";
import { onRequest } from "./functions/[slug].js";

const port = Number(process.env.PORT || 8080);
const origin = new URL(process.env.PUBLIC_URL || `http://localhost:${port}`).origin;
const directory = process.env.DATA_DIR || "./data";
mkdirSync(directory, { recursive: true });
const db = new DatabaseSync(join(directory, "urls.sqlite"));
db.exec("CREATE TABLE IF NOT EXISTS urls (slug TEXT PRIMARY KEY, url TEXT NOT NULL)");
const lookup = db.prepare("SELECT url FROM urls WHERE slug = ?");
const insert = db.prepare("INSERT INTO urls(slug,url) VALUES (?,?)");
const env = { URLS: {
  get: slug => lookup.get(slug)?.url,
  put: (slug, url) => insert.run(slug, url)
} };
const assets = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript"]],
  ["/styles.css", ["styles.css", "text/css"]]
]);
http.createServer(async (incoming, outgoing) => {
  try {
    const path = new URL(incoming.url, origin).pathname;
    const asset = assets.get(path);
    if (asset && ["GET", "HEAD"].includes(incoming.method)) {
      outgoing.writeHead(200, { "Content-Type": asset[1] });
      outgoing.end(incoming.method === "HEAD" ? undefined : readFileSync(new URL("./public/" + asset[0], import.meta.url)));
      return;
    }
    let response;
    if (path === "/api/extend" && incoming.method === "POST") {
      const chunks = [];
      let size = 0;
      for await (const chunk of incoming) {
        size += chunk.length;
        if (size > 32768) { outgoing.writeHead(413).end(); return; }
        chunks.push(chunk);
      }
      const request = new Request(origin + path, {
        method: "POST", headers: incoming.headers, body: Buffer.concat(chunks)
      });
      response = await onRequestPost({ request, env });
    } else {
      response = await onRequest({ request: { method: incoming.method }, env, params: { slug: path.slice(1) } });
    }
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    outgoing.writeHead(500).end();
  }
}).listen(port, process.env.BIND || "127.0.0.1", function () {
  console.log(`Listening on port ${this.address().port}`);
});
