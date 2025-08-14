# StarForge Hub - Deployment Guide

## Deployment Issue Fixed

The deployment was failing because of a directory structure mismatch:
- **Problem**: Server expected static files in `dist/public`, but Vite built to `client/dist`
- **Solution**: Custom build script that properly structures files for deployment

## How to Deploy

### Option 1: Using Custom Build Script (Recommended)
```bash
# Build for production
node build.js

# Deploy the dist/ directory
# The static files will be in dist/public/
# The server file will be in dist/index.js
```

### Option 2: Manual Build Steps
```bash
# 1. Build client
vite build

# 2. Create dist directory structure
mkdir -p dist/public

# 3. Copy client files to expected location
cp -r client/dist/* dist/public/

# 4. Build server
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

## Deployment Configuration

### Expected Directory Structure After Build:
```
dist/
├── public/           # Static files (HTML, CSS, JS, assets)
│   ├── index.html
│   ├── assets/
│   └── ...other static files
└── index.js         # Built server file
```

### Environment Variables Needed:
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key  
- `SESSION_SECRET` - Session encryption secret
- `PORT` - Server port (defaults to 5000)

### Production Start Command:
```bash
NODE_ENV=production node dist/index.js
```

## Build Script Details

The `build.js` script:
1. Builds client with Vite (`vite build` → `client/dist`)
2. Creates proper directory structure (`dist/public`)
3. Copies client files to expected location (`client/dist` → `dist/public`)
4. Builds server with esbuild (`server/index.ts` → `dist/index.js`)

## Verification

After building, verify the structure:
```bash
ls -la dist/
ls -la dist/public/
```

You should see:
- `dist/index.js` (server file)
- `dist/public/` directory with all static assets