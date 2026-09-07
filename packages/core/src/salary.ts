/**
 * Parse Boss/Zhilian-like salary strings into monthly CNY bounds.
 * Examples: "30-60K·15薪", "15-25K", "8千-1.2万", "面议"
 */
export interface ParsedSalary {
  min: number | null;
  max: number | null;
  months: number | null;
}

export function parseSalary(raw: string | null | undefined): ParsedSalary {
  if (!raw || !raw.trim()) {
    return { min: null, max: null, months: null };
  }
  const text = raw.trim();
  if (/面议|薪资面议/.test(text)) {
    return { min: null, max: null, months: null };
  }

  let months: number | null = null;
  const monthsMatch = text.match(/[·・]\s*(\d+)\s*薪/);
  if (monthsMatch) months = Number(monthsMatch[1]);

  // 30-60K or 30K-60K
  const kRange = text.match(/(\d+(?:\.\d+)?)\s*[-~～]\s*(\d+(?:\.\d+)?)\s*[Kk千]/);
  if (kRange) {
    const unit = /[Kk]/.test(kRange[0]) || /千/.test(kRange[0]) ? 1000 : 1000;
    return {
      min: Math.round(Number(kRange[1]) * unit),
      max: Math.round(Number(kRange[2]) * unit),
      months,
    };
  }

  // 8千-1.2万
  const wanMix = text.match(
    /(\d+(?:\.\d+)?)\s*千\s*[-~～]\s*(\d+(?:\.\d+)?)\s*万/,
  );
  if (wanMix) {
    return {
      min: Math.round(Number(wanMix[1]) * 1000),
      max: Math.round(Number(wanMix[2]) * 10000),
      months,
    };
  }

  // 1-2万
  const wanRange = text.match(/(\d+(?:\.\d+)?)\s*[-~～]\s*(\d+(?:\.\d+)?)\s*万/);
  if (wanRange) {
    return {
      min: Math.round(Number(wanRange[1]) * 10000),
      max: Math.round(Number(wanRange[2]) * 10000),
      months,
    };
  }

  return { min: null, max: null, months };
}

export function parseRestPolicy(jd: string | null | undefined): {
  restPolicy: string | null;
  isDoubleOff: boolean | null;
} {
  if (!jd) return { restPolicy: null, isDoubleOff: null };
  if (/双休|周末双休|周六日休/.test(jd)) {
    return { restPolicy: "双休", isDoubleOff: true };
  }
  if (/大小周/.test(jd)) {
    return { restPolicy: "大小周", isDoubleOff: false };
  }
  if (/单休/.test(jd)) {
    return { restPolicy: "单休", isDoubleOff: false };
  }
  return { restPolicy: null, isDoubleOff: null };
}
