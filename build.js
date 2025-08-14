#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏗️ Building StarForge Hub for deployment...');

try {
  // Step 1: Build the client with Vite
  console.log('📦 Building client with Vite...');
  execSync('vite build', { stdio: 'inherit' });

  // Step 2: Create dist directory if it doesn't exist
  const distDir = path.join(__dirname, 'dist');
  const publicDir = path.join(distDir, 'public');
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Step 3: Copy client build files to dist/public
  const clientDistDir = path.join(__dirname, 'client', 'dist');
  
  if (fs.existsSync(clientDistDir)) {
    console.log('📋 Copying client files to dist/public...');
    
    // Remove existing public directory
    if (fs.existsSync(publicDir)) {
      fs.rmSync(publicDir, { recursive: true, force: true });
    }
    
    // Copy client/dist to dist/public
    fs.cpSync(clientDistDir, publicDir, { recursive: true });
    console.log('✅ Client files copied successfully');
  } else {
    throw new Error('Client build directory not found. Make sure vite build completed successfully.');
  }

  // Step 4: Build server
  console.log('🖥️ Building server...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

  console.log('🎉 Build completed successfully!');
  console.log('📁 Static files are in: dist/public');
  console.log('🚀 Server file is in: dist/index.js');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}