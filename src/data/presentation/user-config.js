export const USER_CONFIG_SCHEMA = "everbliss-user-config-v1";

export const PRESENTATION_FIELDS = Object.freeze([
  { section: "HOME", path: "home.heroTitle", label: "主標題" },
  { section: "HOME", path: "home.heroSupport", label: "副標題" },
  { section: "HOME", path: "home.note", label: "首頁提示" },
  { section: "J01 CONCERN", path: "j01.lead", label: "頁面說明" },
  { section: "J01 CONCERN", path: "j01.concernChoices", label: "關注選項（每行一項）", type: "list" },
  { section: "J02 INCOME", path: "j02.explanation", label: "頁面說明" },
  { section: "J02 INCOME", path: "j02.spendingHelper", label: "生活費欄位提示" },
  { section: "J02 INCOME", path: "j02.existingIncomeHelper", label: "穩定收入欄位提示" },
  { section: "J02 INCOME", path: "j02.gapLabel", label: "退休收入差額文字" },
  { section: "J03 LIQUIDITY", path: "j03.explanation", label: "頁面說明" },
  { section: "J03 LIQUIDITY", path: "j03.amountVisible", label: "顯示金額選項", type: "boolean" },
  { section: "J03 LIQUIDITY", path: "j03.monthsVisible", label: "顯示生活費月數選項", type: "boolean" },
  { section: "J03 LIQUIDITY", path: "j03.unknownVisible", label: "顯示暫時未知選項", type: "boolean" },
  { section: "J03 LIQUIDITY", path: "j03.amountOrder", label: "金額選項次序", type: "number" },
  { section: "J03 LIQUIDITY", path: "j03.monthsOrder", label: "月數選項次序", type: "number" },
  { section: "J03 LIQUIDITY", path: "j03.unknownOrder", label: "未知選項次序", type: "number" },
  { section: "J03 LIQUIDITY", path: "j03.helper", label: "欄位提示" },
  { section: "J04 CONCEPT", path: "j04.explanation", label: "頁面說明" },
  { section: "J04 CONCEPT", path: "j04.beforeLabel", label: "退休前標籤" },
  { section: "J04 CONCEPT", path: "j04.afterLabel", label: "退休後標籤" },
  { section: "J04 CONCEPT", path: "j04.support", label: "補充說明" },
  { section: "J05 TIMING", path: "j05.explanation", label: "頁面說明" },
  { section: "J05 TIMING", path: "j05.immediateLabel", label: "即期安排標籤" },
  { section: "J05 TIMING", path: "j05.deferredLabel", label: "延期安排標籤" },
  { section: "J05 TIMING", path: "j05.helper", label: "時間提示" },
  { section: "J06 PLAN", path: "j06.explanation", label: "頁面說明" },
  { section: "J06 PLAN", path: "j06.premiumLabel", label: "保費欄位標籤" },
  { section: "J06 PLAN", path: "j06.helper", label: "保費欄位提示" },
  { section: "J07 RESULT", path: "j07.explanation", label: "頁面說明" },
  { section: "J07 RESULT", path: "j07.incomeTab", label: "收入分頁" },
  { section: "J07 RESULT", path: "j07.surrenderTab", label: "退保分頁" },
  { section: "J07 RESULT", path: "j07.deathTab", label: "身故分頁" },
  { section: "J07 RESULT", path: "j07.monthlyLabel", label: "每月金額標籤" },
  { section: "J07 RESULT", path: "j07.annualLabel", label: "每年金額標籤" },
  { section: "J07 RESULT", path: "j07.year8Extra", label: "第8年起額外收入文字" },
  { section: "J08 SUMMARY", path: "j08.title", label: "摘要標題" },
  { section: "J08 SUMMARY", path: "j08.lead", label: "摘要說明" },
  { section: "J08 SUMMARY", path: "j08.concernLabel", label: "關注項目標籤" },
  { section: "J08 SUMMARY", path: "j08.gapLabel", label: "退休差額標籤" },
  { section: "J08 SUMMARY", path: "j08.reserveLabel", label: "流動資金標籤" },
  { section: "J08 SUMMARY", path: "j08.assetsLabel", label: "退休資產標籤" },
  { section: "J08 SUMMARY", path: "j08.availableLabel", label: "可安排金額標籤" },
  { section: "J08 SUMMARY", path: "j08.timingLabel", label: "開始時間標籤" },
  { section: "J08 SUMMARY", path: "j08.cashflowLabel", label: "每月現金流標籤" },
  { section: "FEATURES", path: "features.title", label: "特點頁標題" },
  { section: "FEATURES", path: "features.description", label: "特點頁說明" },
  { section: "FEATURES", path: "features.F01.title", label: "F01 標題" },
  { section: "FEATURES", path: "features.F01.description", label: "F01 說明" },
  { section: "FEATURES", path: "features.F01.visible", label: "顯示 F01", type: "boolean" },
  { section: "FEATURES", path: "features.F01.order", label: "F01 順序", type: "number" },
  { section: "FEATURES", path: "features.F02.title", label: "F02 標題" },
  { section: "FEATURES", path: "features.F02.description", label: "F02 說明" },
  { section: "FEATURES", path: "features.F02.visible", label: "顯示 F02", type: "boolean" },
  { section: "FEATURES", path: "features.F02.order", label: "F02 順序", type: "number" },
  { section: "FEATURES", path: "features.F03.title", label: "F03 標題" },
  { section: "FEATURES", path: "features.F03.description", label: "F03 說明" },
  { section: "FEATURES", path: "features.F03.visible", label: "顯示 F03", type: "boolean" },
  { section: "FEATURES", path: "features.F03.order", label: "F03 順序", type: "number" },
  { section: "FEATURES", path: "features.F04.title", label: "F04 標題" },
  { section: "FEATURES", path: "features.F04.description", label: "F04 說明" },
  { section: "FEATURES", path: "features.F04.visible", label: "顯示 F04", type: "boolean" },
  { section: "FEATURES", path: "features.F04.order", label: "F04 順序", type: "number" },
  { section: "OALA", path: "oala.explanation", label: "OALA 說明" },
  { section: "OALA", path: "oala.sectionLabel", label: "OALA 區域標籤" },
  { section: "OALA", path: "oala.homeCardVisible", label: "首頁顯示 OALA 卡片", type: "boolean" }
]);

