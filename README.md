# media-viewer

App to stream media from one device to other devices on your home network.

## Prerequisites

- Node.js 18+ (with npm)
- Windows 11, macOS, or Linux
- Local network connectivity between devices

## Setup

### 1. Clone and Install Dependencies

```bash
# Install API dependencies
cd api
npm install

# Install UI dependencies
cd ../ui
npm install
```

### 2. Set Up HTTPS Certificates (Required)

The API runs in HTTPS-only mode. You must create:
- `api/certs/cert.pem`
- `api/certs/key.pem`

Use `mkcert` to generate certificates for your machine hostname, localhost, and LAN IP.

#### Windows 11
```powershell
# Install mkcert
winget install FiloSottile.mkcert

# Create local CA and certificates (run from project root)
mkcert -install
mkcert localhost 127.0.0.1 <your-local-ip>

# Organize certificates
mkdir api\certs -Force
move localhost+2.pem api\certs\cert.pem -Force
move localhost+2-key.pem api\certs\key.pem -Force
```

#### macOS / Linux
```bash
# Install mkcert (using brew on macOS)
brew install mkcert

# Create local CA and certificates (run from project root)
mkcert -install
mkcert localhost 127.0.0.1 <your-local-ip>

# Organize certificates
mkdir -p api/certs
mv localhost+2.pem api/certs/cert.pem
mv localhost+2-key.pem api/certs/key.pem
```

**Note**: Replace `<your-local-ip>` with your host machine LAN IP (for example `192.168.1.42`).

### 3. Configure Environment Variables

Edit `api/.env`:

```env
PORT=3000
HOST=localhost

DATABASE_PATH=library.db
CACHE_PATH=cache

MEDIA_ROOTS=[{"name":"Your Folder","path":"C:\\Path\\To\\Media"}]
CBZ_ROOTS=[{"name":"Your Comics","path":"C:\\Path\\To\\Comics"}]

# Authentication
AUTH_USER=admin
AUTH_PASS=your-secure-password
AUTH_SECRET=your-secret-key-change-this
```

## Running the App

### Start API Server

```bash
cd api
npm run dev
```

The API will run on `https://<host>:3000`.
If cert files are missing, startup fails by design.

### Start UI Dev Server

In another terminal:

```bash
cd ui
npm run host
```

If API certs exist, Vite will also serve HTTPS using the same cert/key pair.

## Accessing on Your Network

Once both servers are running:

1. Open your browser on any device on your home network
2. Navigate to: `https://<your-local-ip>:5173`
3. Login with your configured credentials
4. Browse and stream media from other devices

If another device shows certificate warnings, trust the certificate authority on that device or install a cert trusted by that device.

## Features

- Stream videos and view images across your home network
- Support for CBZ comic book archives
- Tag-based filtering for comics
- Secure authentication with JWT and httpOnly cookies
- HTTPS-only API mode
- Responsive design for mobile and desktop

## Security Notes

- This app is designed for **home network use only**
- Use strong passwords in `AUTH_PASS`
- Change `AUTH_SECRET` to a unique value
- Login is rate-limited to 3 failed attempts per 15-minute window
- Tokens expire after 3 days
- All authentication uses secure httpOnly cookies over HTTPS
- `POST /rescan` is used for library rescans (no state-changing GET)
