/**
 * Common Boss city codes. Full list can be refreshed from the live site later.
 * REQ-COLLECT-002
 */
export const BOSS_CITY_CODES: Record<string, string> = {
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
  青岛: "101120200",
  大连: "101070200",
  厦门: "101230200",
  合肥: "101220100",
  福州: "101230100",
  济南: "101120100",
  东莞: "101281600",
  佛山: "101280800",
  宁波: "101210400",
  无锡: "101190200",
  全国: "100010000",
};

/** Zhilian city ids commonly used in search (subset). */
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
  全国: "489",
};

export function resolveBossCityCode(cityName: string): string {
  const code = BOSS_CITY_CODES[cityName];
  if (!code) {
    throw new Error(
      `未知 Boss 城市「${cityName}」。可用: ${Object.keys(BOSS_CITY_CODES).join("、")}`,
    );
  }
  return code;
}

export function resolveZhilianCityCode(cityName: string): string {
  const code = ZHILIAN_CITY_CODES[cityName];
  if (!code) {
    throw new Error(
      `未知智联城市「${cityName}」。可用: ${Object.keys(ZHILIAN_CITY_CODES).join("、")}`,
    );
  }
  return code;
}
