/**
 * AVA - Everbliss production GAS backend.
 * Sheet presentation is Chinese; this API exposes English canonical keys.
 * Public cloud reads are independent from the app-owned calculation engine.
 *
 * Required Script Property: EVERBLISS_SHEET_ID
 * AVA Admin property: AVA_PLATFORM_ADMIN_ENDPOINT (Platform GAS Web App URL; no browser secret)
 */
const EB = Object.freeze({
  APP_ID: 'everbliss',
  ADMIN_CONTRACT: 'ava-admin-session-v1',
  BASE_PREMIUM_USD: 25000,
  SCHEMA_VERSION: 1,
  API_VERSION: '1.0.0',
  SESSION_TTL_MAX_SECONDS: 1800,
  SHEETS: Object.freeze({
    PRODUCT_CONFIG: '產品設定',
    INCOME: '系統_每年收入回報率',
    SURRENDER: '系統_退保價值倍數',
    DEATH: '系統_身故賠償倍數',
    SOURCES: '系統_官方資料來源',
    DATASET_META: '系統_數據版本',
    AUDIT: '系統_修改紀錄',
    VISIBLE_DATASET_META: '數據版本',
    VISIBLE_AUDIT: '修改紀錄'
  })
});

// One canonical-key → Sheet-header mapping. Never use display labels as API keys.
const F = Object.freeze({
  income: { record_id:'記錄編號',issue_age:'投保年齡',gender:'性別',mode:'收入模式',guaranteed_rate:'保證每年收入率',ng_rate_from_year8:'第8年起非保證收入率',total_rate_from_year8:'第8年起總收入率',source_type:'資料類型',source_file:'官方建議書',source_version:'建議書版本',verified_date:'核實日期',record_version:'記錄版本',updated_at:'更新時間' },
  surrender: { record_id:'記錄編號',issue_age:'投保年齡',gender:'性別',mode:'收入模式',policy_year:'保單年度',attained_age:'當時年齡',surrender_total_usd_25k:'US$25,000退保價值',surrender_multiplier:'退保價值倍數',source_type:'資料類型',source_file:'官方建議書',source_version:'建議書版本',verified_date:'核實日期',record_version:'記錄版本',updated_at:'更新時間' },
  death: { record_id:'記錄編號',issue_age:'投保年齡',gender:'性別',mode:'收入模式',policy_year:'保單年度',attained_age:'當時年齡',guaranteed_death_value_usd_25k:'保證身故價值',terminal_bonus_usd_25k:'終期紅利',death_total_usd_25k:'身故賠償總額',death_multiplier:'身故賠償倍數',source_type:'資料類型',source_file:'官方建議書',source_version:'建議書版本',verified_date:'核實日期',record_version:'記錄版本',updated_at:'更新時間' },
  sources: { source_id:'資料來源編號',filename:'檔案名稱',issue_age:'投保年齡',gender:'性別',mode:'收入模式',base_premium_usd:'官方基準保費（美元）',proposal_generator_version:'建議書產生器版本',table_type:'資料表類型',extraction_date:'擷取日期',verified_date:'核實日期',status:'狀態',notes:'備註' },
  meta: { dataset_name:'數據集名稱',dataset_version:'數據版本',schema_version:'架構版本',published_version:'已發布版本',status:'狀態',source_sha:'資料指紋',updated_at:'更新時間',published_at:'發布時間',published_by:'發布者' }
});

const CONFIG = Object.freeze({
  min_issue_age:['最小投保年齡','number'], max_issue_age:['最大投保年齡','number'],
  min_premium_usd:['最低保費（美元）','number'], max_premium_usd:['最高保費（美元）','number'],
  base_premium_usd:['官方計算基準保費','number'],
  hkd_per_usd_calculation_rate:['港元兌美元試算換算率','number'],
  deferred_guaranteed_start_month:['延期保證收入開始','numberFromText'],
  ng_income_start_month:['非保證收入開始','numberFromText'],
  health_extra_percentage:['健康額外收入比例','number'],
  health_extra_max_months:['健康額外收入最長','numberFromText'],
  default_income_scenario:['預設情境','scenario']
});

function doGet(e) {
  try { return json_(publicAction_(String(e?.parameter?.action || 'health'))); }
  catch (err) { return json_({success:false,error:safeError_(err)}); }
}
function doPost(e) {
  try {
    const body=JSON.parse(e?.postData?.contents || '{}');
    if (body.appId && body.appId!==EB.APP_ID) throw Error('APP_ID_MISMATCH');
    if (body.action==='exchangeAdminSession') return json_(exchangeAdminSession_(body));
    if (body.action==='getAdminOfficialDataset') return json_(adminGetDataset_(body));
    if (body.action==='publishDataset') return json_(adminPublish_(body));
    return json_(publicAction_(String(body.action || 'getOfficialDataset')));
  } catch (err) { return json_({success:false,error:safeError_(err)}); }
}

function publicAction_(action) {
  switch(action) {
    case 'health': return {success:true,appId:EB.APP_ID,service:'EverBliss Official Data API',mode:'PRODUCTION_BACKEND',spreadsheet:spreadsheet_().getName(),timestamp:new Date().toISOString()};
    case 'getProductConfig': return {success:true,productConfig:readProductConfig_()};
    case 'getDatasetMeta': return {success:true,datasetMeta:readDatasetMeta_()};
    case 'getIncomeRates': ensurePublished_(); return {success:true,incomeRates:readIncomeRates_()};
    case 'getSurrenderMultipliers': ensurePublished_(); return {success:true,surrenderMultipliers:readSurrender_()};
    case 'getDeathMultipliers': ensurePublished_(); return {success:true,deathMultipliers:readDeath_()};
    case 'getOfficialDataset': ensurePublished_(); validateDataset_(); return {success:true,dataset:buildDataset_()};
    case 'getHKAnnuityRates': return getHKAnnuityRates_();
    default: throw Error('ACTION_NOT_ALLOWED');
  }
}

