# Development Plan & Specification: LetterPort Letter Management System (LMS)

This document serves as the unified master blueprint for the Letter Management System (**LetterPort**). It consolidates the Software Requirements Specification (SRS), Software Design Description (SDD), Object-Oriented Programming (OOP) architecture, Dynamic Multilateral Role-Based Access Control (RBAC) matrix, Hybrid PDF & Scanned Image OCR engine, Network-Attached Storage (NAS) plug-and-play deployment, printable sticker/routing slip generation, automated SLA tracking, standalone classifications management, and containerized deployment across all development phases and enhancement sprints.

---

## Part 1: Software Requirements Specification (SRS)

### 1.1 Purpose & Vision
LetterPort is engineered to digitize, organize, index, and monitor all incoming and outgoing institutional correspondence through a centralized, secure platform. It features automated OCR scanning with Poppler PDF rendering, institutional VEM tracking codes, real-time keyword indexing, automated Service Level Agreement (SLA) due date alerts, dynamic role-based access control, standalone classifications management, and a zero-config NAS deployment model.

### 1.2 Core Functional Requirements

1. **Authentication & Dynamic Role-Based Access Control (RBAC):**
   - Secure JWT-based authentication mechanism with role-differentiated access views.
   - **Administrator (`admin`)**: Full system authority (CRUD on letters, record deletion, user management, reference number formatting, database backup/restore, system wipe, classification management, dynamic role creation, and access matrix policy editing).
   - **Staff User (`user`)**: Standard daily operational workflow (viewing, searching, encoding letters, tracking progress, printing QR stickers & routing slips, downloading PDFs). Record deletion, user management, and system administration tools are hidden and restricted by default.
   - **Dynamic Custom Roles**: Administrators can create custom roles (e.g., `auditor`, `clerk`, `manager`, `vip`) via `/settings/roles`, which dynamically appear as distinct columns in the Access Matrix editor.
   - Built-in credentials: `admin` / `password` (Administrator) and `user` / `password` (Staff User).
   - Session Resilience: Direct entity serialization preserving role attributes across all page transitions without defaulting to fallback roles.

2. **Letter Encoding & Automated SLA Management:**
   - Metadata capture: Reference Number, VEM-Number, Direction (`INCOMING` / `OUTGOING`), Sender, Recipient, Subject, Letter Date, Target Due Date (SLA), Status, Priority, and Tags.
   - **Automated SLA Calculation**: Target resolution date automatically calculated based on priority level (+3 days for Urgent, +5 days for High, +7 days for Normal) with optional manual override.
   - **Overdue Detection**: Automatically flags correspondence as Overdue if the target date has passed and status is not marked `Completed` or `Archived`, surfacing an animated red badge and dashboard metric.

3. **People Directory & Deduplication:**
   - Dedicated `people` directory with case-insensitive uniqueness constraint (`COLLATE NOCASE`).
   - Senders and recipients entered during letter encoding or editing are automatically deduplicated and saved.
   - Real-time autocomplete suggestions (`PeopleAutocomplete`) during encoding and editing prevent typographical discrepancies.

4. **Printable Barcode / QR Code Stickers & Official Routing Slips:**
   - **Folder & Envelope Stickers**: Vector QR codes (pointing to `/letters/:id?track=true`) formatted for dedicated sticker printers or standard label sheets, displayable on physical folders and envelope covers.
   - **Official Transmittal / Routing Slip**: Formatted 1-page printable document detailing letter metadata, QR code, departmental routing stage checklists, instructions, and physical signature sign-offs (`@media print`).

5. **Document Storage & Plug-and-Play NAS Integration:**
   - Store uploaded scans and PDFs using relative directory mounts (`./letterport_data`, `./db_data`, and `./pb_data`).
   - Completely zero-config: No hardcoded drive letters (`/volume1/`) required. Compatible with Synology DSM, QNAP QTS, TrueNAS, Unraid, and generic Linux servers.

