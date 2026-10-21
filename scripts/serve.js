import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".webmanifest":"application/manifest+json; charset=utf-8", ".svg":"image/svg+xml" };
const server = http.createServer(async (req,res)=>{
  let pathname = decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  const target = path.resolve(root, `.${pathname}`);
  if (!target.startsWith(root)) { res.writeHead(403).end(); return; }
  try { const data=await fs.readFile(target);res.writeHead(200,{"content-type":types[path.extname(target)]||"application/octet-stream","cache-control":"no-store"}).end(data); }
  catch { res.writeHead(404).end("Not found"); }
});
server.listen(4173,"0.0.0.0",()=>console.log("EverBliss available at http://localhost:4173"));