function readProductConfig_() {
  const sheet=requireSheet_(EB.SHEETS.PRODUCT_CONFIG), values=sheet.getDataRange().getValues(), out={};
  Object.keys(CONFIG).forEach(key=>{
    const [label,type]=CONFIG[key], row=values.find((r,i)=>i>0 && text_(r[0])===label);
    if(!row) throw Error('PRODUCT_CONFIG_MISSING:'+key);
    let v=row[1];
    if(type==='number') v=number_(v);
    if(type==='numberFromText') v=numberFromText_(v);
    if(type==='scenario') v='withdrawn_income';
    out[key]=v;
  });
  return out;
}
function readIncomeRates_() {
  return readCanonicalIncomeRates_().map(r=>({record_id:'income-'+r.age+'-'+r.gender+'-'+r.mode,issue_age:r.age,gender:r.gender,mode:r.mode,guaranteed_rate:r.guaranteedRate,ng_rate_from_year8:r.nonGuaranteedRateFromYear8,total_rate_from_year8:r.totalRateFromYear8,source_type:r.sourceType,source_file:r.sourceFile,source_ages:r.sourceAges,source_version:'',verified_date:'',record_version:null,updated_at:''}));
}
function readSurrender_() {
  return readTable_(EB.SHEETS.SURRENDER).map(r=>({record_id:text_(r[F.surrender.record_id]),issue_age:number_(r[F.surrender.issue_age]),gender:gender_(r[F.surrender.gender]),mode:mode_(r[F.surrender.mode]),policy_year:number_(r[F.surrender.policy_year]),attained_age:number_(r[F.surrender.attained_age]),surrender_total_usd_25k:number_(r[F.surrender.surrender_total_usd_25k]),surrender_multiplier:number_(r[F.surrender.surrender_multiplier]),source_type:'OFFICIAL_PARSED',source_file:text_(r[F.surrender.source_file]),source_version:text_(r[F.surrender.source_version]),verified_date:date_(r[F.surrender.verified_date]),record_version:number_(r[F.surrender.record_version]),updated_at:date_(r[F.surrender.updated_at])}));
}
function readDeath_() {
  return readTable_(EB.SHEETS.DEATH).map(r=>({record_id:text_(r[F.death.record_id]),issue_age:number_(r[F.death.issue_age]),gender:gender_(r[F.death.gender]),mode:mode_(r[F.death.mode]),policy_year:number_(r[F.death.policy_year]),attained_age:number_(r[F.death.attained_age]),guaranteed_death_value_usd_25k:number_(r[F.death.guaranteed_death_value_usd_25k]),terminal_bonus_usd_25k:number_(r[F.death.terminal_bonus_usd_25k]),death_total_usd_25k:number_(r[F.death.death_total_usd_25k]),death_multiplier:number_(r[F.death.death_multiplier]),source_type:'OFFICIAL_PARSED',source_file:text_(r[F.death.source_file]),source_version:text_(r[F.death.source_version]),verified_date:date_(r[F.death.verified_date]),record_version:number_(r[F.death.record_version]),updated_at:date_(r[F.death.updated_at])}));
}
function readSources_() {
  return readTable_(EB.SHEETS.SOURCES).map(r=>({source_id:text_(r[F.sources.source_id]),filename:text_(r[F.sources.filename]),issue_age:number_(r[F.sources.issue_age]),gender:gender_(r[F.sources.gender]),mode:mode_(r[F.sources.mode]),base_premium_usd:number_(r[F.sources.base_premium_usd]),proposal_generator_version:text_(r[F.sources.proposal_generator_version]),table_type:text_(r[F.sources.table_type]),extraction_date:text_(r[F.sources.extraction_date]),verified_date:date_(r[F.sources.verified_date]),status:text_(r[F.sources.status]),notes:text_(r[F.sources.notes])}));
}
function readDatasetMeta_() {
  const rows=readTable_(EB.SHEETS.DATASET_META);
  if(!rows.length) throw Error('DATASET_META_EMPTY');
  const r=rows[0];
  const status=datasetStatus_(r[F.meta.status]);
  return {dataset_name:'everbliss-official',dataset_version:text_(r[F.meta.dataset_version]),schema_version:text_(r[F.meta.schema_version]),published_version:text_(r[F.meta.published_version]),status,source_sha:text_(r[F.meta.source_sha]),updated_at:date_(r[F.meta.updated_at]),published_at:date_(r[F.meta.published_at]),published_by:text_(r[F.meta.published_by])};
}
/**
 * Public income calculation source: AIA guaranteed appendix plus
 * proposal-backed totals and bracketed linear interpolation.
 * Legacy 36-row Admin intake stays untouched until a separate migration.
 */
