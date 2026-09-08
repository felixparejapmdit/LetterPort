import { Router } from 'express';
import { LetterController } from '../controllers/LetterController';
import { SearchController } from '../controllers/SearchController';
import { StatsController } from '../controllers/StatsController';
import { SettingsController } from '../controllers/SettingsController';
import { uploadMiddleware } from '../middleware/upload';

export function createLetterRoutes(
  letterController: LetterController,
  searchController: SearchController,
  statsController: StatsController,
  settingsController: SettingsController
): Router {
  const router = Router();

  // Dashboard Statistics
  router.get('/stats', statsController.getStats);

  // Settings & NAS Configuration
  router.get('/settings', settingsController.getSettings);
  router.post('/settings/nas', settingsController.saveNasSettings);
  router.post('/settings/nas/test', settingsController.testNasConnection);
  router.post('/settings/sample-data/load', settingsController.loadSampleData);
  router.post('/settings/sample-data/clear', settingsController.clearSampleData);
  router.get('/settings/storage-info', settingsController.getStorageInfo);

  // Full-Text Search
  router.get('/search', searchController.search);

  // Auto reference and VEM generation helpers
  router.get('/letters/next-reference', letterController.getNextReference);
  router.get('/letters/next-vem', letterController.getNextVemNumber);

  // Letters CRUD & Retrieval
  router.post('/letters', uploadMiddleware.single('file'), letterController.createLetter);
  router.get('/letters', letterController.listLetters);
  router.get('/letters/:id', letterController.getLetter);
  router.put('/letters/:id', letterController.updateLetter);
  router.delete('/letters/:id', letterController.deleteLetter);

  // File Viewing & Downloading
  router.get('/letters/:id/file', letterController.streamFile);
  router.get('/letters/:id/download', letterController.downloadFile);

  // Re-run OCR
  router.post('/letters/:id/re-ocr', letterController.reprocessOCR);

  return router;
}
