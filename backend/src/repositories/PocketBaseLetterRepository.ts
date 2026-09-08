// @ts-ignore
import PocketBase from 'pocketbase/cjs';
import { Letter, LetterPriority, LetterStatus, LetterType } from '../entities/Letter';
import { Attachment } from '../entities/Attachment';
import { OCRRecord, OCRStatus } from '../entities/OCRRecord';
import { ILetterRepository, LetterFilter, SearchResult, DashboardStats } from './ILetterRepository';

export class PocketBaseLetterRepository implements ILetterRepository {
  private pb: PocketBase;
  private isConnected: boolean = false;

  constructor(url: string = 'http://127.0.0.1:8090') {
    this.pb = new PocketBase(url);
    // Disable auto cancellation for concurrent queries
    this.pb.autoCancellation(false);
  }

  public async init(): Promise<void> {
    try {
      const health = await this.pb.health.check();
      if (health && health.code === 200) {
        this.isConnected = true;
        console.log(`[PocketBase] Successfully connected to PocketBase server at ${this.pb.baseUrl}`);
      }
    } catch (err: any) {
      console.warn(`[PocketBase] Notice: PocketBase server not reachable at ${this.pb.baseUrl} (${err?.message || 'Offline'}).`);
      this.isConnected = false;
    }
  }

  public isAvailable(): boolean {
    return this.isConnected;
  }

  private mapRecordToLetter(record: any): Letter {
    let tags: string[] = [];
    if (Array.isArray(record.tags)) {
      tags = record.tags;
    } else if (typeof record.tags === 'string') {
      try {
        tags = JSON.parse(record.tags);
      } catch {
        tags = record.tags ? record.tags.split(',') : [];
      }
    }

    return new Letter({
      id: record.id,
      referenceNumber: record.referenceNumber || record.reference_number || '',
      vemNumber: record.vemNumber || record.vem_number || '',
      type: record.type as LetterType,
      sender: record.sender,
      recipient: record.recipient,
      subject: record.subject,
      letterDate: record.letterDate || record.letter_date || '',
      receivedSentDate: record.receivedSentDate || record.received_sent_date || '',
      status: record.status as LetterStatus,
      priority: record.priority as LetterPriority,
      tags,
      createdAt: record.created || record.createdAt,
      updatedAt: record.updated || record.updatedAt,
    });
  }

  private mapRecordToAttachment(record: any): Attachment {
    return new Attachment({
      id: record.id,
      letterId: record.letterId || record.letter_id,
      originalName: record.originalName || record.original_name,
      storedFilename: record.storedFilename || record.stored_filename,
      filePath: record.filePath || record.file_path,
      mimeType: record.mimeType || record.mime_type,
      fileSize: record.fileSize || record.file_size,
      checksum: record.checksum || '',
      createdAt: record.created || record.createdAt,
    });
  }

  private mapRecordToOCRRecord(record: any): OCRRecord {
    return new OCRRecord({
      id: record.id,
      letterId: record.letterId || record.letter_id,
      attachmentId: record.attachmentId || record.attachment_id,
      extractedText: record.extractedText || record.extracted_text || '',
      confidence: record.confidence ?? 0,
      pageCount: record.pageCount || record.page_count || 1,
      status: (record.status as OCRStatus) || 'PENDING',
      errorMessage: record.errorMessage || record.error_message || null,
      processedAt: record.processedAt || record.processed_at || null,
    });
  }

  public async saveLetter(letter: Letter): Promise<void> {
    await this.pb.collection('letters').create({
      id: letter.id.replace(/-/g, '').substring(0, 15), // PocketBase 15-char ID or standard
      referenceNumber: letter.referenceNumber,
      vemNumber: letter.vemNumber,
      type: letter.type,
      sender: letter.sender,
      recipient: letter.recipient,
      subject: letter.subject,
      letterDate: letter.letterDate,
      receivedSentDate: letter.receivedSentDate,
      status: letter.status,
      priority: letter.priority,
      tags: letter.tags,
    });
  }

  public async getLetterById(id: string): Promise<Letter | null> {
    try {
      const record = await this.pb.collection('letters').getOne(id);
      return this.mapRecordToLetter(record);
    } catch {
      return null;
    }
  }

