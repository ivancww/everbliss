import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const sourcePaths = ["index.html", "manifest.webmanifest", "release.json", "src", "assets"];
await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });
for (const item of sourcePaths) await fs.cp(path.join(root, item), path.join(dist, item), { recursive: true });
const releasePath = path.join(dist, "release.json");
const release = JSON.parse(await fs.readFile(releasePath, "utf8"));
const buildId = process.env.GITHUB_SHA || process.env.EVERBLISS_BUILD_ID || "local-build";
release.buildId = buildId;
await fs.writeFile(releasePath, `${JSON.stringify(release, null, 2)}\n`);
const swTemplate = await fs.readFile(path.join(root, "src/pwa/sw-template.js"), "utf8");
await fs.writeFile(path.join(dist, "sw.js"), swTemplate.replaceAll("__BUILD_ID__", buildId));
console.log(`Built EverBliss ${release.version} (${buildId})`);
