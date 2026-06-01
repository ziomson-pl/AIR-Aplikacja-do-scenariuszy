/** Line kinds supported by the screenplay editor. */
export const LINE_TYPES = ['dialogue', 'narrator', 'scene'] as const;
export type LineTypeValue = (typeof LINE_TYPES)[number];

/**
 * Distinct, reasonably accessible accent colours assigned to characters as
 * they are created. Cycled by index so a project's first ten characters all
 * get a unique colour.
 */
export const CHARACTER_PALETTE = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f97316', // orange
  '#06b6d4', // cyan
] as const;

/** Pick the next palette colour for a character at the given index. */
export function colorForIndex(index: number): string {
  return CHARACTER_PALETTE[index % CHARACTER_PALETTE.length];
}
