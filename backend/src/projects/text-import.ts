/**
 * Parses a plain-text script into scenes and lines.
 * Supported formats:
 *   IMIĘ: kwestia          → dialogue line for that character
 *   NARRATOR: tekst        → narrator line
 *   INT./EXT. ...          → scene heading (starts a new scene)
 *   WNĘTRZE/PLENER ...     → scene heading (Polish convention)
 *   (zwykły tekst)         → narrator line if no character prefix found
 *
 * Returns { characterNames: string[], scenes: ParsedScene[] }
 */

export interface ParsedLine {
  type: 'dialogue' | 'narrator';
  characterName: string | null;
  text: string;
  parenthetical?: string | null;
}

export interface ParsedScene {
  heading: string;
  lines: ParsedLine[];
}

export interface ParsedImport {
  characterNames: string[];
  scenes: ParsedScene[];
}

export function parseImportText(rawText: string): ParsedImport {
  const rawLines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  const scenePattern = /^(INT\.|EXT\.|WNĘTRZE|PLENER|INT\/EXT)/i;
  // Match lines like "CHARACTER NAME: dialogue text" where name is all caps (Polish included)
  const dialoguePattern = /^([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻ\s]{0,40}):\s+(.+)/;

  const scenes: ParsedScene[] = [];
  const characterNames = new Set<string>();

  let currentScene: ParsedScene = { heading: 'SCENA 1', lines: [] };
  let hasStartedFirstScene = false;

  for (const rawLine of rawLines) {
    if (scenePattern.test(rawLine)) {
      if (hasStartedFirstScene) {
        scenes.push(currentScene);
      } else if (currentScene.lines.length > 0) {
        scenes.push(currentScene);
      }
      currentScene = { heading: rawLine.toUpperCase(), lines: [] };
      hasStartedFirstScene = true;
      continue;
    }

    const dialogueMatch = rawLine.match(dialoguePattern);
    if (dialogueMatch) {
      const [, name, text] = dialogueMatch;
      const trimmedName = name.trim();
      if (trimmedName.toUpperCase() === 'NARRATOR') {
        currentScene.lines.push({ type: 'narrator', characterName: null, text });
      } else {
        characterNames.add(trimmedName);
        currentScene.lines.push({ type: 'dialogue', characterName: trimmedName, text });
      }
    } else {
      currentScene.lines.push({ type: 'narrator', characterName: null, text: rawLine });
    }

    if (!hasStartedFirstScene) {
      hasStartedFirstScene = true;
    }
  }

  // Push the last scene
  if (currentScene.lines.length > 0 || scenes.length === 0) {
    scenes.push(currentScene);
  }

  return {
    characterNames: [...characterNames],
    scenes,
  };
}
