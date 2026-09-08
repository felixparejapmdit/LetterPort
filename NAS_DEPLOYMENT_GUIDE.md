# 🏢 LetterPort LMS - NAS Deployment Guide

This guide explains how to deploy LetterPort in a **Zero-Config / Plug-and-Play** architecture on any Network-Attached Storage (NAS) or server.

Because LetterPort uses **relative storage paths**, all uploaded letters, scanned documents, and databases are saved directly in the project folder without needing to configure host volume paths (like `/volume1/`).

---

## 📋 System Requirements

- **NAS Operating System**:
  - **Synology DSM 7.0+** (with Container Manager)
  - **QNAP QTS 5.0+** (with Container Station)
  - **TrueNAS SCALE** (or TrueNAS Core with Docker)
  - **Unraid 6.9+**
  - **Any Linux Server / VM** (Ubuntu, Debian, Alpine, CentOS, Proxmox)
- **RAM**: 2 GB minimum (4 GB recommended for background OCR processing)
- **Storage**: ~2 GB free disk space for Docker images + storage for correspondence documents.

---

## 🚀 Deployment Method 1: 1-Click Terminal / SSH (Recommended)

This is the fastest method across all NAS and Linux systems.

### Step 1: Connect via SSH
Open your terminal (macOS/Linux) or PowerShell (Windows) and connect to your NAS:
```bash
ssh admin@your-nas-ip
```

### Step 2: Clone or Download LetterPort
```bash
git clone https://github.com/felixparejapmdit/LetterPort.git
cd LetterPort
```

### Step 3: Run the Install Script
Make the installer executable and run it:
```bash
chmod +x install.sh
./install.sh
```

The script will automatically:
1. Validate Docker and Docker Compose.
2. Initialize local storage folders (`./letterport_data` and `./db_data`).
3. Set appropriate file permissions.
4. Build and boot all containers in detached mode.
5. Display your local network URL (e.g. `http://192.168.1.150:8765`).

---

## 🗄️ Deployment Method 2: Synology NAS (Container Manager GUI)

If you prefer using the Synology DSM web interface:

1. Open **Package Center** on Synology and install **Container Manager** (formerly Docker).
2. Open **File Station** and create a folder:
   ```
   /docker/letterport
   ```
3. Upload the LetterPort project files into `/docker/letterport` (or clone via SSH into this directory).
4. Open **Container Manager** in DSM:
   - Click on **Project** in the left sidebar.
   - Click **Create**.
   - **Project Name**: `letterport`
   - **Path**: Select `/docker/letterport`
   - **Source**: Select *Use existing docker-compose.yml*
   - Click **Next** and check *Start the project after creation*.
   - Click **Done**.
5. Once started, open your web browser and go to:
   ```
   http://<YOUR-SYNOLOGY-IP>:8765
   ```

---

## 🗄️ Deployment Method 3: QNAP NAS (Container Station)

1. Open **App Center** and install **Container Station**.
2. Open **File Station** and create a directory named `/Container/letterport`.
3. Copy or clone the project files into that folder.
4. Open **Container Station**:
   - Go to **Applications** on the left menu.
   - Click **Create**.
   - **Application Name**: `letterport`
   - Paste or upload the contents of `docker-compose.yml`.
   - Click **Deploy**.
5. Access LetterPort at:
   ```
   http://<YOUR-QNAP-IP>:8765
   ```

---

## 🗄️ Deployment Method 4: TrueNAS SCALE / Portainer

If you manage containers using **Portainer**:

1. Log into **Portainer** (`http://<server-ip>:9000`).
2. Go to **Stacks** ➔ **Add stack**.
3. Name the stack `letterport`.
4. Choose **Repository**:
   - Repository URL: `https://github.com/felixparejapmdit/LetterPort.git`
   - Compose path: `docker-compose.yml`
5. Click **Deploy the stack**.
6. Open your browser and navigate to:
   ```
   http://<server-ip>:8765
   ```

---

## 📁 Where is My Data Stored?

Because LetterPort uses relative bind-mounts, your files are never hidden inside abstract Docker virtual disks. They are saved directly in the project directory:

| Directory | Purpose | Access |
| :--- | :--- | :--- |
| `./letterport_data/` | All uploaded letters, PDFs, and scanned image files | You can browse, backup, or sync this folder with Synology Drive / Qsync |
| `./db_data/` | PostgreSQL relational database cluster | Database tables, indexes, OCR text records |
| `./pb_data/` | PocketBase database (if using PocketBase engine) | Local SQLite records and schema |

---

## 🛠️ Useful Management Commands

From the `LetterPort` directory on your NAS:

- **Check container status**:
  ```bash
  docker compose ps
  ```
- **View live application logs**:
  ```bash
  docker compose logs -f
  ```
- **Restart the entire stack**:
  ```bash
  docker compose restart
  ```
- **Stop the application**:
  ```bash
  docker compose down
  ```
- **Update to the latest version**:
  ```bash
  git pull origin main
  ./install.sh
  ```
