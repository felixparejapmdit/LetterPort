import { Request, Response, NextFunction } from 'express';
import { LetterService } from '../services/LetterService';

export class SearchController {
  private readonly letterService: LetterService;

  constructor(letterService: LetterService) {
    this.letterService = letterService;
  }

  public search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, limit = '30' } = req.query;

      if (!q || typeof q !== 'string' || !q.trim()) {
        res.status(200).json({
          success: true,
          data: {
            results: [],
            total: 0
          }
        });
        return;
      }

      const limitNum = parseInt(limit as string, 10) || 30;
      const results = await this.letterService.search(q.trim(), limitNum);

      res.status(200).json({
        success: true,
        data: {
          query: q.trim(),
          total: results.length,
          results: results.map(r => ({
            letter: r.letter.toJSON(),
            attachment: r.attachment ? r.attachment.toJSON() : null,
            ocrRecord: r.ocrRecord ? r.ocrRecord.toJSON() : null,
            matchSnippet: r.matchSnippet,
            matchType: r.matchType
          }))
        }
      });
    } catch (err) {
      next(err);
    }
  };
}
