import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { SqliteLetterRepository } from './repositories/SqliteLetterRepository';
import { PocketBaseLetterRepository } from './repositories/PocketBaseLetterRepository';
import { ILetterRepository } from './repositories/ILetterRepository';
import { LocalStorageService } from './services/StorageService';
import { TesseractOCRService } from './services/OCRService';
import { LocalQueueService } from './services/QueueService';
import { LetterService } from './services/LetterService';
import { SettingsService } from './services/SettingsService';
import { LetterController } from './controllers/LetterController';
import { SearchController } from './controllers/SearchController';
import { StatsController } from './controllers/StatsController';
import { SettingsController } from './controllers/SettingsController';
import { createLetterRoutes } from './routes/letterRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '8766', 10);
const DB_PATH = path.resolve(process.env.DATABASE_FILE || './data/letterport.db');
// Zero-Config file storage: /app/documents inside Docker, ./letterport_data for local development
const STORAGE_DIR = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : fs.existsSync('/app/documents')
    ? '/app/documents'
    : path.resolve('./letterport_data');
const DB_TYPE = process.env.DATABASE_TYPE || 'sqlite';
const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';

async function bootstrap() {
  const app = express();

  // Ensure necessary runtime directories exist
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  // 1. Dependency Injection Wiring (OOP Architecture)
  let repository: ILetterRepository;

  if (DB_TYPE === 'pocketbase') {
    console.log(`[Bootstrap] Initializing PocketBase repository at ${PB_URL}...`);
    const pbRepo = new PocketBaseLetterRepository(PB_URL);
    await pbRepo.init();
    if (pbRepo.isAvailable()) {
      repository = pbRepo;
    } else {
      console.warn(`[Bootstrap] PocketBase not reachable. Falling back to local SQLite at ${DB_PATH}...`);
      const sqliteRepo = new SqliteLetterRepository(DB_PATH);
      await sqliteRepo.init();
      repository = sqliteRepo;
    }
  } else {
    console.log(`[Bootstrap] Initializing database at ${DB_PATH}...`);
    const sqliteRepo = new SqliteLetterRepository(DB_PATH);
    await sqliteRepo.init();
    repository = sqliteRepo;
  }

  console.log(`[Bootstrap] Initializing storage at ${STORAGE_DIR}...`);
  const storageService = new LocalStorageService(STORAGE_DIR);

  console.log('[Bootstrap] Initializing OCR Service (Tesseract)...');
  const ocrService = new TesseractOCRService(process.env.OCR_LANGUAGE || 'eng');

  console.log('[Bootstrap] Initializing Queue Service...');
  const queueService = new LocalQueueService();

  console.log('[Bootstrap] Initializing Letter Domain Service...');
  const letterService = new LetterService(repository, storageService, ocrService, queueService);

  console.log('[Bootstrap] Initializing Settings & NAS Service...');
  const settingsService = new SettingsService(repository, storageService, DB_PATH);

  // 2. Controllers
  const letterController = new LetterController(letterService);
  const searchController = new SearchController(letterService);
  const statsController = new StatsController(letterService);
  const settingsController = new SettingsController(settingsService);

  // 3. Express Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static uploads & documents serving if needed
  app.use('/uploads', express.static(STORAGE_DIR));
  app.use('/documents', express.static(STORAGE_DIR));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'LetterPort Backend API', timestamp: new Date() });
  });

  // 4. Register Routes
  const router = createLetterRoutes(letterController, searchController, statsController, settingsController);
  app.use('/api', router);

  // 5. Centralized Error Handler
  app.use(errorHandler);

  // 6. Start Server
  const server = app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 LetterPort Backend API running on port ${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/health`);
    console.log(`   API Base:     http://localhost:${PORT}/api`);
    console.log(`=================================================`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nGracefully shutting down LetterPort server...');
    server.close(() => {
      console.log('Server closed successfully.');
      process.exit(0);
    });
  };

  process.on('uncaughtException', (err) => {
    console.error('[Process Error] Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[Process Error] Unhandled Rejection:', reason);
  });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
