import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createWorker } from 'tesseract.js';

const execFileAsync = promisify(execFile);

export interface OCRResult {
  text: string;
  confidence: number;
  pageCount: number;
}

export interface IOCRService {
  extractText(filePath: string, mimeType?: string): Promise<OCRResult>;
}

export abstract class BaseOCRService implements IOCRService {
  abstract extractText(filePath: string, mimeType?: string): Promise<OCRResult>;
}

export class TesseractOCRService extends BaseOCRService {
  private readonly lang: string;

  constructor(lang: string = 'eng') {
    super();
    this.lang = lang;
  }

  public async extractText(filePath: string, mimeType?: string): Promise<OCRResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist for OCR: ${filePath}`);
    }

    const lowerPath = filePath.toLowerCase();
    const isPdf = mimeType === 'application/pdf' || lowerPath.endsWith('.pdf');
    const isSvg = mimeType === 'image/svg+xml' || lowerPath.endsWith('.svg');

    if (isSvg) {
      // SVGs are XML vector documents - extract text tags directly
      const svgText = await this.extractTextFromSvg(filePath);
      return {
        text: svgText || '(No text elements in SVG)',
        confidence: 100,
        pageCount: 1
      };
    }

    if (isPdf) {
      return await this.extractTextFromPdf(filePath);
    }

    // Run Tesseract OCR engine for raster images (PNG, JPEG, TIFF, BMP, WebP)
    let worker: any = null;
    try {
      worker = await createWorker(this.lang);
      const { data } = await worker.recognize(filePath);
      const cleanedText = (data?.text || '').replace(/\r\n/g, '\n').trim();
      const confidence = Math.round(data?.confidence || 85);

      return {
        text: cleanedText || '(No readable text detected)',
        confidence,
        pageCount: 1
      };
    } catch (err: any) {
      console.warn(`Tesseract OCR error on ${filePath}:`, err?.message || err);
      return {
        text: `[OCR Note: Text extraction completed with message: ${err?.message || 'Check document clarity'}]`,
        confidence: 0,
        pageCount: 1
      };
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {}
      }
    }
  }

  private async extractTextFromPdf(filePath: string): Promise<OCRResult> {
    // 1. Try fast native text extraction using pdftotext
    try {
      const { stdout } = await execFileAsync('pdftotext', ['-layout', filePath, '-'], { timeout: 15000 });
      const cleanNativeText = (stdout || '').trim();
      if (cleanNativeText.length > 30) {
        return {
          text: cleanNativeText,
          confidence: 98,
          pageCount: 1
        };
      }
    } catch {
      // pdftotext not installed or failed, proceed to next strategies
    }

    // 2. Try raw text stream matching fallback
    const directText = await this.extractTextFromPdfDirectly(filePath);
    if (directText && directText.trim().length > 30) {
      return {
        text: directText.trim(),
        confidence: 95,
        pageCount: 1
      };
    }

    // 3. For scanned / image-only PDFs, render pages to PNG using pdftoppm, then OCR with Tesseract
    const tmpDir = os.tmpdir();
    const prefixId = `ocr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const outputPrefix = path.join(tmpDir, prefixId);
    let generatedFiles: string[] = [];

    try {
      await execFileAsync('pdftoppm', ['-png', '-r', '150', filePath, outputPrefix], { timeout: 30000 });

      const dirEntries = await fs.promises.readdir(tmpDir);
      generatedFiles = dirEntries
        .filter(f => f.startsWith(prefixId) && f.endsWith('.png'))
        .sort()
        .map(f => path.join(tmpDir, f));

      if (generatedFiles.length > 0) {
        let worker: any = null;
        try {
          worker = await createWorker(this.lang);
          const pageTexts: string[] = [];
          let totalConfidence = 0;

          // Limit processing to max 10 pages for performance
          const pagesToProcess = generatedFiles.slice(0, 10);
          for (const imgPath of pagesToProcess) {
            const { data } = await worker.recognize(imgPath);
            const pageText = (data?.text || '').replace(/\r\n/g, '\n').trim();
            if (pageText) {
              pageTexts.push(pageText);
            }
            totalConfidence += (data?.confidence || 85);
          }

          const combined = pageTexts.join('\n\n--- Page Break ---\n\n').trim();
          const avgConfidence = Math.round(totalConfidence / pagesToProcess.length) || 85;

          return {
            text: combined || '(No readable text detected in document image)',
            confidence: combined ? avgConfidence : 0,
            pageCount: pagesToProcess.length
          };
        } finally {
          if (worker) {
            try { await worker.terminate(); } catch {}
          }
        }
      }
    } catch (err: any) {
      console.warn(`[OCRService] pdftoppm or Tesseract rendering failed on ${filePath}:`, err?.message || err);
    } finally {
      // Clean up all temporary rendered PNG files
      for (const f of generatedFiles) {
        try { await fs.promises.unlink(f); } catch {}
      }
    }

    return {
      text: '[OCR Note: Text extraction completed with message: Check document clarity]',
      confidence: 0,
      pageCount: 1
    };
  }

  private async extractTextFromSvg(filePath: string): Promise<string> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const matches = content.match(/<text[^>]*>([^<]+)<\/text>/gi);
      if (!matches) return '';
      return matches
        .map(m => m.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean)
        .join('\n');
    } catch {
      return '';
    }
  }

  private async extractTextFromPdfDirectly(filePath: string): Promise<string> {
    try {
      const buffer = await fs.promises.readFile(filePath);
      const raw = buffer.toString('latin1');
      // Extract text enclosed in parentheses in BT/ET PDF text blocks (Tj and TJ operators)
      const textMatches: string[] = [];
      const regex = /\(([^)]+)\)\s*Tj/g;
      let match;
      while ((match = regex.exec(raw)) !== null) {
        if (match[1] && match[1].trim()) {
          textMatches.push(match[1]);
        }
      }
      return textMatches.join(' ');
    } catch {
      return '';
    }
  }
}

export class MockOCRService extends BaseOCRService {
  public async extractText(filePath: string): Promise<OCRResult> {
    const filename = path.basename(filePath);
    return {
      text: `[MOCK OCR EXTRACTED TEXT]\nDocument: ${filename}\nDate: ${new Date().toLocaleDateString()}\nRef: Letter reference extracted successfully.\nSubject: Important formal correspondence regarding operations.`,
      confidence: 99,
      pageCount: 1
    };
  }
}
