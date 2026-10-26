export const ENTRY_SURFACES = Object.freeze(["frontend", "user", "admin"]);

export function resolveEntrySurface(search = "") {
  const value = new URLSearchParams(search).get("avaEntry");
  return ENTRY_SURFACES.includes(value) ? value : "frontend";
}

export function returnAvaUrl(surface) {
  if (surface === "user") return "https://ivancww.github.io/avaplatform/?avaSurface=user";
  if (surface === "admin") return "https://ivancww.github.io/avaplatform/?avaSurface=admin";
  return "https://ivancww.github.io/avaplatform/";
}
