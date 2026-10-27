import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createInitialState, loadAppState, saveAppState } from "../src/storage/state.js";
import { checkDeployedRelease, claimForcedReload, releaseDiffers } from "../src/pwa/release-check.js";
import { startLocalFirst } from "../src/app/local-first-startup.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const template=await fs.readFile(path.join(root,"src/pwa/sw-template.js"),"utf8");
function harness(buildId,cachesMap,posted,indexedDBRef,fetchImpl=globalThis.fetch){
  const handlers={};let waiting=0;
  const cacheApi={
    async open(name){if(!cachesMap.has(name))cachesMap.set(name,new Map());const bucket=cachesMap.get(name);return {async addAll(urls){for(const url of urls)bucket.set(url,{url});},async match(key){return bucket.get(typeof key==="string"?key:key.url)||null;},async put(key,value){bucket.set(typeof key==="string"?key:key.url,value);}};},
    async keys(){return [...cachesMap.keys()];},async delete(name){return cachesMap.delete(name);}
  };
  const client={postMessage:message=>posted.push(message)};
  const self={location:{origin:"https://example.test"},addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting:async()=>{waiting++},clients:{claim:async()=>{},matchAll:async()=>[client]}};
  const source=template.replaceAll("__BUILD_ID__",buildId);
  vm.runInNewContext(source,{self,caches:cacheApi,URL,Request,fetch:fetchImpl,Promise,indexedDB:indexedDBRef});
  return {handlers,get waiting(){return waiting;},client};
}
async function runLifecycle(h,kind){let promise;h.handlers[kind]({waitUntil:p=>{promise=p;}});await promise;}

test("v0.4.3 shell loads and build stamps a unique deployment identifier",()=>{
  return fs.readFile(path.join(root,"release.json"),"utf8").then(async raw=>{const release=JSON.parse(raw);assert.equal(release.version,"v0.4.3");
  const built=execFileSync(process.execPath,[path.join(root,"scripts/build.js")],{cwd:root,env:{...process.env,GITHUB_SHA:"test-sha-001"},encoding:"utf8"});
  assert.match(built,/Built EverBliss v0\.4\.3 \(test-sha-001\)/);
  const [sw,meta,index,info]=await Promise.all([fs.readFile(path.join(root,"dist/sw.js"),"utf8"),fs.readFile(path.join(root,"dist/release.json"),"utf8"),fs.readFile(path.join(root,"dist/index.html"),"utf8"),fs.readFile(path.join(root,"dist/build-info.js"),"utf8")]);assert.match(sw,/const BUILD_ID = "test-sha-001"/);assert.equal(JSON.parse(meta).buildId,"test-sha-001");assert.match(index,/<small id="app-version">v0\.4\.3<\/small>/);assert.match(info,/"version":"v0\.4\.3"/);});
});

test("next deployment changes the worker, stages new shell, activates it and safely retires prior shell",async()=>{
  const cacheMap=new Map();const messages=[];
  const oldWorker=harness("deployment-a",cacheMap,messages);await runLifecycle(oldWorker,"install");await runLifecycle(oldWorker,"activate");assert.deepEqual([...cacheMap.keys()], ["everbliss-shell-deployment-a"]);assert.equal(oldWorker.waiting,1);
  const newWorker=harness("deployment-b",cacheMap,messages);assert.notEqual(template.replaceAll("__BUILD_ID__","deployment-a"),template.replaceAll("__BUILD_ID__","deployment-b"));
  await runLifecycle(newWorker,"install");assert.ok(cacheMap.has("everbliss-shell-deployment-a"));assert.ok(cacheMap.has("everbliss-shell-deployment-b"));
  await runLifecycle(newWorker,"activate");assert.deepEqual([...cacheMap.keys()],["everbliss-shell-deployment-b"]);assert.equal(JSON.stringify(messages),JSON.stringify([{type:"EVERBLISS_SHELL_UPDATED",buildId:"deployment-b"}]));
});

test("update reload is bounded once per build ID and does not clear app data",async()=>{
  const app=await fs.readFile(path.join(root,"src/app/main.js"),"utf8");const sw=template;const updater=await fs.readFile(path.join(root,"src/pwa/release-check.js"),"utf8");
  assert.match(updater,/everbliss:forced-update:\$\{targetBuild\}/);assert.match(app,/register\("\.\/sw\.js",\{updateViaCache:"none"\}\)/);
  assert.doesNotMatch(sw,/localStorage\.clear\(|indexedDB\.deleteDatabase\(/);assert.match(sw,/const previous = names\.filter\(name => name\.startsWith\(CACHE_PREFIX\) && name !== CACHE_NAME\)/);
  assert.match(sw,/name\.startsWith\(CACHE_PREFIX\)/);assert.match(sw,/release\.json/);assert.match(sw,/new Request\(request, \{ cache: "no-store" \}\)/);
});

test("journey and local storage survive an automatic shell transition",async()=>{
  const oldStorage=globalThis.localStorage;const oldIndexedDB=globalThis.indexedDB;const values=new Map();let deleteDatabaseCalls=0;
  globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value))};
  globalThis.indexedDB={deleteDatabase(){deleteDatabaseCalls++;throw new Error("must not delete app data");}};
  try{
    await saveAppState({...createInitialState(),page:"result",journeyStep:"result",issueAge:50,premiumHkd:390000,scenarioReady:true});
    const cachesMap=new Map();const messages=[];const db={
      deleteDatabase(){deleteDatabaseCalls++;throw new Error("must not delete app data");}
    };
    await runLifecycle(harness("before",cachesMap,messages,db),"install");await runLifecycle(harness("before",cachesMap,messages,db),"activate");
    await runLifecycle(harness("after",cachesMap,messages,db),"install");await runLifecycle(harness("after",cachesMap,messages,db),"activate");
    const restored=await loadAppState();assert.equal(restored.page,"result");assert.equal(restored.issueAge,50);assert.equal(restored.premiumHkd,390000);assert.equal(restored.scenarioReady,true);assert.equal(deleteDatabaseCalls,0);
  }finally{if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage;if(oldIndexedDB===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=oldIndexedDB;}
});