function readCanonicalIncomeRates_() {
  const sheet = requireSheet_('AIA優悅年金_官方保證收入率');
  const values = sheet.getDataRange().getValues();
  const expected = ['投保年齡','性別','領取模式','保證每月收入（每US$1,000）','保證每年收入率（%）','預期總年收入率（%）','非保證年收入率（%）','數據類型','參考年齡','來源／方法'];
  if (values.length !== 145 || expected.some((h,i)=>text_(values[0][i])!==h)) throw Error('AIA_CANONICAL_SCHEMA_INVALID');
  const rates=[], seen=new Set();
  values.slice(1).forEach((r,i)=>{
    const age=Number(r[0]), gender=gender_(r[1]), mode=r[2]==='即時'?'immediate':mode_(r[2]);
    const guaranteed=r[4]===''?NaN:Number(r[4]), monthly=r[3]===''?NaN:Number(r[3]), total=r[5]===''?NaN:Number(r[5]), ng=r[6]===''?NaN:Number(r[6]);
    const key=age+'|'+gender+'|'+mode;
    if (!Number.isInteger(age)||age<40||age>75||seen.has(key)||!Number.isFinite(guaranteed)||guaranteed<=0||!Number.isFinite(monthly)||monthly<=0||
        Math.abs(guaranteed-monthly*1.2)>0.000001) throw Error('AIA_CANONICAL_ROW_INVALID:'+(i+2));
    seen.add(key);
    if(age<50) return; // no proposal brackets; existing app supports ages 50–75
    if(!Number.isFinite(total)||total<guaranteed||!Number.isFinite(ng)||ng<0||Math.abs(total-guaranteed-ng)>0.000001)
      throw Error('AIA_CANONICAL_INCOME_INVALID:'+(i+2));
    const source=text_(r[7]), sourceAges=source==='官方建議書'?[age]:text_(r[8]).split('–').map(Number);
    if(!['官方建議書','線性插值估算'].includes(source) || !text_(r[9]) || (source==='官方建議書' && Number(r[8])!==age) || (source==='線性插值估算' && (sourceAges.length!==2 || !sourceAges.every(Number.isInteger) || sourceAges[0]>=age || sourceAges[1]<=age || sourceAges[0]<50 || sourceAges[1]>75))) throw Error('AIA_CANONICAL_SOURCE_INVALID:'+(i+2));
    rates.push({age,gender,mode,guaranteedRate:guaranteed/100,
      nonGuaranteedRateFromYear8:(total-guaranteed)/100,totalRateFromYear8:total/100,
      sourceType:source==='官方建議書'?'OFFICIAL':'INTERPOLATED',
      sourceAges,
      sourceFile:source==='官方建議書'?text_(r[9]):''});
  });
  if(rates.length!==104) throw Error('AIA_CANONICAL_INCOME_COUNT_INVALID:'+rates.length);
  const byKey=new Map(rates.map(r=>[r.age+'|'+r.gender+'|'+r.mode,r]));
  rates.filter(r=>r.sourceType==='INTERPOLATED').forEach(r=>{
    const [low,high]=r.sourceAges, a=byKey.get(low+'|'+r.gender+'|'+r.mode), b=byKey.get(high+'|'+r.gender+'|'+r.mode);
    if(!a||!b||a.sourceType!=='OFFICIAL'||b.sourceType!=='OFFICIAL') throw Error('AIA_CANONICAL_ANCHOR_INVALID:'+r.age);
    const expected=a.totalRateFromYear8+(b.totalRateFromYear8-a.totalRateFromYear8)*(r.age-low)/(high-low);
    if(Math.abs(expected-r.totalRateFromYear8)>1e-8) throw Error('AIA_CANONICAL_INTERPOLATION_INVALID:'+r.age);
  });
  return rates;
}

function buildDataset_() {
  const surrender=readSurrender_(), death=readDeath_(), meta=readDatasetMeta_(), scenarios={};
  surrender.forEach(r=>{const k=scenarioKey_(r.issue_age,r.gender,r.mode); const s=scenarios[k]||(scenarios[k]={issueAge:r.issue_age,gender:r.gender,mode:r.mode,sourceType:'OFFICIAL_PARSED',sourceFile:r.source_file,years:{}}); const y=s.years[String(r.policy_year)]||(s.years[String(r.policy_year)]={attainedAge:r.attained_age}); y.surrenderMultiplier=r.surrender_multiplier; y.surrenderTotal=r.surrender_total_usd_25k;});
  death.forEach(r=>{const k=scenarioKey_(r.issue_age,r.gender,r.mode); const s=scenarios[k]||(scenarios[k]={issueAge:r.issue_age,gender:r.gender,mode:r.mode,sourceType:'OFFICIAL_PARSED',sourceFile:r.source_file,years:{}}); const y=s.years[String(r.policy_year)]||(s.years[String(r.policy_year)]={attainedAge:r.attained_age}); Object.assign(y,{deathMultiplier:r.death_multiplier,deathTotal:r.death_total_usd_25k,guaranteedDeathValue:r.guaranteed_death_value_usd_25k,terminalBonus:r.terminal_bonus_usd_25k});});
  return {schemaVersion:EB.SCHEMA_VERSION,datasetName:'everbliss-official',datasetVersion:meta.dataset_version,status:'PUBLISHED',sourceSha:meta.source_sha,updatedAt:meta.updated_at,incomeRates:{schemaVersion:EB.API_VERSION,datasetContract:'canonical-sheet-v1',basePremiumUsd:EB.BASE_PREMIUM_USD,rates:readCanonicalIncomeRates_()},multipliers:{schemaVersion:EB.API_VERSION,basePremiumUsd:EB.BASE_PREMIUM_USD,scenarios}};
}

