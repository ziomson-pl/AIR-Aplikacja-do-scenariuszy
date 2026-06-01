import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

interface PdfLine {
  type: 'dialogue' | 'narrator';
  characterName?: string | null;
  text: string;
}

interface PdfProject {
  title: string;
  lines: PdfLine[];
}

@Injectable()
export class PdfService {
  async generatePdf(project: PdfProject): Promise<Buffer> {
    const html = this.buildHtml(project);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '2.5cm',
          bottom: '2.5cm',
          left: '3cm',
          right: '3cm',
        },
        printBackground: true,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private buildHtml(project: PdfProject): string {
    const linesHtml = project.lines
      .map((line) => {
        if (line.type === 'narrator') {
          return `
            <div class="narrator-block">
              <p class="narrator-text">(${this.escapeHtml(line.text)})</p>
            </div>`;
        } else {
          const charName = line.characterName
            ? this.escapeHtml(line.characterName.toUpperCase())
            : 'NIEZNANA POSTAĆ';
          return `
            <div class="dialogue-block">
              <p class="character-name">${charName}</p>
              <p class="dialogue-text">${this.escapeHtml(line.text)}</p>
            </div>`;
        }
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHtml(project.title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Courier Prime', 'Courier New', Courier, monospace;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
    }

    .page-title {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 3cm;
      padding-bottom: 0.5cm;
      border-bottom: 2px solid #000;
    }

    .dialogue-block {
      margin-bottom: 1.2em;
    }

    .character-name {
      text-align: center;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.2em;
    }

    .dialogue-text {
      margin-left: 2.5cm;
      margin-right: 2.5cm;
      text-align: left;
    }

    .narrator-block {
      margin-bottom: 1.2em;
      text-align: center;
    }

    .narrator-text {
      font-style: italic;
      text-align: center;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="page-title">${this.escapeHtml(project.title)}</div>
  ${linesHtml}
</body>
</html>`;
  }
}
