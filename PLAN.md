# Development Plan & Specification: LetterPort Letter Management System (LMS)

This document serves as the master blueprint for the Letter Management System (**LetterPort**). It details the functional requirements, Object-Oriented Programming (OOP) architecture, Role-Based Access Control (RBAC) matrix, automated background text recognition (OCR), Network-Attached Storage (NAS) plug-and-play deployment, printable sticker/routing slip generation, automated SLA tracking, and containerized deployment.

---

## Part 1: Software Requirements Specification (SRS)

### 1.1 Purpose
LetterPort is engineered to digitize, organize, index, and monitor all incoming and outgoing institutional correspondence through a centralized, secure platform featuring automated OCR scanning, institutional VEM tracking codes, real-time keyword indexing, automated Service Level Agreement (SLA) due date alerts, and dedicated role-based access control.

### 1.2 Core Functional Requirements

1. **Authentication & Access Control (RBAC):**
   - Secure login mechanism with role-differentiated access views.
   - **Administrator**: Full system authority (CRUD on letters, record deletion, user management, reference number formatting, database backup/restore, system wipe).
   - **Staff User**: Standard daily operational workflow (viewing, searching, encoding letters, tracking progress, printing QR stickers & routing slips, downloading PDFs). Record deletion, user management, and system administration tools are hidden and restricted.
   - Built-in credentials: `admin` / `password` (Administrator) and `user` / `password` (Staff User).

2. **Letter Encoding & Automated SLA Management:**
   - Capture metadata: Reference Number, VEM-Number, Direction (`INCOMING` / `OUTGOING`), Sender, Recipient, Subject, Letter Date, Target Due Date (SLA), Status, Priority, and Tags.
   - **Automated SLA Calculation**: Target resolution date automatically calculated based on priority level (+3 days for Urgent, +5 days for High, +7 days for Normal) with optional manual override.
   - **Overdue Detection**: Automatically flags correspondence as Overdue if the target date has passed and status is not marked `Completed` or `Archived`, surfacing an animated red badge and dashboard metric.

3. **Printable Barcode / QR Code Stickers & Official Routing Slips:**
   - **Folder & Envelope Stickers**: Vector QR codes (pointing to `/letters/:id?track=true`) formatted for dedicated sticker printers or standard label sheets, displayable on physical folders and envelope covers.
   - **Official Transmittal / Routing Slip**: Formatted 1-page printable document detailing letter metadata, QR code, departmental routing stage checklists, instructions, and physical signature sign-offs.

4. **Document Storage & Plug-and-Play NAS Integration:**
   - Store uploaded scans and PDFs using relative directory mounts (`./letterport_data` and `./db_data`).
   - Completely zero-config: No hardcoded drive letters (`/volume1/`) required. Compatible with Synology DSM, QNAP QTS, TrueNAS, Unraid, and generic Linux servers.

5. **Lateral 5-Stage Tracking Drawer:**
   - Replaces disruptive modal popups with a sleek, full-height slide-over drawer on the right side of the screen (~28% screen width).
   - Shows active stage pulses (Drafted ➔ Scanned ➔ Under Review ➔ Approved/Completed ➔ Archived), OCR accuracy score, SLA countdown, and 1-click share URL.

6. **Table Action Dropdown Hamburger Menu:**
   - Consolidates inline action buttons into a single compact `...` button opening a floating contextual popover (Track Progress, View Document, Edit Details, Download PDF, Sticker & Slip, Delete Letter).
   - Reduces horizontal table footprint by over 100px, eliminating horizontal scrolling on smaller screens.

7. **Advanced Full-Text Search & Quick Access:**
   - Debounced live search across reference numbers, VEM codes, senders, recipients, subjects, and extracted OCR text.
   - Global keyboard command palette (`Ctrl+K` / `Cmd+K`) accessible across all pages.

8. **Customizable Reference Numbering Format:**
   - Institutional prefix configuration (e.g. `LP`, `DOC`, `OFFICE`), separator (`-`, `/`, `.`), and sequential padding (3 to 6 digits) with real-time live preview.

