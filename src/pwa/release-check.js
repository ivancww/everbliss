export function releaseDiffers(current, deployed) {
  return Boolean(deployed?.version && deployed?.buildId
    && (deployed.version !== current?.version || deployed.buildId !== current?.buildId));
}

export function claimForcedReload(targetBuild, currentBuild, storage) {
  if (!targetBuild || targetBuild === currentBuild) return false;
  const key = `everbliss:forced-update:${targetBuild}`;
  if (storage.getItem(key)) return false;
  storage.setItem(key, "1");
  return true;
}

export async function checkDeployedRelease({ current, registration, fetchImpl = globalThis.fetch, releaseUrl = "./release.json" } = {}) {
  try {
    const response = await fetchImpl(releaseUrl, { cache: "no-store" });
    if (!response.ok) return { checked: true, updateAvailable: false };
    const deployed = await response.json();
    if (!releaseDiffers(current, deployed)) return { checked: true, updateAvailable: false, deployed };
    await registration?.update?.();
    if (registration?.waiting) registration.waiting.postMessage({ type: "EVERBLISS_SKIP_WAITING" });
    return { checked: true, updateAvailable: true, deployed };
  } catch {
    return { checked: false, updateAvailable: false };
  }
}