function validateDataset_() {
  const surrender=readSurrender_(), death=readDeath_(), d=buildDataset_(), scenarios=d.multipliers.scenarios;
  if(d.incomeRates.rates.length!==104) throw Error('CANONICAL_INCOME_COUNT_INVALID');
  if(surrender.length!==1396) throw Error('SURRENDER_ROW_COUNT_INVALID:'+surrender.length);
  if(death.length!==1396) throw Error('DEATH_ROW_COUNT_INVALID:'+death.length);
  if(Object.keys(scenarios).length!==36) throw Error('SCENARIO_COUNT_INVALID');
  Object.keys(scenarios).forEach(k=>{const s=scenarios[k], n=100-s.issueAge; for(let p=1;p<=n;p++){const y=s.years[String(p)]; if(!y) throw Error('MISSING_YEAR:'+k+':'+p); if(y.attainedAge!==s.issueAge+p) throw Error('ATTAINED_AGE_INVALID:'+k+':'+p); if(!Number.isFinite(y.surrenderMultiplier)||!Number.isFinite(y.deathMultiplier)) throw Error('MULTIPLIER_INVALID:'+k+':'+p);}});
  surrender.forEach(r=>assertNear_(r.surrender_multiplier,r.surrender_total_usd_25k/EB.BASE_PREMIUM_USD,'SURRENDER_RECONCILIATION:'+r.record_id));
  death.forEach(r=>{if(Math.abs(r.death_total_usd_25k-r.guaranteed_death_value_usd_25k-r.terminal_bonus_usd_25k)>1) throw Error('DEATH_COMPONENT_RECONCILIATION:'+r.record_id); assertNear_(r.death_multiplier,r.death_total_usd_25k/EB.BASE_PREMIUM_USD,'DEATH_RECONCILIATION:'+r.record_id);});
  verifyRegression_(scenarios);
  return {success:true,incomeCount:d.incomeRates.rates.length,surrenderCount:surrender.length,deathCount:death.length,scenarioCount:Object.keys(scenarios).length};
}
function verifyRegression_(s) {
  const a=s['60M_immediate'].years['10'], b=s['60M_deferred'].years['10'], c=s['75M_immediate'].years['10'];
  [['60M immediate surrender',a.surrenderTotal,14210],['60M immediate surrender multiplier',a.surrenderMultiplier,.56840],['60M immediate guaranteed death',a.guaranteedDeathValue,15750],['60M immediate bonus',a.terminalBonus,4475],['60M immediate death',a.deathTotal,20225],['60M immediate death multiplier',a.deathMultiplier,.809],['60M deferred surrender',b.surrenderTotal,18002],['60M deferred surrender multiplier',b.surrenderMultiplier,.72008],['60M deferred death',b.deathTotal,25070],['60M deferred death multiplier',b.deathMultiplier,1.0028],['75M immediate death',c.deathTotal,15900],['75M immediate death multiplier',c.deathMultiplier,.636]].forEach(x=>assertNear_(x[1],x[2],x[0]));
}
function ensurePublished_(){const m=readDatasetMeta_();if(m.status!=='PUBLISHED'||!m.dataset_version||m.published_version!==m.dataset_version)throw Error('OFFICIAL_DATASET_NOT_PUBLISHED');if(!m.source_sha||m.source_sha!==computeSha_())throw Error('OFFICIAL_DATASET_FINGERPRINT_MISMATCH');}

