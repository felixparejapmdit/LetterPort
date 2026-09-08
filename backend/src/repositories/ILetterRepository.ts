import { Letter, LetterStatus, LetterType } from '../entities/Letter';
import { Attachment } from '../entities/Attachment';
import { OCRRecord } from '../entities/OCRRecord';

export interface LetterFilter {
  type?: LetterType;
  status?: LetterStatus;
  startDate?: string;
  endDate?: string;
  sender?: string;
  recipient?: string;
  vemNumber?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SearchResult {
  letter: Letter;
  attachment?: Attachment;
  ocrRecord?: OCRRecord;
  matchSnippet?: string;
  matchType: 'METADATA' | 'OCR';
}

export interface DashboardStats {
  totalLetters: number;
  incomingLetters: number;
  outgoingLetters: number;
  pendingOCR: number;
  urgentLetters: number;
  recentActivity: Array<{
    id: string;
    action: string;
    referenceNumber: string;
    subject: string;
    timestamp: string;
  }>;
}

export interface ILetterRepository {
  init(): Promise<void>;
  saveLetter(letter: Letter): Promise<void>;
  getLetterById(id: string): Promise<Letter | null>;
  getLetterByReferenceNumber(ref: string): Promise<Letter | null>;
  findLetters(filter: LetterFilter): Promise<{ letters: Letter[]; total: number }>;
  updateLetter(letter: Letter): Promise<void>;
  deleteLetter(id: string): Promise<void>;
  
  saveAttachment(attachment: Attachment): Promise<void>;
  getAttachmentsByLetterId(letterId: string): Promise<Attachment[]>;
  getAttachmentById(id: string): Promise<Attachment | null>;
  deleteAttachment(id: string): Promise<void>;

  saveOCRRecord(record: OCRRecord): Promise<void>;
  getOCRRecordByLetterId(letterId: string): Promise<OCRRecord | null>;
  getOCRRecordByAttachmentId(attachmentId: string): Promise<OCRRecord | null>;
  updateOCRRecord(record: OCRRecord): Promise<void>;

  searchLetters(query: string, limit?: number): Promise<SearchResult[]>;
  getStats(): Promise<DashboardStats>;
  generateNextReferenceNumber(type: LetterType): Promise<string>;
}
