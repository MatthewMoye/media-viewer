# media-viewer

Stream your media library and comic library to devices on your home network.

## App Views

### Main Viewer
<img src="z-assets/ui-view.png" alt="Main viewer" width="800" />

### Admin Page
<img src="z-assets/api-view.png" alt="Admin page" width="800" />

## What You Need

- Node.js 18+
- A computer on your home network to host the app
- Media folders and optional comic folders you want to share

## One-Time Setup

### 1. Install dependencies

Run this from the project root:

```bash
npm run install:all
```

### 2. Create HTTPS certificates

The API requires these files:

- certs/cert.pem
- certs/key.pem

Use mkcert to generate them for localhost and your local IP.

Windows:

```powershell
winget install FiloSottile.mkcert
mkcert -install
mkcert localhost 127.0.0.1 <your-local-ip>
mkdir certs -Force
move localhost+2.pem certs\cert.pem -Force
move localhost+2-key.pem certs\key.pem -Force
```

macOS/Linux:

```bash
brew install mkcert
mkcert -install
mkcert localhost 127.0.0.1 <your-local-ip>
mkdir -p certs
mv localhost+2.pem certs/cert.pem
mv localhost+2-key.pem certs/key.pem
```

### 3. Configure .env

Create a .env file in the project root that is a copy of [.env.example](.env.example) and fill in your values:

```env
API_PORT=3000
UI_PORT=5173
HOST=localhost

DATABASE_PATH=library.db
CACHE_PATH=cache
# Number of concurrent backend workers for media+CBZ thumbnail generation queue
THUMBNAIL_WORKER_COUNT=2

MEDIA_ROOTS=[{"name":"Media","path":"C:\\Path\\To\\Media"}]
CBZ_ROOTS=[{"name":"Comics","path":"C:\\Path\\To\\Comics"}]

# Authentication
AUTH_USER=admin
AUTH_PASS=your-secure-password-here
# Can generate a new secret with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=your-secret-key-change-this-in-production
```

Notes:

- `HOST` is shared by both the API and UI dev servers. Use `HOST=0.0.0.0` if you want other devices to connect directly instead of through the UI proxy.
- Directory changes made in the admin page are saved in cache/roots.json.
- THUMBNAIL_WORKER_COUNT controls concurrent backend thumbnail workers for both media and CBZ thumbnails (higher is faster warmup, but uses more CPU/disk). A value of 2-4 is usually a good range.

## Start The App

From the root of the project repo, run both the API and UI together:

```bash
npm run start
```

Or run them separately, each still from the project root:

```bash
npm run api dev
npm run ui host
```

These `api`/`ui` scripts forward to any script defined in that project's package.json, e.g. `npm run api build` or `npm run ui lint`.

## Where to Use This

- Host computer: use this README for setup and commands, and use the Admin page there to manage directories and run rescans at https://localhost:3000/ (or your configured `API_PORT`).
- Any device on your home network: use the Main Viewer in a browser to stream media.

## View the App On Other Devices

1. On another device, open a browser.
2. Go to `https://<your-local-ip>:5173` (or your configured `UI_PORT`)
3. Log in with AUTH_USER and AUTH_PASS from .env.

If you see a certificate warning, trust your mkcert certificate authority on that device.

## Features

- Video and image browsing
- CBZ comic browsing
- Search and filters
- Auth-protected admin page for rescan and directory management

## Security

- Home network use only
- Use a strong AUTH_PASS
- Use a long random AUTH_SECRET
