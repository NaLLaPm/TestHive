import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".htm": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".gif": "image/gif",
};

interface StoredSite {
  sourceId: string;
  projectName: string;
  rootDir: string;
  entryPath: string;
  port: number;
  server: http.Server;
  createdAt: number;
}

class SiteServerManager {
  private static instance: SiteServerManager;
  private sites = new Map<string, StoredSite>();
  private uploadsBaseDir: string;
  private nextPort = 9100;

  private constructor() {
    this.uploadsBaseDir = path.resolve(process.cwd(), "data", "uploads");
    fs.mkdirSync(this.uploadsBaseDir, { recursive: true });
  }

  public static getInstance(): SiteServerManager {
    if (!SiteServerManager.instance) {
      SiteServerManager.instance = new SiteServerManager();
    }
    return SiteServerManager.instance;
  }

  public async deployZip(zipBuffer: Buffer, originalFilename: string): Promise<{
    sourceId: string;
    url: string;
    projectName: string;
    entryPath: string;
    fileCount: number;
    htmlFiles: string[];
  }> {
    const sourceId = crypto.randomUUID();
    const destDir = path.join(this.uploadsBaseDir, sourceId);
    fs.mkdirSync(destDir, { recursive: true });

    const tempZipPath = path.join(destDir, "source.zip");
    fs.writeFileSync(tempZipPath, zipBuffer);

    // Unpack using python's built-in zipfile module for maximum reliability
    try {
      execFileSync(
        "python3",
        [
          "-c",
          `
import zipfile, sys, os
zip_path = sys.argv[1]
dest = sys.argv[2]
with zipfile.ZipFile(zip_path, 'r') as z:
    for member in z.infolist():
        target_path = os.path.realpath(os.path.join(dest, member.filename))
        if not target_path.startswith(os.path.realpath(dest)):
            continue
        z.extract(member, dest)
`,
          tempZipPath,
          destDir,
        ],
        { stdio: "pipe" }
      );
    } catch (err) {
      // Fallback to unzip CLI if available
      try {
        execFileSync("unzip", ["-q", "-o", tempZipPath, "-d", destDir]);
      } catch {
        throw new Error(`Failed to extract uploaded zip archive: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      if (fs.existsSync(tempZipPath)) {
        fs.unlinkSync(tempZipPath);
      }
    }

    const { effectiveRoot, htmlFiles, totalFiles } = this.findSiteStructure(destDir);
    const entryPath = htmlFiles.includes("index.html")
      ? "index.html"
      : htmlFiles[0] || "index.html";

    const baseName = originalFilename.replace(/\.[^/.]+$/, "") || "uploaded-site";
    const port = await this.allocatePort();

    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url ?? "/", `http://localhost:${port}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      if (reqPath.endsWith("/")) {
        reqPath += "index.html";
      }

      let filePath = path.join(effectiveRoot, reqPath);
      if (!filePath.startsWith(effectiveRoot)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      // If directory requested, check for index.html
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      // SPA fallback: if file not found and request accepts text/html, fallback to entryPath or index.html
      if (!fs.existsSync(filePath)) {
        const acceptHeader = req.headers.accept || "";
        if (acceptHeader.includes("text/html") || !path.extname(reqPath)) {
          filePath = path.join(effectiveRoot, entryPath);
        }
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 Not Found");
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME[ext] ?? "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(data);
      });
    });

    await new Promise<void>((resolve, reject) => {
      server.listen(port, "0.0.0.0", () => resolve());
      server.on("error", reject);
    });

    const host = process.env.PUBLIC_DEMO_HOST || "http://127.0.0.1";
    const siteUrl = `${host}:${port}/`;

    const stored: StoredSite = {
      sourceId,
      projectName: baseName,
      rootDir: effectiveRoot,
      entryPath,
      port,
      server,
      createdAt: Date.now(),
    };
    this.sites.set(sourceId, stored);

    return {
      sourceId,
      url: siteUrl,
      projectName: baseName,
      entryPath,
      fileCount: totalFiles,
      htmlFiles,
    };
  }

  private findSiteStructure(dir: string): { effectiveRoot: string; htmlFiles: string[]; totalFiles: number } {
    let effectiveRoot = dir;

    // Check if zip contains a single top-level folder (common zip export pattern)
    const entries = fs.readdirSync(effectiveRoot, { withFileTypes: true });
    const nonHidden = entries.filter((e) => !e.name.startsWith(".") && !e.name.startsWith("__MACOSX"));
    if (nonHidden.length === 1 && nonHidden[0]!.isDirectory()) {
      effectiveRoot = path.join(effectiveRoot, nonHidden[0]!.name);
    }

    // Also check if there's a dist/ or build/ or public/ subfolder that contains index.html
    const subdirs = ["dist", "build", "public", "out"];
    for (const sub of subdirs) {
      const candidate = path.join(effectiveRoot, sub);
      if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, "index.html"))) {
        effectiveRoot = candidate;
        break;
      }
    }

    const htmlFiles: string[] = [];
    let totalFiles = 0;

    const scan = (current: string, rel: string) => {
      const items = fs.readdirSync(current, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith(".") || item.name === "node_modules" || item.name === "__MACOSX") continue;
        const full = path.join(current, item.name);
        const relPath = rel ? `${rel}/${item.name}` : item.name;
        if (item.isDirectory()) {
          scan(full, relPath);
        } else {
          totalFiles++;
          if (item.name.toLowerCase().endsWith(".html") || item.name.toLowerCase().endsWith(".htm")) {
            htmlFiles.push(relPath);
          }
        }
      }
    };

    scan(effectiveRoot, "");
    return { effectiveRoot, htmlFiles, totalFiles };
  }

  private async allocatePort(): Promise<number> {
    const isPortAvailable = (p: number): Promise<boolean> =>
      new Promise((resolve) => {
        const s = http.createServer();
        s.once("error", () => resolve(false));
        s.once("listening", () => {
          s.close(() => resolve(true));
        });
        s.listen(p, "0.0.0.0");
      });

    for (let p = this.nextPort; p < 9999; p++) {
      if (await isPortAvailable(p)) {
        this.nextPort = p + 1;
        return p;
      }
    }
    return 9100;
  }
}

export const siteServerManager = SiteServerManager.getInstance();
