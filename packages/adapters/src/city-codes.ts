import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Fallback subset if JSON missing. */
const FALLBACK_BOSS: Record<string, string> = {
  全国: "100010000",
  北京: "101010100",
  上海: "101020100",
  广州: "101280100",
  深圳: "101280600",
  杭州: "101210100",
  成都: "101270100",
  重庆: "101040100",
  武汉: "101200100",
  西安: "101110100",
  南京: "101190100",
  苏州: "101190400",
  天津: "101030100",
  长沙: "101250100",
  郑州: "101180100",
};

/** Zhilian city ids (BossHunter / public sou URLs). */
export const ZHILIAN_CITY_CODES: Record<string, string> = {
  北京: "530",
  上海: "538",
  广州: "763",
  深圳: "765",
  杭州: "653",
  成都: "801",
  重庆: "551",
  武汉: "736",
  西安: "854",
  南京: "635",
  苏州: "639",
  天津: "531",
  长沙: "749",
  郑州: "719",
  青岛: "703",
  大连: "600",
  厦门: "682",
  合肥: "664",
  福州: "681",
  济南: "702",
  东莞: "779",
  佛山: "768",
  宁波: "654",
  无锡: "636",
  全国: "489",
};

let bossCache: Record<string, string> | null = null;

export function loadBossCityCodes(): Record<string, string> {
  if (bossCache) return bossCache;
  const jsonPath = path.join(__dirname, "..", "data", "city_codes.json");
  try {
    const raw = fs.readFileSync(jsonPath, "utf8");
    bossCache = JSON.parse(raw) as Record<string, string>;
  } catch {
    bossCache = { ...FALLBACK_BOSS };
  }
  return bossCache;
}

export function resolveBossCityCode(cityName: string): string {
  const map = loadBossCityCodes();
  const code = map[cityName] ?? map[cityName.replace(/市$/, "")];
  if (!code) {
    throw new Error(
      `未知 Boss 城市「${cityName}」。可用示例: 重庆、北京、上海…`,
    );
  }
  return code;
}

export function resolveZhilianCityCode(cityName: string): string {
  const code =
    ZHILIAN_CITY_CODES[cityName] ??
    ZHILIAN_CITY_CODES[cityName.replace(/市$/, "")];
  if (!code) {
    throw new Error(
      `未知智联城市「${cityName}」。可用: ${Object.keys(ZHILIAN_CITY_CODES).join("、")}`,
    );
  }
  return code;
}

export const BOSS_CITY_CODES = new Proxy({} as Record<string, string>, {
  get(_t, prop: string) {
    return loadBossCityCodes()[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(loadBossCityCodes());
  },
  getOwnPropertyDescriptor(_t, prop) {
    const v = loadBossCityCodes()[prop as string];
    if (v === undefined) return undefined;
    return { configurable: true, enumerable: true, value: v };
  },
});
