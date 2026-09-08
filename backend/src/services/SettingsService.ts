import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ILetterRepository } from '../repositories/ILetterRepository';
import { LocalStorageService } from './StorageService';
import { Letter } from '../entities/Letter';
import { Attachment } from '../entities/Attachment';
import { OCRRecord } from '../entities/OCRRecord';

export interface SystemInfo {
  version: string;
  edition: string;
  architecture: string;
  storageMode: string;
  storageDirectory: string;
  updateStatus: string;
}

export interface StorageInfo {
  storageDirectory: string;
  databasePath: string;
  databaseSizeBytes: number;
  totalLetters: number;
}

export class SettingsService {
  private readonly repository: ILetterRepository;
  private readonly storageService: LocalStorageService;
  private readonly dbPath: string;

  constructor(repository: ILetterRepository, storageService: LocalStorageService, dbPath: string) {
    this.repository = repository;
    this.storageService = storageService;
    this.dbPath = dbPath;
  }

  public getSystemInfo(): SystemInfo {
    return {
      version: 'v1.2.0',
      edition: 'Plug-and-Play Zero-Config NAS Edition',
      architecture: 'Self-Contained Container Volumes',
      storageMode: 'Internal Docker Volume (/app/documents)',
      storageDirectory: this.storageService.getAbsolutePath(''),
      updateStatus: 'Up to date'
    };
  }

  public async getStorageInfo(): Promise<StorageInfo> {
    const stats = await this.repository.getStats();

    let dbSizeBytes = 0;
    try {
      if (fs.existsSync(this.dbPath)) {
        dbSizeBytes = fs.statSync(this.dbPath).size;
      }
    } catch {}

    return {
      storageDirectory: this.storageService.getAbsolutePath(''),
      databasePath: this.dbPath,
      databaseSizeBytes: dbSizeBytes,
      totalLetters: stats.totalLetters
    };
  }

