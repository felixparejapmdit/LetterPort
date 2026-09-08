# 📬 LetterPort - Letter Management System (LMS)

[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=flat&logo=node.js)](https://nodejs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PocketBase](https://img.shields.io/badge/PocketBase-Ready-B8272C?style=flat&logo=pocketbase)](https://pocketbase.io/)
[![SQLite](https://img.shields.io/badge/SQLite-Zero--Setup-003B57?style=flat&logo=sqlite)](https://sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-OS--Agnostic-2496ED?style=flat&logo=docker)](https://www.docker.com/)

**LetterPort** is a modern, high-performance **Letter Management System (LMS)** engineered to streamline, digitize, and index all incoming and outgoing organizational correspondence. Designed for government offices, institutions, educational facilities, and enterprises, it features automated background text scanning (OCR), institutional VEM-Number tracking, real-time live search, a global `Ctrl+K` command palette, seamless Network-Attached Storage (NAS) integration, dark mode, and an OS-agnostic architecture.

---

## 🌟 Key Features

- **🔐 Built-in Authentication & User Management**: Dedicated login with role-based access control. Preconfigured with `admin` / `password` (full system control & user management) and `user` / `password` (staff workflow: view, encode, track, download).
- **🏷️ Printable Barcode / QR Code Stickers & Routing Slips**: Generate and print vector QR code labels for physical envelopes/folders or 1-page official transmittal/routing slips with checkpoint sign-offs.
- **⏱️ Automated SLA & Overdue Tracking**: Auto-calculates target resolution dates based on priority (+3 days for Urgent, +5 days for High, +7 days for Normal) with live Overdue indicators and dashboard alert metrics.
- **📂 Full-Height Right-Side Tracking Drawer**: Clicking any tracking icon slides open a smooth, full-height lateral drawer displaying the timeline stepper, OCR confidence, SLA countdown, and quick share URL.
- **🔢 Customizable Reference Number Format**: Configure prefix (e.g. `LP`, `DOC`, `OFFICE`), separator (`-`, `/`, `.`), and digit sequence length in Settings with live preview.
- **⚡ Live Search As-You-Type**: Instant debounced search querying across letter metadata, senders, recipients, and text extracted from scanned documents.
- **⌨️ Global `Ctrl+K` / `Cmd+K` Command Modal**: Accessible on any page with keyboard arrow navigation and immediate document opening.
- **🔢 VEM-Number Tracking**: Institutional tracking number assigned to correspondence alongside auto-generated reference codes (`LP-IN-YYYY-XXXX`).
- **🌙 Sleek Dark Mode & Light Mode**: Curated theme switcher with system preference detection, localStorage persistence, and zero-flicker hydration.
- **📱 Fully Mobile Responsive**: Engineered with a collapsible hamburger navigation drawer, responsive tables, and mobile-friendly document split views.
- **🔍 Automated Background Text Reader (OCR)**: Scans PDF documents and images (JPG, PNG, TIFF) using background worker queues, transcribing text for instant full-text indexing with reading accuracy scoring.
- **📂 In-Browser Document Viewer**: High-performance viewer supporting zoom, rotation, side-by-side text viewing, and downloads.
- **💾 Dual Database Engine (Postgres, PocketBase & SQLite)**: Enterprise-ready multi-database architecture with zero-setup automatic SQLite fallback.
- **🗄️ Office Network Storage (NAS) Integration**: Settings interface to connect and automatically sync uploaded correspondence to Synology, QNAP, TrueNAS, or Windows network shares.
- **🧪 Demo Sample Data**: One-click demo letter generator and cleanup tool to preview the system immediately.

---

## 📖 User Guide

### 0. User Login & Roles
- Access LetterPort and log in via `/login`:
  - **Administrator** (`admin` / `password`): Full system control, letter deletion, database management, and user creation/password resets.
  - **Staff User** (`user` / `password`): Standard daily workflow (encode, search, track, sticker generator, PDF download).
- One-click demo login buttons are provided on the login screen for immediate access.

### 1. Dashboard Overview
- Navigate to the **Dashboard** (`/`) to view 6 live metric cards: **Total Letters**, **Incoming Letters**, **Outgoing Letters**, **Reading Text** (pending OCR), **Urgent Items**, and **Overdue Letters** (SLA breached).
- The table displays priority icons directly beside the Reference Number (with flashing red badge for Urgent letters), followed by VEM number, Type, Subject, color-coded **Status** badge, From/To, and SLA Due Date.
- Click the **Track icon** (`🧭`) on any row to open the full-height **Right-Side Tracking Drawer**.

### 2. Adding a Letter & SLA Due Dates
1. Click **Add Letter** in the top navigation or dashboard.
2. Choose **Direction**: `Incoming` or `Outgoing`.
3. Fill in the **Sender**, **Recipient**, and **Subject**.
4. The **Reference Number** is auto-generated according to the pattern set in Settings.
5. Set priority (`Low`, `Normal`, `High`, `Urgent`). The **Target Due Date (SLA)** automatically calculates (+3d for Urgent, +5d for High, +7d for Normal), or you can pick a specific date.
6. Attach a scan or PDF of the letter.
7. Click **Save Letter & Read Text**. The system saves the letter and starts background OCR reading immediately.

### 3. QR Stickers & Official Routing Slips
- On any letter detail page (`/letters/:id`), click **Sticker / Slip**:
  - **Sticker Label**: Prints a high-contrast QR code label designed for physical envelope covers or manila folders. Anyone scanning the QR code with a smartphone camera is instantly taken to that letter's tracking page.
  - **Routing / Transmittal Slip**: Generates an official 1-page transmittal document complete with routing stages, instructions, and signature sign-off boxes for physical routing.

### 3. Quick Global Search (`Ctrl+K`)
- Press <kbd>Ctrl+K</kbd> (or <kbd>Cmd+K</kbd> on macOS) on any page to open the Quick Search modal.
- Use <kbd>↑</kbd> and <kbd>↓</kbd> arrows to navigate search results and press <kbd>Enter</kbd> to open.
- Press <kbd>Esc</kbd> or click outside to dismiss.

### 4. Live Search Page (`/search`)
- Navigate to **Search** in the navbar.
- Simply start typing any word, reference code, VEM number, sender name, or phrase written inside scanned letters. Results update automatically as you type.
- Matches highlight whether the term was found in the title/sender or inside the scanned document text.

### 5. Viewing Letters & Scanned Text
- Open any letter to access the **Split-Screen Workspace**:
  - **Left Side**: High-resolution document viewer with Zoom In, Zoom Out, Rotate, and Download controls.
  - **Right Side**: Metadata card, status changer (`Received`, `Draft`, `In Review`, `Completed`, `Archived`), and the **Text Read from Document** panel with text accuracy scoring and one-click copy.

### 6. Office NAS & Storage Settings (`/settings`)
- **Network Storage (NAS)**: Toggle NAS integration and enter your share path (e.g. `Z:\LetterPort_Archive` or `\\192.168.1.100\Letters`). Test connection status with a single click.
- **Sample Letters**: Click **Load Sample Letters** to populate 5 realistic institutional letters with pre-assigned VEM numbers and OCR text. Clear them anytime with **Clear All Letters**.

---

## 💻 Developer Guide

### System Architecture

LetterPort follows an **Object-Oriented Service-Repository Pattern** in TypeScript:

```
LetterPort/
├── backend/                # Node.js / Express TypeScript API
│   ├── src/
│   │   ├── entities/       # Domain models (Letter, Attachment, OCRRecord)
│   │   ├── repositories/   # ILetterRepository, SqliteLetterRepository, PocketBaseLetterRepository
│   │   ├── services/       # LetterService, StorageService, OCRService, QueueService, SettingsService
│   │   ├── controllers/    # Express REST controllers
│   │   ├── routes/         # API route handlers
│   │   └── index.ts        # Bootstrap entrypoint
│   ├── tests/              # Automated backend test suite
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # Next.js 14 App Router + TailwindCSS
│   ├── src/
│   │   ├── app/            # App router pages (dashboard, letters, encode, search, settings)
│   │   ├── components/     # UI components (Navbar, SearchModal, ThemeToggle, PDFViewer, OCRTextViewer)
│   │   └── lib/            # Typed API client
│   ├── public/             # Static assets & favicon
│   ├── Dockerfile
│   └── package.json
│
├── docker/                 # Nginx reverse proxy configuration
├── docker-compose.yml      # Multi-container orchestration (Web, API, Worker, PocketBase, Postgres, Redis, Nginx)
├── .env.example            # Environment template
└── .gitignore              # OS-agnostic git ignore rules
```

---

### Prerequisites
- **Node.js**: version `18.x` or `20.x` or later
- **npm**: version `9.x` or later
- **Docker & Docker Compose** *(optional, for containerized deployment)*

---

### Local Setup & Quick Start

#### Step 1: Clone the Repository
```bash
git clone https://github.com/felixparejapmdit/LetterPort.git
cd LetterPort
```

#### Step 2: Install Dependencies
Install dependencies for both backend and frontend:
```bash
# Install root & workspace packages
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

#### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Default configuration works out of the box with zero setup:
```env
PORT=8766
FRONTEND_PORT=8765
DATABASE_TYPE=sqlite
DATABASE_FILE=./data/letterport.db
STORAGE_DIR=./uploads
QUEUE_TYPE=local
OCR_ENGINE=tesseract
NEXT_PUBLIC_API_URL=http://localhost:8766/api
```

#### Step 4: Run in Development Mode
You can start both backend and frontend concurrently:
```bash
# From root directory:
npm run dev
```

Or start them individually:
```bash
# Terminal 1 - Backend API:
cd backend
npm run dev

# Terminal 2 - Frontend UI:
cd frontend
npm run dev
```

- **Frontend Application**: [http://localhost:8765](http://localhost:8765)
- **Backend API**: [http://localhost:8766/api](http://localhost:8766/api)
- **API Health Check**: [http://localhost:8766/health](http://localhost:8766/health)

*(Windows users can double-click `start-dev.bat`, Mac users can double-click `start-dev.command`, or run `./start-dev.sh` on Linux/macOS).*

---

### Using with PocketBase

To run with **PocketBase**:
1. Run PocketBase locally or via Docker:
   ```bash
   docker run -p 8090:8090 -v pb_data:/pb_data ghcr.io/muchobien/pocketbase:latest
   ```
2. Set in your `.env`:
   ```env
   DATABASE_TYPE=pocketbase
   POCKETBASE_URL=http://localhost:8090
   ```
3. Restart the backend. If PocketBase is temporarily unavailable, LetterPort automatically falls back to local SQLite to ensure uninterrupted uptime.

#### PocketBase Admin UI & Database Browser:
- **Dashboard URL**: [http://localhost:8090/_/](http://localhost:8090/_/)
- **Superuser Email**: `admin@letterport.local`
- **Superuser Password**: `adminpassword123`

---

### 🐳 Zero-Config Docker & NAS Deployment

LetterPort is completely containerized, self-contained, and uses **relative storage paths** (`./letterport_data` and `./db_data`) so you can deploy on any NAS without configuring host drive paths or external SMB mappings.

#### 1-Click Installer (Linux, macOS, Synology, QNAP, TrueNAS)
```bash
chmod +x install.sh
./install.sh
```

Or start manually with Docker Compose:
```bash
docker compose up -d --build
```

> 📖 **Full NAS Guide**: For detailed GUI instructions on Synology Container Manager, QNAP Container Station, TrueNAS, and Portainer, see [NAS_DEPLOYMENT_GUIDE.md](file:///d:/PROJECTS/LetterPort/NAS_DEPLOYMENT_GUIDE.md).

#### Running Services:
| Service | Container Name | Host Port | Description |
|---|---|---|---|
| **Nginx** | `letterport-nginx` | `8765` | Reverse proxy gateway & static document server |
| **Web** | `letterport-web` | Internal (`8765`) | Next.js 14 Production Server |
| **API** | `letterport-api` | Internal (`5000`) | Node.js Express REST API |
| **Worker** | `letterport-worker` | Internal | Dedicated Tesseract OCR worker |
| **Database** | `letterport-db` | `5432` | PostgreSQL 16 database (`./db_data`) |
| **Redis** | `letterport-redis` | `6379` | In-memory job queue cache |
| **PocketBase** | `letterport-pocketbase` | `8090` | Embedded backend & Admin UI |

To stop the containers:
```bash
docker compose down
```

---

### 🧪 Running Tests & Typechecks

Run the backend automated test suite:
```bash
cd backend
npm test
```

Run TypeScript verification:
```bash
# Backend typecheck & build
cd backend
npm run build

# Frontend typecheck
cd frontend
npx tsc --noEmit
```

---

## 🛡️ License

This project is licensed under the MIT License.
