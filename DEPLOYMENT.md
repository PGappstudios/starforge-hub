# Deployment Guide for StarForge Hub

## Overview
This document provides instructions for deploying the StarForge Hub gaming platform. The application requires a specific build process to properly structure files for production deployment.

## Build Process

### Prerequisites
- Node.js environment
- All dependencies installed (`npm install` already completed)
- Database configured (PostgreSQL)
- Environment variables set (if using external services)

### Building for Production

**Use the custom build script:**
```bash
node build.js
```

This script will:
1. Build the React frontend using Vite
2. Create the proper directory structure (`dist/public/`)
3. Copy all static files to the correct location
4. Compile the Express server to `dist/index.js`

### Expected Output Structure
After running `node build.js`, you should see:
```
dist/
├── public/              # Static files (HTML, CSS, JS, assets)
│   ├── assets/          # Bundled application files
│   ├── index.html       # Main HTML file
│   ├── favicon.ico      # Site icon
│   └── ...             # Other static assets
└── index.js            # Compiled Express server
```

### Starting Production Server
```bash
NODE_ENV=production node dist/index.js
```

## Deployment on Replit

### For Replit Deployments:
1. Run the build command: `node build.js`
2. Ensure environment variables are set in Replit Secrets
3. The deployment system will automatically use the built files
4. Server will serve static files from `dist/public/` and API from the Express server

### Important Notes:
- **DO NOT** use the default `npm run build` script for deployment
- **ALWAYS** use `node build.js` for production builds
- The server expects static files at `dist/public/` (not `client/dist/`)
- Both development and production modes are supported by the same codebase

## Troubleshooting

### Common Issues:
1. **"Cannot find build directory"** - Run `node build.js` first
2. **Static files not loading** - Verify files are in `dist/public/` not `client/dist/`
3. **Server errors** - Check environment variables and database connection

### Verification:
After building, verify the structure:
```bash
ls -la dist/
ls -la dist/public/
```

You should see the server file at `dist/index.js` and all static assets in `dist/public/`.

## Environment Configuration

Required environment variables for production:
- `DATABASE_URL` - PostgreSQL database connection string
- `SESSION_SECRET` - Session encryption key
- `STRIPE_SECRET_KEY` - Stripe API key (if using payments)
- `NODE_ENV=production` - Ensures production mode