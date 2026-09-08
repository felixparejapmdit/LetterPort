import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Letter, LetterPriority, LetterStatus, LetterType } from '../entities/Letter';
import { Attachment } from '../entities/Attachment';
import { OCRRecord, OCRStatus } from '../entities/OCRRecord';
import { User, UserRole } from '../entities/User';
import { ILetterRepository, LetterFilter, SearchResult, DashboardStats } from './ILetterRepository';

export class SqliteLetterRepository implements ILetterRepository {
  private db!: sqlite3.Database;
  private readonly dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  public async init(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) return reject(err);
        this.createTables()
          .then(resolve)
          .catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    await this.run(`
      CREATE TABLE IF NOT EXISTS letters (
        id TEXT PRIMARY KEY,
        reference_number TEXT UNIQUE NOT NULL,
        vem_number TEXT,
        type TEXT NOT NULL,
        sender TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        letter_date TEXT NOT NULL,
        received_sent_date TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        tags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Safe migration: Add vem_number and due_date columns if not existing in older databases
    try {
      await this.run(`ALTER TABLE letters ADD COLUMN vem_number TEXT`);
    } catch {}
    try {
      await this.run(`ALTER TABLE letters ADD COLUMN due_date TEXT`);
    } catch {}

    // Users table for Admin and Staff Authentication
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        avatar TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    try {
      await this.run(`ALTER TABLE users ADD COLUMN avatar TEXT`);
    } catch {}

    // System configuration table for custom formats
    await this.run(`
      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Seed default admin and user accounts if users table is empty
    const userCount = await this.get<{ count: number }>(`SELECT COUNT(*) as count FROM users`);
    if (!userCount || userCount.count === 0) {
      const now = new Date().toISOString();
      await this.run(
        `INSERT INTO users (id, username, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'admin', 'password', 'admin', now, now]
      );
      await this.run(
        `INSERT INTO users (id, username, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), 'user', 'password', 'user', now, now]
      );
    }

    await this.run(`
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        letter_id TEXT NOT NULL,
        original_name TEXT NOT NULL,
        stored_filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        checksum TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (letter_id) REFERENCES letters (id) ON DELETE CASCADE
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS ocr_records (
        id TEXT PRIMARY KEY,
        letter_id TEXT NOT NULL,
        attachment_id TEXT NOT NULL,
        extracted_text TEXT,
        confidence REAL DEFAULT 0,
        page_count INTEGER DEFAULT 1,
        status TEXT NOT NULL,
        error_message TEXT,
        processed_at TEXT,
        FOREIGN KEY (letter_id) REFERENCES letters (id) ON DELETE CASCADE,
        FOREIGN KEY (attachment_id) REFERENCES attachments (id) ON DELETE CASCADE
      )
    `);

