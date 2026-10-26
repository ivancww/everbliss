const DB_NAME = "ava-everbliss-local";
const DB_VERSION = 2;
const STATE_STORE = "appState";
const OVERRIDE_STORE = "userOverrides";
const OFFICIAL_CACHE_STORE = "officialLastKnownGood";
const STATE_KEY = "everbliss";

function openDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error("IndexedDB unavailable"));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STATE_STORE)) db.createObjectStore(STATE_STORE);
      if (!db.objectStoreNames.contains(OVERRIDE_STORE)) db.createObjectStore(OVERRIDE_STORE);
      if (!db.objectStoreNames.contains(OFFICIAL_CACHE_STORE)) db.createObjectStore(OFFICIAL_CACHE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
  });
}

async function requestValue(storeName, mode, action, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = action === "get" ? store.get(STATE_KEY) : store.put(value, STATE_KEY);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB request failed"));
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
  });
}

function localKey(kind) { return `ava:everbliss:${kind}:v1`; }
function safeParse(value) { try { return value ? JSON.parse(value) : null; } catch { return null; } }

export async function loadAppState() {
  try { return (await requestValue(STATE_STORE, "readonly", "get")) || null; }
  catch { return safeParse(globalThis.localStorage?.getItem(localKey("state"))); }
}

export async function saveAppState(state) {
  const record = { ...state, metadata: { schemaVersion: 1, updatedAt: new Date().toISOString() } };
  try { await requestValue(STATE_STORE, "readwrite", "put", record); }
  catch { globalThis.localStorage?.setItem(localKey("state"), JSON.stringify(record)); }
  return record;
}

export async function loadUserOverrides() {
  try { return (await requestValue(OVERRIDE_STORE, "readonly", "get")) || {}; }
  catch { return safeParse(globalThis.localStorage?.getItem(localKey("overrides"))) || {}; }
}

export async function saveUserOverrides(overrides) {
  const record = { ...overrides, metadata: { layer: "USER_OVERRIDE", schemaVersion: 1, updatedAt: new Date().toISOString() } };
  try { await requestValue(OVERRIDE_STORE, "readwrite", "put", record); }
  catch { globalThis.localStorage?.setItem(localKey("overrides"), JSON.stringify(record)); }
  return record;
}

export async function loadLastKnownGoodOfficial() {
  try { return (await requestValue(OFFICIAL_CACHE_STORE, "readonly", "get")) || null; }
  catch { return safeParse(globalThis.localStorage?.getItem(localKey("official-lkg"))); }
}

export async function saveLastKnownGoodOfficial(dataset) {
  const record = { ...dataset, cacheLayer: "LAST_KNOWN_GOOD_OFFICIAL", cachedAt: new Date().toISOString() };
  try { await requestValue(OFFICIAL_CACHE_STORE, "readwrite", "put", record); }
  catch { globalThis.localStorage?.setItem(localKey("official-lkg"), JSON.stringify(record)); }
  return record;
}

export async function loadLastKnownGoodProductConfig() {
  try { return safeParse(globalThis.localStorage?.getItem(localKey("product-config-lkg"))); }
  catch { return null; }
}

export async function saveLastKnownGoodProductConfig(config) {
  const record = { ...config, cacheLayer: "LAST_KNOWN_GOOD_PRODUCT_CONFIG", cachedAt: new Date().toISOString() };
  try { globalThis.localStorage?.setItem(localKey("product-config-lkg"), JSON.stringify(record)); } catch { /* built-in config remains available */ }
  return record;
}

export function createInitialState() {
  return {
    page: "home", journeyStep: "concern", concern: null,
    desiredMonthlySpending: 0, existingStableIncome: 0,
    totalRetirementAssets: 0, liquidReserve: 0, liquidReserveMode: "amount", liquidReserveMonths: 12,
    issueAge: 60, gender: "F", premiumHkd: 195000, scenarioReady: false, accumulation: "immediate",
    selectedFeature: null,
    selectedOutcomeView: "income", selectedPolicyYear: 1, selectedPolicyYearTouched: false,
    oala: { age: 65, household: "single", currentAssets: 0, currentMonthlyIncome: 0, surrenderProceeds: 0 },
    comparisonVisible: false
  };
}

export const storageKeys = Object.freeze({ DB_NAME, DB_VERSION, STATE_STORE, OVERRIDE_STORE, OFFICIAL_CACHE_STORE, STATE_KEY });