test("browser and installed-PWA entry share the App Service Worker update lifecycle",async()=>{
  const manifest=JSON.parse(await fs.readFile(path.join(root,"manifest.webmanifest"),"utf8"));const app=await fs.readFile(path.join(root,"src/app/main.js"),"utf8");
  assert.equal(manifest.display,"standalone");assert.equal(manifest.scope,"./");assert.match(app,/reg\.update\(\)/);assert.match(app,/navigator\.serviceWorker\.addEventListener\("message"/);assert.match(app,/visibilitychange/);
});

test("customer first paint completes before cloud Official and Product Config refresh",async()=>{
  const order=[];let scheduled;
  await startLocalFirst({loadLocal:async()=>({official:"bundled",config:7.8}),activateLocal:value=>order.push(`activate:${value.config}`),render:()=>order.push("render"),schedule:callback=>{scheduled=callback;},refreshCloud:()=>{order.push("cloud");return new Promise(()=>{});}});
  assert.deepEqual(order,["activate:7.8","render"]);scheduled();await Promise.resolve();assert.deepEqual(order,["activate:7.8","render","cloud"]);
});

test("release checks bypass cache and detect version or build changes",async()=>{
  assert.equal(releaseDiffers({version:"v0.4.0",buildId:"a"},{version:"v0.4.0",buildId:"a"}),false);
  assert.equal(releaseDiffers({version:"v0.4.0",buildId:"a"},{version:"v0.2.1",buildId:"b"}),true);
  assert.equal(releaseDiffers({version:"v0.4.0",buildId:"a"},{version:"v0.4.0",buildId:"b"}),true);
  let options;let updates=0;let notified="";
  const result=await checkDeployedRelease({current:{version:"v0.4.0",buildId:"a"},registration:{update:async()=>{updates++;}},onUpdateDetected:deployed=>{notified=deployed.buildId;},fetchImpl:async(_url,init)=>{options=init;return{ok:true,json:async()=>({version:"v0.2.1",buildId:"b"})};}});
  assert.equal(options.cache,"no-store");assert.equal(result.updateAvailable,true);assert.equal(updates,1);assert.equal(notified,"b");
});

test("forced update reloads once for the target build and skips the already-current build",()=>{
  const values=new Map();const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  assert.equal(claimForcedReload("b","a",storage),true);assert.equal(claimForcedReload("b","a",storage),false);assert.equal(claimForcedReload("b","b",storage),false);assert.equal(claimForcedReload("c","b",storage),true);
});

test("static shell is cache-first while release metadata is explicitly network-fresh",()=>{
  assert.match(template,/if \(url\.pathname\.endsWith\("\/release\.json"\)\)/);
  assert.match(template,/const cached = await cache\.match\(request\)/);
  assert.match(template,/if \(cached\)/);
  assert.doesNotMatch(template,/const freshRequest = new Request\(request, \{ cache: "no-store" \}\);\s*const response = await fetch\(freshRequest\);\s*if \(response && response\.ok/);
});

test("offline navigation serves the staged local shell without deleting customer data",async()=>{
  const cacheMap=new Map([ ["everbliss-shell-offline",new Map([["https://example.test/app.js",{body:"cached-shell"}]])] ]);
  const h=harness("offline",cacheMap,[],null,async()=>{throw new Error("offline");});
  let responsePromise;const waits=[];
  h.handlers.fetch({request:new Request("https://example.test/app.js"),respondWith:p=>{responsePromise=p;},waitUntil:p=>waits.push(p)});
  const response=await responsePromise;assert.equal(response.body,"cached-shell");await Promise.allSettled(waits);
  assert.deepEqual([...cacheMap.keys()].sort(),["everbliss-shell-offline"]);
});

test("release metadata bypasses a stale cached value",async()=>{
  const cacheMap=new Map([ ["everbliss-shell-live",new Map([["https://example.test/release.json",{body:"old"}]])] ]);
  let requestOptions;
  const h=harness("live",cacheMap,[],null,async request=>{requestOptions=request;return{body:"fresh-release",ok:true,type:"basic"};});
  let responsePromise;h.handlers.fetch({request:new Request("https://example.test/release.json"),respondWith:p=>{responsePromise=p;},waitUntil:()=>{}});
  const response=await responsePromise;assert.equal(response.body,"fresh-release");assert.equal(requestOptions.cache,"no-store");
});

test("updated Official age data remains in the staged PWA shell",()=>{
  assert.match(template,/\.\/src\/app\/plan-input\.js/);
  assert.match(template,/\.\/src\/data\/official\/everbliss-anchors\.js/);
  assert.match(template,/\.\/src\/calculations\/full-outcomes\.js/);
  assert.match(template,/\.\/src\/data\/official\/income-rates\.js/);
  assert.match(template,/\.\/src\/data\/official\/official-multipliers\.js/);
  assert.match(template,/\.\/src\/data\/official\/official-dataset\.js/);
  assert.match(template,/\.\/src\/admin\/admin-auth\.js/);
  assert.match(template,/\.\/src\/admin\/admin-view\.js/);
  assert.match(template,/\.\/src\/admin\/admin-workflow\.js/);
  assert.match(template,/cache\.addAll\(SHELL_FILES\)/);
  assert.match(template,/const BUILD_ID = "__BUILD_ID__"/);
});