6. **Lateral 5-Stage Tracking Drawer:**
   - Replaces disruptive modal popups with a sleek, full-height slide-over drawer on the right side of the screen (`w-full sm:w-[400px] md:w-[28vw]`).
   - Shows active stage pulses (Drafted ➔ Scanned ➔ Under Review ➔ Approved/Completed ➔ Archived), OCR accuracy score, SLA countdown, and 1-click share URL.

7. **Synchronous Viewport-Aware Action Dropdown Menu:**
   - Consolidates inline action buttons into a single compact `...` button opening a floating contextual popover (Track Progress, View Document, Edit Details, Download PDF, Sticker & Slip, Delete Letter).
   - Synchronous bounding client rect calculation in `onClick` mounted via React Portals (`createPortal`) directly to `document.body` with viewport collision detection (auto-flips upward if `< 220px` clearance) and coordinate guard preventing upper-left (0,0) render glitches.
   - Reduces horizontal table footprint by over 100px, eliminating horizontal scrolling on smaller screens.

8. **Universal 15-Item Standardized Pagination:**
   - Standardized 15-item pagination across all data tables (Dashboard, All Letters, Statuses, Priorities, Types, Roles, and Access Matrix).
   - Unified bottom pagination bar featuring:
     - Left: `Showing X to Y of Z items (15 / page)`
     - Right: `< Page X of Y >` chevron controls.

9. **Multi-File Upload & In-Memory PDF Merging:**
   - Multi-file dropzone in `/encode` and attachments manager in `EditLetterModal`.
   - In-memory PDF concatenation and merging using pure-JS `pdf-lib` (100% portable, zero C++ native compile requirements).

10. **Advanced Full-Text Search & Quick Access:**
    - Debounced live search across reference numbers, VEM codes, senders, recipients, subjects, and extracted OCR text.
    - Global keyboard command palette (`Ctrl+K` / `Cmd+K`) accessible across all pages.

11. **Customizable Reference Numbering Format:**
    - Institutional prefix configuration (e.g. `LP`, `DOC`, `OFFICE`), separator (`-`, `/`, `.`), and sequential padding (3 to 6 digits) with real-time live preview.

12. **High-Density Compact Notion Minimalist Design:**
    - Default theme set to clean Notion Minimalist style.
    - Compact typography, tighter table rows, reduced padding, and optimized dark mode contrast (`#090d16`).

### 1.3 Hybrid PDF & Scanned Image OCR Processing Engine
- Multi-tier intelligent extraction pipeline combining native vector text streaming and raster OCR:
  1. **Tier 1 (Native Digital PDF Extraction)**: Direct extraction using `pdftotext -layout <file> -`. If digital text stream has > 30 characters, returns immediately with 98% confidence score.
  2. **Tier 2 (Direct Byte Stream Fallback)**: Regular expression matching against uncompressed PDF text object streams (`BT ... ET`) with 95% confidence.
  3. **Tier 3 (Raster Rendering & Tesseract OCR for Scanned Documents)**: For scanned or image-only PDFs (such as official stamped memorandums), pages are rasterized to temporary 150 DPI PNG images using `pdftoppm -png -r 150 <file> <temp_prefix>`, processed page-by-page through Tesseract.js worker with confidence scoring, followed by deterministic temp-file cleanup.
- Supported file types: Native PDF, Scanned PDF, PNG, JPEG, TIFF, BMP, WebP, SVG (XML direct parsing).
- Dual-container runtime support: In-process `OCRService.ts` on backend and standalone asynchronous `worker` container.
- Host and container dependency: `poppler-utils` (`pdftoppm`, `pdftotext`).

---

## Part 2: Complete Access Matrix & Role View Breakdown