---

## Part 2: Complete Access Matrix & Role View Breakdown

| Feature / Capability | Administrator | Staff User | Security & Governance Rationale |
| :--- | :---: | :---: | :--- |
| **Dashboard Analytics & Overdue Metrics** | ✅ Full | ✅ Full | Shared visibility into institutional workload and pending correspondence. |
| **Search & Ctrl+K Global Modal** | ✅ Full | ✅ Full | Universal retrieval across correspondence and scanned OCR bodies. |
| **Document Viewer & OCR Text Inspector** | ✅ Full | ✅ Full | Side-by-side reading, rotation, zooming, and text copy. |
| **Lateral Tracking Drawer** | ✅ Full | ✅ Full | 5-stage timeline progression and SLA countdown inspection. |
| **Download Document Files** | ✅ Full | ✅ Full | Retrieval of original scanned PDFs and image files. |
| **Add / Encode New Letters** | ✅ Full | ✅ Full | Ingestion of incoming correspondence and outgoing memo dispatch. |
| **Edit Letter Details & Status** | ✅ Full | ✅ Full | Workflow updates, notes, tagging, and due date adjustments. |
| **Print QR Stickers & Routing Slips** | ✅ Full | ✅ Full | Physical document handling and routing transmittal preparation. |
| **Delete Letter Records** | ✅ **Allowed** | ❌ **Restricted** | Deletions restricted to prevent accidental destruction of audit records. |
| **User Account Management** | ✅ **Allowed** | ❌ **Restricted** | Creating accounts, changing roles, and resetting other staff passwords. |
| **Self Password Change** | ✅ Allowed | ✅ Allowed | Every user can update their personal password. |
| **Reference Number Format Customizer** | ✅ **Allowed** | ❌ **Restricted** | Numbering schemes must remain institutionally consistent. |
| **NAS Storage & System Maintenance** | ✅ **Allowed** | ❌ **Restricted** | Host hardware, mounts, and software updates are administrative tasks. |
| **Letters Backup & Recovery** | ✅ **Allowed** | ❌ **Restricted** | System snapshot export and restoration are restricted to administrators. |
| **Reset / Wipe Letters Database** | ✅ **Allowed** | ❌ **Restricted** | Database purge and sample fixtures reloading require admin clearance. |
| **Access Matrix Management** | ✅ **Allowed** | 👁️ **Read-Only** | Staff users can inspect granted permissions but cannot alter policies. |

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
│   │   │   ├── AuthController.ts   # /api/auth/login, /api/auth/me
│   │   │   ├── UserController.ts   # /api/users CRUD (Admin-guarded)
│   │   │   ├── SettingsController.ts # Format customizer, backups, storage
│   │   │   ├── LetterController.ts # /api/letters, SLA tracking, reference generation
│   │   │   ├── SearchController.ts # /api/search full-text querying
│   │   │   └── StatsController.ts  # /api/stats including overdueLetters counter
│   │   ├── services/
│   │   │   ├── LetterService.ts    # SLA computation, validation, reference sequencing
│   │   │   ├── SettingsService.ts  # Backup export/restore, reference formatting, sample data
│   │   │   ├── OCRService.ts       # Asynchronous OCR engine abstraction
│   │   │   └── StorageService.ts   # Document streaming and checksum verification
│   │   └── repositories/
│   │       ├── ILetterRepository.ts # Database contract
│   │       └── SqliteLetterRepository.ts # SQLite + Postgres persistence layer
│   └── index.ts                    # Express bootstrap on port 8766
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Dashboard with SLA metrics & ActionDropdown table
│   │   │   ├── login/page.tsx      # Minimalist login page (zero menubar)
│   │   │   ├── letters/page.tsx    # Letters catalogue with ActionDropdown & overdue filter
│   │   │   ├── letters/[id]/page.tsx # Split-screen viewer & sticker/routing slip button
│   │   │   ├── encode/page.tsx     # Letter ingestion form with automatic SLA due date
│   │   │   ├── search/page.tsx     # Debounced live search
│   │   │   ├── access-matrix/page.tsx # Dedicated Access Control & Permissions Matrix
│   │   │   └── settings/page.tsx   # Role-guarded administration & profile settings
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Dynamic role navigation (hides completely on /login)
│   │   │   ├── ActionDropdown.tsx  # Compact 3-dots table action menu
│   │   │   ├── TrackingModal.tsx   # Right-side lateral full-height slide-over drawer
│   │   │   ├── LetterStickerModal.tsx # Vector QR sticker & routing slip generator
│   │   │   └── EditLetterModal.tsx # Due date & metadata editor
│   │   └── context/
│   │       └── AuthContext.tsx     # JWT storage, role state, and permission guards
│   └── package.json
│
├── docker-compose.yml              # Production multi-container orchestration
├── install.sh                      # 1-click zero-config installer
└── README.md                       # Comprehensive deployment & user manual
```

---

## Part 4: Containerization & Infrastructure

- **Unique Port Assignment**:
  - Web & Nginx Gateway: **`8765`** (replaces default ports to avoid collisions with Synology DSM, Plex, and Portainer).
  - Backend API: **`8766`** (internal port `5000` mapped via reverse proxy).
- **Persistent Volume Structure**:
  - `./letterport_data`: Scanned correspondence files and document uploads.
  - `./db_data`: PostgreSQL persistent relational database cluster.
  - `./pb_data`: PocketBase storage (if running embedded engine).

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
  - **Editable Access Matrix with Granular Action Icons & Buttons**: Expanded the Access Matrix into an interactive management tool allowing Administrators to toggle visibility of 34 discrete action buttons, icons, and features across all 6 pages (Dashboard, All Letters, Letter Details, Encode Letter, Live Search, and Settings).
  - **Dynamic Permissions Storage & Synchronization**: Backend `GET /api/settings/permissions` and `PUT /api/settings/permissions` endpoints backed by `system_config` table. Frontend `AuthContext` provides `hasPermission(permissionId)` to dynamically guard table action dropdown items and detail page toolbars.
  - **Login Screen Refinements**: Removed theme toggle button from login screen; eliminated central container banding on wide displays by introducing an isolated `AppShell` with seamless `#090d16` background.
