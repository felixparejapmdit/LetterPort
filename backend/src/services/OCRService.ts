import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';

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
      // For PDFs, first attempt fast native text extraction from text streams
      const pdfText = await this.extractTextFromPdfDirectly(filePath);
      if (pdfText && pdfText.trim().length > 20) {
        return {
          text: pdfText.trim(),
          confidence: 95,
          pageCount: 1
        };
      }
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
