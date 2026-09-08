import { Request, Response, NextFunction } from 'express';
import { LetterService } from '../services/LetterService';
import { LetterType, LetterStatus, LetterPriority } from '../entities/Letter';
import path from 'path';

export class LetterController {
  private readonly letterService: LetterService;

  constructor(letterService: LetterService) {
    this.letterService = letterService;
  }

  public createLetter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        referenceNumber,
        vemNumber,
        type,
        sender,
        recipient,
        subject,
        letterDate,
        receivedSentDate,
        status,
        priority,
        tags
      } = req.body;

      if (!type || !sender || !recipient || !subject) {
        res.status(400).json({
          success: false,
          error: { message: 'Fields type, sender, recipient, and subject are mandatory' }
        });
        return;
      }

      let parsedTags: string[] = [];
      if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }

      const file = req.file ? {
        tempFilePath: req.file.path,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      } : undefined;

      const details = await this.letterService.createLetter({
        referenceNumber,
        vemNumber,
        type: type as LetterType,
        sender,
        recipient,
        subject,
        letterDate: letterDate || new Date().toISOString().split('T')[0],
        receivedSentDate: receivedSentDate || new Date().toISOString().split('T')[0],
        status: status as LetterStatus,
        priority: priority as LetterPriority,
        tags: parsedTags,
        file
      });

      res.status(201).json({
        success: true,
        data: {
          letter: details.letter.toJSON(),
          attachments: details.attachments.map(a => a.toJSON()),
          ocrRecord: details.ocrRecord ? details.ocrRecord.toJSON() : null
        }
      });
    } catch (err) {
      next(err);
    }
  };

  public getLetter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const details = await this.letterService.getLetterDetails(id);

      if (!details) {
        res.status(404).json({
          success: false,
          error: { message: `Letter with ID ${id} not found` }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          letter: details.letter.toJSON(),
          attachments: details.attachments.map(a => a.toJSON()),
          ocrRecord: details.ocrRecord ? details.ocrRecord.toJSON() : null
        }
      });
    } catch (err) {
      next(err);
    }
  };

  public listLetters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        type,
        status,
        startDate,
        endDate,
        sender,
        recipient,
        search,
        page = '1',
        limit = '20',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 20;
      const offset = (pageNum - 1) * limitNum;

      const result = await this.letterService.listLetters({
        type: type as LetterType,
        status: status as LetterStatus,
        startDate: startDate as string,
        endDate: endDate as string,
        sender: sender as string,
        recipient: recipient as string,
        search: search as string,
        limit: limitNum,
        offset,
        sortBy: sortBy as string,
        sortOrder: (sortOrder as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
      });

      res.status(200).json({
        success: true,
        data: {
          letters: result.letters.map(l => l.toJSON()),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: result.total,
            totalPages: Math.ceil(result.total / limitNum)
          }
        }
      });
    } catch (err) {
      next(err);
    }
  };

  public updateLetter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { sender, recipient, subject, vemNumber, status, priority, tags } = req.body;

      const updated = await this.letterService.updateLetter(id, {
        sender,
        recipient,
        subject,
        vemNumber,
        status: status as LetterStatus,
        priority: priority as LetterPriority,
        tags
      });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: { message: `Letter with ID ${id} not found` }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { letter: updated.toJSON() }
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteLetter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.letterService.deleteLetter(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: { message: `Letter with ID ${id} not found` }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Letter and associated documents successfully deleted'
      });
    } catch (err) {
      next(err);
    }
  };

  public streamFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const details = await this.letterService.getLetterDetails(id);

      if (!details || details.attachments.length === 0) {
        res.status(404).json({ success: false, error: { message: 'Document file not found' } });
        return;
      }

      const attachment = details.attachments[0];
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.originalName)}"`);

      const fileStream = (this.letterService as any).storageService.getFileStream(attachment.filePath);
      fileStream.pipe(res);
    } catch (err) {
      next(err);
    }
  };

  public downloadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const details = await this.letterService.getLetterDetails(id);

      if (!details || details.attachments.length === 0) {
        res.status(404).json({ success: false, error: { message: 'Document file not found' } });
        return;
      }

      const attachment = details.attachments[0];
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.originalName)}"`);

      const fileStream = (this.letterService as any).storageService.getFileStream(attachment.filePath);
      fileStream.pipe(res);
    } catch (err) {
      next(err);
    }
  };

  public reprocessOCR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const queued = await this.letterService.reprocessOCR(id);

      if (!queued) {
        res.status(404).json({
          success: false,
          error: { message: 'Cannot re-run OCR: letter or document attachment not found' }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'OCR re-processing queued successfully'
      });
    } catch (err) {
      next(err);
    }
  };

  public getNextReference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = (req.query.type as LetterType) || 'INCOMING';
      const ref = await this.letterService.generateNextReference(type);
      res.status(200).json({ success: true, data: { referenceNumber: ref } });
    } catch (err) {
      next(err);
    }
  };

  public getNextVemNumber = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vem = await this.letterService.generateNextVemNumber();
      res.status(200).json({ success: true, data: { vemNumber: vem } });
    } catch (err) {
      next(err);
    }
  };
}
