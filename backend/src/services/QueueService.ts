import EventEmitter from 'events';

export interface OCRJob {
  letterId: string;
  attachmentId: string;
  enqueuedAt: string;
}

export interface IQueueService {
  enqueueOCRJob(letterId: string, attachmentId: string): Promise<void>;
  processJobs(handler: (job: OCRJob) => Promise<void>): void;
}

export class LocalQueueService extends EventEmitter implements IQueueService {
  private queue: OCRJob[] = [];
  private isProcessing: boolean = false;
  private handler: ((job: OCRJob) => Promise<void>) | null = null;

  constructor() {
    super();
  }

  public async enqueueOCRJob(letterId: string, attachmentId: string): Promise<void> {
    const job: OCRJob = {
      letterId,
      attachmentId,
      enqueuedAt: new Date().toISOString()
    };
    this.queue.push(job);
    console.log(`[Queue] Job enqueued for Letter ${letterId} (Attachment ${attachmentId}). Queue size: ${this.queue.length}`);
    this.triggerNext();
  }

  public processJobs(handler: (job: OCRJob) => Promise<void>): void {
    this.handler = handler;
    this.triggerNext();
  }

  private async triggerNext(): Promise<void> {
    if (this.isProcessing || !this.handler || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift();

    if (job) {
      try {
        console.log(`[Queue] Processing OCR Job for Letter ${job.letterId}...`);
        await this.handler(job);
        console.log(`[Queue] Completed OCR Job for Letter ${job.letterId}.`);
      } catch (err) {
        console.error(`[Queue] Failed processing OCR Job for Letter ${job.letterId}:`, err);
      }
    }

    this.isProcessing = false;

    // Continue with next job if available
    if (this.queue.length > 0) {
      setImmediate(() => this.triggerNext());
    }
  }
}
