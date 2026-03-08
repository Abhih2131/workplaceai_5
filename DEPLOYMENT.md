# HR Analytics Dashboard – Deployment Guide

This project supports **two deployment modes** from a single codebase:

| Feature | Cloud Mode | Local / On-Prem Mode |
|---|---|---|
| Hosting | Lovable Cloud / Web | Local machine / office server |
| Internet required | Yes | No (for core features) |
| Data location | Cloud | Local machine |
| Config file | `.env.cloud` | `.env.local` |

---

## Architecture

```
┌─────────────────────────────────────────┐
│            Same React Codebase          │
│  (Dashboard, Charts, Filters, Reports)  │
├────────────────┬────────────────────────┤
│  Cloud Config  │   Local Config         │
│  .env.cloud    │   .env.local           │
├────────────────┼────────────────────────┤
│  Cloud hosting │   Docker / npm dev     │
│  Cloud storage │   Local file storage   │
│  Cloud auth    │   No auth / local auth │
└────────────────┴────────────────────────┘
```

The `src/lib/deploymentConfig.ts` module reads `VITE_DEPLOYMENT_MODE` and exposes a unified config object. All mode-dependent behavior references this single source.

---

## Cloud Mode (Default)

This is the standard deployment used on Lovable Cloud.

### How it works
- Uses `.env.cloud` configuration (or no `.env` file – defaults to cloud)
- Deployed and hosted automatically via Lovable
- No additional setup required

### Startup
Handled by Lovable Cloud automatically. For manual builds:
```bash
npm run build
npm run preview
```

---

## Local / On-Prem Mode

### Option 1: Docker (Recommended)

**Prerequisites:** Docker and Docker Compose installed.

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-folder>

# Start with Docker
docker-compose up --build

# Open in browser
# http://localhost:8080
```

To stop:
```bash
docker-compose down
```

**Data files:** Place Excel files in `./public/data/` – they are mounted into the container.

### Option 2: npm (Development mode)

**Prerequisites:** Node.js 18+ installed.

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-folder>

# Copy local config
cp .env.local .env

# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:8080
```

### Option 3: One-click startup scripts

**Windows:**
```
Double-click start-local.bat
```

**Mac/Linux:**
```bash
chmod +x start-local.sh
./start-local.sh
```

These scripts auto-detect Docker availability and fall back to npm.

### Option 4: Static build for local server

```bash
cp .env.local .env
npm run build
# Serve the `dist/` folder with any static file server
npx serve dist -l 8080
```

---

## Configuration Reference

| Variable | Description | Cloud Default | Local Default |
|---|---|---|---|
| `VITE_DEPLOYMENT_MODE` | `cloud` or `local` | `cloud` | `local` |
| `VITE_APP_TITLE` | App title shown in UI | HR Analytics Dashboard | HR Analytics Dashboard (Local) |
| `VITE_API_BASE_URL` | Base URL for APIs | (empty) | `http://localhost:8080` |
| `VITE_AUTH_MODE` | `cloud`, `local`, or `none` | `cloud` | `none` |
| `VITE_DATA_BASE_PATH` | Path for data files | `/data` | `/data` |
| `VITE_PORT` | Server port | `8080` | `8080` |

---

## Data Management (Local Mode)

- Place Excel master files in `public/data/`
- In Docker mode, this folder is volume-mounted so files persist
- All data processing happens client-side in the browser
- **No data leaves the local machine** – ideal for sensitive HR data

---

## Validation Checklist

### Cloud Mode
- [ ] App loads at cloud URL
- [ ] All dashboard tabs render correctly
- [ ] Filters work as expected
- [ ] Chart exports (PPT/PDF/Excel) work
- [ ] "Download Dashboard PPT" generates full deck
- [ ] Demo data loads correctly

### Local Mode
- [ ] App starts via Docker or npm
- [ ] Opens at http://localhost:8080
- [ ] Excel upload works
- [ ] Demo data loads correctly
- [ ] All dashboard tabs render
- [ ] Filters work
- [ ] Chart exports work
- [ ] No internet requests for core features
- [ ] Data stays on local machine

---

## Limitations

1. **No local database** – The app is fully client-side; data is loaded from Excel files in both modes. No separate database is needed.
2. **Authentication** – Cloud mode can use cloud auth when configured. Local mode defaults to no auth (suitable for controlled on-prem environments).
3. **Real-time sync** – Local mode does not sync data between multiple users. Each user works with their own uploaded files.

---

## Files Added for Dual Deployment

| File | Purpose |
|---|---|
| `src/lib/deploymentConfig.ts` | Runtime config module reading env vars |
| `.env.cloud` | Cloud deployment environment variables |
| `.env.local` | Local deployment environment variables |
| `Dockerfile` | Multi-stage Docker build |
| `docker-compose.yml` | One-command local Docker startup |
| `nginx.conf` | Nginx config for serving the SPA locally |
| `start-local.bat` | Windows one-click startup |
| `start-local.sh` | Mac/Linux one-click startup |
| `DEPLOYMENT.md` | This documentation |
