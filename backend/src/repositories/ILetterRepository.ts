import { Letter, LetterStatus, LetterType, LetterPriority } from '../entities/Letter';
import { Attachment } from '../entities/Attachment';
import { OCRRecord } from '../entities/OCRRecord';

export interface LetterFilter {
  type?: LetterType;
  status?: LetterStatus;
  priority?: LetterPriority;
  ocrStatus?: string;
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
  overdueLetters?: number;
  recentActivity: Array<{
    id: string;
    action: string;
    referenceNumber: string;
    subject: string;
    timestamp: string;
  }>;
}

export interface Person {
  id: string;
  name: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassificationStatus {
  id: string;
  code: string;
  label: string;
  color: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassificationPriority {
  id: string;
  code: string;
  label: string;
  color: string;
  level: number;
  slaDays: number;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassificationType {
  id: string;
  code: string;
  label: string;
  prefix: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
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

  // User Management & System Configuration
  getUserByUsername?(username: string): Promise<any | null>;
  getUserById?(id: string): Promise<any | null>;
  listUsers?(): Promise<any[]>;
  saveUser?(user: any): Promise<void>;
  updateUser?(user: any): Promise<void>;
  deleteUser?(id: string): Promise<void>;

  getConfig?(key: string, defaultValue?: string): Promise<string>;
  setConfig?(key: string, value: string): Promise<void>;

  // People Directory
  savePerson?(name: string, type?: string): Promise<Person>;
  listPeople?(search?: string): Promise<Person[]>;
  deletePerson?(id: string): Promise<void>;

  // Classifications: Statuses
  listStatuses?(): Promise<ClassificationStatus[]>;
  saveStatus?(status: ClassificationStatus): Promise<void>;
  updateStatus?(status: ClassificationStatus): Promise<void>;
  deleteStatus?(id: string): Promise<void>;

  // Classifications: Priorities
  listPriorities?(): Promise<ClassificationPriority[]>;
  savePriority?(priority: ClassificationPriority): Promise<void>;
  updatePriority?(priority: ClassificationPriority): Promise<void>;
  deletePriority?(id: string): Promise<void>;

  // Classifications: Types
  listTypes?(): Promise<ClassificationType[]>;
  saveType?(type: ClassificationType): Promise<void>;
  updateType?(type: ClassificationType): Promise<void>;
  deleteType?(id: string): Promise<void>;

  // User Roles
  listRoles?(): Promise<RoleItem[]>;
  saveRole?(role: RoleItem): Promise<void>;
  updateRole?(role: RoleItem): Promise<void>;
  deleteRole?(id: string): Promise<void>;
}

