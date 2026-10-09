import "dotenv/config";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.DEMO_SITE_PORT ?? 8989);
const PUBLIC_DIR = path.resolve(process.cwd(), "demo-site", "public");

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  let pathname = url.pathname;

  let filePath = path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }

  // If path is a directory or root, serve index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  // If file doesn't exist, SPA fallback to index.html
  if (!fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, "index.html");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Demo site listening on http://0.0.0.0:${PORT}  (SPA shopping-time)`);
});