// Browser-bound AVA proof is exchanged server-to-server with the current Platform contract.
// The browser receives only an opaque App session ID; the signed Platform proof stays in Script Cache.
function exchangeAdminSession_(body) {
  if(body.contract!==EB.ADMIN_CONTRACT||body.appId!==EB.APP_ID||!body.launchTicket||!body.launchNonce||!body.browserProof||!body.expiresAt) throw Error('ADMIN_PROOF_INCOMPLETE');
  const browserExpiry=Date.parse(body.expiresAt); if(!Number.isFinite(browserExpiry)||browserExpiry<=Date.now()) throw Error('ADMIN_PROOF_EXPIRED');
  const endpoint=PropertiesService.getScriptProperties().getProperty('AVA_PLATFORM_ADMIN_ENDPOINT');
  if(!endpoint) throw Error('AVA_PLATFORM_ADMIN_ENDPOINT_NOT_CONFIGURED');
  const response=UrlFetchApp.fetch(endpoint,{method:'post',contentType:'application/json',payload:JSON.stringify({action:'exchangeAdminSession',appId:EB.APP_ID,launchTicket:String(body.launchTicket),launchNonce:String(body.launchNonce),browserProof:String(body.browserProof)}),muteHttpExceptions:true});
  if(response.getResponseCode()<200||response.getResponseCode()>=300) throw Error('AVA_PLATFORM_EXCHANGE_HTTP_'+response.getResponseCode());
  let result; try{result=JSON.parse(response.getContentText());}catch(_){throw Error('AVA_PLATFORM_EXCHANGE_INVALID_JSON');}
  const expiresAt=Date.parse(result.expiresAt);
  // The browser proof is short-lived (the launch ticket window), while the
  // exchanged Platform session may live until the authenticated Admin session
  // expires. The Platform response is authoritative for session expiry.
  if(result.success!==true||result.appId!==EB.APP_ID||result.contract!==EB.ADMIN_CONTRACT||typeof result.adminSessionProof!=='string'||result.adminSessionProof.length<24||!Number.isFinite(expiresAt)||expiresAt<=Date.now()) throw Error('AVA_PLATFORM_EXCHANGE_DENIED');
  const lock=LockService.getScriptLock();if(!lock.tryLock(10000))throw Error('ADMIN_EXCHANGE_LOCK_BUSY');
  try{const sessionId=Utilities.getUuid(),ttl=Math.max(1,Math.min(EB.SESSION_TTL_MAX_SECONDS,Math.floor((expiresAt-Date.now())/1000)));if(ttl<1)throw Error('ADMIN_SESSION_EXPIRED');CacheService.getScriptCache().put('admin:'+sessionId,JSON.stringify({appId:EB.APP_ID,adminSessionProof:result.adminSessionProof,expiresAt:result.expiresAt}),ttl);return{success:true,appId:EB.APP_ID,adminAuthorized:true,contract:EB.ADMIN_CONTRACT,expiresAt:result.expiresAt,session:sessionId};}finally{lock.releaseLock();}
}
function verifyPlatformAdminSession_(adminSessionProof,operation,expectedExpiry) {
  if(!['official-read','official-write'].includes(operation))throw Error('ADMIN_OPERATION_NOT_ALLOWED');
  const endpoint=PropertiesService.getScriptProperties().getProperty('AVA_PLATFORM_ADMIN_ENDPOINT');if(!endpoint)throw Error('AVA_PLATFORM_ADMIN_ENDPOINT_NOT_CONFIGURED');
  const response=UrlFetchApp.fetch(endpoint,{method:'post',contentType:'application/json',payload:JSON.stringify({action:'verifyAdminSession',appId:EB.APP_ID,adminSessionProof,operation}),muteHttpExceptions:true});
  if(response.getResponseCode()<200||response.getResponseCode()>=300)throw Error('AVA_PLATFORM_VERIFY_HTTP_'+response.getResponseCode());
  let result;try{result=JSON.parse(response.getContentText());}catch(_){throw Error('AVA_PLATFORM_VERIFY_INVALID_JSON');}
  const expiry=Date.parse(result.expiresAt);
  if(result.success!==true||result.appId!==EB.APP_ID||result.operation!==operation||result.contract!==EB.ADMIN_CONTRACT||!Number.isFinite(expiry)||expiry<=Date.now()||expiry>Date.parse(expectedExpiry))throw Error('AVA_PLATFORM_SESSION_DENIED');
  return result;
}
function requireAdmin_(body,operation) {
  const id=String(body.session||''),raw=id&&CacheService.getScriptCache().get('admin:'+id);if(!raw)throw Error('ADMIN_SESSION_REQUIRED');
  const s=JSON.parse(raw);if(s.appId!==EB.APP_ID||Date.parse(s.expiresAt)<=Date.now())throw Error('ADMIN_SESSION_INVALID');
  verifyPlatformAdminSession_(s.adminSessionProof,operation,s.expiresAt);
  return {sessionId:id,appId:s.appId,expiresAt:s.expiresAt,subject:'AVA Admin'};
}
function adminGetDataset_(body) { const s=requireAdmin_(body,'official-read');return{success:true,appId:EB.APP_ID,adminAuthorized:true,contract:EB.ADMIN_CONTRACT,sessionExpiresAt:s.expiresAt,dataset:{productConfig:readProductConfig_(),incomeRates:readIncomeRates_(),canonicalIncomeRates:readCanonicalIncomeRates_(),surrenderMultipliers:readSurrender_(),deathMultipliers:readDeath_(),officialSources:readSources_(),datasetMeta:readDatasetMeta_(),auditLog:readAuditLog_()}}; }
function readAuditLog_() { const sh=requireSheet_(EB.SHEETS.AUDIT), rows=sh.getDataRange().getValues().slice(1).filter(r=>r.some(v=>v!==''&&v!==null)).slice(-200); return rows.map(r=>({timestamp:text_(r[0]),admin_session_id:text_(r[1]),operation:text_(r[2]),domain:text_(r[3]),record_id:text_(r[4]),old_value:text_(r[5]),new_value:text_(r[6]),dataset_version_before:text_(r[7]),dataset_version_after:text_(r[8]),source_sha:text_(r[9])})); }
function adminPublish_(body) { return withLock_(()=>{const s=requireAdmin_(body,'official-write');return publish_(body,s);}); }
function publish_(body,session) {
  const meta=readDatasetMeta_(); if(String(body.expected_dataset_version)!==String(meta.dataset_version)) return {success:false,status:'CONFLICT',currentDatasetVersion:meta.dataset_version};
  const changes=Array.isArray(body.changes)?body.changes:[]; validateChanges_(changes);
  const before=meta.dataset_version, next=incrementVersion_(before);
  const tx={entries:[],meta:snapshotMetaState_(),audit:snapshotAuditState_(),auditWriteAttempted:false};
  changes.forEach(c=>tx.entries.push({change:c,backup:prepareChange_(c)}));
  try {
    tx.entries.forEach(entry=>applyChange_(entry));
    validateDataset_(); const sha=computeSha_(), now=new Date().toISOString();
    updateMeta_({dataset_version:next,published_version:next,status:'PUBLISHED',source_sha:sha,updated_at:now,published_at:now,published_by:session.subject||EB.APP_ID});
    const check=readDatasetMeta_(); if(check.dataset_version!==next||check.status!=='PUBLISHED') throw Error('READ_AFTER_WRITE_FAILED');
    validateDataset_(); tx.auditWriteAttempted=true; appendAudit_(tx.entries,before,next,sha,session,tx.audit);
    return {success:true,status:'PUBLISHED',datasetVersion:next,sourceSha:sha,dataset:buildDataset_()};
  } catch(err) { rollbackPublish_(tx,err); throw err; }
}
function validateChanges_(changes) {
  const allow={product:['value'],income:['guaranteed_rate','ng_rate_from_year8','total_rate_from_year8'],surrender:['surrender_total_usd_25k','surrender_multiplier'],death:['guaranteed_death_value_usd_25k','terminal_bonus_usd_25k','death_total_usd_25k','death_multiplier'],sources:['status','notes']};
  changes.forEach(c=>{if(c.domain==='income') throw Error('INCOME_CANONICAL_SHEET_EDIT_REQUIRED'); if(!allow[c.domain]||!c.recordId||!allow[c.domain].includes(c.field)) throw Error('FIELD_NOT_ALLOWED'); if(['income','surrender','death'].includes(c.domain)){if(!c.sourceFile) throw Error('OFFICIAL_SOURCE_REQUIRED'); verifySource_(c.sourceFile);} const n=Number(c.newValue); if(!Number.isFinite(n)&&c.domain!=='sources') throw Error('OFFICIAL_VALUE_INVALID'); if((c.domain==='surrender'||c.domain==='death')&&n<0) throw Error('OFFICIAL_VALUE_INVALID'); if(c.domain==='income'&&(n<0||n>1)) throw Error('INCOME_RATE_INVALID');});
}
function verifySource_(filename) { const s=readSources_().find(x=>x.filename===filename); if(!s) throw Error('OFFICIAL_SOURCE_NOT_FOUND'); const v=String(s.status||''); if(!(v.indexOf('已核實')===0||v.toUpperCase().indexOf('VERIFIED')===0)) throw Error('OFFICIAL_SOURCE_NOT_VERIFIED'); if(!String(s.table_type).includes('支取每月入息')) throw Error('OFFICIAL_SOURCE_SCENARIO_INVALID'); }
function prepareChange_(c) {
  const setup={income:{sheet:EB.SHEETS.INCOME,fields:F.income},surrender:{sheet:EB.SHEETS.SURRENDER,fields:F.surrender},death:{sheet:EB.SHEETS.DEATH,fields:F.death},sources:{sheet:EB.SHEETS.SOURCES,fields:F.sources}}[c.domain];
  const sh=requireSheet_(setup?.sheet||EB.SHEETS.PRODUCT_CONFIG), vals=sh.getDataRange().getValues(), headers=vals[0].map(text_); let row=-1,col=-1;
  if(c.domain==='product'){const def=CONFIG[c.recordId]; if(!def) throw Error('PRODUCT_CONFIG_KEY_INVALID'); row=vals.findIndex((r,i)=>i>0&&text_(r[0])===def[0]); col=1;}
  else {const idHeader=c.domain==='sources'?F.sources.source_id:'記錄編號'; const idCol=headers.indexOf(idHeader); row=vals.findIndex((r,i)=>i>0&&String(r[idCol])===String(c.recordId)); col=headers.indexOf(setup.fields[c.field]);}
  if(row<1||col<0) throw Error('RECORD_NOT_FOUND');
  const rv=headers.indexOf('記錄版本'), ut=headers.indexOf('更新時間');
  return {sheet:sh.getName(),row:row+1,col:col+1,old:cloneCell_(vals[row][col]),rv:rv>=0?rv+1:null,oldRv:rv>=0?cloneCell_(vals[row][rv]):null,ut:ut>=0?ut+1:null,oldUt:ut>=0?cloneCell_(vals[row][ut]):null};
}
function applyChange_(entry) { const b=entry.backup, sh=requireSheet_(b.sheet), c=entry.change; sh.getRange(b.row,b.col).setValue(c.newValue); if(b.rv)sh.getRange(b.row,b.rv).setValue(Number(b.oldRv||0)+1); if(b.ut)sh.getRange(b.row,b.ut).setValue(new Date().toISOString()); }
function restoreChange_(b) { const sh=requireSheet_(b.sheet), errors=[]; [[b.col,b.old],[b.rv,b.oldRv],[b.ut,b.oldUt]].forEach(x=>{if(!x[0])return;try{sh.getRange(b.row,x[0]).setValue(x[1]);}catch(e){errors.push(safeError_(e));}}); if(errors.length)throw Error('DATA_ROW_RESTORE_FAILED:'+errors.join('|')); }
function snapshotSheetRow_(sheetName,required) { const sh=spreadsheet_().getSheetByName(sheetName); if(!sh){if(required)throw Error('SHEET_NOT_FOUND:'+sheetName);return null;} const width=sh.getLastColumn(); if(width<1){if(required)throw Error('SHEET_SCHEMA_EMPTY:'+sheetName);return null;} const rows=sh.getDataRange().getValues(); if(rows.length<2){if(required)throw Error('SHEET_DATA_ROW_MISSING:'+sheetName);return null;} return {sheet:sheetName,row:2,values:rows[1].slice(0,width).map(cloneCell_)}; }
function snapshotMetaState_() { return {system:snapshotSheetRow_(EB.SHEETS.DATASET_META,true),visible:snapshotSheetRow_(EB.SHEETS.VISIBLE_DATASET_META,false)}; }
function restoreMetaState_(snapshot) { const errors=[]; [snapshot.system,snapshot.visible].forEach(s=>{if(!s)return;try{restoreSheetRow_(s);}catch(e){errors.push(s.sheet+':'+safeError_(e));}}); if(errors.length)throw Error('META_RESTORE_FAILED:'+errors.join('|')); }
function restoreSheetRow_(snapshot) { const sh=requireSheet_(snapshot.sheet); sh.getRange(snapshot.row,1,1,snapshot.values.length).setValues([snapshot.values.map(cloneCell_)]); }
function verifySheetRow_(snapshot) { if(!snapshot)return true; const sh=requireSheet_(snapshot.sheet), actual=sh.getRange(snapshot.row,1,1,snapshot.values.length).getValues()[0]; return snapshot.values.every((v,i)=>sameCell_(v,actual[i])); }
function snapshotAuditState_() { return {hidden:snapshotAuditSheet_(EB.SHEETS.AUDIT),visible:snapshotAuditSheet_(EB.SHEETS.VISIBLE_AUDIT)}; }
function snapshotAuditSheet_(name) { const sh=spreadsheet_().getSheetByName(name); if(!sh)return null; return {sheet:name,lastRow:Math.max(1,sh.getLastRow()),width:Math.max(1,sh.getLastColumn())}; }
function restoreAuditState_(snapshot) { const errors=[]; [snapshot.hidden,snapshot.visible].forEach(s=>{if(!s)return;try{const sh=requireSheet_(s.sheet), last=sh.getLastRow(), start=s.lastRow+1; if(last>=start)sh.getRange(start,1,last-start+1,s.width).clearContent();}catch(e){errors.push(s.sheet+':'+safeError_(e));}}); if(errors.length)throw Error('AUDIT_RESTORE_FAILED:'+errors.join('|')); }
function verifyAuditState_(snapshot) { return [snapshot.hidden,snapshot.visible].every(s=>{if(!s)return true; const sh=requireSheet_(s.sheet), start=s.lastRow+1, last=sh.getLastRow(); if(last<start)return true; return sh.getRange(start,1,last-start+1,s.width).getValues().every(row=>row.every(v=>v===''||v===null));}); }
function rollbackPublish_(tx,original) { const errors=[]; if(tx.auditWriteAttempted)try{restoreAuditState_(tx.audit);}catch(e){errors.push('AUDIT:'+safeError_(e));} try{restoreMetaState_(tx.meta);}catch(e){errors.push('META:'+safeError_(e));} tx.entries.slice().reverse().forEach(e=>{try{restoreChange_(e.backup);}catch(err){errors.push('DATA:'+safeError_(err));}}); try{const systemOk=verifySheetRow_(tx.meta.system), visibleMetaOk=verifySheetRow_(tx.meta.visible), auditOk=verifyAuditState_(tx.audit); if(!systemOk)errors.push('SYSTEM_META_READBACK_MISMATCH'); if(!visibleMetaOk)errors.push('VISIBLE_META_READBACK_MISMATCH'); if(!auditOk)errors.push('AUDIT_READBACK_MISMATCH');}catch(e){errors.push('ROLLBACK_READBACK_ERROR:'+safeError_(e));} tx.entries.forEach(e=>{try{if(!verifyChangeRestored_(e.backup))errors.push('DATA_READBACK_MISMATCH:'+e.backup.sheet+':'+e.backup.row);}catch(err){errors.push('DATA_READBACK_ERROR:'+safeError_(err));}}); if(errors.length)throw Error('ROLLBACK_VERIFICATION_FAILED; original='+safeError_(original)+'; rollback='+errors.join(';')); }
function verifyChangeRestored_(b) { const sh=requireSheet_(b.sheet), ok=sameCell_(sh.getRange(b.row,b.col).getValues()[0][0],b.old)&&(!b.rv||sameCell_(sh.getRange(b.row,b.rv).getValues()[0][0],b.oldRv))&&(!b.ut||sameCell_(sh.getRange(b.row,b.ut).getValues()[0][0],b.oldUt)); return ok; }
function cloneCell_(v) { return v instanceof Date?new Date(v.getTime()):v; }
function sameCell_(a,b) { if(a instanceof Date&&b instanceof Date)return a.getTime()===b.getTime(); return a===b; }
function auditValue_(v) { return v===null||v===undefined?'':String(v); }
function appendAudit_(entries,before,after,sha,session,snapshot) { if(!entries.length)return; const now=new Date().toISOString(), hidden=requireSheet_(EB.SHEETS.AUDIT), visible=spreadsheet_().getSheetByName(EB.SHEETS.VISIBLE_AUDIT), hiddenRows=[], visibleRows=[]; entries.forEach(e=>{const c=e.change,b=e.backup,old=auditValue_(b.old),value=auditValue_(c.newValue); hiddenRows.push([now,session.sessionId,'publish:'+c.field,c.domain,c.recordId,old,value,before,after,sha]); if(visible)visibleRows.push([now,session.subject||session.sessionId,c.domain,c.recordId+' / '+c.field,old,value]);}); const hiddenStart=snapshot.hidden.lastRow+1; hidden.getRange(hiddenStart,1,hiddenRows.length,hiddenRows[0].length).setValues(hiddenRows); if(visible&&visibleRows.length){const visibleStart=snapshot.visible.lastRow+1; visible.getRange(visibleStart,1,visibleRows.length,visibleRows[0].length).setValues(visibleRows);} }
function updateMeta_(updates) { const sh=requireSheet_(EB.SHEETS.DATASET_META), vals=sh.getDataRange().getValues(), headers=vals[0].map(text_); Object.keys(updates).forEach(k=>{const c=headers.indexOf(F.meta[k]); if(c>=0){const v=k==='status'&&updates[k]==='PUBLISHED'?'已發布':updates[k]; sh.getRange(2,c+1).setValue(v);}}); syncVisibleMeta_(updates); }
function syncVisibleMeta_(updates) { const sh=spreadsheet_().getSheetByName(EB.SHEETS.VISIBLE_DATASET_META); if(!sh)return; const v=sh.getDataRange().getValues(); if(v.length<2)return; const h=v[0].map(text_), m={dataset_version:'版本',status:'狀態',updated_at:'更新日期'}; Object.keys(m).forEach(k=>{if(Object.hasOwn(updates,k)){const c=h.indexOf(m[k]);if(c>=0)sh.getRange(2,c+1).setValue(k==='status'?'已發布':updates[k]);}}); }
function computeSha_() { return sha256_(JSON.stringify({config:readProductConfig_(),income:readCanonicalIncomeRates_(),surrender:readSurrender_(),death:readDeath_(),sources:readSources_()})); }
function sha256_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s).map(b=>('0'+(((b+256)%256).toString(16))).slice(-2)).join(''); }
function incrementVersion_(v) { const s=String(v||''), a=s.match(/^(.*\bv)(\d+)$/); if(a)return a[1]+(Number(a[2])+1); const b=s.match(/^(\d+)\.(\d+)\.(\d+)$/); if(b)return `${b[1]}.${b[2]}.${Number(b[3])+1}`; throw Error('DATASET_VERSION_INVALID'); }