### 2.1 Dynamic Multi-Role RBAC Model
LetterPort features a hybrid RBAC model supporting both immutable built-in system roles and dynamically created user roles:
- **System Administrator (`admin`)**: Immutable system role with complete governance over letters, deletion, user accounts, system configuration, backups, and role permissions.
- **Staff User (`user`)**: Immutable default operational role for daily correspondence handling (view, search, encode, edit, track, print stickers/routing slips, download files).
- **Custom Dynamic Roles**: Administrators can create custom roles (e.g., `auditor`, `clerk`, `manager`, `vip`) via `/settings/roles`. These roles automatically generate new columns in the Access Matrix editor.

### 2.2 Granular Action & UI Permissions (34 Items across 6 Categories)
- **Dashboard**: `dashboard_add_letter`, `dashboard_track`, `dashboard_view`, `dashboard_edit`, `dashboard_download`, `dashboard_delete`
- **All Letters**: `letters_encode_button`, `letters_filter_direction`, `letters_filter_status`, `letters_filter_priority`, `letters_filter_overdue`, `letters_track`, `letters_view`, `letters_edit`, `letters_download`, `letters_sticker`, `letters_delete`
- **Letter Details**: `details_edit`, `details_download`, `details_sticker`, `details_re_ocr`, `details_delete`
- **Encode Letter**: `encode_save`, `encode_cancel`
- **Live Search**: `search_track`, `search_view`, `search_download`
- **Settings & Administration**: `settings_general`, `settings_users`, `settings_matrix`, `settings_reference`, `settings_backup`, `settings_sample_load`, `settings_sample_clear`

### 2.3 Access Matrix Reference Table

| Feature / Capability | Administrator (`admin`) | Staff User (`user`) | Dynamic Custom Roles | Security & Governance Rationale |
| :--- | :---: | :---: | :---: | :--- |
| **Dashboard Analytics & Overdue Metrics** | ✅ Full | ✅ Full | Configurable | Shared visibility into institutional workload and pending correspondence. |
| **Search & Ctrl+K Global Modal** | ✅ Full | ✅ Full | Configurable | Universal retrieval across correspondence and scanned OCR bodies. |
| **Document Viewer & OCR Text Inspector** | ✅ Full | ✅ Full | Configurable | Side-by-side reading, rotation, zooming, and text copy. |
| **Lateral Tracking Drawer** | ✅ Full | ✅ Full | Configurable | 5-stage timeline progression and SLA countdown inspection. |
| **Download Document Files** | ✅ Full | ✅ Full | Configurable | Retrieval of original scanned PDFs and image files. |
| **Add / Encode New Letters** | ✅ Full | ✅ Full | Configurable | Ingestion of incoming correspondence and outgoing memo dispatch. |
| **Edit Letter Details & Status** | ✅ Full | ✅ Full | Configurable | Workflow updates, notes, tagging, and due date adjustments. |
| **Print QR Stickers & Routing Slips** | ✅ Full | ✅ Full | Configurable | Physical document handling and routing transmittal preparation. |
| **Delete Letter Records** | ✅ **Allowed** | ❌ **Restricted** | Configurable | Deletions restricted to prevent accidental destruction of audit records. |
| **User Account Management** | ✅ **Allowed** | ❌ **Restricted** | ❌ Restricted | Creating accounts, changing roles, and resetting other staff passwords. |
| **Self Password Change** | ✅ Allowed | ✅ Allowed | ✅ Allowed | Every user can update their personal password. |
| **Reference Number Format Customizer** | ✅ **Allowed** | ❌ **Restricted** | ❌ Restricted | Numbering schemes must remain institutionally consistent. |
| **Classifications (Statuses, Priorities, Types)**| ✅ **Allowed** | ❌ **Restricted** | Configurable | Workflow taxonomy management restricted to supervisors. |
| **Roles & Permissions Management** | ✅ **Allowed** | ❌ **Restricted** | ❌ Restricted | Role definitions and security boundaries governance. |
| **Access Matrix Management** | ✅ **Allowed** | 👁️ **Read-Only** | Configurable | Policy toggling restricted to administrators. |
| **NAS Storage & System Maintenance** | ✅ **Allowed** | ❌ **Restricted** | ❌ Restricted | Host hardware, mounts, and software updates are administrative tasks. |
| **Letters Backup & Recovery** | ✅ **Allowed** | ❌ **Restricted** | ❌ Restricted | System snapshot export and restoration are restricted to administrators. |
| **Reset / Wipe Letters Database** | ✅ **Allowed** | ❌ **Restricted** | ❌ Restricted | Database purge and sample fixtures reloading require admin clearance. |