  public async loadSampleData(): Promise<{ count: number }> {
    const samples = [
      {
        referenceNumber: 'LP-IN-2026-0010',
        vemNumber: 'VEM-2026-0010',
        type: 'INCOMING' as const,
        sender: 'National Revenue Authority',
        recipient: 'Finance & Accounting Department',
        subject: 'Tax Clearance Certificate and Compliance Notice',
        letterDate: '2026-03-01',
        receivedSentDate: '2026-03-02',
        status: 'PROCESSED' as const,
        priority: 'HIGH' as const,
        tags: ['tax', 'compliance', 'certificate'],
        content: `NATIONAL REVENUE AUTHORITY\nOFFICIAL NOTICE: TAX CLEARANCE CERTIFICATE\nCertificate No: TX-2026-8891\nDate: March 01, 2026\n\nThis is to certify that LetterPort Operations has complied with all statutory corporate tax declarations for the prior fiscal year.\nTotal liability assessed: $0.00.\nStatus: Fully Cleared and in Good Standing.\nIssued under the seal of the Commissioner General.`
      },
      {
        referenceNumber: 'LP-IN-2026-0011',
        vemNumber: 'VEM-2026-0011',
        type: 'INCOMING' as const,
        sender: 'City Planning & Building Council',
        recipient: 'General Administration Office',
        subject: 'Approval of Office Expansion and Facility Renovation Permit',
        letterDate: '2026-03-03',
        receivedSentDate: '2026-03-04',
        status: 'RECEIVED' as const,
        priority: 'MEDIUM' as const,
        tags: ['permit', 'office', 'facilities'],
        content: `CITY PLANNING & DEVELOPMENT COMMISSION\nBUILDING & ARCHITECTURAL APPROVAL PERMIT\nPermit Ref: BLD-2026-4412\n\nTo: General Administration Office\nSubject: Commercial Building Renovation Approval\n\nWe are pleased to inform you that your application to renovate Suite 400 and install server rack ventilation has been formally approved.\nAll fire safety and electrical regulations must be strictly adhered to during construction.\nValid through: December 31, 2026.`
      },
      {
        referenceNumber: 'LP-OUT-2026-0012',
        vemNumber: 'VEM-2026-0012',
        type: 'OUTGOING' as const,
        sender: 'Procurement Department',
        recipient: 'Apex Server Solutions Ltd.',
        subject: 'Purchase Order for Synology NAS Server and Storage Hard Drives',
        letterDate: '2026-03-05',
        receivedSentDate: '2026-03-05',
        status: 'PROCESSED' as const,
        priority: 'URGENT' as const,
        tags: ['purchase-order', 'nas', 'hardware'],
        content: `LETTERPORT ENTERPRISE - PROCUREMENT DIVISION\nPURCHASE ORDER: PO-2026-092\n\nVendor: Apex Server Solutions Ltd.\nDelivery Address: Main Data Center Room 2B\n\nItems Ordered:\n1. 1x Synology DiskStation 8-Bay NAS Server (DS1823+)\n2. 8x 16TB Enterprise SATA 7200RPM Hard Drives (RAID 6 Config)\n3. 2x 10GbE SFP+ Network Interface Cards\n\nTotal Contract Price: $8,450.00\nPayment Terms: Net 30 Days.\nAuthorized by Chief Technology Officer.`
      },
      {
        referenceNumber: 'LP-IN-2026-0013',
        vemNumber: 'VEM-2026-0013',
        type: 'INCOMING' as const,
        sender: 'Grand Horizon Insurance Co.',
        recipient: 'Legal & Risk Management',
        subject: 'Commercial Asset and Cyber Liability Insurance Policy Renewal',
        letterDate: '2026-03-06',
        receivedSentDate: '2026-03-07',
        status: 'UNDER_REVIEW' as const,
        priority: 'HIGH' as const,
        tags: ['insurance', 'legal', 'policy'],
        content: `GRAND HORIZON UNDERWRITING PARTNERS\nPOLICY RENEWAL SCHEDULE\nPolicy Number: GHI-POL-992384\n\nInsured: LetterPort Organization\nCoverage: Comprehensive Cyber Risk, Document Loss, and Business Interruption\nMaximum Aggregate Limit: $10,000,000\nAnnual Premium: $14,200\n\nPlease sign and return Section 4 to bind coverage before the expiration date of March 31, 2026.`
      },
      {
        referenceNumber: 'LP-OUT-2026-0014',
        vemNumber: 'VEM-2026-0014',
        type: 'OUTGOING' as const,
        sender: 'Human Resources Directorate',
        recipient: 'All Staff Members',
        subject: 'Internal Memo: New Document Digitization and Letter Storage Guidelines',
        letterDate: '2026-03-08',
        receivedSentDate: '2026-03-08',
        status: 'PROCESSED' as const,
        priority: 'LOW' as const,
        tags: ['memo', 'internal', 'guidelines'],
        content: `INTERNAL STAFF MEMORANDUM\nCircular No: HR-MEMO-2026-08\n\nFrom: Human Resources Directorate\nTo: All Department Heads and Staff\nSubject: Guidelines for Digital Letter Processing\n\nEffective immediately, all incoming physical correspondence received by reception must be scanned and encoded into the LetterPort system within 24 hours of arrival.\nThe background OCR worker will automatically transcribe text for keyword searching.\nThank you for your cooperation in keeping our records organized and easily searchable.`
      }
    ];

    let insertedCount = 0;

    for (const sample of samples) {
      const existing = await this.repository.getLetterByReferenceNumber(sample.referenceNumber);
      if (existing) continue;

      const letterId = uuidv4();
      const letter = new Letter({
        id: letterId,
        referenceNumber: sample.referenceNumber,
        vemNumber: sample.vemNumber,
        type: sample.type,
        sender: sample.sender,
        recipient: sample.recipient,
        subject: sample.subject,
        letterDate: sample.letterDate,
        receivedSentDate: sample.receivedSentDate,
        status: sample.status,
        priority: sample.priority,
        tags: sample.tags
      });

      await this.repository.saveLetter(letter);

      // Create a sample visual SVG file for attachment
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
        <rect width="800" height="1000" fill="#ffffff"/>
        <rect x="40" y="40" width="720" height="920" fill="none" stroke="#3b82f6" stroke-width="2"/>
        <text x="400" y="100" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1e40af" text-anchor="middle">${sample.sender.toUpperCase()}</text>
        <line x1="80" y1="130" x2="720" y2="130" stroke="#e2e8f0" stroke-width="2"/>
        <text x="80" y="180" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Reference: ${sample.referenceNumber}</text>
        <text x="80" y="210" font-family="Arial, sans-serif" font-size="13" fill="#475569">Date: ${sample.letterDate}</text>
        <text x="80" y="240" font-family="Arial, sans-serif" font-size="13" fill="#475569">To: ${sample.recipient}</text>
        <text x="80" y="270" font-family="Arial, sans-serif" font-size="13" fill="#475569">From: ${sample.sender}</text>
        <text x="80" y="320" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1e293b">SUBJECT: ${sample.subject.toUpperCase()}</text>
        <line x1="80" y1="340" x2="720" y2="340" stroke="#cbd5e1" stroke-width="1"/>
        ${sample.content.split('\n').map((line, idx) => `<text x="80" y="${380 + idx * 24}" font-family="Arial, sans-serif" font-size="13" fill="#334155">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`).join('\n')}
      </svg>`;

      const storedFile = await this.storageService.saveBuffer(Buffer.from(svg), `${sample.referenceNumber}.svg`, 'image/svg+xml');

      const attachment = new Attachment({
        id: uuidv4(),
        letterId: letter.id,
        originalName: `${sample.referenceNumber}.svg`,
        storedFilename: storedFile.storedFilename,
        filePath: storedFile.filePath,
        mimeType: storedFile.mimeType,
        fileSize: storedFile.fileSize,
        checksum: storedFile.checksum
      });

      await this.repository.saveAttachment(attachment);

      // Create OCR Record
      const ocrRecord = new OCRRecord({
        id: uuidv4(),
        letterId: letter.id,
        attachmentId: attachment.id,
        extractedText: sample.content,
        confidence: 99,
        pageCount: 1,
        status: 'COMPLETED',
        processedAt: new Date().toISOString()
      });

      await this.repository.saveOCRRecord(ocrRecord);
      insertedCount++;
    }

    return { count: insertedCount };
  }

  public async clearSampleData(): Promise<{ deleted: number }> {
    const { letters } = await this.repository.findLetters({ limit: 1000 });
    let deletedCount = 0;

    for (const letter of letters) {
      const attachments = await this.repository.getAttachmentsByLetterId(letter.id);
      for (const att of attachments) {
        try {
          await this.storageService.deleteFile(att.filePath);
        } catch {}
      }
      await this.repository.deleteLetter(letter.id);
      deletedCount++;
    }

    return { deleted: deletedCount };
  }

  public async exportBackup(): Promise<{
    version: string;
    exportDate: string;
    totalLetters: number;
    letters: Array<{
      letter: any;
      attachments: any[];
      ocrRecord: any | null;
    }>;
  }> {
    const { letters } = await this.repository.findLetters({ limit: 10000 });
    const fullLetters = await Promise.all(
      letters.map(async (letter) => {
        const attachments = await this.repository.getAttachmentsByLetterId(letter.id);
        const ocrRecord = await this.repository.getOCRRecordByLetterId(letter.id);
        return {
          letter: letter.toJSON(),
          attachments: attachments.map(a => a.toJSON()),
          ocrRecord: ocrRecord ? ocrRecord.toJSON() : null
        };
      })
    );

    return {
      version: 'v1.2.0',
      exportDate: new Date().toISOString(),
      totalLetters: fullLetters.length,
      letters: fullLetters
    };
  }

  public async restoreBackup(backupData: any): Promise<{ restored: number }> {
    if (!backupData || !Array.isArray(backupData.letters)) {
      throw new Error('Invalid backup file structure: missing letters array');
    }

    let count = 0;
    for (const item of backupData.letters) {
      const letterData = item.letter || item;
      if (!letterData || !letterData.id || !letterData.referenceNumber) continue;

      const existing = await this.repository.getLetterById(letterData.id);
      const letter = new Letter({
        id: letterData.id,
        referenceNumber: letterData.referenceNumber,
        vemNumber: letterData.vemNumber || null,
        type: letterData.type,
        sender: letterData.sender,
        recipient: letterData.recipient,
        subject: letterData.subject,
        letterDate: letterData.letterDate,
        receivedSentDate: letterData.receivedSentDate,
        status: letterData.status,
        priority: letterData.priority || 'MEDIUM',
        tags: Array.isArray(letterData.tags) ? letterData.tags : [],
        createdAt: letterData.createdAt,
        updatedAt: letterData.updatedAt
      });

      if (existing) {
        await this.repository.updateLetter(letter);
      } else {
        await this.repository.saveLetter(letter);
      }

      // Restore attachments
      if (Array.isArray(item.attachments)) {
        for (const attData of item.attachments) {
          const existingAtt = await this.repository.getAttachmentById(attData.id);
          if (!existingAtt) {
            const attachment = new Attachment({
              id: attData.id,
              letterId: letter.id,
              storedFilename: attData.storedFilename || attData.fileName || 'document',
              originalName: attData.originalName || 'document',
              mimeType: attData.mimeType || 'application/pdf',
              fileSize: attData.fileSize ?? attData.fileSizeBytes ?? 0,
              filePath: attData.filePath || '',
              checksum: attData.checksum || '',
              createdAt: attData.createdAt
            });
            await this.repository.saveAttachment(attachment);
          }
        }
      }

      // Restore OCR record
      if (item.ocrRecord) {
        const existingOCR = await this.repository.getOCRRecordByLetterId(letter.id);
        const ocr = new OCRRecord({
          id: item.ocrRecord.id || uuidv4(),
          letterId: letter.id,
          attachmentId: item.ocrRecord.attachmentId || letter.id,
          extractedText: item.ocrRecord.extractedText || '',
          confidence: item.ocrRecord.confidence || 95,
          pageCount: item.ocrRecord.pageCount || 1,
          status: item.ocrRecord.status || 'COMPLETED',
          processedAt: item.ocrRecord.processedAt || new Date().toISOString()
        });

        if (existingOCR) {
          await this.repository.updateOCRRecord(ocr);
        } else {
          await this.repository.saveOCRRecord(ocr);
        }
      }

      count++;
    }

    return { restored: count };
  }
}
