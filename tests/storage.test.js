import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, loadAppState, loadLastKnownGoodOfficial, loadUserOverrides, saveAppState, saveLastKnownGoodOfficial, saveUserOverrides } from "../src/storage/state.js";

function memoryStorage(){const values=new Map();return {getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k),clear:()=>values.clear(),keys:()=>[...values.keys()]};}
test("journey inputs and current route restore from Local-first state",async()=>{
  const old=globalThis.localStorage;globalThis.localStorage=memoryStorage();
  try{const state={...createInitialState(),page:"oala",journeyStep:"plan",issueAge:58,gender:"F",annuityAllocationHkd:1234567,hkdPerUsd:"7.8",oala:{...createInitialState().oala,household:"couple",currentAssets:900000}};await saveAppState(state);const restored=await loadAppState();assert.equal(restored.page,"oala");assert.equal(restored.issueAge,58);assert.equal(restored.annuityAllocationHkd,1234567);assert.equal(restored.oala.household,"couple");assert.equal(restored.metadata.schemaVersion,1);}finally{if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old;}
});
test("Last Known Good Official cache uses a distinct local namespace from User Override",async()=>{
  const old=globalThis.localStorage;globalThis.localStorage=memoryStorage();
  try{const official={schemaVersion:1,datasetVersion:"official-v2",multipliers:{}};await saveLastKnownGoodOfficial(official);await saveUserOverrides({heroTitle:"自訂標題"});const restored=await loadLastKnownGoodOfficial();const override=await loadUserOverrides();assert.equal(restored.datasetVersion,"official-v2");assert.equal(restored.cacheLayer,"LAST_KNOWN_GOOD_OFFICIAL");assert.equal(override.heroTitle,"自訂標題");assert.notEqual(restored.heroTitle,override.heroTitle);assert.deepEqual(globalThis.localStorage.keys().sort(),["ava:everbliss:official-lkg:v1","ava:everbliss:overrides:v1"]);}finally{if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old;}
});
test("selected annual outcome view and policy year are included in persisted app state",async()=>{
  const old=globalThis.localStorage;globalThis.localStorage=memoryStorage();
  try{const state={...createInitialState(),page:"result",selectedOutcomeView:"death",selectedPolicyYear:12};await saveAppState(state);const restored=await loadAppState();assert.equal(restored.selectedOutcomeView,"death");assert.equal(restored.selectedPolicyYear,12);assert.equal(createInitialState().selectedOutcomeView,"income");assert.equal(createInitialState().selectedPolicyYear,1);}finally{if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old;}
});
test("User overrides persist separately and do not replace Official or customer state",async()=>{
  const old=globalThis.localStorage;globalThis.localStorage=memoryStorage();
  try{await saveAppState({...createInitialState(),page:"health"});await saveUserOverrides({heroTitle:"我的退休現金流"});const state=await loadAppState();const override=await loadUserOverrides();assert.equal(state.page,"health");assert.equal(override.heroTitle,"我的退休現金流");assert.equal(override.metadata.layer,"USER_OVERRIDE");assert.deepEqual(globalThis.localStorage.keys().sort(),["ava:everbliss:overrides:v1","ava:everbliss:state:v1"]);}finally{if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old;}
});
