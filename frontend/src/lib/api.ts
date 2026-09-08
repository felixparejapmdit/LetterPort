const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface Letter {
  id: string;
  referenceNumber: string;
  vemNumber?: string;
  type: 'INCOMING' | 'OUTGOING';
  sender: string;
  recipient: string;
  subject: string;
  letterDate: string;
  receivedSentDate: string;
  status: 'DRAFT' | 'RECEIVED' | 'UNDER_REVIEW' | 'PROCESSED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  letterId: string;
  originalName: string;
  storedFilename: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  createdAt: string;
  isPdf: boolean;
  isImage: boolean;
}

export interface OCRRecord {
  id: string;
  letterId: string;
  attachmentId: string;
  extractedText: string;
  confidence: number;
  pageCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage: string | null;
  processedAt: string | null;
}

export interface LetterDetails {
  letter: Letter;
  attachments: Attachment[];
  ocrRecord: OCRRecord | null;
}

export interface SearchResultItem {
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

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  const json = await res.json();
  return json.data;
}

export async function fetchLetters(params?: {
  type?: string;
  status?: string;
  priority?: string;
  ocrStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ letters: Letter[]; pagination: { total: number; totalPages: number; page: number } }> {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.status) query.set('status', params.status);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.ocrStatus) query.set('ocrStatus', params.ocrStatus);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/letters?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch letters');
  const json = await res.json();
  return json.data;
}

export async function fetchLetter(id: string): Promise<LetterDetails> {
  const res = await fetch(`${API_BASE}/letters/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch letter details');
  const json = await res.json();
  return json.data;
}

export async function createLetter(formData: FormData): Promise<{ letter: Letter; attachment?: Attachment }> {
  const res = await fetch(`${API_BASE}/letters`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create letter');
  }
  const json = await res.json();
  return json.data;
}

export async function updateLetter(id: string, data: Partial<Letter>): Promise<Letter> {
  const res = await fetch(`${API_BASE}/letters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update letter');
  const json = await res.json();
  return (json.data?.letter || json.data) as Letter;
}

export async function deleteLetter(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/letters/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete letter');
}

export async function reprocessOCR(letterId: string): Promise<OCRRecord> {
  const res = await fetch(`${API_BASE}/letters/${letterId}/re-ocr`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reprocess OCR');
  const json = await res.json();
  return json.data;
}

export async function searchLetters(q: string): Promise<{ query: string; total: number; results: SearchResultItem[] }> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to search letters');
  const json = await res.json();
  return json.data;
}

export async function getNextReference(type: 'INCOMING' | 'OUTGOING'): Promise<string> {
  const res = await fetch(`${API_BASE}/letters/next-reference?type=${type}`, { cache: 'no-store' });
  if (!res.ok) return '';
  const json = await res.json();
  return json.data?.nextReference || '';
}

export async function getNextVem(): Promise<string> {
  const res = await fetch(`${API_BASE}/letters/next-vem`, { cache: 'no-store' });
  if (!res.ok) return '';
  const json = await res.json();
  return json.data?.nextVemNumber || '';
}

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

export async function fetchSettings(): Promise<{ systemInfo: SystemInfo; storageInfo: StorageInfo }> {
  const res = await fetch(`${API_BASE}/settings`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch settings');
  const json = await res.json();
  return json.data;
}

export async function loadSampleData(): Promise<{ count: number; message: string }> {
  const res = await fetch(`${API_BASE}/settings/sample-data/load`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to load sample data');
  const json = await res.json();
  return { count: json.data.count, message: json.message };
}

export async function clearSampleData(): Promise<{ deleted: number; message: string }> {
  const res = await fetch(`${API_BASE}/settings/sample-data/clear`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to clear data');
  const json = await res.json();
  return { deleted: json.data.deleted, message: json.message };
}

export function getFileUrl(letterId: string): string {
  return `${API_BASE}/letters/${letterId}/file`;
}

export function getDownloadUrl(letterId: string): string {
  return `${API_BASE}/letters/${letterId}/download`;
}

export function getBackupUrl(): string {
  return `${API_BASE}/settings/backup`;
}

export async function restoreBackup(backupData: any): Promise<{ restored: number; message: string }> {
  const res = await fetch(`${API_BASE}/settings/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backupData),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || 'Failed to restore backup');
  }
  const json = await res.json();
  return { restored: json.data?.restored || 0, message: json.message };
}