---

## Part 3: Object-Oriented Architecture (SDD)

LetterPort strictly adheres to the **Service-Repository Pattern** in TypeScript:

```
LetterPort/
├── backend/
│   ├── src/
│   │   ├── entities/
│   │   │   ├── User.ts             # Domain model for User (id, username, passwordHash, role)
│   │   │   ├── Letter.ts           # Letter aggregate with dueDate, vemNumber, priority, status
│   │   │   ├── Attachment.ts       # Document scan metadata and SHA-256 integrity hash
│   │   │   └── OCRRecord.ts        # OCR transcription status, text, and confidence score
│   │   ├── controllers/
│   │   │   ├── AuthController.ts   # /api/auth/login, /api/auth/me (resilient role payload)
│   │   │   ├── UserController.ts   # /api/users CRUD (Admin-guarded)
│   │   │   ├── SettingsController.ts # Format customizer, backups, storage, permissions
│   │   │   ├── LetterController.ts # /api/letters, SLA tracking, reference generation
│   │   │   ├── SearchController.ts # /api/search full-text querying
│   │   │   ├── StatsController.ts  # /api/stats including overdueLetters counter
│   │   │   ├── ClassificationsController.ts # Statuses, Priorities, and Types CRUD
│   │   │   ├── RolesController.ts  # Dynamic Roles CRUD (/api/roles)
│   │   │   └── PeopleController.ts # People directory & autocomplete (/api/people)
│   │   ├── services/
│   │   │   ├── LetterService.ts    # SLA computation, validation, reference sequencing
│   │   │   ├── SettingsService.ts  # Backup export/restore, reference formatting, sample data
│   │   │   ├── OCRService.ts       # Hybrid Poppler (pdftoppm/pdftotext) + Tesseract OCR engine
│   │   │   └── StorageService.ts   # Document streaming and checksum verification
│   │   └── repositories/
│   │       ├── ILetterRepository.ts # Database contract
│   │       └── SqliteLetterRepository.ts # SQLite + Postgres persistence layer
│   ├── Dockerfile                  # Alpine runner with poppler-utils installed
│   └── index.ts                    # Express bootstrap on port 8766
│
├── worker/
│   ├── src/
│   │   └── index.ts                # Asynchronous OCR worker with Poppler PDF rasterization
│   ├── Dockerfile                  # Worker runner with poppler-utils installed
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Dashboard with SLA metrics & ActionDropdown table
│   │   │   ├── login/page.tsx      # Minimalist login page (zero menubar)
│   │   │   ├── letters/page.tsx    # Letters catalogue with ActionDropdown & 15-item pagination
│   │   │   ├── letters/[id]/page.tsx # Split-screen viewer & sticker/routing slip button
│   │   │   ├── encode/page.tsx     # Letter ingestion form with People autocomplete & SLA
│   │   │   ├── search/page.tsx     # Debounced live search
│   │   │   ├── access-matrix/page.tsx # Dedicated Access Control & Permissions Matrix
│   │   │   └── settings/
│   │   │       ├── page.tsx        # General Settings & Storage
│   │   │       ├── statuses/page.tsx # Standalone Statuses CRUD
│   │   │       ├── priorities/page.tsx # Standalone Priorities CRUD
│   │   │       ├── types/page.tsx  # Standalone Types CRUD
│   │   │       ├── roles/page.tsx  # Standalone Roles & Permissions CRUD
│   │   │       ├── access-matrix/page.tsx # Categorized Access Matrix Editor
│   │   │       ├── users/page.tsx  # User Accounts Management
│   │   │       ├── reference/page.tsx # Reference Number Format Customizer
│   │   │       ├── backup/page.tsx # Letters Backup & Recovery
│   │   │       └── profile/page.tsx # My Profile & Password
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Dynamic role navigation & categorized settings dropdown
│   │   │   ├── ActionDropdown.tsx  # Synchronous portal-based 3-dots table action menu
│   │   │   ├── TrackingModal.tsx   # Right-side lateral full-height slide-over drawer
│   │   │   ├── LetterStickerModal.tsx # Vector QR sticker & routing slip generator
│   │   │   ├── EditLetterModal.tsx # Due date, multi-attachment & metadata editor
│   │   │   ├── AccessMatrixEditor.tsx # Interactive 34-permission dynamic role matrix editor
│   │   │   ├── PeopleAutocomplete.tsx # Case-insensitive sender/recipient autocomplete
│   │   │   └── AppShell.tsx        # Seamless full-height background container
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # JWT storage, resilient role state, dynamic permissions
│   │   └── lib/
│   │       ├── api.ts              # Resilient API client with fallback unpacking
│   │       └── permissions.ts      # Permission catalogs and default permission maps
│   └── package.json
│
├── docker-compose.yml              # Production multi-container orchestration
├── install.sh                      # 1-click zero-config installer (Ubuntu/Debian)
└── README.md                       # Comprehensive deployment & user manual
```

