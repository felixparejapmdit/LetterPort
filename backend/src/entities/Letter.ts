export type LetterType = 'INCOMING' | 'OUTGOING' | string;
export type LetterStatus = 'DRAFT' | 'RECEIVED' | 'UNDER_REVIEW' | 'PROCESSED' | 'ARCHIVED' | string;
export type LetterPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;

export interface LetterProps {
  id: string;
  referenceNumber: string;
  vemNumber?: string;
  type: LetterType;
  sender: string;
  recipient: string;
  subject: string;
  letterDate: string; // YYYY-MM-DD
  receivedSentDate: string; // YYYY-MM-DD
  status?: LetterStatus;
  priority?: LetterPriority;
  dueDate?: string; // YYYY-MM-DD
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export class Letter {
  private readonly _id: string;
  private _referenceNumber: string;
  private _vemNumber: string;
  private _type: LetterType;
  private _sender: string;
  private _recipient: string;
  private _subject: string;
  private _letterDate: string;
  private _receivedSentDate: string;
  private _status: LetterStatus;
  private _priority: LetterPriority;
  private _dueDate: string;
  private _tags: string[];
  private readonly _createdAt: string;
  private _updatedAt: string;

  constructor(props: LetterProps) {
    this.validate(props);

    this._id = props.id;
    this._referenceNumber = props.referenceNumber.trim();
    this._vemNumber = (props.vemNumber || '').trim();
    this._type = props.type;
    this._sender = props.sender.trim();
    this._recipient = props.recipient.trim();
    this._subject = props.subject.trim();
    this._letterDate = props.letterDate;
    this._receivedSentDate = props.receivedSentDate;
    this._status = props.status || (props.type === 'INCOMING' ? 'RECEIVED' : 'DRAFT');
    this._priority = props.priority || 'MEDIUM';
    this._dueDate = props.dueDate || '';
    this._tags = props.tags || [];
    this._createdAt = props.createdAt || new Date().toISOString();
    this._updatedAt = props.updatedAt || new Date().toISOString();
  }

  private validate(props: LetterProps): void {
    if (!props.id || props.id.trim() === '') {
      throw new Error('Letter ID cannot be empty');
    }
    if (!props.referenceNumber || props.referenceNumber.trim() === '') {
      throw new Error('Reference Number is required');
    }
    if (!props.sender || props.sender.trim() === '') {
      throw new Error('Sender cannot be empty');
    }
    if (!props.recipient || props.recipient.trim() === '') {
      throw new Error('Recipient cannot be empty');
    }
    if (!props.subject || props.subject.trim() === '') {
      throw new Error('Subject cannot be empty');
    }
    if (!props.type || props.type.trim() === '') {
      throw new Error('Letter Type cannot be empty');
    }
  }

  // Getters
  public get id(): string { return this._id; }
  public get referenceNumber(): string { return this._referenceNumber; }
  public get vemNumber(): string { return this._vemNumber; }
  public get type(): LetterType { return this._type; }
  public get sender(): string { return this._sender; }
  public get recipient(): string { return this._recipient; }
  public get subject(): string { return this._subject; }
  public get letterDate(): string { return this._letterDate; }
  public get receivedSentDate(): string { return this._receivedSentDate; }
  public get status(): LetterStatus { return this._status; }
  public get priority(): LetterPriority { return this._priority; }
  public get dueDate(): string { return this._dueDate; }
  public get tags(): string[] { return [...this._tags]; }
  public get createdAt(): string { return this._createdAt; }
  public get updatedAt(): string { return this._updatedAt; }

  // Domain behavior methods
  public updateVemNumber(newVem: string): void {
    this._vemNumber = newVem.trim();
    this._updatedAt = new Date().toISOString();
  }

  public updateStatus(newStatus: LetterStatus): void {
    this._status = newStatus;
    this._updatedAt = new Date().toISOString();
  }

  public updatePriority(newPriority: LetterPriority): void {
    this._priority = newPriority;
    this._updatedAt = new Date().toISOString();
  }

  public update(props: {
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
  }): void {
    if (props.type) this._type = props.type;
    if (props.sender !== undefined && props.sender.trim()) this._sender = props.sender.trim();
    if (props.recipient !== undefined && props.recipient.trim()) this._recipient = props.recipient.trim();
    if (props.subject !== undefined && props.subject.trim()) this._subject = props.subject.trim();
    if (props.letterDate) this._letterDate = props.letterDate;
    if (props.receivedSentDate) this._receivedSentDate = props.receivedSentDate;
    if (props.vemNumber !== undefined) this._vemNumber = props.vemNumber.trim();
    if (props.status) this._status = props.status;
    if (props.priority) this._priority = props.priority;
    if (props.dueDate !== undefined) this._dueDate = props.dueDate;
    if (props.tags) this._tags = [...props.tags];
    this._updatedAt = new Date().toISOString();
  }

  public updateMetadata(sender: string, recipient: string, subject: string, vemNumber?: string): void {
    if (!sender.trim() || !recipient.trim() || !subject.trim()) {
      throw new Error('Sender, recipient, and subject cannot be blank');
    }
    this._sender = sender.trim();
    this._recipient = recipient.trim();
    this._subject = subject.trim();
    if (vemNumber !== undefined) {
      this._vemNumber = vemNumber.trim();
    }
    this._updatedAt = new Date().toISOString();
  }

  public addTag(tag: string): void {
    const cleaned = tag.trim().toLowerCase();
    if (cleaned && !this._tags.includes(cleaned)) {
      this._tags.push(cleaned);
      this._updatedAt = new Date().toISOString();
    }
  }

  public removeTag(tag: string): void {
    const cleaned = tag.trim().toLowerCase();
    this._tags = this._tags.filter(t => t !== cleaned);
    this._updatedAt = new Date().toISOString();
  }

  public toJSON(): Record<string, any> {
    return {
      id: this._id,
      referenceNumber: this._referenceNumber,
      vemNumber: this._vemNumber,
      type: this._type,
      sender: this._sender,
      recipient: this._recipient,
      subject: this._subject,
      letterDate: this._letterDate,
      receivedSentDate: this._receivedSentDate,
      status: this._status,
      priority: this._priority,
      dueDate: this._dueDate,
      tags: this._tags,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
