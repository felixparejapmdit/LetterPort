import { v4 as uuidv4 } from 'uuid';
import { Letter, LetterPriority, LetterStatus, LetterType } from '../entities/Letter';
import { Attachment } from '../entities/Attachment';
import { OCRRecord } from '../entities/OCRRecord';
import { ILetterRepository, LetterFilter, SearchResult, DashboardStats } from '../repositories/ILetterRepository';
import { IStorageService } from './StorageService';
import { IOCRService } from './OCRService';
import { IQueueService, OCRJob } from './QueueService';

export interface CreateLetterDTO {
  referenceNumber?: string;
  vemNumber?: string;
  type: LetterType;
  sender: string;
  recipient: string;
  subject: string;
  letterDate: string;
  receivedSentDate: string;
  status?: LetterStatus;
  priority?: LetterPriority;
  dueDate?: string;
  tags?: string[];
  file?: {
    tempFilePath: string;
    originalName: string;
    mimeType: string;
    buffer?: Buffer;
  };
}

export interface UpdateLetterDTO {
  type?: LetterType;
  sender?: string;
  recipient?: string;
  subject?: string;
  letterDate?: string;
  receivedSentDate?: string;
  vemNumber?: string;
  status?: LetterStatus;
  priority?: LetterPriority;
  dueDate?: string;
  tags?: string[];
}

export interface LetterDetailsDTO {
  letter: Letter;
  attachments: Attachment[];
  ocrRecord: OCRRecord | null;
}

export class LetterService {
  private readonly repository: ILetterRepository;
  private readonly storageService: IStorageService;
  private readonly ocrService: IOCRService;
  private readonly queueService: IQueueService;

  constructor(
    repository: ILetterRepository,
    storageService: IStorageService,
    ocrService: IOCRService,
    queueService: IQueueService
  ) {
    this.repository = repository;
    this.storageService = storageService;
    this.ocrService = ocrService;
    this.queueService = queueService;

    // Register queue consumer worker
    this.queueService.processJobs((job) => this.handleOCRJob(job));
  }

  public async createLetter(dto: CreateLetterDTO): Promise<LetterDetailsDTO> {
    const letterId = uuidv4();
    let referenceNumber = dto.referenceNumber?.trim();
    if (!referenceNumber) {
      referenceNumber = await this.repository.generateNextReferenceNumber(dto.type);
    }

    let dueDate = dto.dueDate?.trim();
    if (!dueDate) {
      const baseDate = new Date(dto.letterDate || new Date());
      const priority = dto.priority || 'MEDIUM';
      const daysToAdd = priority === 'URGENT' ? 3 : priority === 'HIGH' ? 5 : 7;
      baseDate.setDate(baseDate.getDate() + daysToAdd);
      dueDate = baseDate.toISOString().split('T')[0];
    }

    const letter = new Letter({
      id: letterId,
      referenceNumber,
      vemNumber: dto.vemNumber,
      type: dto.type,
      sender: dto.sender,
      recipient: dto.recipient,
      subject: dto.subject,
      letterDate: dto.letterDate || new Date().toISOString().split('T')[0],
      receivedSentDate: dto.receivedSentDate || new Date().toISOString().split('T')[0],
      status: dto.status,
      priority: dto.priority,
      dueDate,
      tags: dto.tags || []
    });

    await this.repository.saveLetter(letter);

    const attachments: Attachment[] = [];
    let ocrRecord: OCRRecord | null = null;

    if (dto.file) {
      const storedFile = dto.file.buffer
        ? await this.storageService.saveBuffer(dto.file.buffer, dto.file.originalName, dto.file.mimeType)
        : await this.storageService.saveFile(dto.file.tempFilePath, dto.file.originalName, dto.file.mimeType);

      const attachmentId = uuidv4();
      const attachment = new Attachment({
        id: attachmentId,
        letterId: letter.id,
        originalName: dto.file.originalName,
        storedFilename: storedFile.storedFilename,
        filePath: storedFile.filePath,
        mimeType: storedFile.mimeType,
        fileSize: storedFile.fileSize,
        checksum: storedFile.checksum
      });

      await this.repository.saveAttachment(attachment);
      attachments.push(attachment);

      // Create Initial Pending OCR Record
      const ocrId = uuidv4();
      ocrRecord = new OCRRecord({
        id: ocrId,
        letterId: letter.id,
        attachmentId: attachment.id,
        status: 'PENDING'
      });

      await this.repository.saveOCRRecord(ocrRecord);

      // Enqueue OCR background processing
      await this.queueService.enqueueOCRJob(letter.id, attachment.id);
    }

    return {
      letter,
      attachments,
      ocrRecord
    };
  }