function verifyAndPublishPreparedDataset() { const validation=validateDataset_(), meta=readDatasetMeta_(), sha=computeSha_(), now=new Date().toISOString(); updateMeta_({dataset_version:meta.dataset_version,published_version:meta.dataset_version,status:'PUBLISHED',source_sha:sha,updated_at:now,published_at:now,published_by:'GAS_INITIAL_BOOTSTRAP'}); return {success:true,status:'PUBLISHED',datasetVersion:meta.dataset_version,sourceSha:sha,validation}; }
function testEverBlissConnection() { const validation=validateDataset_(), d=buildDataset_(), s=d.multipliers.scenarios; return {success:true,spreadsheet:spreadsheet_().getName(),spreadsheetId:spreadsheet_().getId(),validation,samples:{'60M_immediate_Y10':s['60M_immediate'].years['10'],'60M_deferred_Y10':s['60M_deferred'].years['10'],'75M_immediate_Y10':s['75M_immediate'].years['10']}}; }

function readTable_(name) { const sh=requireSheet_(name), v=sh.getDataRange().getValues(); if(!v.length)return []; const h=v[0].map(text_); return v.slice(1).filter(r=>r.some(x=>x!==''&&x!==null)).map(r=>{const o={};h.forEach((k,i)=>{if(k)o[k]=r[i];});return o;}); }
function spreadsheet_(){const id=PropertiesService.getScriptProperties().getProperty('EVERBLISS_SHEET_ID');if(!id)throw Error('EVERBLISS_SHEET_ID_NOT_CONFIGURED');return SpreadsheetApp.openById(id);}
function requireSheet_(n){const s=spreadsheet_().getSheetByName(n);if(!s)throw Error('SHEET_NOT_FOUND:'+n);return s;}
function withLock_(fn){const l=LockService.getScriptLock();if(!l.tryLock(10000))throw Error('WRITE_LOCK_BUSY');try{return fn();}finally{l.releaseLock();}}
function gender_(x){const v=text_(x);if(v==='男'||v==='M')return'M';if(v==='女'||v==='F')return'F';throw Error('INVALID_GENDER:'+v);}
function mode_(x){const v=text_(x);if(v==='即期'||v==='immediate')return'immediate';if(v==='延期'||v==='5年延期'||v==='5年遞延'||v==='deferred')return'deferred';throw Error('INVALID_MODE:'+v);}
function datasetStatus_(x){const v=text_(x);if(v==='已準備'||v==='PREPARED')return'PREPARED';if(v==='已發布'||v==='PUBLISHED')return'PUBLISHED';return v||'PREPARED';}
function scenarioKey_(a,g,m){return String(a)+g+'_'+m;}
function number_(x){if(typeof x==='number'&&Number.isFinite(x))return x;const n=Number(String(x||'').replace(/,/g,'').replace(/\$/g,'').replace(/%/g,'').trim());if(!Number.isFinite(n))throw Error('INVALID_NUMBER:'+x);return n;}
function numberFromText_(x){if(typeof x==='number')return x;const m=String(x||'').match(/-?\d+(?:\.\d+)?/);if(!m)throw Error('NUMBER_NOT_FOUND:'+x);return Number(m[0]);}
function text_(x){return x===null||x===undefined?'':String(x).trim();}
function date_(x){if(!x)return'';if(Object.prototype.toString.call(x)==='[object Date]')return Utilities.formatDate(x,'Asia/Hong_Kong',"yyyy-MM-dd'T'HH:mm:ssXXX");return String(x);}
function assertNear_(a,b,label){if(!Number.isFinite(a)||Math.abs(a-b)>1e-9)throw Error('REGRESSION_FAILED:'+label+':'+a+'!='+b);}
function safeError_(e){return String(e&&e.message||'INTERNAL_ERROR').slice(0,240);}
function json_(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);}

