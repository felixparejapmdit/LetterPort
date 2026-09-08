import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/SettingsService';

export class SettingsController {
  private readonly settingsService: SettingsService;

  constructor(settingsService: SettingsService) {
    this.settingsService = settingsService;
  }

  public getSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const systemInfo = this.settingsService.getSystemInfo();
      const storageInfo = await this.settingsService.getStorageInfo();

      res.status(200).json({
        success: true,
        data: {
          systemInfo,
          storageInfo
        }
      });
    } catch (err) {
      next(err);
    }
  };

  public loadSampleData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.settingsService.loadSampleData();

      res.status(200).json({
        success: true,
        message: `Successfully loaded ${result.count} sample letters with documents and OCR text.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  public clearSampleData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.settingsService.clearSampleData();

      res.status(200).json({
        success: true,
        message: `Successfully cleared ${result.deleted} letters and removed attached files.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  public getStorageInfo = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const info = await this.settingsService.getStorageInfo();
      res.status(200).json({
        success: true,
        data: info
      });
    } catch (err) {
      next(err);
    }
  };

  public exportBackup = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const backup = await this.settingsService.exportBackup();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `letterport-backup-${dateStr}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(JSON.stringify(backup, null, 2));
    } catch (err) {
      next(err);
    }
  };

  public restoreBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.settingsService.restoreBackup(req.body);
      res.status(200).json({
        success: true,
        message: `Successfully restored ${result.restored} letters from backup.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  };
}
