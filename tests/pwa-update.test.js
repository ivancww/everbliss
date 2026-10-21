import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createInitialState, loadAppState, saveAppState } from "../src/storage/state.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const template=await fs.readFile(path.join(root,"src/pwa/sw-template.js"),"utf8");
function harness(buildId,cachesMap,posted,indexedDBRef){
  const handlers={};let waiting=0;
  const cacheApi={
    async open(name){if(!cachesMap.has(name))cachesMap.set(name,new Map());const bucket=cachesMap.get(name);return {async addAll(urls){for(const url of urls)bucket.set(url,{url});},async match(key){return bucket.get(typeof key==="string"?key:key.url)||null;},async put(key,value){bucket.set(typeof key==="string"?key:key.url,value);}};},
    async keys(){return [...cachesMap.keys()];},async delete(name){return cachesMap.delete(name);}
  };
  const client={postMessage:message=>posted.push(message)};
  const self={location:{origin:"https://example.test"},addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting:async()=>{waiting++},clients:{claim:async()=>{},matchAll:async()=>[client]}};
  const source=template.replaceAll("__BUILD_ID__",buildId);
  vm.runInNewContext(source,{self,caches:cacheApi,URL,Request,fetch:globalThis.fetch,Promise,indexedDB:indexedDBRef});
  return {handlers,get waiting(){return waiting;},client};
}
async function runLifecycle(h,kind){let promise;h.handlers[kind]({waitUntil:p=>{promise=p;}});await promise;}

test("v0.1.0 shell loads and build stamps a unique deployment identifier",()=>{
  return fs.readFile(path.join(root,"release.json"),"utf8").then(async raw=>{const release=JSON.parse(raw);assert.equal(release.version,"v0.1.0");
  const built=execFileSync(process.execPath,[path.join(root,"scripts/build.js")],{cwd:root,env:{...process.env,GITHUB_SHA:"test-sha-001"},encoding:"utf8"});
  assert.match(built,/Built EverBliss v0\.1\.0 \(test-sha-001\)/);
  const [sw,meta,index]=await Promise.all([fs.readFile(path.join(root,"dist/sw.js"),"utf8"),fs.readFile(path.join(root,"dist/release.json"),"utf8"),fs.readFile(path.join(root,"dist/index.html"),"utf8")]);assert.match(sw,/const BUILD_ID = "test-sha-001"/);assert.equal(JSON.parse(meta).buildId,"test-sha-001");assert.match(index,/退休現金流規劃/);});
});

test("next deployment changes the worker, stages new shell, activates it and safely retires prior shell",async()=>{
  const cacheMap=new Map();const messages=[];
  const oldWorker=harness("deployment-a",cacheMap,messages);await runLifecycle(oldWorker,"install");await runLifecycle(oldWorker,"activate");assert.deepEqual([...cacheMap.keys()], ["everbliss-shell-deployment-a"]);assert.equal(oldWorker.waiting,1);
  const newWorker=harness("deployment-b",cacheMap,messages);assert.notEqual(template.replaceAll("__BUILD_ID__","deployment-a"),template.replaceAll("__BUILD_ID__","deployment-b"));
  await runLifecycle(newWorker,"install");assert.ok(cacheMap.has("everbliss-shell-deployment-a"));assert.ok(cacheMap.has("everbliss-shell-deployment-b"));
  await runLifecycle(newWorker,"activate");assert.deepEqual([...cacheMap.keys()],["everbliss-shell-deployment-b"]);assert.equal(JSON.stringify(messages),JSON.stringify([{type:"EVERBLISS_SHELL_UPDATED",buildId:"deployment-b"}]));
});

test("update reload is bounded once per build ID and does not clear app data",async()=>{
  const app=await fs.readFile(path.join(root,"src/app/main.js"),"utf8");const sw=template;
  assert.match(app,/everbliss:shell-reloaded:\$\{buildId\}/);assert.match(app,/sessionStorage\.getItem\(key\)/);assert.match(app,/navigator\.serviceWorker\.register\("\.\/sw\.js"\)/);
  assert.doesNotMatch(sw,/localStorage\.clear\(|indexedDB\.deleteDatabase\(/);assert.match(sw,/const previous = names\.filter\(name => name\.startsWith\(CACHE_PREFIX\) && name !== CACHE_NAME\)/);
  assert.match(sw,/name\.startsWith\(CACHE_PREFIX\)/);assert.match(sw,/new Request\(request, \{ cache: "no-store" \}\)/);
});

test("journey and local storage survive an automatic shell transition",async()=>{
  const oldStorage=globalThis.localStorage;const oldIndexedDB=globalThis.indexedDB;const values=new Map();let deleteDatabaseCalls=0;
  globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value))};
  globalThis.indexedDB={deleteDatabase(){deleteDatabaseCalls++;throw new Error("must not delete app data");}};
  try{
    await saveAppState({...createInitialState(),page:"result",journeyStep:"result",issueAge:50,annuityAllocationHkd:195000});
    const cachesMap=new Map();const messages=[];const db={
      deleteDatabase(){deleteDatabaseCalls++;throw new Error("must not delete app data");}
    };
    await runLifecycle(harness("before",cachesMap,messages,db),"install");await runLifecycle(harness("before",cachesMap,messages,db),"activate");
    await runLifecycle(harness("after",cachesMap,messages,db),"install");await runLifecycle(harness("after",cachesMap,messages,db),"activate");
    const restored=await loadAppState();assert.equal(restored.page,"result");assert.equal(restored.issueAge,50);assert.equal(restored.annuityAllocationHkd,195000);assert.equal(deleteDatabaseCalls,0);
  }finally{if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage;if(oldIndexedDB===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=oldIndexedDB;}
});

test("browser and installed-PWA entry share the App Service Worker update lifecycle",async()=>{
  const manifest=JSON.parse(await fs.readFile(path.join(root,"manifest.webmanifest"),"utf8"));const app=await fs.readFile(path.join(root,"src/app/main.js"),"utf8");
  assert.equal(manifest.display,"standalone");assert.equal(manifest.scope,"./");assert.match(app,/reg\.update\(\)/);assert.match(app,/navigator\.serviceWorker\.addEventListener\("message"/);
});

