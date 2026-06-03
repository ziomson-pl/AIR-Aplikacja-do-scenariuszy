export interface PdfLine {
  type: 'dialogue' | 'narrator';
  characterName?: string | null;
  text: string;
  parenthetical?: string | null;
}

export interface PdfScene {
  heading: string;
  lines: PdfLine[];
}

export interface PdfProject {
  title: string;
  scenes: PdfScene[];
}

/** Escape a raw string so it is safe to interpolate into HTML. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderLine(line: PdfLine): string {
  const text = escapeHtml(line.text);

  if (line.type === 'narrator') {
    return `<div class="narrator-block"><p class="narrator-text">(${text})</p></div>`;
  }

  const charName = line.characterName
    ? escapeHtml(line.characterName.toUpperCase())
    : 'NIEZNANA POSTAĆ';
  const parentheticalHtml =
    line.parenthetical
      ? `<p class="parenthetical">(${escapeHtml(line.parenthetical)})</p>`
      : '';
  return `<div class="dialogue-block"><p class="character-name">${charName}</p>${parentheticalHtml}<p class="dialogue-text">${text}</p></div>`;
}

/**
 * Build a complete, self-contained HTML document laid out as a screenplay.
 * Pure function (no Puppeteer) so it can be unit-tested directly.
 */
export function buildScreenplayHtml(project: PdfProject): string {
  const title = escapeHtml(project.title);
  const today = new Date().toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const scenesHtml = project.scenes
    .map((scene) => {
      const headingHtml = `<div class="scene-block"><p class="scene-heading">${escapeHtml(scene.heading.toUpperCase())}</p></div>`;
      const linesHtml = scene.lines.map(renderLine).join('\n');
      return headingHtml + '\n' + linesHtml;
    })
    .join('\n');

  const body =
    project.scenes.length === 0
      ? '<p class="empty-note">Scenariusz nie zawiera jeszcze żadnych kwestii.</p>'
      : scenesHtml;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Courier Prime', 'Courier New', Courier, monospace;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
    }

    .title-page {
      text-align: center;
      page-break-after: always;
      padding-top: 9cm;
    }
    .title-page h1 {
      font-size: 24pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .title-page .subtitle {
      margin-top: 1.2cm;
      font-size: 12pt;
      color: #444;
    }

    .scene-block { margin: 1.4em 0 0.8em; }
    .scene-heading {
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .dialogue-block { margin-bottom: 1.1em; }
    .character-name {
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.15em;
    }
    .parenthetical {
      text-align: center;
      font-style: italic;
      margin-bottom: 0.15em;
    }
    .dialogue-text {
      margin-left: 2.5cm;
      margin-right: 2.5cm;
    }

    .narrator-block { margin-bottom: 1.1em; text-align: center; }
    .narrator-text { font-style: italic; color: #333; }

    .empty-note { text-align: center; font-style: italic; color: #888; margin-top: 4cm; }
  </style>
</head>
<body>
  <section class="title-page">
    <h1>${title}</h1>
    <p class="subtitle">Scenariusz · ${escapeHtml(today)}</p>
  </section>
  ${body}
</body>
</html>`;
}
