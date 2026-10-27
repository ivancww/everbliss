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

// A new canonical AVA launch resets only navigation, never customer inputs.
export function resetNavigationForAvaEntry(state, search) {
  const entry = new URLSearchParams(search).get('avaEntry');
  return ENTRY_SURFACES.includes(entry) ? { ...state, page: 'home', journeyStep: 'concern' } : state;
}
