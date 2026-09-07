export { BrowserManager, parseCookiePayload } from "./browser.js";
export {
  BOSS_CITY_CODES,
  ZHILIAN_CITY_CODES,
  resolveBossCityCode,
  resolveZhilianCityCode,
  loadBossCityCodes,
} from "./city-codes.js";
export { captureJsonViaCdp, captureJsonViaPlaywright } from "./capture.js";
export { pageFetchJson, readBossZpToken, ensureHostPage } from "./page-api.js";
export { BossAdapter, buildBossSearchUrl } from "./boss/adapter.js";
export {
  isBossJobListUrl,
  mapBossListResponse,
  assertBossApiOk,
} from "./boss/mapper.js";
export { ZhilianAdapter, buildZhilianSearchUrl } from "./zhilian/adapter.js";
export {
  isZhilianSearchUrl,
  mapZhilianListResponse,
  extractZhilianList,
} from "./zhilian/mapper.js";
export {
  collectJobs,
  createAdapter,
  ApplyNotImplemented,
} from "./collect.js";
export type { CollectResult, ApplyPort } from "./collect.js";
export type { PlatformAdapter, JobRef } from "./types.js";
