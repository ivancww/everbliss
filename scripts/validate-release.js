import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";

const release = JSON.parse(await fs.readFile("release.json", "utf8"));
if (!/^v\d+\.\d+\.\d+$/.test(release.version || "")) throw new Error("Invalid release version; use vMAJOR.MINOR.PATCH");
const built = JSON.parse(await fs.readFile("dist/release.json", "utf8"));
if (built.version !== release.version) throw new Error("Built release version does not match release.json");
if (!built.buildId || built.buildId === "source") throw new Error("Build ID was not generated");
const buildInfo = await fs.readFile("dist/build-info.js", "utf8");
const index = await fs.readFile("dist/index.html", "utf8");
const worker = await fs.readFile("dist/sw.js", "utf8");
const app = await fs.readFile("dist/src/app/main.js", "utf8");
if (!buildInfo.includes(`"version":"${release.version}"`) || !buildInfo.includes(`"buildId":"${built.buildId}"`)) throw new Error("Generated build-info does not match release metadata");
if (!index.includes(`<small id="app-version">${release.version}</small>`)) throw new Error("Generated shell does not display the release version");
if (!worker.includes(`const BUILD_ID = "${built.buildId}"`)) throw new Error("Service Worker does not carry the generated build ID");
if (!worker.includes('url.pathname.endsWith("/release.json")') || !worker.includes('cache: "no-store"')) throw new Error("Service Worker release metadata must bypass static cache");
if (!app.includes('register("./sw.js",{updateViaCache:"none"})')) throw new Error("Service Worker registration must bypass update cache");
if (process.env.EVERBLISS_OFFICIAL_ENDPOINT && built.officialEndpoint !== process.env.EVERBLISS_OFFICIAL_ENDPOINT) throw new Error("Official endpoint was not injected into release metadata");

const base = process.argv.includes("--base") ? process.argv[process.argv.indexOf("--base") + 1] : "";
if (base) {
  let baseRelease;
  try { baseRelease = JSON.parse(execFileSync("git", ["show", `${base}:release.json`], { encoding: "utf8" })); }
  catch { throw new Error(`Could not read release.json from base ${base}`); }
  const changed = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const customerFacing = changed.some(file => file === "index.html" || file.startsWith("src/app/") || file.startsWith("src/ui/") || file.startsWith("src/calculations/") || file.startsWith("src/data/official/") || file.startsWith("src/pwa/") || file === "manifest.webmanifest");
  if (customerFacing && release.version === baseRelease.version) throw new Error(`Customer-facing production files changed without a version bump from ${baseRelease.version}`);
}
console.log(`Release contract valid: ${release.version} / ${built.buildId}`);
