import { createServer } from "node:http";
import { Readable } from "node:stream";
import { existsSync, createReadStream } from "node:fs";
import { resolve, extname } from "node:path";
const { default: handler } = await import("../dist/server/server.js");
const types = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain",
  ".xml": "application/xml",
};
const port = Number(process.env.PORT || 3000);
const origin = process.env.BETTER_AUTH_URL || `http://localhost:${port}`;
createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url, origin);
    const file = resolve("dist/client", "." + decodeURIComponent(url.pathname));
    if (
      file.startsWith(resolve("dist/client") + "/") &&
      existsSync(file) &&
      extname(file)
    ) {
      outgoing.setHeader(
        "Content-Type",
        types[extname(file)] || "application/octet-stream",
      );
      createReadStream(file).pipe(outgoing);
      return;
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers))
      if (value)
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    const request = new Request(url, {
      method: incoming.method,
      headers,
      body: ["GET", "HEAD"].includes(incoming.method)
        ? undefined
        : Readable.toWeb(incoming),
      duplex: "half",
    });
    const response = await handler.fetch(request);
    outgoing.statusCode = response.status;
    for (const [key, value] of response.headers)
      if (key !== "set-cookie") outgoing.setHeader(key, value);
    if (response.headers.getSetCookie().length)
      outgoing.setHeader("set-cookie", response.headers.getSetCookie());
    if (response.body) Readable.fromWeb(response.body).pipe(outgoing);
    else outgoing.end();
  } catch (error) {
    console.error(error);
    outgoing.statusCode = 500;
    outgoing.end("Server error");
  }
}).listen(port, () => console.log(`Startup OS listening at ${origin}`));
