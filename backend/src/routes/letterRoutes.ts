import { Router } from 'express';
import { LetterController } from '../controllers/LetterController';
import { SearchController } from '../controllers/SearchController';
import { StatsController } from '../controllers/StatsController';
import { SettingsController } from '../controllers/SettingsController';
import { AuthController } from '../controllers/AuthController';
import { UserController } from '../controllers/UserController';
import { ClassificationController } from '../controllers/ClassificationController';
import { uploadMiddleware } from '../middleware/upload';

export function createLetterRoutes(
  letterController: LetterController,
  searchController: SearchController,
  statsController: StatsController,
  settingsController: SettingsController,
  authController: AuthController,
  userController: UserController,
  classificationController: ClassificationController
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

  // Roles Management Endpoints
  router.get('/roles', classificationController.listRoles);
  router.post('/roles', classificationController.createRole);
  router.put('/roles/:id', classificationController.updateRole);
  router.delete('/roles/:id', classificationController.deleteRole);

  // People Directory Endpoints
  router.get('/people', classificationController.listPeople);
  router.post('/people', classificationController.createPerson);
  router.delete('/people/:id', classificationController.deletePerson);

  // Document Classifications Endpoints
  // Statuses
  router.get('/classifications/statuses', classificationController.listStatuses);
  router.post('/classifications/statuses', classificationController.createStatus);
  router.put('/classifications/statuses/:id', classificationController.updateStatus);
  router.delete('/classifications/statuses/:id', classificationController.deleteStatus);

  // Priorities
  router.get('/classifications/priorities', classificationController.listPriorities);
  router.post('/classifications/priorities', classificationController.createPriority);
  router.put('/classifications/priorities/:id', classificationController.updatePriority);
  router.delete('/classifications/priorities/:id', classificationController.deletePriority);

  // Letter Types
  router.get('/classifications/types', classificationController.listTypes);
  router.post('/classifications/types', classificationController.createType);
  router.put('/classifications/types/:id', classificationController.updateType);
  router.delete('/classifications/types/:id', classificationController.deleteType);

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
  router.get('/settings/permissions', settingsController.getPermissions);
  router.put('/settings/permissions', settingsController.updatePermissions);

  // Full-Text Search
  router.get('/search', searchController.search);

  // Auto reference and VEM generation helpers
  router.get('/letters/next-reference', letterController.getNextReference);
  router.get('/letters/next-vem', letterController.getNextVemNumber);

  // Letters CRUD & Retrieval (Supports single 'file' and multiple 'files')
  router.post('/letters', uploadMiddleware.any(), letterController.createLetter);
  router.get('/letters', letterController.listLetters);
  router.get('/letters/:id', letterController.getLetter);
  router.put('/letters/:id', letterController.updateLetter);
  router.delete('/letters/:id', letterController.deleteLetter);

  // Letter Attachment Management
  router.post('/letters/:id/attachments', uploadMiddleware.single('file'), letterController.addAttachment);
  router.delete('/letters/:id/attachments/:attachmentId', letterController.deleteAttachment);
  router.post('/letters/:id/attachments/combine', uploadMiddleware.single('file'), letterController.combineAttachments);
  router.get('/letters/:id/attachments/:attachmentId/file', letterController.streamFile);
  router.get('/letters/:id/attachments/:attachmentId/download', letterController.downloadFile);

  // File Viewing & Downloading (legacy fallback to first attachment)
  router.get('/letters/:id/file', letterController.streamFile);
  router.get('/letters/:id/download', letterController.downloadFile);

  // Re-run OCR
  router.post('/letters/:id/re-ocr', letterController.reprocessOCR);

  return router;
}
