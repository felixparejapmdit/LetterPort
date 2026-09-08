export interface AttachmentProps {
  id: string;
  letterId: string;
  originalName: string;
  storedFilename: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  checksum?: string;
  createdAt?: string;
}

export class Attachment {
  private readonly _id: string;
  private readonly _letterId: string;
  private readonly _originalName: string;
  private readonly _storedFilename: string;
  private readonly _filePath: string;
  private readonly _mimeType: string;
  private readonly _fileSize: number;
  private readonly _checksum: string;
  private readonly _createdAt: string;

  constructor(props: AttachmentProps) {
    if (!props.id) throw new Error('Attachment ID is required');
    if (!props.letterId) throw new Error('Letter ID is required');
    if (!props.storedFilename) throw new Error('Stored filename is required');

    this._id = props.id;
    this._letterId = props.letterId;
    this._originalName = props.originalName;
    this._storedFilename = props.storedFilename;
    this._filePath = props.filePath;
    this._mimeType = props.mimeType;
    this._fileSize = props.fileSize;
    this._checksum = props.checksum || '';
    this._createdAt = props.createdAt || new Date().toISOString();
  }

  public get id(): string { return this._id; }
  public get letterId(): string { return this._letterId; }
  public get originalName(): string { return this._originalName; }
  public get storedFilename(): string { return this._storedFilename; }
  public get filePath(): string { return this._filePath; }
  public get mimeType(): string { return this._mimeType; }
  public get fileSize(): number { return this._fileSize; }
  public get checksum(): string { return this._checksum; }
  public get createdAt(): string { return this._createdAt; }

  public isPdf(): boolean {
    return this._mimeType === 'application/pdf' || this._originalName.toLowerCase().endsWith('.pdf');
  }

  public isImage(): boolean {
    return this._mimeType.startsWith('image/');
  }

  public toJSON(): Record<string, any> {
    return {
      id: this._id,
      letterId: this._letterId,
      originalName: this._originalName,
      storedFilename: this._storedFilename,
      filePath: this._filePath,
      mimeType: this._mimeType,
      fileSize: this._fileSize,
      checksum: this._checksum,
      createdAt: this._createdAt,
      isPdf: this.isPdf(),
      isImage: this.isImage()
    };
  }
}