export const DEFAULT_USER_PRESENTATION = Object.freeze({
  "home.heroTitle": "將累積的財富，轉化成每月現金流",
  "home.heroSupport": "退休前累積財富；退休後，讓財富持續為你提供長糧。",
  "home.note": "計劃月入可能包括額外每月收入；額外收入並非保證。試算並非保單建議書、承保結果或政府資格確認。",
  "j01.lead": "先由你最在意的事情開始，暫時唔會作出產品建議。",
  "j01.concernChoices": ["活得耐，現金慢慢減少", "退休後每月收入唔穩定", "健康轉差增加生活負擔", "唔想將財務問題留俾家人"],
  "j02.explanation": "計算退休生活費扣除已有穩定收入後，仍需準備的每月退休收入。",
  "j02.spendingHelper": "例如日常開支、休閒和家庭支援。",
  "j02.existingIncomeHelper": "例如已安排的退休金或穩定租金；MPF 未安排成月入前不當作月入。",
  "j02.gapLabel": "每月需要補充的退休收入：",
  "j03.explanation": "先保留需要的流動資金，再考慮其餘資產點樣提供長期收入。",
  "j03.amountVisible": true, "j03.monthsVisible": true, "j03.unknownVisible": true, "j03.amountOrder": 1, "j03.monthsOrder": 2, "j03.unknownOrder": 3,
  "j03.helper": "先保留需要的流動資金，再考慮其餘資產點樣提供長期收入。",
  "j04.explanation": "退休前後，資產的用途會改變。年金其中一個作用，是將部分退休資產轉化成持續每月現金流。",
  "j04.beforeLabel": "退休前", "j04.afterLabel": "退休後",
  "j04.support": "退休收入期並非預設於某個退休年齡停止，實際支付按保單條款而定。",
  "j05.explanation": "按你需要收入的時間選擇；延後開始不代表一定更適合。",
  "j05.immediateLabel": "而家開始", "j05.deferredLabel": "5年後開始",
  "j05.helper": "而家開始：保證每月收入由保單第1個月開始。5年後開始：保證每月收入由第61個月開始。兩種安排由第85個月起可加入額外每月收入。",
  "j06.explanation": "輸入投保資料和計劃保費，看看可能的退休現金流情境。",
  "j06.premiumLabel": "投入年金保費（HKD）", "j06.helper": "以港元輸入計劃保費。",
  "j07.explanation": "滑動及選擇年齡，查看不同保單年度的安排。",
  "j07.incomeTab": "每年領取", "j07.surrenderTab": "退保價值", "j07.deathTab": "身故賠償",
  "j07.monthlyLabel": "/ 月", "j07.annualLabel": "每年", "j07.year8Extra": "已包括第8年起額外每月收入",
  "j08.title": "一個屬於你嘅退休現金流方向",
  "j08.lead": "可能適合，亦可能唔適合。這是一個討論起點，並非產品推薦或承保結果。",
  "j08.concernLabel": "你最關心", "j08.gapLabel": "每月需要補充的退休收入", "j08.reserveLabel": "保留流動資金",
  "j08.assetsLabel": "退休資產總額", "j08.availableLabel": "可考慮長期收入安排", "j08.timingLabel": "選擇開始時間", "j08.cashflowLabel": "每月現金流",
  "features.title": "計劃特點", "features.description": "按你想了解的部分逐一查看；功能適用條件以產品條款為準。",
  "features.F01.title": "健康額外收入", "features.F01.description": "了解指定健康情況下的額外每月收入。", "features.F01.visible": true, "features.F01.order": 1,
  "features.F02.title": "靈活／照顧安排", "features.F02.description": "了解收款安排與預支收入選項。", "features.F02.visible": true, "features.F02.order": 2,
  "features.F03.title": "身故／家庭安排", "features.F03.description": "看看已收取收入與第10保單年度的身故利益示例。", "features.F03.visible": true, "features.F03.order": 3,
  "features.F04.title": "增值服務", "features.F04.description": "查看非合約式的 RetireSmart Health Service 資訊。", "features.F04.visible": true, "features.F04.order": 4,
  "oala.explanation": "了解年金安排在長者生活津貼資產及入息審查下的處理方式。",
  "oala.sectionLabel": "年金安排前後初步試算", "oala.homeCardVisible": true
});

