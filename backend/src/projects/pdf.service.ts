import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { buildScreenplayHtml, PdfProject } from './pdf-template';

@Injectable()
export class PdfService {
  async generatePdf(project: PdfProject): Promise<Buffer> {
    const html = buildScreenplayHtml(project);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '2.5cm', bottom: '2.5cm', left: '3cm', right: '3cm' },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate:
          '<div style="width:100%;text-align:center;font-size:9px;color:#888;font-family:monospace;">' +
          '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