### 3.3 Domain Entities & Polymorphic Interfaces

- **Domain Entities**:
  - `Letter`: Properties (`id`, `referenceNumber`, `vemNumber`, `direction`, `sender`, `recipient`, `subject`, `letterDate`, `dueDate`, `status`, `priority`, `tags`, `createdAt`, `updatedAt`). Domain methods for validation, status transitions, and reference code formatting.
  - `Attachment`: Properties (`id`, `letterId`, `originalName`, `storedFilename`, `filePath`, `mimeType`, `fileSize`, `checksum`).
  - `OCRRecord`: Properties (`id`, `letterId`, `attachmentId`, `extractedText`, `confidence`, `pageCount`, `status`, `errorMessage`, `processedAt`).
  - `User`: Properties (`id`, `username`, `passwordHash`, `role`, `createdAt`).
  - `Role`: Properties (`id`, `code`, `name`, `description`, `isSystem`).
  - `Classification`: Properties (`id`, `type`, `code`, `name`, `color`, `orderIndex`, `isSystem`).
  - `Person`: Properties (`id`, `name`, `organization`, `email`, `phone`, `createdAt`).

- **OOP Interfaces**:
  - `IStorageService`: Interface defining `saveFile()`, `getFileStream()`, `deleteFile()`, `getFilePath()`. Implemented by `LocalStorageService` (with SHA-256 integrity verification) and extensible for cloud/NAS storage.
  - `IOCRService` / `BaseOCRService`: Abstract polymorphic base class defining `extractText(filePath: string, mimeType?: string): Promise<OCRResult>`. Implemented by `TesseractOCRService` with multi-tier Poppler PDF rendering.
  - `IQueueService`: Interface defining `addJob(letterId: string, attachmentId: string)` and `processJobs(handler)`. Implemented by `BullMQQueueService` (Redis) and lightweight `LocalQueueService` (in-process).
  - `ILetterRepository`: Repository contract encapsulating letter queries, filters, full-text search, and transaction-safe sequence numbering.

### 3.4 API Endpoints Reference Catalog

#### Authentication & Users
- `POST /api/auth/login`: Authenticate credentials, return JWT token and user profile.
- `GET /api/auth/me`: Validate current session and retrieve active role (resilient serialization).
- `GET /api/users`: List registered user accounts (Admin only).
- `POST /api/users`: Create new user account (Admin only).
- `PUT /api/users/:id`: Update user role, username, or password.
- `DELETE /api/users/:id`: Delete user account (Admin only).