  public async getLetterByReferenceNumber(ref: string): Promise<Letter | null> {
    try {
      const record = await this.pb.collection('letters').getFirstListItem(`referenceNumber = "${ref}"`);
      return this.mapRecordToLetter(record);
    } catch {
      return null;
    }
  }

  public async findLetters(filter: LetterFilter): Promise<{ letters: Letter[]; total: number }> {
    const filterClauses: string[] = [];

    if (filter.type) filterClauses.push(`type = "${filter.type}"`);
    if (filter.status) filterClauses.push(`status = "${filter.status}"`);
    if (filter.startDate) filterClauses.push(`letterDate >= "${filter.startDate}"`);
    if (filter.endDate) filterClauses.push(`letterDate <= "${filter.endDate}"`);
    if (filter.sender) filterClauses.push(`sender ~ "${filter.sender}"`);
    if (filter.recipient) filterClauses.push(`recipient ~ "${filter.recipient}"`);
    if (filter.vemNumber) filterClauses.push(`vemNumber ~ "${filter.vemNumber}"`);
    if (filter.search) {
      filterClauses.push(`(subject ~ "${filter.search}" || referenceNumber ~ "${filter.search}" || vemNumber ~ "${filter.search}" || sender ~ "${filter.search}" || recipient ~ "${filter.search}")`);
    }

    const filterString = filterClauses.join(' && ');
    const page = Math.floor((filter.offset || 0) / (filter.limit || 20)) + 1;
    const perPage = filter.limit || 20;
    const sortField = filter.sortBy === 'letter_date' ? 'letterDate' : filter.sortBy === 'reference_number' ? 'referenceNumber' : '-created';

    try {
      const result = await this.pb.collection('letters').getList(page, perPage, {
        filter: filterString,
        sort: filter.sortOrder === 'ASC' ? sortField : `-${sortField.replace(/^-/, '')}`,
      });

      return {
        letters: result.items.map((r: any) => this.mapRecordToLetter(r)),
        total: result.totalItems,
      };
    } catch (err) {
      return { letters: [], total: 0 };
    }
  }

  public async updateLetter(letter: Letter): Promise<void> {
    await this.pb.collection('letters').update(letter.id, {
      referenceNumber: letter.referenceNumber,
      vemNumber: letter.vemNumber,
      type: letter.type,
      sender: letter.sender,
      recipient: letter.recipient,
      subject: letter.subject,
      letterDate: letter.letterDate,
      receivedSentDate: letter.receivedSentDate,
      status: letter.status,
      priority: letter.priority,
      tags: letter.tags,
    });
  }

  public async deleteLetter(id: string): Promise<void> {
    try {
      await this.pb.collection('letters').delete(id);
    } catch {}
  }

  public async saveAttachment(attachment: Attachment): Promise<void> {
    await this.pb.collection('attachments').create({
      id: attachment.id.replace(/-/g, '').substring(0, 15),
      letterId: attachment.letterId,
      originalName: attachment.originalName,
      storedFilename: attachment.storedFilename,
      filePath: attachment.filePath,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      checksum: attachment.checksum,
    });
  }

  public async getAttachmentsByLetterId(letterId: string): Promise<Attachment[]> {
    try {
      const records = await this.pb.collection('attachments').getFullList({
        filter: `letterId = "${letterId}"`,
        sort: 'created',
      });
      return records.map((r: any) => this.mapRecordToAttachment(r));
    } catch {
      return [];
    }
  }

  public async getAttachmentById(id: string): Promise<Attachment | null> {
    try {
      const record = await this.pb.collection('attachments').getOne(id);
      return this.mapRecordToAttachment(record);
    } catch {
      return null;
    }
  }

  public async deleteAttachment(id: string): Promise<void> {
    try {
      await this.pb.collection('attachments').delete(id);
    } catch {}
  }

  public async saveOCRRecord(record: OCRRecord): Promise<void> {
    await this.pb.collection('ocr_records').create({
      id: record.id.replace(/-/g, '').substring(0, 15),
      letterId: record.letterId,
      attachmentId: record.attachmentId,
      extractedText: record.extractedText,
      confidence: record.confidence,
      pageCount: record.pageCount,
      status: record.status,
      errorMessage: record.errorMessage,
      processedAt: record.processedAt,
    });
  }

  public async getOCRRecordByLetterId(letterId: string): Promise<OCRRecord | null> {
    try {
      const record = await this.pb.collection('ocr_records').getFirstListItem(`letterId = "${letterId}"`, {
        sort: '-created',
      });
      return this.mapRecordToOCRRecord(record);
    } catch {
      return null;
    }
  }

