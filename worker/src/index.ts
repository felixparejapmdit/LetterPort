import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sqlite3 from 'sqlite3';
import { createWorker } from 'tesseract.js';

const execFileAsync = promisify(execFile);

dotenv.config();

const DB_PATH = path.resolve(process.env.DATABASE_FILE || '../backend/data/letterport.db');
const STORAGE_DIR = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : fs.existsSync('/app/documents')
    ? '/app/documents'
    : path.resolve('../letterport_data');
const OCR_LANG = process.env.OCR_LANGUAGE || 'eng';
const POLL_INTERVAL_MS = 3000;

console.log('=================================================');
console.log('  LetterPort Dedicated OCR Background Worker     ');
console.log(`  Database: ${DB_PATH}`);
console.log(`  Storage:  ${STORAGE_DIR}`);
console.log(`  Language: ${OCR_LANG}`);
console.log('=================================================');

let isProcessing = false;

function getDb(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

async function extractTextFromAttachment(filePath: string, mimeType?: string): Promise<{ text: string; confidence: number }> {
  const lowerPath = filePath.toLowerCase();
  const isPdf = mimeType === 'application/pdf' || lowerPath.endsWith('.pdf');

  if (isPdf) {
    // 1. Try fast pdftotext
    try {
      const { stdout } = await execFileAsync('pdftotext', ['-layout', filePath, '-'], { timeout: 15000 });
      const cleanNative = (stdout || '').trim();
      if (cleanNative.length > 30) {
        return { text: cleanNative, confidence: 98 };
      }
    } catch {}

    // 2. Render pages to PNG using pdftoppm
    const tmpDir = os.tmpdir();
    const prefixId = `worker_ocr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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
          worker = await createWorker(OCR_LANG);
          const pageTexts: string[] = [];
          let totalConfidence = 0;

          const pagesToProcess = generatedFiles.slice(0, 10);
          for (const imgPath of pagesToProcess) {
            const { data } = await worker.recognize(imgPath);
            const pageText = (data?.text || '').replace(/\r\n/g, '\n').trim();
            if (pageText) pageTexts.push(pageText);
            totalConfidence += (data?.confidence || 85);
          }

          const combined = pageTexts.join('\n\n--- Page Break ---\n\n').trim();
          const avgConfidence = Math.round(totalConfidence / pagesToProcess.length) || 85;

          return {
            text: combined || '(No readable text detected in document image)',
            confidence: combined ? avgConfidence : 0
          };
        } finally {
          if (worker) {
            try { await worker.terminate(); } catch {}
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Worker] pdftoppm or Tesseract rendering failed on ${filePath}:`, err?.message || err);
    } finally {
      for (const f of generatedFiles) {
        try { await fs.promises.unlink(f); } catch {}
      }
    }
  }

  // Standard image recognition with Tesseract
  let worker: any = null;
  try {
    worker = await createWorker(OCR_LANG);
    const { data } = await worker.recognize(filePath);
    const cleanedText = (data?.text || '').replace(/\r\n/g, '\n').trim();
    const confidence = Math.round(data?.confidence || 85);
    return {
      text: cleanedText || '(No readable text detected)',
      confidence
    };
  } finally {
    if (worker) {
      try { await worker.terminate(); } catch {}
    }
  }
}

async function processPendingOCR() {
  if (isProcessing) return;
  if (!fs.existsSync(DB_PATH)) return;

  isProcessing = true;
  let db: sqlite3.Database | null = null;

  try {
    db = await getDb();

    // Query pending OCR job
    const row = await new Promise<any>((resolve, reject) => {
      db!.get(
        `SELECT o.id as ocr_id, o.letter_id, a.id as att_id, a.file_path, a.original_name, a.mime_type
         FROM ocr_records o
         JOIN attachments a ON a.id = o.attachment_id
         WHERE o.status = 'PENDING'
         ORDER BY o.id ASC LIMIT 1`,
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        }
      );
    });

    if (!row) {
      isProcessing = false;
      db.close();
      return;
    }

    console.log(`[Worker] Found pending OCR job ${row.ocr_id} for Letter ${row.letter_id}...`);

    // Mark as PROCESSING
    await new Promise((resolve, reject) => {
      db!.run(`UPDATE ocr_records SET status = 'PROCESSING' WHERE id = ?`, [row.ocr_id], (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });

    const fullFilePath = path.isAbsolute(row.file_path) ? row.file_path : path.join(STORAGE_DIR, path.basename(row.file_path));

    if (!fs.existsSync(fullFilePath)) {
      throw new Error(`Attachment file does not exist on disk: ${fullFilePath}`);
    }

    const { text, confidence } = await extractTextFromAttachment(fullFilePath, row.mime_type);

    // Update to COMPLETED
    await new Promise((resolve, reject) => {
      db!.run(
        `UPDATE ocr_records SET 
          status = 'COMPLETED',
          extracted_text = ?,
          confidence = ?,
          processed_at = ?,
          error_message = NULL
        WHERE id = ?`,
        [text, confidence, new Date().toISOString(), row.ocr_id],
        (err) => {
          if (err) reject(err);
          else resolve(null);
        }
      );
    });

    console.log(`[Worker] Successfully completed OCR for record ${row.ocr_id} (Confidence: ${confidence}%)`);
  } catch (err: any) {
    console.error(`[Worker] Error processing OCR record:`, err?.message || err);
  } finally {
    if (db) {
      db.close();
    }
    isProcessing = false;
  }
}

// Polling interval loop
setInterval(() => {
  processPendingOCR().catch(console.error);
}, POLL_INTERVAL_MS);

console.log(`[Worker] Polling for OCR tasks every ${POLL_INTERVAL_MS}ms...`);
