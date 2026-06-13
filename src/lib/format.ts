export function formatYen(amount: number): string {
  return amount.toLocaleString("ja-JP");
}

/** 例: 「〜1,200,000円/月」「800,000〜1,200,000円/月」 */
export function formatRateRange(min: number | null, max: number | null): string {
  if (min && max && min !== max) return `${formatYen(min)}〜${formatYen(max)}円/月`;
  if (max) return `〜${formatYen(max)}円/月`;
  if (min) return `${formatYen(min)}円/月〜`;
  return "応相談";
}

/** 月額単価から時間単価の目安（160h/月換算） */
export function hourlyFromMonthly(monthly: number): number {
  return Math.round(monthly / 160 / 10) * 10;
}

/** 例: 「週2日〜週4日」「週5日」 */
export function formatWeeklyDays(min: number, max: number): string {
  if (min === max) return `週${min}日`;
  return `週${min}日〜週${max}日`;
}

export function formatDesiredWeeklyDays(days: readonly number[] | null | undefined): string | null {
  if (!days || days.length === 0) return null;
  return [...days]
    .sort((a, b) => a - b)
    .map((day) => `週${day}日`)
    .join("・");
}

export function formatEngineerTitles(titles: readonly string[] | null | undefined): string | null {
  if (!titles || titles.length === 0) return null;
  return titles.join(" / ");
}

export function formatProjectLocation(
  location: string | null,
  prefecture: string | null,
): string | null {
  if (location && prefecture) return `${location}（${prefecture}）`;
  return location || prefecture || null;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}日前`;
  return formatDate(date);
}

export function isNew(date: Date, days = 7): boolean {
  return Date.now() - date.getTime() < days * 24 * 60 * 60 * 1000;
}
