import path from 'path';
import fs from 'fs';
import { Letter } from '../src/entities/Letter';
import { Attachment } from '../src/entities/Attachment';
import { OCRRecord } from '../src/entities/OCRRecord';
import { SqliteLetterRepository } from '../src/repositories/SqliteLetterRepository';
import { LocalStorageService } from '../src/services/StorageService';
import { MockOCRService } from '../src/services/OCRService';
import { LocalQueueService } from '../src/services/QueueService';
import { LetterService } from '../src/services/LetterService';

async function runTests() {
  console.log('--- Starting LetterPort OOP Unit & Integration Tests ---');
  const testDir = path.resolve('./tests/sandbox');
  const testDb = path.join(testDir, 'test.db');
  const testUploads = path.join(testDir, 'uploads');

  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  // 1. Entity Tests
  console.log('\n[1] Testing Letter Entity Validation & Encapsulation...');
  const letter = new Letter({
    id: 'test-1',
    referenceNumber: 'LP-IN-2026-0001',
    type: 'INCOMING',
    sender: 'Ministry of Finance',
    recipient: 'Executive Director',
    subject: 'Annual Fiscal Budget Allocation for 2026-2027',
    letterDate: '2026-03-01',
    receivedSentDate: '2026-03-02',
    tags: ['budget', 'finance']
  });

  if ((letter.status as string) !== 'RECEIVED') throw new Error(`Expected default status RECEIVED, got ${letter.status}`);
  letter.updateStatus('PROCESSED');
  if ((letter.status as string) !== 'PROCESSED') throw new Error('Failed to update letter status');
  letter.addTag('urgent');
  if (!letter.tags.includes('urgent')) throw new Error('Failed to add tag');
  console.log('✓ Letter entity tests passed.');

  // 2. Storage Service Tests
  console.log('\n[2] Testing LocalStorageService & Checksum Calculation...');
  const storage = new LocalStorageService(testUploads);
  const sampleContent = Buffer.from('CONFIDENTIAL OFFICIAL NOTICE: Fiscal Budget Approved.');
  const stored = await storage.saveBuffer(sampleContent, 'notice.txt', 'text/plain');
  if (!stored.checksum || stored.checksum.length !== 64) {
    throw new Error('Invalid SHA-256 checksum generated');
  }
  if (!fs.existsSync(stored.filePath)) {
    throw new Error('Stored file does not exist on disk');
  }
  console.log(`✓ StorageService verified (SHA-256: ${stored.checksum.substring(0, 16)}...).`);

  // 3. Repository & Full-Text Search Tests
  console.log('\n[3] Testing SqliteLetterRepository & Full-Text Search...');
  const repo = new SqliteLetterRepository(testDb);
  await repo.init();
  await repo.saveLetter(letter);

  const fetched = await repo.getLetterById('test-1');
  if (!fetched || fetched.subject !== letter.subject) {
    throw new Error('Repository failed to retrieve saved letter');
  }

  // Save attachment and OCR record
  const attachment = new Attachment({
    id: 'att-1',
    letterId: letter.id,
    originalName: 'notice.txt',
    storedFilename: stored.storedFilename,
    filePath: stored.filePath,
    mimeType: stored.mimeType,
    fileSize: stored.fileSize,
    checksum: stored.checksum
  });
  await repo.saveAttachment(attachment);

  const ocrRecord = new OCRRecord({
    id: 'ocr-1',
    letterId: letter.id,
    attachmentId: attachment.id,
    extractedText: 'We hereby confirm that the total allocation of $5,000,000 has been sanctioned.',
    confidence: 98,
    status: 'COMPLETED'
  });
  await repo.saveOCRRecord(ocrRecord);

  // Search by metadata
  const metaResults = await repo.searchLetters('Fiscal Budget');
  if (metaResults.length === 0) throw new Error('Metadata search failed to find match');
  console.log('✓ Metadata search returned match.');

  // Search by OCR extracted text
  const ocrResults = await repo.searchLetters('sanctioned');
  if (ocrResults.length === 0) throw new Error('OCR full-text search failed to find match');
  if (ocrResults[0].matchType !== 'OCR') throw new Error(`Expected matchType OCR, got ${ocrResults[0].matchType}`);
  console.log(`✓ OCR Full-Text search returned match: "${ocrResults[0].matchSnippet}"`);

  // Auto reference generation test
  const nextRef = await repo.generateNextReferenceNumber('INCOMING');
  if (!nextRef.startsWith('LP-IN-')) throw new Error(`Invalid generated reference: ${nextRef}`);
  console.log(`✓ Auto-reference generator verified: ${nextRef}`);

  // 4. LetterService End-to-End Test
  console.log('\n[4] Testing LetterService orchestration with OCR queue worker...');
  const mockOcr = new MockOCRService();
  const queue = new LocalQueueService();
  const letterService = new LetterService(repo, storage, mockOcr, queue);

  const created = await letterService.createLetter({
    type: 'OUTGOING',
    sender: 'LetterPort Office',
    recipient: 'City Council',
    subject: 'Quarterly Infrastructure Report & Audit',
    letterDate: '2026-03-05',
    receivedSentDate: '2026-03-05',
    priority: 'HIGH',
    file: {
      tempFilePath: '',
      originalName: 'report.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 Mock PDF Content')
    }
  });

  if (!created.letter.referenceNumber) throw new Error('Missing generated reference number');
  console.log(`✓ Letter created with ID: ${created.letter.id} and Ref: ${created.letter.referenceNumber}`);

  // Allow queue job to process
  await new Promise(r => setTimeout(r, 500));

  const refreshed = await letterService.getLetterDetails(created.letter.id);
  if (!refreshed?.ocrRecord || refreshed.ocrRecord.status !== 'COMPLETED') {
    throw new Error(`Expected OCR status COMPLETED, got ${refreshed?.ocrRecord?.status}`);
  }
  console.log(`✓ Background OCR worker extracted text: "${refreshed.ocrRecord.extractedText.split('\n')[0]}"`);

  // Stats test
  const stats = await letterService.getStats();
  if (stats.totalLetters !== 2) throw new Error(`Expected 2 letters, got ${stats.totalLetters}`);
  console.log(`✓ Dashboard stats verified (Total: ${stats.totalLetters}, Incoming: ${stats.incomingLetters}, Outgoing: ${stats.outgoingLetters}).`);

  // Clean up test sandbox
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch {}

  console.log('\n========================================');
  console.log(' ALL LETTERPORT BACKEND TESTS PASSED! 🎉');
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
