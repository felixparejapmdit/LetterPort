import { Request, Response, NextFunction } from 'express';
import { LetterService } from '../services/LetterService';

export class StatsController {
  private readonly letterService: LetterService;

  constructor(letterService: LetterService) {
    this.letterService = letterService;
  }

  public getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.letterService.getStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  };
}
