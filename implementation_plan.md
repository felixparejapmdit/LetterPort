# Implementation Plan: Robust Letter Management System (LetterPort LMS)

Review of [PLAN.md](file:///d:/PROJECTS/LetterPort/PLAN.md) and technical blueprint to implement, configure, and run the Letter Management System.

---

## 1. Executive Summary & Review of PLAN.md

The [PLAN.md](file:///d:/PROJECTS/LetterPort/PLAN.md) outlines a complete Letter Management System (LMS) designed to digitize, index, search, and manage incoming and outgoing letters.
Key architectural highlights from the review:
1. **SRS**: Letter encoding (Reference No, Type [Incoming/Outgoing], Dates, Sender, Recipient, Subject, Priority, Status), secure file storage (PDF & images), automated background OCR processing, and advanced full-text search across both metadata and extracted OCR text.
2. **SDD & OOP Architecture**: Strict Service-Repository pattern in TypeScript.
   - Presentation Layer: `LetterController`, `SearchController`, `StatsController`.
   - Service Layer: `LetterService`, `OCRService` (`IOCRService` polymorphic base), `StorageService` (`IStorageService` interface), and `QueueService` (`IQueueService`).
   - Repository Layer: `ILetterRepository` encapsulating relational data access and full-text search queries.
   - Domain Entities: `Letter`, `DocumentAttachment`, `OCRRecord`.
3. **Infrastructure**:
   - Production containerization via `docker-compose.yml` (`web`, `api`, `worker`, `db`, `redis`, `nginx`).
   - Dual-runtime compatibility: Full Docker deployment for Proxmox/Linux servers, paired with a seamless direct local Node.js runner (`npm run dev`) so that the application can be built, tested, and run directly on Windows immediately.

---

## 2. Proposed System Architecture

### Directory Structure
```
LetterPort/
├── backend/                  # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── entities/         # Domain entities (Letter, Attachment, OCRRecord)
│   │   ├── repositories/     # Data access layer (ILetterRepository, Sqlite/PgRepository)
│   │   ├── services/         # Business logic layer (LetterService, OCRService, StorageService, QueueService)
│   │   ├── controllers/      # Presentation/HTTP layer (LetterController, SearchController, StatsController)
│   │   ├── routes/           # Express router definitions
│   │   ├── middleware/       # Multer upload, error handler, validation
│   │   └── index.ts          # Server entrypoint
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── worker/                   # Background OCR Worker service
│   ├── src/
│   │   ├── worker.ts         # OCR job queue consumer
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Next.js 14+ (App Router) + Tailwind CSS + Lucide Icons
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Root layout with responsive navigation & theme
│   │   │   ├── page.tsx      # Dashboard: stats widgets, quick actions, recent letters
│   │   │   ├── letters/
│   │   │   │   ├── page.tsx  # Letter repository table with filters & pagination
│   │   │   │   └── [id]/page.tsx # Detailed view: PDF/image viewer + side-by-side OCR text viewer + metadata
│   │   │   ├── encode/page.tsx # Letter Encoding & multi-file upload form
│   │   │   └── search/page.tsx # Full-text search with OCR snippets & keyword highlighting
│   │   ├── components/       # Reusable components (PDFViewer, OCRViewer, StatusBadge, UploadZone)
│   │   └── lib/api.ts        # Type-safe API client
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.ts
├── docker/
│   └── nginx/
│       ├── default.conf      # Reverse proxy: /api -> api:5000, / -> web:3000, /uploads/
│       └── Dockerfile
├── uploads/                  # Document storage volume (PDFs, scans, images)
├── docker-compose.yml        # Multi-container orchestration (api, worker, web, db, redis, nginx)
├── .env.example              # Environment variables template
├── package.json              # Root workspace orchestrator
└── start-dev.bat             # One-click Windows runner
```

---

## 3. Detailed Component Design

### 3.1 Backend & OOP Implementation
- **Entities**:
  - `Letter`: Properties (`id`, `referenceNumber`, `type` [INCOMING/OUTGOING], `sender`, `recipient`, `subject`, `letterDate`, `receivedSentDate`, `status`, `priority`, `tags`, `createdAt`, `updatedAt`). Domain methods for validation, status transitions, and reference code formatting.
  - `Attachment`: Properties (`id`, `letterId`, `originalName`, `storedFilename`, `filePath`, `mimeType`, `fileSize`, `checksum`).
  - `OCRRecord`: Properties (`id`, `letterId`, `attachmentId`, `extractedText`, `confidence`, `pageCount`, `status` [PENDING, PROCESSING, COMPLETED, FAILED], `errorMessage`, `processedAt`).
- **OOP Services & Polymorphism**:
  - `IStorageService`: Interface with `saveFile()`, `getFileStream()`, `deleteFile()`, `getFilePath()`. Implemented by `LocalStorageService` (with SHA-256 integrity verification) and extensible for `S3StorageService`.
  - `IOCRService`: Abstract base class with `extractText(filePath: string): Promise<OCRResult>`. Implemented by `TesseractOCRService` (using `tesseract.js` for standalone portability across Node.js/Windows/Linux without needing native C++ binaries, with support for system Tesseract).
  - `IQueueService`: Interface with `addJob(letterId: string, attachmentId: string)`, `processJobs(handler)`. Implemented by `BullMQQueueService` (for Redis) and a lightweight `LocalQueueService` (for local zero-dependency execution).
  - `ILetterRepository`: Repository interface for saving, querying with filters, full-text searching (matching title, reference, sender, recipient, and OCR content), and updating OCR status.
- **REST Endpoints**:
  - `POST /api/letters`: Multipart form upload (letter metadata + PDF/image file). Stores file, creates DB record, enqueues OCR job.
  - `GET /api/letters`: List letters with pagination, sorting, and filter by type/status/date.
  - `GET /api/letters/:id`: Get letter details, attachments, and OCR record.
  - `PUT /api/letters/:id`: Update letter metadata or status.
  - `DELETE /api/letters/:id`: Delete letter and associated files.
  - `POST /api/letters/:id/re-ocr`: Manually trigger or re-run OCR.
  - `GET /api/letters/:id/download`: Secure file download with proper disposition headers.
  - `GET /api/letters/:id/file`: Stream file inline for browser PDF/image viewing.
  - `GET /api/search`: Advanced full-text search across metadata and extracted OCR content.
  - `GET /api/stats`: Dashboard summary counts (total, incoming, outgoing, pending OCR, recent activity).

### 3.2 Frontend UI/UX (Next.js + Tailwind CSS)
- **Visual Design**: Sleek modern dashboard with dark/light theme, custom typography (Inter), glassmorphism cards, and responsive layout.
- **Letter Encoding Form**:
  - Drag-and-drop file upload with live preview for PDF and images.
  - Form validation with automatic Reference Number generation (e.g. `REF-2026-0001`).
  - Metadata inputs: Type (Incoming / Outgoing), Sender, Recipient, Subject, Letter Date, Received Date, Priority (Low/Medium/High/Urgent), Status, and Tags.
- **Document Viewer & Split View**:
  - In-browser interactive PDF & Image viewer.
  - Side-by-side OCR text viewer displaying extracted content, confidence score, copy-to-clipboard, and quick search within document.
- **Advanced Search View**:
  - Instant debounced search bar querying both metadata and full OCR extracted text.
  - Search hit cards displaying matched text snippets with highlighted keywords.
- **Dashboard**:
  - Key metrics: Total Letters, Incoming vs Outgoing, Pending OCR Processing, High Priority.
  - Recent activity timeline and quick actions.

### 3.3 Containerization & Production (Docker)
- `docker-compose.yml` configured with 6 services:
  1. `web`: Next.js frontend on port 3000.
  2. `api`: Express backend on port 5000.
  3. `worker`: Node.js OCR worker consuming Redis queue.
  4. `db`: PostgreSQL 16 relational database with persistent volume.
  5. `redis`: Redis 7 Alpine for job queuing.
  6. `nginx`: Nginx reverse proxy on port 80/443.
- Health checks, network isolation (`lms-network`), and shared `storage_volume`.

---

## 4. Proposed Changes by Component

### Root Configuration
#### [NEW] [package.json](file:///d:/PROJECTS/LetterPort/package.json)
- Orchestration scripts (`dev`, `build`, `start`, `test`).
#### [NEW] [docker-compose.yml](file:///d:/PROJECTS/LetterPort/docker-compose.yml)
- Complete 6-service Docker Compose specification.
#### [NEW] [.env.example](file:///d:/PROJECTS/LetterPort/.env.example)
- Default configuration values.
#### [NEW] [start-dev.bat](file:///d:/PROJECTS/LetterPort/start-dev.bat)
- Batch script for launching both backend and frontend locally in one command.

### Backend (`/backend`)
#### [NEW] [backend/package.json](file:///d:/PROJECTS/LetterPort/backend/package.json)
#### [NEW] [backend/tsconfig.json](file:///d:/PROJECTS/LetterPort/backend/tsconfig.json)
#### [NEW] [backend/Dockerfile](file:///d:/PROJECTS/LetterPort/backend/Dockerfile)
#### [NEW] [backend/src/index.ts](file:///d:/PROJECTS/LetterPort/backend/src/index.ts)
#### [NEW] [backend/src/entities/Letter.ts](file:///d:/PROJECTS/LetterPort/backend/src/entities/Letter.ts)
#### [NEW] [backend/src/entities/Attachment.ts](file:///d:/PROJECTS/LetterPort/backend/src/entities/Attachment.ts)
#### [NEW] [backend/src/entities/OCRRecord.ts](file:///d:/PROJECTS/LetterPort/backend/src/entities/OCRRecord.ts)
#### [NEW] [backend/src/repositories/ILetterRepository.ts](file:///d:/PROJECTS/LetterPort/backend/src/repositories/ILetterRepository.ts)
#### [NEW] [backend/src/repositories/SqliteLetterRepository.ts](file:///d:/PROJECTS/LetterPort/backend/src/repositories/SqliteLetterRepository.ts)
#### [NEW] [backend/src/services/StorageService.ts](file:///d:/PROJECTS/LetterPort/backend/src/services/StorageService.ts)
#### [NEW] [backend/src/services/OCRService.ts](file:///d:/PROJECTS/LetterPort/backend/src/services/OCRService.ts)
#### [NEW] [backend/src/services/QueueService.ts](file:///d:/PROJECTS/LetterPort/backend/src/services/QueueService.ts)
#### [NEW] [backend/src/services/LetterService.ts](file:///d:/PROJECTS/LetterPort/backend/src/services/LetterService.ts)
#### [NEW] [backend/src/controllers/LetterController.ts](file:///d:/PROJECTS/LetterPort/backend/src/controllers/LetterController.ts)
#### [NEW] [backend/src/routes/letterRoutes.ts](file:///d:/PROJECTS/LetterPort/backend/src/routes/letterRoutes.ts)

### Background Worker (`/worker`)
#### [NEW] [worker/package.json](file:///d:/PROJECTS/LetterPort/worker/package.json)
#### [NEW] [worker/src/index.ts](file:///d:/PROJECTS/LetterPort/worker/src/index.ts)
#### [NEW] [worker/Dockerfile](file:///d:/PROJECTS/LetterPort/worker/Dockerfile)

### Frontend (`/frontend`)
#### [NEW] [frontend/package.json](file:///d:/PROJECTS/LetterPort/frontend/package.json)
#### [NEW] [frontend/tsconfig.json](file:///d:/PROJECTS/LetterPort/frontend/tsconfig.json)
#### [NEW] [frontend/tailwind.config.ts](file:///d:/PROJECTS/LetterPort/frontend/tailwind.config.ts)
#### [NEW] [frontend/src/app/layout.tsx](file:///d:/PROJECTS/LetterPort/frontend/src/app/layout.tsx)
#### [NEW] [frontend/src/app/page.tsx](file:///d:/PROJECTS/LetterPort/frontend/src/app/page.tsx)
#### [NEW] [frontend/src/app/encode/page.tsx](file:///d:/PROJECTS/LetterPort/frontend/src/app/encode/page.tsx)
#### [NEW] [frontend/src/app/letters/[id]/page.tsx](file:///d:/PROJECTS/LetterPort/frontend/src/app/letters/[id]/page.tsx)
#### [NEW] [frontend/src/app/search/page.tsx](file:///d:/PROJECTS/LetterPort/frontend/src/app/search/page.tsx)
#### [NEW] [frontend/src/app/settings/page.tsx](file:///d:/PROJECTS/LetterPort/frontend/src/app/settings/page.tsx)
#### [NEW] [frontend/src/app/access-matrix/page.tsx](file:///d:/PROJECTS/LetterPort/frontend/src/app/access-matrix/page.tsx)
#### [NEW] [frontend/src/components/Navbar.tsx](file:///d:/PROJECTS/LetterPort/frontend/src/components/Navbar.tsx)
#### [NEW] [frontend/src/components/AccessMatrixEditor.tsx](file:///d:/PROJECTS/LetterPort/frontend/src/components/AccessMatrixEditor.tsx)
#### [NEW] [frontend/src/components/AppShell.tsx](file:///d:/PROJECTS/LetterPort/frontend/src/components/AppShell.tsx)
#### [NEW] [frontend/src/components/ActionDropdown.tsx](file:///d:/PROJECTS/LetterPort/frontend/src/components/ActionDropdown.tsx)
#### [NEW] [frontend/src/lib/permissions.ts](file:///d:/PROJECTS/LetterPort/frontend/src/lib/permissions.ts)

### Nginx Reverse Proxy (`/docker/nginx`)
#### [NEW] [docker/nginx/default.conf](file:///d:/PROJECTS/LetterPort/docker/nginx/default.conf)
#### [NEW] [docker/nginx/Dockerfile](file:///d:/PROJECTS/LetterPort/docker/nginx/Dockerfile)

---

## 5. Verification Plan

### Automated Tests
1. **Unit Tests for Domain & Services**:
   - `Letter` entity validation & state rules.
   - `LocalStorageService` file write, checksum verification, and retrieval.
   - `SqliteLetterRepository` letter creation, retrieval, and full-text search queries.
2. **API Endpoint Integration Testing**:
   - Letter creation with file upload -> verify letter stored and OCR queued.
   - Retrieval endpoint -> verify letter metadata, attachment URL, and OCR record.
   - Search endpoint -> verify query matching both metadata and OCR text content.
   - Permissions endpoint (`GET /api/settings/permissions` and `PUT /api/settings/permissions`) -> verify dynamic persistence.

### Manual Verification & Running
1. Verify `/login` page renders with a unified `#090d16` background and zero theme toggle button.
2. Test Navbar Settings dropdown menu navigation (`General & Storage`, `User Accounts`, `Access Matrix`, `Reference Format`, `Backup & Recovery`).
3. Verify `/settings` page segmented tab navigation displays each respective section cleanly without full page reloads.
4. Verify `/access-matrix` and `/settings?tab=matrix` render the interactive `<AccessMatrixEditor />` with 34 toggleable action buttons and icons.
5. Toggle permissions for Admin and Staff User roles, click "Save Matrix Changes", and verify immediate enforcement in table action menus (`ActionDropdown.tsx`) and letter detail toolbars.