  public async getOCRRecordByAttachmentId(attachmentId: string): Promise<OCRRecord | null> {
    try {
      const record = await this.pb.collection('ocr_records').getFirstListItem(`attachmentId = "${attachmentId}"`);
      return this.mapRecordToOCRRecord(record);
    } catch {
      return null;
    }
  }

  public async updateOCRRecord(record: OCRRecord): Promise<void> {
    try {
      await this.pb.collection('ocr_records').update(record.id, {
        extractedText: record.extractedText,
        confidence: record.confidence,
        pageCount: record.pageCount,
        status: record.status,
        errorMessage: record.errorMessage,
        processedAt: record.processedAt,
      });
    } catch {}
  }

  public async searchLetters(query: string, limit: number = 25): Promise<SearchResult[]> {
    const clean = query.trim();
    if (!clean) return [];

    try {
      // 1. Search letters metadata
      const letters = await this.pb.collection('letters').getList(1, limit, {
        filter: `subject ~ "${clean}" || referenceNumber ~ "${clean}" || vemNumber ~ "${clean}" || sender ~ "${clean}" || recipient ~ "${clean}"`,
      });

      // 2. Search OCR text
      const ocrMatches = await this.pb.collection('ocr_records').getList(1, limit, {
        filter: `extractedText ~ "${clean}"`,
      });

      const results: SearchResult[] = [];
      const seenIds = new Set<string>();

      for (const item of letters.items) {
        seenIds.add(item.id);
        const letter = this.mapRecordToLetter(item);
        results.push({
          letter,
          matchType: 'METADATA',
          matchSnippet: `Matched in Subject/Sender: "${letter.subject}"`,
        });
      }

      for (const ocr of ocrMatches.items) {
        if (!seenIds.has(ocr.letterId)) {
          seenIds.add(ocr.letterId);
          try {
            const letterRecord = await this.pb.collection('letters').getOne(ocr.letterId);
            const letter = this.mapRecordToLetter(letterRecord);
            results.push({
              letter,
              matchType: 'OCR',
              matchSnippet: (ocr.extractedText || '').substring(0, 160),
            });
          } catch {}
        }
      }

      return results;
    } catch {
      return [];
    }
  }

  public async getStats(): Promise<DashboardStats> {
    try {
      const all = await this.pb.collection('letters').getList(1, 1);
      const inc = await this.pb.collection('letters').getList(1, 1, { filter: 'type = "INCOMING"' });
      const out = await this.pb.collection('letters').getList(1, 1, { filter: 'type = "OUTGOING"' });
      const pendingOcr = await this.pb.collection('ocr_records').getList(1, 1, { filter: 'status = "PENDING" || status = "PROCESSING"' });
      const urgent = await this.pb.collection('letters').getList(1, 1, { filter: 'priority = "URGENT"' });
      const recent = await this.pb.collection('letters').getList(1, 6, { sort: '-created' });

      return {
        totalLetters: all.totalItems,
        incomingLetters: inc.totalItems,
        outgoingLetters: out.totalItems,
        pendingOCR: pendingOcr.totalItems,
        urgentLetters: urgent.totalItems,
        recentActivity: recent.items.map((r: any) => ({
          id: r.id,
          action: `Created ${r.type.toLowerCase()} letter`,
          referenceNumber: r.referenceNumber,
          subject: r.subject,
          timestamp: r.created,
        })),
      };
    } catch {
      return {
        totalLetters: 0,
        incomingLetters: 0,
        outgoingLetters: 0,
        pendingOCR: 0,
        urgentLetters: 0,
        recentActivity: [],
      };
    }
  }

  public async generateNextReferenceNumber(type: LetterType): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = type === 'INCOMING' ? 'LP-IN' : 'LP-OUT';
    try {
      const recent = await this.pb.collection('letters').getList(1, 1, {
        filter: `referenceNumber ~ "${prefix}-${year}"`,
        sort: '-referenceNumber',
      });

      let nextSeq = 1;
      if (recent.items.length > 0) {
        const lastRef = recent.items[0].referenceNumber;
        const parts = lastRef.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
      return `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
    } catch {
      return `${prefix}-${year}-0001`;
    }
  }
}
