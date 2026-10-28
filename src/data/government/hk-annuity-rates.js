/** Reference-only HKMC example, delivered through the existing EverBliss GAS v4 endpoint. */
export function validateHKAnnuityRates(payload) {
  if (payload?.success !== true || payload.schemaVersion !== 1 ||
      payload.product !== "HK_ANNUITY" ||
      payload.status !== "REFERENCE_ONLY_NOT_CURRENT_VERIFIED" ||
      payload.rateBasis !== "HKD_1000000_SINGLE_PREMIUM" ||
      payload.percentageMeaning !== "ANNUAL_PAYOUT_TO_PREMIUM" ||
      payload.count !== 52 || !Array.isArray(payload.rates) || payload.rates.length !== 52) return null;
  const keys = new Set();
  for (const r of payload.rates) {
    const key = r.issueAge + "-" + r.gender;
    if (!Number.isInteger(r.issueAge) || r.issueAge < 60 || r.issueAge > 85 ||
        !["M", "F"].includes(r.gender) || r.referencePremiumHkd !== 1000000 ||
        !Number.isFinite(r.monthlyPaymentHkd) || r.monthlyPaymentHkd <= 0 ||
        !Number.isFinite(r.annualPayoutPercent) || r.annualPayoutPercent <= 0 ||
        Math.abs(r.annualPayoutPercent - r.monthlyPaymentHkd * 12 / 10000) > 0.0001 ||
        keys.has(key)) return null;
    keys.add(key);
  }
  for (let age = 60; age <= 85; age++) for (const gender of ["M", "F"]) {
    if (!keys.has(age + "-" + gender)) return null;
  }
  return payload.rates;
}

export async function fetchHKAnnuityRates(endpoint, fetchImpl = globalThis.fetch) {
  if (!endpoint) return null;
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST", headers: {"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify({action:"getHKAnnuityRates",appId:"everbliss"}),
      cache: "no-store"
    });
    if (!response.ok) return null;
    return validateHKAnnuityRates(await response.json());
  } catch { return null; }
}

export function selectHKAnnuityReference(rates, {issueAge, gender, premiumHkd}) {
  // HKMC source is a HK$1m example only. Never assume arbitrary-premium scaling.
  if (!Array.isArray(rates) || Number(premiumHkd) !== 1000000) return null;
  return rates.find(r => r.issueAge === Number(issueAge) && r.gender === gender) || null;
}

export function validateHKAnnuityValues(payload, rates) {
  if(payload?.success!==true||payload.schemaVersion!==1||payload.status!=='OWNER_SUPPLIED_REFERENCE_NOT_POLICY_QUOTE'||!Array.isArray(payload.observations)||!Array.isArray(rates)) return null;
  const seen=new Set();
  for(const r of payload.observations){
    const key=`${r.issueAge}|${r.gender}|${r.policyYear}`, rate=rates.find(x=>x.issueAge===r.issueAge&&x.gender===r.gender);
    if(![60,65].includes(r.issueAge)||!['M','F'].includes(r.gender)||!Number.isInteger(r.policyYear)||r.policyYear<1||r.issueAge+r.policyYear>100||!rate||!Number.isFinite(r.cashValueHkd)||r.cashValueHkd<0||!Number.isFinite(r.deathBenefitHkd)||seen.has(key))return null;
    const cumulative=rate.monthlyPaymentHkd*12*r.policyYear, expected=cumulative>=1050000?0:Math.max(r.cashValueHkd,1000000-cumulative);
    if(r.deathBenefitHkd!==expected||(cumulative>=1050000&&r.cashValueHkd!==0))return null;seen.add(key);
  }
  for(const age of [60,65])for(const gender of ['M','F'])for(let y=1;y<=100-age;y++)if(!seen.has(`${age}|${gender}|${y}`))return null;
  return payload.observations;
}
export async function fetchHKAnnuityValues(endpoint,rates,fetchImpl=globalThis.fetch){
  if(!endpoint||!rates)return null;try{const r=await fetchImpl(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'getHKAnnuityValues',appId:'everbliss'}),cache:'no-store'});return r.ok?validateHKAnnuityValues(await r.json(),rates):null;}catch{return null;}
}
export function compareHKAnnuity(rates,values,{issueAge,gender,premiumHkd,policyYear}){
  const age=Number(issueAge), premium=Number(premiumHkd), year=Number(policyYear);
  if(!Number.isInteger(age)||age<60||age>85)return {status:'INELIGIBLE'};
  if(!Number.isFinite(premium)||premium<500000||premium>5000000||!Number.isInteger(year)||year<1||age+year>100)return {status:'UNAVAILABLE'};
  const rate=rates?.find(r=>r.issueAge===age&&r.gender===gender);if(!rate)return {status:'UNAVAILABLE'};
  const monthly=rate.monthlyPaymentHkd*premium/1000000, cumulative=monthly*12*year;
  const observation=values?.find(v=>v.issueAge===age&&v.gender===gender&&v.policyYear===year);
  const death=cumulative>=premium*1.05?0:observation?Math.max(Math.round(observation.cashValueHkd*premium/1000000),Math.round(premium-cumulative)):null;
  return {status:'MODEL',monthly,cumulative,death,reference:premium===1000000};
}