  public async handleOCRJob(job: OCRJob): Promise<void> {
    const attachment = await this.repository.getAttachmentById(job.attachmentId);
    if (!attachment) {
      console.warn(`[OCR Worker] Attachment not found: ${job.attachmentId}`);
      return;
    }

    let ocrRecord = await this.repository.getOCRRecordByAttachmentId(attachment.id);
    if (!ocrRecord) {
      ocrRecord = new OCRRecord({
        id: uuidv4(),
        letterId: job.letterId,
        attachmentId: attachment.id,
        status: 'PENDING'
      });
      await this.repository.saveOCRRecord(ocrRecord);
    }

    ocrRecord.markProcessing();
    await this.repository.updateOCRRecord(ocrRecord);

    try {
      const absPath = this.storageService.getAbsolutePath(attachment.filePath);
      const result = await this.ocrService.extractText(absPath, attachment.mimeType);

      ocrRecord.complete(result.text, result.confidence, result.pageCount);
      await this.repository.updateOCRRecord(ocrRecord);
      console.log(`[OCR Worker] Successfully extracted text for letter ${job.letterId} (${result.text.length} chars, confidence ${result.confidence}%)`);
    } catch (err: any) {
      console.error(`[OCR Worker] Failed text extraction for attachment ${attachment.id}:`, err);
      ocrRecord.fail(err.message || 'Unknown OCR failure');
      await this.repository.updateOCRRecord(ocrRecord);
    }
  }

  public async getLetterDetails(id: string): Promise<LetterDetailsDTO | null> {
    const letter = await this.repository.getLetterById(id);
    if (!letter) return null;

    const attachments = await this.repository.getAttachmentsByLetterId(id);
    const ocrRecord = await this.repository.getOCRRecordByLetterId(id);

    return {
      letter,
      attachments,
      ocrRecord
    };
  }

  public async listLetters(filter: LetterFilter): Promise<{ letters: Letter[]; total: number }> {
    return this.repository.findLetters(filter);
  }

  public async updateLetter(id: string, updates: UpdateLetterDTO): Promise<Letter | null> {
    const letter = await this.repository.getLetterById(id);
    if (!letter) return null;

    letter.update(updates);

    await this.repository.updateLetter(letter);
    return letter;
  }

  public async deleteLetter(id: string): Promise<boolean> {
    const letter = await this.repository.getLetterById(id);
    if (!letter) return false;

    const attachments = await this.repository.getAttachmentsByLetterId(id);
    for (const att of attachments) {
      try {
        await this.storageService.deleteFile(att.filePath);
      } catch (err) {
        console.warn(`Could not delete file ${att.filePath}:`, err);
      }
    }

    await this.repository.deleteLetter(id);
    return true;
  }

  public async reprocessOCR(letterId: string): Promise<boolean> {
    const attachments = await this.repository.getAttachmentsByLetterId(letterId);
    if (attachments.length === 0) return false;

    const primaryAttachment = attachments[0];
    await this.queueService.enqueueOCRJob(letterId, primaryAttachment.id);
    return true;
  }

  public async search(query: string, limit: number = 25): Promise<SearchResult[]> {
    return this.repository.searchLetters(query, limit);
  }

  public async getStats(): Promise<DashboardStats> {
    return this.repository.getStats();
  }

  public async generateNextReference(type: LetterType): Promise<string> {
    return this.repository.generateNextReferenceNumber(type);
  }

  public async generateNextVemNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `VEM-${year}`;
    const result = await this.repository.findLetters({ limit: 1, sortBy: 'created_at', sortOrder: 'DESC' });
    let nextSeq = 1;
    if (result.letters.length > 0 && result.letters[0].vemNumber) {
      const parts = result.letters[0].vemNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }
    return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
  }
}