#### Correspondence & Letters
- `GET /api/letters`: Paginated letter retrieval with filters (`direction`, `status`, `priority`, `ocrStatus`, `overdue`, `page`, `pageSize=15`).
- `POST /api/letters`: Ingest new letter with file scan upload, auto SLA calculation, and sender/recipient deduplication.
- `GET /api/letters/:id`: Retrieve letter details with attachments and OCR transcription.
- `PUT /api/letters/:id`: Update metadata, status, tags, attachments, and target resolution date.
- `DELETE /api/letters/:id`: Delete letter record (Admin or granted role).
- `GET /api/letters/:id/download`: Stream original PDF or image scan.
- `POST /api/letters/:id/ocr`: Trigger manual re-OCR execution.
- `GET /api/letters/next-reference`: Generate next sequence number following configured format.

#### Classifications & Roles
- `GET /api/classifications/statuses`: List all letter workflow statuses.
- `POST /api/classifications/statuses`: Create new custom status (Admin only).
- `PUT /api/classifications/statuses/:id`: Update status details (Admin only).
- `DELETE /api/classifications/statuses/:id`: Delete custom status (protected against system defaults).
- `GET /api/classifications/priorities`: List priority levels and SLA days.
- `GET /api/classifications/types`: List letter classification types.
- `GET /api/roles`: List all active system and custom roles.
- `POST /api/roles`: Create new dynamic role (Admin only).
- `PUT /api/roles/:id`: Update role name and description (Admin only).
- `DELETE /api/roles/:id`: Delete custom role (built-in `admin` and `user` are protected).

#### People Directory
- `GET /api/people`: List contacts or search autocomplete matches (`?search=query`).
- `POST /api/people`: Explicitly add a contact to the directory.

#### Settings & Maintenance
- `GET /api/stats`: Dashboard counters (total, incoming, outgoing, OCR pending, urgent, overdue).
- `GET /api/settings`: System edition and storage directories.
- `GET /api/settings/permissions`: Retrieve current dynamic access matrix mapping.
- `PUT /api/settings/permissions`: Persist updated role permission map (Admin only).
- `GET /api/settings/reference-format`: Retrieve current reference numbering pattern.
- `PUT /api/settings/reference-format`: Update reference prefix, separator, and digits padding (Admin only).
- `GET /api/settings/backup`: Download complete JSON backup package (Admin only).
- `POST /api/settings/restore`: Restore records from JSON backup payload (Admin only).
- `POST /api/settings/sample-data/load`: Load 5 realistic institutional letters with VEM codes (Admin only).
- `POST /api/settings/sample-data/clear`: Wipe all letters from database (Admin only).

---

## Part 4: Containerization & Infrastructure

### 4.1 Port Allocations
- **Web & Nginx Gateway**: **`8765`** (replaces default ports to avoid collisions with Synology DSM, Plex, and Portainer).
- **Backend API**: **`8766`** (internal port `5000` mapped via reverse proxy).

### 4.2 Persistent Storage Volume Architecture
- `./letterport_data`: Scanned correspondence files, uploaded attachments, and merged PDFs.
- `./db_data`: PostgreSQL persistent relational database cluster.
- `./pb_data`: PocketBase storage (if running embedded engine).

### 4.3 Host & Container System Dependencies
- Container images include `poppler-utils` (`pdftoppm` for raster image rendering and `pdftotext` for text extraction).
- Host system requirements handled automatically by `install.sh`.

---

## Part 5: SDLC & Enhancement Sprints

