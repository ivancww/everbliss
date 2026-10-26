const validRate = value => Number.isFinite(Number(value)) && Number(value) > 0;

export async function resolveProductConfig({ endpoint = "", fetchImpl = globalThis.fetch, fallback = {} } = {}) {
  if (endpoint) {
    try {
      const url = new URL(endpoint);
      url.searchParams.set("action", "getProductConfig");
      const response = await fetchImpl(url.toString(), { method: "GET", cache: "no-store" });
      if (!response.ok) throw new Error("Product config request failed");
      const payload = await response.json();
      const productConfig = payload?.productConfig;
      const rate = Number(productConfig?.hkd_per_usd_calculation_rate);
      if (payload?.success === true && validRate(rate)) {
        return { productConfig, hkdPerUsd: rate, source: "VALID_CLOUD_PRODUCT_CONFIG" };
      }
    } catch { /* the configured release fallback remains available */ }
  }
  const fallbackRate = Number(fallback.hkd_per_usd_calculation_rate);
  return {
    productConfig: { ...fallback },
    hkdPerUsd: validRate(fallbackRate) ? fallbackRate : null,
    source: validRate(fallbackRate) ? "VERIFIED_BUILT_IN_CONFIG_FALLBACK" : "UNAVAILABLE"
  };
}
