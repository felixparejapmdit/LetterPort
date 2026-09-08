export type OCRStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface OCRRecordProps {
  id: string;
  letterId: string;
  attachmentId: string;
  extractedText?: string;
  confidence?: number;
  pageCount?: number;
  status?: OCRStatus;
  errorMessage?: string;
  processedAt?: string;
}

export class OCRRecord {
  private readonly _id: string;
  private readonly _letterId: string;
  private readonly _attachmentId: string;
  private _extractedText: string;
  private _confidence: number;
  private _pageCount: number;
  private _status: OCRStatus;
  private _errorMessage: string | null;
  private _processedAt: string | null;

  constructor(props: OCRRecordProps) {
    if (!props.id) throw new Error('OCRRecord ID is required');
    if (!props.letterId) throw new Error('Letter ID is required');
    if (!props.attachmentId) throw new Error('Attachment ID is required');

    this._id = props.id;
    this._letterId = props.letterId;
    this._attachmentId = props.attachmentId;
    this._extractedText = props.extractedText || '';
    this._confidence = props.confidence ?? 0;
    this._pageCount = props.pageCount ?? 1;
    this._status = props.status || 'PENDING';
    this._errorMessage = props.errorMessage || null;
    this._processedAt = props.processedAt || null;
  }

  public get id(): string { return this._id; }
  public get letterId(): string { return this._letterId; }
  public get attachmentId(): string { return this._attachmentId; }
  public get extractedText(): string { return this._extractedText; }
  public get confidence(): number { return this._confidence; }
  public get pageCount(): number { return this._pageCount; }
  public get status(): OCRStatus { return this._status; }
  public get errorMessage(): string | null { return this._errorMessage; }
  public get processedAt(): string | null { return this._processedAt; }

  public markProcessing(): void {
    this._status = 'PROCESSING';
  }

  public complete(text: string, confidence: number, pageCount: number = 1): void {
    this._status = 'COMPLETED';
    this._extractedText = text;
    this._confidence = confidence;
    this._pageCount = pageCount;
    this._errorMessage = null;
    this._processedAt = new Date().toISOString();
  }

  public fail(errorMessage: string): void {
    this._status = 'FAILED';
    this._errorMessage = errorMessage;
    this._processedAt = new Date().toISOString();
  }

  public toJSON(): Record<string, any> {
    return {
      id: this._id,
      letterId: this._letterId,
      attachmentId: this._attachmentId,
      extractedText: this._extractedText,
      confidence: this._confidence,
      pageCount: this._pageCount,
      status: this._status,
      errorMessage: this._errorMessage,
      processedAt: this._processedAt
    };
  }
}
