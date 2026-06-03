export const LINE_TYPES = ['dialogue', 'narrator'] as const;
export type LineTypeValue = (typeof LINE_TYPES)[number];

export const CHARACTER_PALETTE = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6',
  '#ef4444', '#10b981', '#3b82f6', '#f97316', '#06b6d4',
] as const;

export function colorForIndex(index: number): string {
  return CHARACTER_PALETTE[index % CHARACTER_PALETTE.length];
}
