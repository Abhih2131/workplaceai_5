# WorkplaceAI – Local Setup Guide

A simple guide to run the HR Analytics Dashboard on your own computer.

---

## What You Need

**Required:**
- **Node.js** (version 20 or higher) → [Download here](https://nodejs.org)

**Optional:**
- **Docker Desktop** → [Download here](https://www.docker.com/products/docker-desktop/) (for containerized deployment)
- **Git** → [Download here](https://git-scm.com) (for cloning the repository)

---

## Quick Start (3 Steps)

### Step 1 — Download the Project

- Go to the GitHub repository page
- Click the green **"Code"** button → **"Download ZIP"**
- Extract the ZIP file to any folder (e.g., `C:\WorkplaceAI`)

### Step 2 — Install Node.js (if not already installed)

- Download from [https://nodejs.org](https://nodejs.org)
- Choose the **LTS** version
- Run the installer with default settings
- **Restart your computer** after installation

### Step 3 — Start the Application

- Open the extracted project folder
- **Double-click** `Start_WorkplaceAI.bat`
- The script will:
  - ✅ Check your system requirements
  - ✅ Install project dependencies (first time only)
  - ✅ Start the application server
  - ✅ Open your browser automatically

The dashboard will open at: **http://localhost:8080**

---

## Stopping the Application

**Option A:** Close the command window that opened when you started the app.

**Option B:** Double-click `Stop_WorkplaceAI.bat` to stop all services.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Script says Node.js is missing | Install Node.js from [nodejs.org](https://nodejs.org) and restart your computer |
| "npm install" fails | Check your internet connection and try again |
| Browser doesn't open | Manually open http://localhost:8080 |
| Port 8080 already in use | Close other applications using that port, or run `Stop_WorkplaceAI.bat` first |

---

## Updating the Application

1. Download the latest ZIP from GitHub
2. Extract it to the same folder (overwrite files)
3. Double-click `Start_WorkplaceAI.bat` — dependencies will update automatically

---

## Notes

- All your data stays on your local machine — nothing is sent to the cloud
- The first startup takes longer because dependencies need to be downloaded
- Subsequent startups are much faster
