import { Router } from 'express';
import { LetterController } from '../controllers/LetterController';
import { SearchController } from '../controllers/SearchController';
import { StatsController } from '../controllers/StatsController';
import { SettingsController } from '../controllers/SettingsController';
import { AuthController } from '../controllers/AuthController';
import { UserController } from '../controllers/UserController';
import { uploadMiddleware } from '../middleware/upload';

export function createLetterRoutes(
  letterController: LetterController,
  searchController: SearchController,
  statsController: StatsController,
  settingsController: SettingsController,
  authController: AuthController,
  userController: UserController
): Router {
  const router = Router();

  // Authentication Endpoints
  router.post('/auth/login', authController.login);
  router.get('/auth/me', authController.getMe);

  // User Management Endpoints (Admin)
  router.get('/users', userController.listUsers);
  router.post('/users', userController.createUser);
  router.put('/users/:id', userController.updateUser);
  router.delete('/users/:id', userController.deleteUser);

  // Dashboard Statistics
  router.get('/stats', statsController.getStats);

  // System Settings & Maintenance
  router.get('/settings', settingsController.getSettings);
  router.get('/settings/storage-info', settingsController.getStorageInfo);
  router.post('/settings/sample-data/load', settingsController.loadSampleData);
  router.post('/settings/sample-data/clear', settingsController.clearSampleData);
  router.get('/settings/backup', settingsController.exportBackup);
  router.post('/settings/restore', settingsController.restoreBackup);
  router.get('/settings/reference-format', settingsController.getReferenceFormat);
  router.put('/settings/reference-format', settingsController.updateReferenceFormat);

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