/**
 * Hong Kong Annuity — reference-only monthly payout and annual payout percentage.
 * Read-only: the EXISTING AVA - EverBliss Google Sheet, no additional tabs.
 * Not a current quotation or investment yield.
 */
function getHKAnnuityRates_() {
  const sheet = spreadsheet_().getSheetByName('香港年金_領取金額及百分比');
  if (!sheet) throw Error('HK_ANNUITY_SHEET_NOT_FOUND');
  const values = sheet.getDataRange().getValues().filter((r,i)=>i===0 || r.slice(0,4).some(v=>v!==''&&v!==null)).map(r=>r.slice(0,4));
  const headers = ['投保年齡', '性別', '每月領取金額（每HK$1,000,000）', '每年領取百分比（%）'];
  if (values.length !== 53 || values[0].length !== 4 ||
      headers.some((header, i) => String(values[0][i]).trim() !== header)) {
    throw Error('HK_ANNUITY_SCHEMA_INVALID');
  }
  const seen = new Set();
  const rates = values.slice(1).map((r, i) => {
    const issueAge = Number(r[0]);
    const gender = r[1] === '男' ? 'M' : r[1] === '女' ? 'F' : '';
    const monthlyPaymentHkd = Number(r[2]);
    const annualPayoutPercent = Number(r[3]);
    const key = issueAge + '-' + gender;
    if (!Number.isInteger(issueAge) || issueAge < 60 || issueAge > 85 ||
        !gender || !Number.isFinite(monthlyPaymentHkd) || monthlyPaymentHkd <= 0 ||
        !Number.isFinite(annualPayoutPercent) || annualPayoutPercent <= 0 ||
        seen.has(key)) throw Error('HK_ANNUITY_INVALID_ROW:' + (i + 2));
    if (Math.abs(annualPayoutPercent - monthlyPaymentHkd * 12 / 10000) > 0.0001) {
      throw Error('HK_ANNUITY_PERCENT_MISMATCH:' + key);
    }
    seen.add(key);
    return {issueAge, gender, referencePremiumHkd:1000000,
      monthlyPaymentHkd, annualPayoutPercent};
  });
  for (let age = 60; age <= 85; age++) {
    for (const gender of ['M', 'F']) {
      if (!seen.has(age + '-' + gender)) throw Error('HK_ANNUITY_MISSING_ROW');
    }
  }
  return {success:true, schemaVersion:1, product:'HK_ANNUITY',
    status:'REFERENCE_ONLY_NOT_CURRENT_VERIFIED',
    rateBasis:'HKD_1000000_SINGLE_PREMIUM',
    percentageMeaning:'ANNUAL_PAYOUT_TO_PREMIUM',
    count:rates.length, rates};
}

function testHKAnnuityRates() {
  const result = getHKAnnuityRates_();
  const male60 = result.rates.find(r => r.issueAge === 60 && r.gender === 'M');
  const female60 = result.rates.find(r => r.issueAge === 60 && r.gender === 'F');
  if (result.count !== 52 || male60?.monthlyPaymentHkd !== 5100 ||
      female60?.monthlyPaymentHkd !== 4700) throw Error('HK_ANNUITY_SMOKE_TEST_FAILED');
  Logger.log(JSON.stringify({success:true,count:result.count,male60,female60}));
  return result;
}
