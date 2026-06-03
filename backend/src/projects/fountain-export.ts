/**
 * Generates Fountain screenplay format (.fountain)
 * Spec: https://fountain.io/syntax
 */
export function buildFountainText(project: any): string {
  const lines: string[] = [];

  // Title page
  lines.push(`Title: ${project.title}`);
  lines.push(`Date: ${new Date().toLocaleDateString('pl-PL')}`);
  lines.push('');
  lines.push('===');
  lines.push('');

  for (const scene of project.scenes) {
    // Scene heading — must be ALL CAPS for Fountain to detect it
    lines.push(scene.heading.toUpperCase());
    lines.push('');

    for (const line of scene.lines) {
      if (line.type === 'narrator') {
        // Action line — plain text, no indent
        lines.push(line.text);
        lines.push('');
      } else {
        // Character cue — all caps
        lines.push(line.character?.name?.toUpperCase() ?? 'NIEZNANA POSTAĆ');
        if (line.parenthetical) {
          lines.push(`(${line.parenthetical})`);
        }
        // Dialogue
        lines.push(line.text);
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}
