/**
 * Pick legal/full company name over brand short name.
 * Prefers names containing 公司/有限/集团/股份/合伙; otherwise longest candidate.
 */
export function pickCompanyFullName(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  const names = candidates
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  if (!names.length) return undefined;

  const legal = names.filter((n) =>
    /公司|有限|集团|股份|合伙|事务所|研究院|大学|医院/.test(n),
  );
  if (legal.length) {
    return legal.sort((a, b) => b.length - a.length)[0];
  }
  return names.sort((a, b) => b.length - a.length)[0];
}
