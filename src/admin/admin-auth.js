export const AVA_ADMIN_CONTRACT = "ava-admin-session-v1";
export const EVERBLISS_APP_ID = "everbliss";
export const AVA_PLATFORM_ORIGIN = "https://ivancww.github.io";

export function validateAdminLaunchMessage({ event, opener, appId = EVERBLISS_APP_ID, launchTicket, launchNonce, now = Date.now(), platformOrigin = AVA_PLATFORM_ORIGIN }) {
  const data = event?.data;
  if (!opener || event?.source !== opener || event?.origin !== platformOrigin || !data) return false;
  if (data.type !== "ava-admin-session-response" || data.contract !== AVA_ADMIN_CONTRACT || data.appId !== appId) return false;
  if (!launchTicket || !launchNonce || data.launchTicket !== launchTicket || data.launchNonce !== launchNonce) return false;
  if (typeof data.browserProof !== "string" || data.browserProof.length < 16) return false;
  const expiry = Date.parse(data.expiresAt);
  return Number.isFinite(expiry) && expiry > now;
}

export async function establishAdminSession({ location, opener, postMessage, waitForProof, exchangeProof, now = Date.now() }) {
  const params = new URLSearchParams(location?.search || "");
  const launchTicket = params.get("avaAdminLaunch");
  const launchNonce = params.get("avaAdminLaunchNonce");
  if (!launchTicket || !launchNonce || !opener || typeof waitForProof !== "function" || typeof exchangeProof !== "function") return { authorized: false, reason: "ADMIN_LAUNCH_PROOF_REQUIRED" };
  const request = { type: "ava-admin-session-request", appId: EVERBLISS_APP_ID, launchTicket, launchNonce };
  const proofPromise = waitForProof({ timeoutMs: 30_000 });
  postMessage?.(request, AVA_PLATFORM_ORIGIN);
  const event = await proofPromise;
  if (!validateAdminLaunchMessage({ event, opener, launchTicket, launchNonce, now })) return { authorized: false, reason: "INVALID_OR_EXPIRED_ADMIN_PROOF" };
  // The AVA Platform's one-time browser proof must be exchanged by EverBliss's
  // server-side connector. The client never grants privilege based on URL/UI.
  const result = await exchangeProof({
    action: "exchangeAdminSession", appId: EVERBLISS_APP_ID,
    launchTicket, launchNonce, browserProof: event.data.browserProof,
    expiresAt: event.data.expiresAt, contract: AVA_ADMIN_CONTRACT
  });
  if (!result?.success || result.appId !== EVERBLISS_APP_ID || result.adminAuthorized !== true
    || result.contract !== AVA_ADMIN_CONTRACT || typeof result.session !== "string" || !result.session
    || !Number.isFinite(Date.parse(result.expiresAt)) || Date.parse(result.expiresAt) <= now) {
    return { authorized: false, reason: "SERVER_ADMIN_EXCHANGE_DENIED" };
  }
  return { authorized: true, expiresAt: result.expiresAt, session: result.session || null };
}

export function adminExchangeFromConfiguredEndpoint(endpoint, fetchImpl = globalThis.fetch) {
  return async proof => {
    if (!endpoint) throw new Error("EverBliss Admin Connector is not configured");
    const response = await fetchImpl(endpoint, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(proof), cache: "no-store"
    });
    if (!response.ok) throw new Error("EverBliss Admin authorization failed");
    return response.json();
  };
}

export function receiveAdminProof({ windowRef = globalThis.window, timeoutMs = 30_000 } = {}) {
  if (!windowRef?.opener) return Promise.reject(new Error("AVA Studio opener is required"));
  const opener = windowRef.opener;
  return new Promise((resolve, reject) => {
    const timer = windowRef.setTimeout(() => finish(null, new Error("AVA Admin browser proof expired")), timeoutMs);
    const listener = event => {
      if (validateAdminLaunchMessage({ event, opener, launchTicket: new URLSearchParams(windowRef.location.search).get("avaAdminLaunch"), launchNonce: new URLSearchParams(windowRef.location.search).get("avaAdminLaunchNonce") })) finish(event);
    };
    function finish(value, error) {
      windowRef.clearTimeout(timer); windowRef.removeEventListener("message", listener);
      if (error) reject(error); else resolve(value);
    }
    windowRef.addEventListener("message", listener);
  });
}
