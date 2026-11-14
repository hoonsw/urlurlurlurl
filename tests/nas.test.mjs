import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import test from "node:test";

const publicOrigin = "https://links.example.org";
async function startServer(directory) {
  const child = spawn(process.execPath, ["nas.mjs"], {
    cwd: new URL("../", import.meta.url),
    env: { ...process.env, PORT: "0", BIND: "127.0.0.1", PUBLIC_URL: publicOrigin, DATA_DIR: directory },
    stdio: ["ignore", "pipe", "inherit"]
  });
  const stopped = once(child, "exit");
  const lines = createInterface({ input: child.stdout });
  try {
    for await (const line of lines) {
      const match = /^Listening on port (\d+)$/.exec(line);
      if (match) {
        return {
          origin: `http://127.0.0.1:${match[1]}`,
          stop: async () => { child.kill(); await stopped; }
        };
      }
    }
    throw new Error("NAS server exited before accepting connections");
  } finally {
    lines.close();
  }
}

test("NAS stores a new link and serves it after restarting with the same volume", async () => {
  const directory = await mkdtemp(join(tmpdir(), "url-link-test-"));
  let server;
  try {
    server = await startServer(directory);
    const response = await fetch(server.origin + "/api/extend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "example.org/article" })
    });
    assert.equal(response.status, 201);
    const { url } = await response.json();
    assert.equal(new URL(url).origin, publicOrigin);
    assert.equal(url.length, 500);
    await server.stop();
    server = undefined;
    server = await startServer(directory);
    const link = await fetch(server.origin + new URL(url).pathname, { redirect: "manual" });
    assert.equal(link.status, 302);
    assert.equal(link.headers.get("location"), "https://example.org/article");
    assert.equal((await fetch(server.origin + "/missing")).status, 404);
  } finally {
    if (server) await server.stop();
    await rm(directory, { recursive: true, force: true });
  }
});