* **Sprint 1 (Foundations):** Core entities, VEM institutional tracking numbers, and basic CRUD.
* **Sprint 2 (OCR & Search):** Tesseract OCR pipeline, live search, and global `Ctrl+K` command modal.
* **Sprint 3 (NAS Hardening):** Relative storage bind-mounts, unique safe ports (`8765` & `8766`), and 1-click `install.sh`.
* **Sprint 4 (Backup & Table Improvements):** Full JSON backup/restore and inline dashboard editing.
* **Sprint 5 (Authentication & RBAC):** Role models, JWT session flow, `admin` and `user` accounts, and role-based interface guarding.
* **Sprint 6 (QR Code & SLA Alerts):** Physical QR sticker generator, official transmittal slips, and automated SLA due date calculation with overdue flags.
* **Sprint 7 (Lateral Tracking & Custom Formats):** Full-height right-side slide-over drawer and customizable reference number formatting.
* **Sprint 8 (Access Matrix, Table Hamburger & Clean UI):** Dedicated `/access-matrix` page, role view differentiation, compact `ActionDropdown` menu in tables, shortened search bar, and clean minimalist login page.
* **Sprint 9 (Editable Access Matrix, Settings Categorization & Login Theme Polish):**
  - **Settings Dropdown & Categorization**: Added categorized dropdown navigation in the Navbar leading to dedicated settings categories (`General & Storage`, `User Accounts`, `Access Matrix`, `Reference Format`, `Backup & Recovery`, and `My Profile & Password`).
  - **Editable Access Matrix with Granular Action Icons & Buttons**: Expanded the Access Matrix into an interactive management tool allowing Administrators to toggle visibility of 34 discrete action buttons, icons, and features across all 6 pages.
  - **Dynamic Permissions Storage & Synchronization**: Backend `GET /api/settings/permissions` and `PUT /api/settings/permissions` endpoints backed by `system_config` table. Frontend `AuthContext` provides `hasPermission(permissionId)` to dynamically guard table action dropdown items and detail page toolbars.
  - **Login Screen Refinements**: Removed theme toggle button from login screen; eliminated central container banding on wide displays by introducing an isolated `AppShell` with seamless `#090d16` background.
* **Sprint 10 (Standalone Classifications, Roles, Multi-File PDF Merging, People Directory & Compact UI):**
  - **Action Dropdown Portaling Fix**: Solved container overflow and table clipping by mounting dropdown popovers to `document.body` via React Portals (`createPortal`) with viewport boundary collision detection.
  - **Universal 15-Item Pagination**: Standardized 15-item pagination across all data tables (Dashboard, All Letters, Statuses, Priorities, Types, Roles, and Access Matrix).
  - **Standalone Management Pages for Classifications & Roles**: Created dedicated CRUD administration pages at `/settings/statuses`, `/settings/priorities`, `/settings/types`, and `/settings/roles` with full backend persistence and system role protection.
  - **Categorized Settings Navbar Dropdown**: Grouped settings into three clear operational sections: `Classifications` (Statuses, Priorities, Types), `Access Control` (Roles & Permissions, Access Matrix), and `System & Design` (General & Storage, User Management, Reference Format, Design System).
  - **People Directory & Deduplication**: Created `people` table with case-insensitive unique constraint (`COLLATE NOCASE`). Auto-saves senders and recipients on encode and edit, and provides real-time autocomplete suggestions via `PeopleAutocomplete` component.
  - **Multi-File Upload & Pure-JS PDF Merging**: Added multi-file upload dropzone in `/encode` and attachments management in `EditLetterModal` with in-memory PDF merging using `pdf-lib` (100% portable, zero C++ native dependencies).
  - **High-Density Compact UI**: Implemented compact typography, tighter table rows, reduced padding, and polished Notion Minimalist dark mode contrast.
