# Implementation Guide: LetterPort LMS

This document details the technical implementation, architectural patterns, API contracts, Role-Based Access Control (RBAC) matrix, and user interface components of **LetterPort LMS**.

---

## 1. System Overview & Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Lucide Icons, Canvas/Vector QR Code rendering (`qrcode`).
- **Backend API**: Node.js, Express, TypeScript, Object-Oriented Architecture (Service-Repository pattern).
- **Databases**: SQLite (zero-setup primary/local fallback) + PostgreSQL 16 (production container) + PocketBase engine.
- **Worker & OCR**: Dedicated asynchronous worker container running Tesseract OCR with confidence scoring.
- **Reverse Proxy**: Nginx routing external traffic on safe, unique host port **`8765`** to web and API services.

---

## 2. Implemented Features & Modules

### Module 1: Authentication & Role-Based Access Control
- **Login Screen (`/login`)**:
  - Minimalist, clean centered box without any menubar clutter.
  - Discreet corner theme switcher.
  - 1-click test credentials for instant evaluation.
- **Default Accounts & Roles**:
  - `admin` / `password`: **Administrator** role with full governance (create/edit/delete letters, manage user accounts, customize reference number formatting, export/restore backups, database reset).
  - `user` / `password`: **Staff User** role with standard daily correspondence access (view, search, encode letters, track timeline, print stickers/routing slips, download PDFs). Delete actions and system administration panels are restricted and hidden.
- **Session Management**: JWT token issued upon login, stored in `localStorage`, and managed via `AuthContext`.

---

### Module 2: Access Control & Permissions Matrix (`/access-matrix`)
- Dedicated permissions matrix page allowing both Administrators and Staff Users to inspect granted capabilities across two distinct roles.
- Categorized capability breakdown:
  1. **Correspondence & Daily Workflow**: Dashboard, Search & Ctrl+K, Viewer & OCR Inspector, Tracking Drawer, Document Downloads, QR Stickers & Routing Slips, Encoding, Metadata Editing, Record Deletions (Admin only).
  2. **System Administration & Security**: User Accounts Management (Admin only), Self Password Change (All), Reference Number Customization (Admin only), NAS Storage & Maintenance (Admin only), Letters Backup & Recovery (Admin only), Clear Database (Admin only), Access Matrix Policy Control (Admin only).
- Visual status badges (`Full Access`, `View Only`, `Restricted`).
- Role filter switcher allowing direct side-by-side comparison or isolated role inspection.

---

### Module 3: Barcode / QR Code Sticker & Routing Slip Generator
- **Component**: `LetterStickerModal.tsx` accessible via "Sticker / Slip" button on any letter page.
- **Sticker Label Tab**:
  - Generates high-contrast vector QR code pointing directly to `http://<host>:8765/letters/:id?track=true`.
  - Formatted for physical envelope covers or manila folders.
  - Includes Reference No, VEM No, Subject, Sender, and Priority.
  - Dedicated print styling via `@media print`.
- **Routing / Transmittal Slip Tab**:
  - Formatted 1-page official transmittal document for physical office document circulation.
  - Contains dispatch metadata, QR code, routing checklist (Drafted ➔ Received ➔ Under Review ➔ Approved ➔ Released), assigned department, instructions, and physical signature sign-off boxes.

---

### Module 4: Automated SLA & Due Date Overdue Alerts
- **SLA Computation**:
  - `Urgent`: Letter Date + 3 business days.
  - `High`: Letter Date + 5 business days.
  - `Normal` / `Low`: Letter Date + 7 business days.
  - Manual override supported during letter encoding or inline editing.
- **Overdue Detection**:
  - Flags correspondence as **OVERDUE** when current date exceeds `dueDate` and status is not `COMPLETED` or `ARCHIVED`.
  - Surfaced via animated red badge in tables, metric counter on Dashboard, and dedicated filter on All Letters page.

---

### Module 5: Compact Table Action Dropdown Hamburger Menu
- **Component**: `ActionDropdown.tsx`
- Replaces 4 bulky inline buttons with a single compact `...` (hamburger/dots) button.
- Clicking opens a floating contextual menu:
  - 🧭 **Track Progress** (opens right-side tracking drawer)
  - 👁️ **View Document** (opens split-screen document viewer)
  - ✏️ **Edit Details** (opens inline metadata/due date modal)
  - 📥 **Download PDF** (downloads original scan)
  - 🏷️ **Sticker & Slip** (opens QR sticker & routing slip modal)
  - 🗑️ **Delete Letter** (Admin only, with confirmation prompt)
- Shrinks table action column width from ~180px down to ~48px, preventing horizontal scrolling.

---

