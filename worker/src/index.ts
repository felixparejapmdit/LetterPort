import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { createWorker } from 'tesseract.js';

dotenv.config();

const DB_PATH = path.resolve(process.env.DATABASE_FILE || '../backend/data/letterport.db');
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || '../backend/uploads');
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

    // Run Tesseract
    const worker = await createWorker(OCR_LANG);
    const { data } = await worker.recognize(fullFilePath);
    await worker.terminate();

    const text = data.text.replace(/\r\n/g, '\n').trim() || '(No readable text detected)';
    const confidence = Math.round(data.confidence) || 85;

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