* **Sprint 11 (Hybrid PDF OCR Engine, Synchronous Action Portals, Session Auth Persistence, Universal Pagination & Dynamic Access Matrix):**
  - **Hybrid PDF OCR Pipeline**: Resolved OCR failures on scanned PDFs (such as `KA EVM.pdf`) by adding `poppler-utils` to backend and worker Dockerfiles. Implemented a 3-tier extraction engine: Tier 1 fast `pdftotext` extraction for digital PDFs, Tier 2 raw stream matching, and Tier 3 `pdftoppm -png -r 150` rasterization for scanned/image-only PDFs feeding into Tesseract.js with > 90% confidence and automatic temp file cleanup.
  - **Synchronous Viewport-Aware ActionDropdown Portal**: Fixed menu originating from the top-left (0,0) by calculating bounding client rect synchronously inside `onClick` prior to opening, utilizing `useLayoutEffect`, and applying a coordinate check guard (`coords.top > 0 || coords.left > 0`).
  - **Resilient User Session Authentication**: Resolved user account role switching from Admin to Staff by serializing `data: user.toJSON()` directly in `AuthController.getMe` and adding resilient unpack logic in `api.ts` (`json.data?.user || json.data`), ensuring `user.role` remains consistent across all route transitions.
  - **Universal 15-Item Pagination Bar**: Standardized the pagination display across All Letters page to mirror the Dashboard exactly, displaying `Showing X to Y of Z items (15 / page)` alongside `< Page X of Y >` navigation controls.
  - **Dynamic Multilateral Access Matrix**: Enhanced `AccessMatrixEditor.tsx` to dynamically query active roles from `/api/roles`, rendering dynamic columns for newly created custom roles (e.g., `auditor`, `clerk`), allowing administrators to toggle and persist role-specific permission maps.

---

## Part 6: Deployment & Operational Runbook

### 6.1 Quick Start (Production Docker)
```bash
# 1-Click Plug & Play NAS & Ubuntu Installer
chmod +x install.sh
./install.sh
```

### 6.2 Access Ports & Endpoints
- **Web Portal**: `http://<host-ip>:8765`
- **Login**: `http://<host-ip>:8765/login`
- **Permissions Matrix**: `http://<host-ip>:8765/access-matrix`
- **Backend API**: `http://<host-ip>:8765/api`

### 6.3 Default Credentials
- **Administrator**: `admin` / `password`
- **Staff User**: `user` / `password`

---

## Part 7: Verification & Quality Assurance Plan

### 7.1 Automated Testing
1. **Domain & Service Validation**:
   - `Letter` entity validation & SLA date calculation (+3 days Urgent, +5 days High, +7 days Normal).
   - `LocalStorageService` file storage, checksum calculation, and file retrieval.
   - `SqliteLetterRepository` letter creation, retrieval, full-text search queries, and reference format generator.
2. **API Endpoint Integration Testing**:
   - Letter creation with multi-file attachment -> verify letter stored, PDF merged, and OCR executed.
   - OCR verification on both digital and scanned image-only PDFs (`poppler-utils` pipeline).
   - Session endpoint (`GET /api/auth/me`) -> verify user role is preserved without undefined values.
   - Permissions endpoints (`GET /api/settings/permissions` and `PUT /api/settings/permissions`) -> verify dynamic role permission persistence.

### 7.2 Manual Verification Workflows
1. **Action Menu Dropdown**: Click the 3-dots action button in Dashboard and Letters page. Verify menu appears right under the button with zero glitch or jump from top-left.
2. **User Account Consistency**: Log in as `admin`. Navigate between Dashboard, Letters, Encode, and Settings multiple times. Verify avatar stays `A` (Admin) and role stays `Admin` without turning into `Staff`.
3. **Letters Page Pagination**: Visit `/letters`. Verify "Showing 1 to 6 of 6 items (15 / page)" and `< Page 1 of 1 >` appear cleanly below the table.
4. **Dynamic Roles in Access Matrix**: Go to `/settings/roles`, add a new role (e.g. `Auditor`), then navigate to `/settings/access-matrix`. Verify `Auditor` appears as a distinct column in the Access Matrix editor.
5. **OCR Verification**: Upload or re-OCR a scanned PDF (e.g. `KA EVM.pdf`). Verify text extraction completes with > 85% accuracy and appears in the OCR inspector.