* **Sprint 10 (Standalone Classifications, Roles, Multi-File PDF Merging, People Directory & Compact UI):**
  - **Action Dropdown Portaling Fix**: Solved container overflow and table clipping by mounting dropdown popovers to `document.body` via React Portals (`createPortal`) with viewport boundary collision detection (automatically flips upward if `< 220px` clearance).
  - **Universal 15-Item Pagination**: Standardized 15-item pagination across all data tables (Dashboard, All Letters, Statuses, Priorities, Types, Roles, and Access Matrix).
  - **Standalone Management Pages for Classifications & Roles**: Created dedicated CRUD administration pages at `/settings/statuses`, `/settings/priorities`, `/settings/types`, and `/settings/roles` with full backend persistence and system role protection (preventing deletion of built-in `admin` and `user` roles).
  - **Categorized Settings Navbar Dropdown**: Grouped settings into three clear operational sections: `Classifications` (Statuses, Priorities, Types), `Access Control` (Roles & Permissions, Access Matrix), and `System & Design` (General & Storage, User Management, Reference Format, Design System).
  - **People Directory & Deduplication**: Created `people` table with case-insensitive unique constraint (`COLLATE NOCASE`). Auto-saves senders and recipients on encode and edit, and provides real-time autocomplete suggestions via `PeopleAutocomplete` component.
  - **Multi-File Upload & Pure-JS PDF Merging**: Added multi-file upload dropzone in `/encode` and attachments management in `EditLetterModal` with in-memory PDF merging using `pdf-lib` (100% portable, zero C++ native dependencies).
  - **High-Density Compact UI**: Implemented compact typography, tighter table rows, reduced padding, and polished Notion Minimalist dark mode contrast.
