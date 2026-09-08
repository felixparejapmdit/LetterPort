# Development Plan: Robust Letter Management System (LMS) - LetterPort

This document serves as the master blueprint for developing the Letter Management System (LetterPort). It incorporates Object-Oriented Programming (OOP) principles, PocketBase backend database integration, automated background OCR, NAS network storage integration, a comprehensive Dockerized OS-agnostic infrastructure, and a complete Software Development Life Cycle (SDLC) strategy.

---

## Part 1: Software Requirements Specification (SRS)

### 1.1 Purpose
To digitize, organize, and track all incoming and outgoing correspondence through a centralized, searchable, and secure platform utilizing automated OCR technology, Network Attached Storage (NAS) support, and instant keyword indexing.

### 1.2 Functional Requirements
1.  **Letter Encoding & Tracking:** Capture metadata (Reference Number, VEM-Number, Direction [Incoming/Outgoing], Dates, Sender, Recipient, Subject, Priority, Status, Tags).
2.  **Document Storage & NAS Integration:** Upload and securely store PDF/Image scans with automated SHA-256 integrity verification and optional real-time backup to office NAS server (SMB / NFS / Shared Folders).
3.  **OCR Processing:** Automated background extraction of text from documents using Tesseract OCR with confidence scoring.
4.  **Advanced Live Search & Global Quick Access:**
    - Real-time debounced full-text search as you type across letter metadata and extracted OCR document bodies.
    - Global `Ctrl+K` (or `Cmd+K`) command search modal accessible from any page.
5.  **Viewing & Retrieval:** In-browser PDF and image viewing with interactive zoom/rotate, side-by-side OCR text inspector, and secure file downloading.
6.  **User Experience & Accessibility:**
    - Dark mode and light mode theme support with persistent preferences.
    - Fully mobile-responsive layouts adapting across smartphone, tablet, and desktop viewports.
    - Simplified, easy-to-understand terminology across all interfaces.
    - Built-in demo sample data management (Load and Clear sample correspondence) in Settings.

---

## Part 2: Software Design Document (SDD) & OOP Architecture

### 2.1 System Architecture
The application uses a decoupled Client-Server model:
*   **Frontend:** Next.js (React 18/19), Tailwind CSS with Dark Mode, Lucide Icons, responsive navigation drawer, and `Ctrl+K` search modal.
*   **Backend:** Node.js (Express) using TypeScript for strict typing and OOP enforcement.
*   **Database:** PocketBase (lightweight embedded Go/SQLite backend with real-time REST API and Admin UI on port 8090) with SQLite fallback.
*   **Storage & NAS Layer:** Local storage with SHA-256 checksums and configurable NAS integration (SMB/CIFS, NFS, Mounted Network Share, WebDAV).
*   **Queue/Worker:** Dedicated background OCR worker service for asynchronous Tesseract document processing.

### 2.2 Object-Oriented Programming (OOP) Application
The backend follows a strict **Service-Repository Pattern** to maintain modularity, encapsulation, and scalability.

*   **Controllers (Presentation Layer):**
    *   `LetterController`: Handles HTTP requests for letter encoding, retrieval, updates, file streaming, and re-running OCR.
    *   `SearchController`: Handles full-text search requests matching metadata and OCR text.
    *   `StatsController`: Provides dashboard metrics.
    *   `SettingsController`: Manages NAS storage configuration, connection testing, and demo sample data.
*   **Services (Business Logic Layer):** 
    *   `LetterService`: Manages business rules, reference generation, VEM-Number tracking, and dispatches background OCR jobs.
    *   `SettingsService`: Manages NAS configuration persistence, connectivity diagnostics, and sample letter fixtures.
    *   `OCRService`: `IOCRService` polymorphic base class. Concrete classes like `TesseractOCRService` implement extraction logic for images and PDFs.
    *   `StorageService`: `IStorageService` interface implemented by `LocalStorageService` with stream piping and checksum verification.
    *   `QueueService`: `IQueueService` interface for async task processing.
*   **Repositories (Data Access Layer):**
    *   `ILetterRepository`: Database-agnostic contract.
    *   `PocketBaseLetterRepository`: Implements data access using the PocketBase JavaScript SDK (`pocketbase`).
    *   `SqliteLetterRepository`: Secondary/local zero-dependency SQLite repository.
*   **Models/Entities:**
    *   `Letter`: Encapsulates `id`, `referenceNumber`, `vemNumber` (official VEM tracking code), `type`, `sender`, `recipient`, `subject`, `letterDate`, `receivedSentDate`, `status`, `priority`, and `tags`.
    *   `Attachment`: Encapsulates file metadata, mime type, and SHA-256 checksum.
    *   `OCRRecord`: Encapsulates OCR status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`), confidence score, and extracted text.

---

## Part 3: Containerization & Infrastructure (Docker & OS-Agnostic)

The system is designed to be 100% OS-agnostic, easily cloned from GitHub, and deployable on Windows, macOS, or Linux (including Proxmox VE).

### 3.1 Docker Compose Services
1.  **`web` (Next.js):** Runs the frontend UI on port 3000 with Dark Mode and responsive views.
2.  **`api` (Node.js/Express):** Handles API requests and REST endpoints on port 5000.
3.  **`pocketbase` (PocketBase):** High-performance Go backend/database running on port 8090 with built-in Admin UI (`/_/`).
4.  **`worker` (Node.js/Tesseract):** Dedicated background service for CPU-heavy OCR processing.
5.  **`nginx` (Reverse Proxy):** Routes traffic to `web`, `api`, or `pocketbase` and handles SSL/TLS termination.

### 3.2 Volume & Network Strategy
*   **Networks:** Internal bridge network (`lms-network`) isolating internal services while exposing public HTTP/HTTPS ports.
*   **Volumes:** 
    *   `pb_data`: Persistent PocketBase database files.
    *   `storage_volume`: Shared document storage for uploaded scans and PDFs.

---

## Part 4: Software Development Life Cycle (SDLC)

### Phase 1: Requirements & Architecture
*   Finalize SRS, SDD, and VEM-Number specification.
*   Configure PocketBase collections and REST API contracts.
*   Setup OS-agnostic repository structure and Git configuration.

### Phase 2: Implementation & Enhancement Sprints
*   **Sprint 1 (Core & VEM-Number):** Implement `Letter` entity with `vemNumber`, DTOs, and repository interfaces.
*   **Sprint 3 (PocketBase Integration):** Build `PocketBaseLetterRepository`, add PocketBase Docker service, and support auto-schema creation.
*   **Sprint 4 (Dark Mode & UI Polish):** Add dark mode theme, simplified friendly copy, responsive hamburger drawer, and `Eye` icon action buttons.
*   **Sprint 5 (Live Search & Ctrl+K):** Implement debounced as-you-type search in `/search` and global `Ctrl+K` command search modal dialog.
*   **Sprint 6 (NAS Integration & Sample Data):** Settings page for NAS configuration, connection testing, and 1-click sample data load/clear.

### Phase 3: Testing & Verification
*   **Unit Testing:** Validate `Letter` entity with `vemNumber` and status transitions.
*   **Integration Testing:** Test PocketBase/SQLite queries, full-text search, and file upload pipelines.
*   **Mobile & Cross-Platform Testing:** Verify responsive views across mobile, tablet, and desktop viewports in both light and dark themes.

### Phase 4: Deployment & Maintenance
*   Provide one-click Windows runners (`start-dev.bat`, `start.ps1`) and cross-platform npm scripts (`npm run dev`).
*   Production deployment via `docker compose up -d --build`.
