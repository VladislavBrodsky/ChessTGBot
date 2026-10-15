import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import path from "node:path";
import test from "node:test";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("standalone website rejects mutation probes and still serves public routes", { timeout: 45000 }, async (t) => {
  const reservation = net.createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));

  let output = "";
  const server = spawn(process.execPath, [".next/standalone/website/server.js"], {
    cwd: websiteRoot,
    env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (data) => { output += data; });
  server.stderr.on("data", (data) => { output += data; });
  t.after(async () => {
    if (server.exitCode === null && server.signalCode === null) {
      const exited = once(server, "exit");
      server.kill("SIGTERM");
      await exited;
    }
  });

  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    assert.equal(server.exitCode, null, output);
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(1000) });
      await response.arrayBuffer();
      if (response.ok) { ready = true; break; }
    } catch { /* Wait for the standalone server to accept connections. */ }
    await setTimeout(100);
  }
  assert(ready, `Standalone server did not become ready:\n${output}`);

  for (const route of ["/", "/blog", "/feed.xml", "/robots.txt", "/sitemap.xml"]) {
    for (const method of ["GET", "HEAD"]) {
      const response = await fetch(base + route, { method });
      assert.equal(response.status, 200, `${method} ${route}`);
      const body = await response.text();
      if (method === "HEAD") assert.equal(body, "");
      else assert(body.length > 0, `${route} must still serve content`);
    }
  }

  const navigation = await fetch(base, { headers: { RSC: "1" } });
  assert.equal(navigation.status, 200);
  assert.match(navigation.headers.get("content-type"), /text\/x-component/);
  await navigation.arrayBuffer();

  for (const route of ["/", "/blog", "/feed.xml", "/missing-page"]) {
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
      const response = await fetch(base + route, {
        method,
        headers: { "Next-Action": "x", "Content-Type": "text/plain" },
        body: "[]",
      });
      assert.equal(response.status, 405, `${method} ${route}`);
      assert.equal(response.headers.get("allow"), "GET, HEAD");
      assert.equal(response.headers.get("cache-control"), "no-store");
      await response.arrayBuffer();
    }
  }

  const form = new FormData();
  form.append("$ACTION_ID_x", "");
  const multipart = await fetch(base, { method: "POST", body: form });
  assert.equal(multipart.status, 405, "Headerless multipart action probe");
  await multipart.arrayBuffer();

  const missing = await fetch(base + "/missing-page");
  assert.equal(missing.status, 404);
  await missing.arrayBuffer();
  await setTimeout(100);
  assert.doesNotMatch(output, /Server Reference ID|Failed to find Server Action|Error: aborted|ECONNRESET/);
});