### Module 6: Full-Height Lateral Tracking Drawer
- **Component**: `TrackingModal.tsx`
- Replaces centered popup modal with a slide-over drawer on the right side of the screen (`w-full sm:w-[400px] md:w-[28vw]`).
- Includes:
  - 5-stage vertical timeline stepper with active pulse animation.
  - SLA status banner (Overdue alert or days remaining).
  - OCR text recognition confidence score.
  - Metadata summary with 1-click **Copy Tracking URL** button.
  - Direct **Open Full Letter** navigation button.

---

### Module 7: Customizable Reference Number Format
- Accessible in Settings for Administrators.
- Configurable parameters:
  - Custom prefix (e.g. `LP`, `DOC`, `OFFICE`).
  - Separator character (`-`, `/`, `.`).
  - Sequence digits padding (3, 4, 5, or 6 digits).
- Real-time live format preview for incoming and outgoing numbers.
- Dynamic sequence generation handled in `SqliteLetterRepository.ts` backed by `system_config` table.

---

## 3. Complete Access Matrix Reference Table

| Capability | Administrator (`admin`) | Staff User (`user`) | Governance Rule |
| :--- | :---: | :---: | :--- |
| **Dashboard Analytics & Overdue SLA** | Full Access | Full Access | Shared operational visibility |
| **Search & Ctrl+K Global Modal** | Full Access | Full Access | Universal indexing |
| **Document Viewer & OCR Text Inspector** | Full Access | Full Access | Side-by-side reading |
| **Lateral Tracking Drawer** | Full Access | Full Access | Progress monitoring |
| **Download Scanned Documents** | Full Access | Full Access | Document retrieval |
| **Add / Encode Incoming & Outgoing Letters** | Full Access | Full Access | Ingestion workflow |
| **Edit Letter Metadata & Status** | Full Access | Full Access | Workflow updates |
| **Print QR Stickers & Transmittal Slips** | Full Access | Full Access | Physical folder circulation |
| **Delete Letter Records** | **Granted** | **Restricted** | Preserves legal archival audit trail |
| **User Account Management** | **Granted** | **Restricted** | Prevents unauthorized account changes |
| **Self Password Change** | Granted | Granted | Personal account security |
| **Reference Number Format Customizer** | **Granted** | **Restricted** | Prevents numbering scheme corruption |
| **NAS Storage & System Maintenance** | **Granted** | **Restricted** | Host hardware & mount management |
| **Letters Backup & Recovery** | **Granted** | **Restricted** | Database snapshot export/restore |
| **Reset / Wipe Letters Database** | **Granted** | **Restricted** | Destructive database purge protection |
| **Access Matrix Policy Control** | **Granted** | Read-Only | Role boundaries enforcement |

---

## 4. API Endpoints Reference

### Authentication & Users
- `POST /api/auth/login`: Authenticate credentials, returns JWT token and user profile.
- `GET /api/auth/me`: Validate current session and retrieve active role.
- `GET /api/users`: List registered user accounts (Admin only).
- `POST /api/users`: Create new user account (Admin only).
- `PUT /api/users/:id`: Update user role, username, or password.
- `DELETE /api/users/:id`: Delete user account (Admin only).

### Correspondence & Letters
- `GET /api/letters`: Paginated letter retrieval with filters (`type`, `status`, `priority`, `ocrStatus`, `overdue`).
- `POST /api/letters`: Ingest new letter with file scan upload and auto SLA calculation.
- `GET /api/letters/:id`: Retrieve letter details with attachments and OCR transcription.
- `PUT /api/letters/:id`: Update metadata, status, tags, and target resolution date.
- `DELETE /api/letters/:id`: Delete letter record (Admin only).
- `GET /api/letters/:id/download`: Stream original PDF or image scan.
- `GET /api/letters/next-reference`: Generate next sequence number following configured format.

### Settings & System
- `GET /api/stats`: Dashboard counters (total, incoming, outgoing, OCR pending, urgent, overdue).
- `GET /api/settings`: System edition and storage directories.
- `GET /api/settings/reference-format`: Retrieve current reference numbering pattern.
- `PUT /api/settings/reference-format`: Update reference prefix, separator, and digits padding (Admin only).
- `GET /api/settings/backup`: Download complete JSON backup package (Admin only).
- `POST /api/settings/restore`: Restore records from JSON backup payload (Admin only).
- `POST /api/settings/sample-data/load`: Load 5 realistic institutional letters with VEM codes (Admin only).
- `POST /api/settings/sample-data/clear`: Wipe all letters from database (Admin only).

---

## 5. Deployment & Operational Runbook

### Quick Start (Production Docker)
```bash
# 1-Click Plug & Play NAS Installer
chmod +x install.sh
./install.sh
```

### Access Ports
- **Web Portal**: `http://<nas-ip>:8765`
- **Login**: `http://<nas-ip>:8765/login`
- **Permissions Matrix**: `http://<nas-ip>:8765/access-matrix`
- **Backend API**: `http://<nas-ip>:8765/api`
