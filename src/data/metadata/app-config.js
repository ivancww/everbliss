export const appIdentity = Object.freeze({
  appId: "everbliss",
  displayName: "EverBliss",
  deploymentStatus: "NOT_DEPLOYED",
  entryModes: Object.freeze({
    frontend: "?avaEntry=frontend",
    user: "?avaEntry=user",
    admin: "?avaEntry=admin"
  })
});
export const appCapabilities = Object.freeze({ frontend: true, user: true, admin: true });
export const appDefaults = Object.freeze({ showHongKongAnnuityComparison: false });
export const dataPrecedence = Object.freeze(["BUILT_IN_DEFAULT", "OFFICIAL", "USER_OVERRIDE"]);
export const fxConfig = Object.freeze({ currencyPair: "HKD/USD", rate: null, source: "USER_ENTERED", asOf: null });
