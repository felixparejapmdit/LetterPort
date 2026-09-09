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
  dueDate?: string;
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
  overdueLetters: number;
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

// User Profile & Authentication
export interface UserProfile {
  id: string;
  username: string;
  role: 'admin' | 'user';
  avatar?: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function loginUser(credentials: { username: string; password: string }): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Invalid username or password');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchCurrentUser(token?: string): Promise<UserProfile> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/auth/me`, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error('Unauthenticated');
  const json = await res.json();
  const userData = json.data?.user || json.data;
  return userData;
}

export async function fetchUsers(token?: string): Promise<UserProfile[]> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/users`, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch users');
  const json = await res.json();
  return json.data;
}

export async function createUser(data: { username: string; password: string; role: 'admin' | 'user'; avatar?: string }, token?: string): Promise<UserProfile> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create user');
  }
  const json = await res.json();
  return json.data;
}

export async function updateUser(id: string, data: { username?: string; password?: string; role?: 'admin' | 'user'; avatar?: string }, token?: string): Promise<UserProfile> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to update user');
  }
  const json = await res.json();
  return json.data;
}

export async function deleteUser(id: string, token?: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to delete user');
  }
}

// Reference Number Format
export interface ReferenceFormatConfig {
  prefix: string;
  separator: string;
  digits: number;
}

export async function fetchReferenceFormat(): Promise<ReferenceFormatConfig> {
  const res = await fetch(`${API_BASE}/settings/reference-format`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch reference format');
  const json = await res.json();
  return json.data;
}

export async function updateReferenceFormat(format: ReferenceFormatConfig): Promise<ReferenceFormatConfig> {
  const res = await fetch(`${API_BASE}/settings/reference-format`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(format),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to update reference format');
  }
  const json = await res.json();
  return json.data;
}

// Access Matrix & Permissions
export type RolePermissionsMap = Record<string, { admin: boolean; user: boolean }>;

export async function fetchPermissions(): Promise<RolePermissionsMap | null> {
  try {
    const res = await fetch(`${API_BASE}/settings/permissions`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function updatePermissions(permissions: RolePermissionsMap, token?: string): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/settings/permissions`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(permissions),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to update permissions');
  }
}

// ==========================================
// People Directory
// ==========================================
export interface Person {
  id: string;
  name: string;
  type: string;
  createdAt?: string;
}

export async function fetchPeople(search?: string): Promise<Person[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_BASE}/people${query}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function createPerson(name: string, type: string = 'contact'): Promise<Person> {
  const res = await fetch(`${API_BASE}/people`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create person');
  }
  const json = await res.json();
  return json.data;
}

export async function deletePerson(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/people/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete person');
}

// ==========================================
// Classifications: Statuses, Priorities, Types
// ==========================================
export interface ClassificationItem {
  id: string;
  code: string;
  label: string;
  color?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface RoleItem {
  id: string;
  code?: string;
  name: string;
  label?: string;
  description?: string;
  isSystem: boolean;
  color?: string;
  createdAt?: string;
}

// Statuses
export async function fetchStatuses(): Promise<ClassificationItem[]> {
  const res = await fetch(`${API_BASE}/classifications/statuses`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function createStatus(data: Partial<ClassificationItem>): Promise<void> {
  const res = await fetch(`${API_BASE}/classifications/statuses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create status');
  }
}

export async function updateStatus(id: string, data: Partial<ClassificationItem>): Promise<void> {
  const res = await fetch(`${API_BASE}/classifications/statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update status');
  }
}

export async function deleteStatus(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/classifications/statuses/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete status');
}

// Priorities
export async function fetchPriorities(): Promise<ClassificationItem[]> {
  const res = await fetch(`${API_BASE}/classifications/priorities`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function createPriority(data: Partial<ClassificationItem>): Promise<void> {
  const res = await fetch(`${API_BASE}/classifications/priorities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create priority');
  }
}

export async function updatePriority(id: string, data: Partial<ClassificationItem>): Promise<void> {
  const res = await fetch(`${API_BASE}/classifications/priorities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update priority');
  }
}

export async function deletePriority(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/classifications/priorities/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete priority');
}

// Types
export async function fetchLetterTypes(): Promise<ClassificationItem[]> {
  const res = await fetch(`${API_BASE}/classifications/types`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function createLetterType(data: Partial<ClassificationItem>): Promise<void> {
  const res = await fetch(`${API_BASE}/classifications/types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create type');
  }
}

export async function updateLetterType(id: string, data: Partial<ClassificationItem>): Promise<void> {
  const res = await fetch(`${API_BASE}/classifications/types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update type');
  }
}

export async function deleteLetterType(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/classifications/types/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete type');
}

// Roles
export async function fetchRoles(): Promise<RoleItem[]> {
  const res = await fetch(`${API_BASE}/roles`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function createRole(data: { code?: string; name: string; label?: string; description?: string; color?: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: (data.code || data.name).toLowerCase().replace(/\s+/g, '_'),
      name: data.label || data.name,
      description: data.description || '',
      color: data.color || 'blue'
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create role');
  }
}

export async function updateRole(id: string, data: { code?: string; name?: string; label?: string; description?: string; color?: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/roles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: data.code,
      name: data.label || data.name,
      description: data.description,
      color: data.color
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update role');
  }
}

export async function deleteRole(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/roles/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete role');
  }
}

// ==========================================
// Letter Attachments & Merging
// ==========================================
export function getAttachmentUrl(letterId: string, attachmentId: string): string {
  return `${API_BASE}/letters/${letterId}/attachments/${attachmentId}/file`;
}

export function getAttachmentDownloadUrl(letterId: string, attachmentId: string): string {
  return `${API_BASE}/letters/${letterId}/attachments/${attachmentId}/download`;
}

export async function addAttachment(letterId: string, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/letters/${letterId}/attachments`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload attachment');
  }
  const json = await res.json();
  return json.data;
}

export async function deleteAttachment(letterId: string, attachmentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/letters/${letterId}/attachments/${attachmentId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete attachment');
  }
}

export async function combinePdfs(letterId: string, additionalFile?: File): Promise<Attachment> {
  const formData = new FormData();
  if (additionalFile) {
    formData.append('file', additionalFile);
  }
  const res = await fetch(`${API_BASE}/letters/${letterId}/attachments/combine`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to combine PDFs');
  }
  const json = await res.json();
  return json.data;
}


