import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 4173);
const root = resolve("dist");
const indexPath = join(root, "index.html");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    const pathname = decodeURIComponent(url.pathname);
    const requestedPath = resolve(root, `.${pathname}`);

    if (!requestedPath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const filePath = await existingFilePath(requestedPath, pathname);
    if (!filePath) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const extension = extname(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] ?? "application/octet-stream",
      "Cache-Control": filePath.includes(`${root}\\assets\\`) || filePath.includes(`${root}/assets/`)
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    console.error(error);
    response.writeHead(500);
    response.end("Internal server error");
  }
});

server.listen(port, host, () => {
  console.log(`Idle Galactica serving ${root} at http://${host}:${port}`);
});

async function existingFilePath(requestedPath, pathname) {
  if (await isFile(requestedPath)) {
    return requestedPath;
  }

  if (!extname(pathname)) {
    return (await isFile(indexPath)) ? indexPath : null;
  }

  return null;
}

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}
