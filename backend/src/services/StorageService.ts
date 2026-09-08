import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StoredFileInfo {
  storedFilename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
}

export interface IStorageService {
  saveFile(tempFilePath: string, originalName: string, mimeType: string): Promise<StoredFileInfo>;
  saveBuffer(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFileInfo>;
  getFileStream(filePath: string): fs.ReadStream;
  deleteFile(filePath: string): Promise<void>;
  fileExists(filePath: string): boolean;
  getAbsolutePath(relativeOrAbs: string): string;
}

export class LocalStorageService implements IStorageService {
  private readonly storageDir: string;

  constructor(storageDir: string) {
    this.storageDir = path.resolve(storageDir);
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  public getAbsolutePath(relativeOrAbs: string): string {
    if (path.isAbsolute(relativeOrAbs)) {
      return relativeOrAbs;
    }
    return path.join(this.storageDir, relativeOrAbs);
  }

  public fileExists(filePath: string): boolean {
    const fullPath = this.getAbsolutePath(filePath);
    return fs.existsSync(fullPath);
  }

  public async saveFile(tempFilePath: string, originalName: string, mimeType: string): Promise<StoredFileInfo> {
    const fileBuffer = await fs.promises.readFile(tempFilePath);
    const result = await this.saveBuffer(fileBuffer, originalName, mimeType);
    
    // Clean up temporary file
    try {
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath);
      }
    } catch (err) {
      console.warn(`Warning: Could not remove temporary file ${tempFilePath}:`, err);
    }

    return result;
  }

  public async saveBuffer(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFileInfo> {
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const ext = path.extname(originalName) || '.bin';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const storedFilename = `${uniqueSuffix}${ext}`;
    const destinationPath = path.join(this.storageDir, storedFilename);

    await fs.promises.writeFile(destinationPath, buffer);

    return {
      storedFilename,
      filePath: destinationPath,
      fileSize: buffer.length,
      mimeType,
      checksum: hash
    };
  }

  public getFileStream(filePath: string): fs.ReadStream {
    const fullPath = this.getAbsolutePath(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    return fs.createReadStream(fullPath);
  }

  public async deleteFile(filePath: string): Promise<void> {
    const fullPath = this.getAbsolutePath(filePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }
}
