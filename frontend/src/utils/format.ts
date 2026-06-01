/** Human-friendly relative time in Polish ("2 godz. temu", "wczoraj", …). */
export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.round((Date.now() - then) / 1000);

  if (diffSec < 60) return 'przed chwilą';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min temu`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} godz. temu`;
  const diffDays = Math.round(diffHrs / 24);
  if (diffDays === 1) return 'wczoraj';
  if (diffDays < 7) return `${diffDays} dni temu`;

  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Polish pluralisation: picks singular / few / many form for a count.
 * e.g. pluralPl(n, ['słowo', 'słowa', 'słów']).
 */
export function pluralPl(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n);
  if (abs === 1) return forms[0];
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

/** Count words in a free-text string. */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
