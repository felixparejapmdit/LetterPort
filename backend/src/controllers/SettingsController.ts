import { Request, Response, NextFunction } from 'express';
import { SettingsService, NasConfig } from '../services/SettingsService';

export class SettingsController {
  private readonly settingsService: SettingsService;

  constructor(settingsService: SettingsService) {
    this.settingsService = settingsService;
  }

  public getSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const nas = this.settingsService.getNasConfig();
      const storageInfo = await this.settingsService.getStorageInfo();

      res.status(200).json({
        success: true,
        data: {
          nas,
          storageInfo
        }
      });
    } catch (err) {
      next(err);
    }
  };

  public saveNasSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config: NasConfig = req.body;
      const saved = this.settingsService.saveNasConfig(config);

      res.status(200).json({
        success: true,
        message: 'NAS server settings saved successfully.',
        data: saved
      });
    } catch (err) {
      next(err);
    }
  };

  public testNasConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config: NasConfig = req.body;
      const result = await this.settingsService.testNasConnection(config);

      res.status(200).json({
        success: result.success,
        message: result.message
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
}