const allowed = new Map(PRESENTATION_FIELDS.map(field => [field.path, field]));
export function normalizeUserPresentationConfig(input) {
  if (input?.schema === USER_CONFIG_SCHEMA && input.schemaVersion !== undefined && input.schemaVersion !== 1) return { schema: USER_CONFIG_SCHEMA, schemaVersion: 1, layer: "USER_OVERRIDE", values: {} };
  const raw = input?.schema === USER_CONFIG_SCHEMA ? input.values : input?.values || input;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { schema: USER_CONFIG_SCHEMA, schemaVersion: 1, layer: "USER_OVERRIDE", values: {} };
  const values = {};
  for (const [key, value] of Object.entries(raw)) {
    const field = allowed.get(key);
    if (!field) continue;
    if (field.type === "boolean" && typeof value === "boolean") values[key] = value;
    else if (field.type === "number" && Number.isFinite(Number(value))) values[key] = Number(value);
    else if (field.type === "list" && Array.isArray(value)) values[key] = value.filter(item => typeof item === "string").slice(0, 20);
    else if (!field.type && typeof value === "string") values[key] = value.slice(0, 500);
  }
  if (!values["home.heroTitle"] && typeof input?.heroTitle === "string") values["home.heroTitle"] = input.heroTitle.slice(0, 500);
  if (!values["home.heroSupport"] && typeof input?.heroSupport === "string") values["home.heroSupport"] = input.heroSupport.slice(0, 500);
  return { schema: USER_CONFIG_SCHEMA, schemaVersion: 1, layer: "USER_OVERRIDE", values };
}

export function resolveUserPresentation(input) {
  const config = normalizeUserPresentationConfig(input);
  return { ...DEFAULT_USER_PRESENTATION, ...config.values };
}

export function updatePresentationValue(values, path, value) {
  if (!allowed.has(path)) throw new Error("Presentation field is not editable");
  return { ...values, [path]: value };
}

export function resetPresentationSection(values, section) {
  const paths = PRESENTATION_FIELDS.filter(field => field.section === section).map(field => field.path);
  return Object.fromEntries(Object.entries(values || {}).filter(([path]) => !paths.includes(path)));
}