    // Indexes for high performance querying
    await this.run(`CREATE INDEX IF NOT EXISTS idx_letters_ref ON letters (reference_number)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_letters_type ON letters (type)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_letters_status ON letters (status)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_attachments_letter ON attachments (letter_id)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_ocr_letter ON ocr_records (letter_id)`);
  }

  private run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  private get<T>(sql: string, params: any[] = []): Promise<T | null> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve((row as T) || null);
      });
    });
  }

  private all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve((rows as T[]) || []);
      });
    });
  }

  private mapRowToLetter(row: any): Letter {
    let tags: string[] = [];
    try {
      tags = row.tags ? JSON.parse(row.tags) : [];
    } catch {
      tags = [];
    }

    return new Letter({
      id: row.id,
      referenceNumber: row.reference_number,
      vemNumber: row.vem_number || '',
      type: row.type as LetterType,
      sender: row.sender,
      recipient: row.recipient,
      subject: row.subject,
      letterDate: row.letter_date,
      receivedSentDate: row.received_sent_date,
      status: row.status as LetterStatus,
      priority: row.priority as LetterPriority,
      dueDate: row.due_date || '',
      tags: tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  private mapRowToAttachment(row: any): Attachment {
    return new Attachment({
      id: row.id,
      letterId: row.letter_id,
      originalName: row.original_name,
      storedFilename: row.stored_filename,
      filePath: row.file_path,
      mimeType: row.mime_type,
      fileSize: row.file_size,
      checksum: row.checksum,
      createdAt: row.created_at
    });
  }

  private mapRowToOCRRecord(row: any): OCRRecord {
    return new OCRRecord({
      id: row.id,
      letterId: row.letter_id,
      attachmentId: row.attachment_id,
      extractedText: row.extracted_text,
      confidence: row.confidence,
      pageCount: row.page_count,
      status: row.status as OCRStatus,
      errorMessage: row.error_message,
      processedAt: row.processed_at
    });
  }

  public async saveLetter(letter: Letter): Promise<void> {
    await this.run(
      `INSERT INTO letters (id, reference_number, vem_number, type, sender, recipient, subject, letter_date, received_sent_date, status, priority, due_date, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        letter.id,
        letter.referenceNumber,
        letter.vemNumber,
        letter.type,
        letter.sender,
        letter.recipient,
        letter.subject,
        letter.letterDate,
        letter.receivedSentDate,
        letter.status,
        letter.priority,
        letter.dueDate,
        JSON.stringify(letter.tags),
        letter.createdAt,
        letter.updatedAt
      ]
    );
  }

  public async getLetterById(id: string): Promise<Letter | null> {
    const row = await this.get<any>(`SELECT * FROM letters WHERE id = ?`, [id]);
    return row ? this.mapRowToLetter(row) : null;
  }

  public async getLetterByReferenceNumber(ref: string): Promise<Letter | null> {
    const row = await this.get<any>(`SELECT * FROM letters WHERE reference_number = ?`, [ref]);
    return row ? this.mapRowToLetter(row) : null;
  }

  public async findLetters(filter: LetterFilter): Promise<{ letters: Letter[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.type) {
      conditions.push(`type = ?`);
      params.push(filter.type);
    }
    if (filter.status) {
      conditions.push(`status = ?`);
      params.push(filter.status);
    }
    if (filter.priority) {
      conditions.push(`priority = ?`);
      params.push(filter.priority);
    }
    if (filter.ocrStatus) {
      if (filter.ocrStatus.toUpperCase() === 'PENDING' || filter.ocrStatus.toUpperCase() === 'READING') {
        conditions.push(`id IN (SELECT letter_id FROM ocr_records WHERE status IN ('PENDING', 'PROCESSING'))`);
      } else {
        conditions.push(`id IN (SELECT letter_id FROM ocr_records WHERE status = ?)`);
        params.push(filter.ocrStatus);
      }
    }
    if (filter.startDate) {
      conditions.push(`letter_date >= ?`);
      params.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push(`letter_date <= ?`);
      params.push(filter.endDate);
    }
    if (filter.sender) {
      conditions.push(`sender LIKE ?`);
      params.push(`%${filter.sender}%`);
    }
    if (filter.recipient) {
      conditions.push(`recipient LIKE ?`);
      params.push(`%${filter.recipient}%`);
    }
    if (filter.vemNumber) {
      conditions.push(`vem_number LIKE ?`);
      params.push(`%${filter.vemNumber}%`);
    }
    if (filter.search) {
      conditions.push(`(subject LIKE ? OR reference_number LIKE ? OR vem_number LIKE ? OR sender LIKE ? OR recipient LIKE ?)`);
      const s = `%${filter.search}%`;
      params.push(s, s, s, s, s);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Count query
    const countRow = await this.get<{ count: number }>(`SELECT COUNT(*) as count FROM letters ${whereClause}`, params);
    const total = countRow?.count || 0;

    // Data query
    const sortBy = filter.sortBy && ['created_at', 'letter_date', 'reference_number', 'subject', 'priority'].includes(filter.sortBy)
      ? filter.sortBy
      : 'created_at';
    const sortOrder = filter.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 20;
    const offset = filter.offset && filter.offset >= 0 ? filter.offset : 0;

    const dataQuery = `SELECT * FROM letters ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    const rows = await this.all<any>(dataQuery, [...params, limit, offset]);

    return {
      letters: rows.map(r => this.mapRowToLetter(r)),
      total
    };
  }

  public async updateLetter(letter: Letter): Promise<void> {
    await this.run(
      `UPDATE letters SET 
        reference_number = ?,
        vem_number = ?,
        type = ?,
        sender = ?,
        recipient = ?,
        subject = ?,
        letter_date = ?,
        received_sent_date = ?,
        status = ?,
        priority = ?,
        due_date = ?,
        tags = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        letter.referenceNumber,
        letter.vemNumber,
        letter.type,
        letter.sender,
        letter.recipient,
        letter.subject,
        letter.letterDate,
        letter.receivedSentDate,
        letter.status,
        letter.priority,
        letter.dueDate,
        JSON.stringify(letter.tags),
        letter.updatedAt,
        letter.id
      ]
    );
  }

  public async deleteLetter(id: string): Promise<void> {
    await this.run(`DELETE FROM letters WHERE id = ?`, [id]);
    await this.run(`DELETE FROM attachments WHERE letter_id = ?`, [id]);
    await this.run(`DELETE FROM ocr_records WHERE letter_id = ?`, [id]);
  }

  public async saveAttachment(attachment: Attachment): Promise<void> {
    await this.run(
      `INSERT INTO attachments (id, letter_id, original_name, stored_filename, file_path, mime_type, file_size, checksum, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attachment.id,
        attachment.letterId,
        attachment.originalName,
        attachment.storedFilename,
        attachment.filePath,
        attachment.mimeType,
        attachment.fileSize,
        attachment.checksum,
        attachment.createdAt
      ]
    );
  }

  public async getAttachmentsByLetterId(letterId: string): Promise<Attachment[]> {
    const rows = await this.all<any>(`SELECT * FROM attachments WHERE letter_id = ? ORDER BY created_at ASC`, [letterId]);
    return rows.map(r => this.mapRowToAttachment(r));
  }

  public async getAttachmentById(id: string): Promise<Attachment | null> {
    const row = await this.get<any>(`SELECT * FROM attachments WHERE id = ?`, [id]);
    return row ? this.mapRowToAttachment(row) : null;
  }

  public async deleteAttachment(id: string): Promise<void> {
    await this.run(`DELETE FROM attachments WHERE id = ?`, [id]);
    await this.run(`DELETE FROM ocr_records WHERE attachment_id = ?`, [id]);
  }

  public async saveOCRRecord(record: OCRRecord): Promise<void> {
    await this.run(
      `INSERT INTO ocr_records (id, letter_id, attachment_id, extracted_text, confidence, page_count, status, error_message, processed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.letterId,
        record.attachmentId,
        record.extractedText,
        record.confidence,
        record.pageCount,
        record.status,
        record.errorMessage,
        record.processedAt
      ]
    );
  }

  public async getOCRRecordByLetterId(letterId: string): Promise<OCRRecord | null> {
    const row = await this.get<any>(`SELECT * FROM ocr_records WHERE letter_id = ? ORDER BY processed_at DESC LIMIT 1`, [letterId]);
    return row ? this.mapRowToOCRRecord(row) : null;
  }

  public async getOCRRecordByAttachmentId(attachmentId: string): Promise<OCRRecord | null> {
    const row = await this.get<any>(`SELECT * FROM ocr_records WHERE attachment_id = ? LIMIT 1`, [attachmentId]);
    return row ? this.mapRowToOCRRecord(row) : null;
  }

  public async updateOCRRecord(record: OCRRecord): Promise<void> {
    await this.run(
      `UPDATE ocr_records SET 
        extracted_text = ?,
        confidence = ?,
        page_count = ?,
        status = ?,
        error_message = ?,
        processed_at = ?
      WHERE id = ?`,
      [
        record.extractedText,
        record.confidence,
        record.pageCount,
        record.status,
        record.errorMessage,
        record.processedAt,
        record.id
      ]
    );
  }

  public async searchLetters(query: string, limit: number = 25): Promise<SearchResult[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const searchParam = `%${cleanQuery}%`;

    // 1. Query metadata matches
    const metadataSql = `
      SELECT l.*, a.id as att_id, a.original_name, a.stored_filename, a.file_path, a.mime_type, a.file_size, a.checksum, a.created_at as att_created_at,
             o.id as ocr_id, o.extracted_text, o.confidence, o.page_count, o.status as ocr_status, o.error_message, o.processed_at as ocr_processed_at
      FROM letters l
      LEFT JOIN attachments a ON a.letter_id = l.id
      LEFT JOIN ocr_records o ON o.letter_id = l.id
      WHERE (l.subject LIKE ? OR l.reference_number LIKE ? OR l.vem_number LIKE ? OR l.sender LIKE ? OR l.recipient LIKE ? OR l.tags LIKE ?)
      LIMIT ?
    `;

    // 2. Query OCR extracted text matches
    const ocrSql = `
      SELECT l.*, a.id as att_id, a.original_name, a.stored_filename, a.file_path, a.mime_type, a.file_size, a.checksum, a.created_at as att_created_at,
             o.id as ocr_id, o.extracted_text, o.confidence, o.page_count, o.status as ocr_status, o.error_message, o.processed_at as ocr_processed_at
      FROM ocr_records o
      JOIN letters l ON l.id = o.letter_id
      LEFT JOIN attachments a ON a.id = o.attachment_id
      WHERE o.extracted_text LIKE ?
      LIMIT ?
    `;

    const [metadataRows, ocrRows] = await Promise.all([
      this.all<any>(metadataSql, [searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, limit]),
      this.all<any>(ocrSql, [searchParam, limit])
    ]);

    const results: SearchResult[] = [];
    const seenLetterIds = new Set<string>();

    // Helper to generate snippet
    const extractSnippet = (text: string, keyword: string, radius: number = 80): string => {
      const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
      if (idx === -1) return text.substring(0, radius * 2);
      const start = Math.max(0, idx - radius);
      const end = Math.min(text.length, idx + keyword.length + radius);
      let snippet = text.substring(start, end).trim();
      if (start > 0) snippet = '...' + snippet;
      if (end < text.length) snippet = snippet + '...';
      return snippet;
    };

    // Metadata hits first
    for (const r of metadataRows) {
      seenLetterIds.add(r.id);
      const letter = this.mapRowToLetter(r);
      const attachment = r.att_id ? this.mapRowToAttachment({
        id: r.att_id,
        letter_id: r.id,
        original_name: r.original_name,
        stored_filename: r.stored_filename,
        file_path: r.file_path,
        mime_type: r.mime_type,
        file_size: r.file_size,
        checksum: r.checksum,
        created_at: r.att_created_at
      }) : undefined;
      const ocrRecord = r.ocr_id ? this.mapRowToOCRRecord({
        id: r.ocr_id,
        letter_id: r.id,
        attachment_id: r.att_id,
        extracted_text: r.extracted_text,
        confidence: r.confidence,
        page_count: r.page_count,
        status: r.ocr_status,
        error_message: r.error_message,
        processed_at: r.ocr_processed_at
      }) : undefined;

      results.push({
        letter,
        attachment,
        ocrRecord,
        matchType: 'METADATA',
        matchSnippet: `Matched metadata in Subject/Sender: "${letter.subject}"`
      });
    }

    // OCR hits next
    for (const r of ocrRows) {
      if (seenLetterIds.has(r.id)) continue;
      seenLetterIds.add(r.id);

      const letter = this.mapRowToLetter(r);
      const attachment = r.att_id ? this.mapRowToAttachment({
        id: r.att_id,
        letter_id: r.id,
        original_name: r.original_name,
        stored_filename: r.stored_filename,
        file_path: r.file_path,
        mime_type: r.mime_type,
        file_size: r.file_size,
        checksum: r.checksum,
        created_at: r.att_created_at
      }) : undefined;
      const ocrRecord = this.mapRowToOCRRecord({
        id: r.ocr_id,
        letter_id: r.id,
        attachment_id: r.att_id,
        extracted_text: r.extracted_text,
        confidence: r.confidence,
        page_count: r.page_count,
        status: r.ocr_status,
        error_message: r.error_message,
        processed_at: r.ocr_processed_at
      });

      results.push({
        letter,
        attachment,
        ocrRecord,
        matchType: 'OCR',
        matchSnippet: extractSnippet(r.extracted_text || '', cleanQuery)
      });
    }

    return results;
  }

  public async getStats(): Promise<DashboardStats> {
    const totalRow = await this.get<{ count: number }>(`SELECT COUNT(*) as count FROM letters`);
    const incRow = await this.get<{ count: number }>(`SELECT COUNT(*) as count FROM letters WHERE type = 'INCOMING'`);
    const outRow = await this.get<{ count: number }>(`SELECT COUNT(*) as count FROM letters WHERE type = 'OUTGOING'`);
    const pendingOcrRow = await this.get<{ count: number }>(`SELECT COUNT(*) as count FROM ocr_records WHERE status IN ('PENDING', 'PROCESSING')`);
    const urgentRow = await this.get<{ count: number }>(`SELECT COUNT(*) as count FROM letters WHERE priority = 'URGENT'`);
    const overdueRow = await this.get<{ count: number }>(`
      SELECT COUNT(*) as count FROM letters 
      WHERE status NOT IN ('PROCESSED', 'ARCHIVED') 
        AND due_date IS NOT NULL 
        AND due_date != '' 
        AND due_date < date('now')
    `);

    const recentRows = await this.all<any>(`
      SELECT id, reference_number, subject, created_at, type 
      FROM letters 
      ORDER BY created_at DESC 
      LIMIT 6
    `);

    return {
      totalLetters: totalRow?.count || 0,
      incomingLetters: incRow?.count || 0,
      outgoingLetters: outRow?.count || 0,
      pendingOCR: pendingOcrRow?.count || 0,
      urgentLetters: urgentRow?.count || 0,
      overdueLetters: overdueRow?.count || 0,
      recentActivity: recentRows.map(r => ({
        id: r.id,
        action: `Created ${r.type.toLowerCase()} letter`,
        referenceNumber: r.reference_number,
        subject: r.subject,
        timestamp: r.created_at
      }))
    };
  }

  public async generateNextReferenceNumber(type: LetterType): Promise<string> {
    const year = new Date().getFullYear();
    const typeCode = type === 'INCOMING' ? 'IN' : 'OUT';
    
    // Read configured pattern or defaults
    const customPrefix = await this.getConfig('reference_prefix', 'LP');
    const customSep = await this.getConfig('reference_separator', '-');
    const digitsStr = await this.getConfig('reference_digits', '4');
    const digits = Math.max(3, Math.min(6, parseInt(digitsStr, 10) || 4));

    // Prefix base for querying: e.g. "LP-IN-2026-"
    const prefixBase = `${customPrefix}${customSep}${typeCode}${customSep}${year}${customSep}`;
    const pattern = `${prefixBase}%`;

    const row = await this.get<{ max_ref: string }>(
      `SELECT reference_number as max_ref FROM letters WHERE reference_number LIKE ? ORDER BY reference_number DESC LIMIT 1`,
      [pattern]
    );

    let nextSeq = 1;
    if (row && row.max_ref) {
      const parts = row.max_ref.split(customSep);
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    const padded = String(nextSeq).padStart(digits, '0');
    return `${prefixBase}${padded}`;
  }

  // User Management
  public async getUserByUsername(username: string): Promise<User | null> {
    const row = await this.get<any>(`SELECT * FROM users WHERE username = ?`, [username.trim().toLowerCase()]);
    if (!row) return null;
    return new User({
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      role: row.role as UserRole,
      avatar: row.avatar,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  public async getUserById(id: string): Promise<User | null> {
    const row = await this.get<any>(`SELECT * FROM users WHERE id = ?`, [id]);
    if (!row) return null;
    return new User({
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      role: row.role as UserRole,
      avatar: row.avatar,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  public async listUsers(): Promise<User[]> {
    const rows = await this.all<any>(`SELECT * FROM users ORDER BY created_at ASC`);
    return rows.map(r => new User({
      id: r.id,
      username: r.username,
      passwordHash: r.password_hash,
      role: r.role as UserRole,
      avatar: r.avatar,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  public async saveUser(user: User): Promise<void> {
    await this.run(
      `INSERT INTO users (id, username, password_hash, role, avatar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.username, user.passwordHash, user.role, user.avatar || null, user.createdAt, user.updatedAt]
    );
  }

  public async updateUser(user: User): Promise<void> {
    await this.run(
      `UPDATE users SET username = ?, password_hash = ?, role = ?, avatar = ?, updated_at = ? WHERE id = ?`,
      [user.username, user.passwordHash, user.role, user.avatar || null, user.updatedAt, user.id]
    );
  }

  public async deleteUser(id: string): Promise<void> {
    await this.run(`DELETE FROM users WHERE id = ?`, [id]);
  }

  // System Configuration Key-Value Store
  public async getConfig(key: string, defaultValue = ''): Promise<string> {
    const row = await this.get<{ value: string }>(`SELECT value FROM system_config WHERE key = ?`, [key]);
    return row ? row.value : defaultValue;
  }

  public async setConfig(key: string, value: string): Promise<void> {
    await this.run(
      `INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    );
  }
}
