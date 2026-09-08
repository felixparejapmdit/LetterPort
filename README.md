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

- **⚡ Live Search As-You-Type**: Instant debounced search querying across letter metadata, senders, recipients, and text extracted from scanned documents.
- **⌨️ Global `Ctrl+K` / `Cmd+K` Command Modal**: Accessible on any page with keyboard arrow navigation and immediate document opening.
- **🔢 VEM-Number Tracking**: Institutional tracking number assigned to correspondence alongside auto-generated reference codes (`LP-IN-YYYY-XXXX`).
- **🌙 Sleek Dark Mode & Light Mode**: Curated theme switcher with system preference detection, localStorage persistence, and zero-flicker hydration.
- **📱 Fully Mobile Responsive**: Engineered with a collapsible hamburger navigation drawer, responsive tables, and mobile-friendly document split views.
- **🔍 Automated Background Text Reader (OCR)**: Scans PDF documents and images (JPG, PNG, TIFF) using background worker queues, transcribing text for instant full-text indexing with reading accuracy scoring.
- **📂 In-Browser Document Viewer**: High-performance viewer supporting zoom, rotation, side-by-side text viewing, and downloads.
- **💾 Dual Database Engine (PocketBase & SQLite)**: Supports **PocketBase** as the primary backend database with zero-setup automatic **SQLite** fallback. Also includes full PostgreSQL configuration for enterprise deployments.
- **🗄️ Office Network Storage (NAS) Integration**: Settings interface to connect and automatically sync uploaded correspondence to Synology, QNAP, TrueNAS, or Windows network shares.
- **🧪 Demo Sample Data**: One-click demo letter generator and cleanup tool to preview the system immediately.

---

## 📖 User Guide

### 1. Dashboard Overview
- Navigate to the **Dashboard** (`/`) to view live metric cards: **Total Letters**, **Incoming Letters**, **Outgoing Letters**, **Reading Text** (pending OCR), and **Urgent Items**.
- Inspect recent correspondence in the table and click the **Eye icon** (`👁️`) to open any letter.

### 2. Adding a Letter
1. Click **Add Letter** in the top navigation or dashboard.
2. Choose **Direction**:
   - `Incoming`: Received from an external sender.
   - `Outgoing`: Dispatched by your office.
3. Fill in the **Sender**, **Recipient**, and **Subject**.
4. The **Reference Number** is auto-generated. You can also assign or regenerate a custom **VEM-Number**.
5. Set priority (`Low`, `Normal`, `High`, `Urgent`) and add optional category tags (`#tax`, `#invoice`, `#memo`).
6. Attach a scan or PDF of the letter by clicking or dragging files into the upload box.
7. Click **Save Letter & Read Text**. The system saves your letter and starts background OCR reading immediately.

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
PORT=5001
FRONTEND_PORT=3001
DATABASE_TYPE=sqlite
DATABASE_FILE=./data/letterport.db
STORAGE_DIR=./uploads
QUEUE_TYPE=local
OCR_ENGINE=tesseract
NEXT_PUBLIC_API_URL=http://localhost:5001/api
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

- **Frontend Application**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api)
- **API Health Check**: [http://localhost:5001/health](http://localhost:5001/health)

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

---

### 🐳 Docker Production Deployment

LetterPort is fully containerized and OS-agnostic. To deploy the entire production stack (Frontend, Backend, PocketBase, PostgreSQL, Redis, OCR Worker, and Nginx reverse proxy):

```bash
docker compose up -d --build
```

#### Running Services:
| Service | Container Name | Port | Description |
|---|---|---|---|
| **Nginx** | `letterport-nginx` | `80`, `443` | Reverse proxy & static assets |
| **Web** | `letterport-web` | `3000` | Next.js 14 Production Server |
| **API** | `letterport-api` | `5000` | Node.js Express REST API |
| **PocketBase** | `letterport-pocketbase` | `8090` | Embedded backend & Admin UI |
| **Worker** | `letterport-worker` | Internal | Dedicated Tesseract OCR worker |
| **Database** | `letterport-db` | `5432` | PostgreSQL 16 database |
| **Redis** | `letterport-redis` | `6379` | In-memory job queue cache |

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
