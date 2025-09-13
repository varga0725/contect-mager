#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('🚀 Verifying project setup...\n');

// Test frontend build
console.log('📦 Testing frontend build...');
const frontendBuild = spawn('npm', ['run', 'build'], { 
  cwd: './frontend',
  stdio: 'pipe'
});

let frontendSuccess = false;
frontendBuild.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Frontend build successful');
    frontendSuccess = true;
  } else {
    console.log('❌ Frontend build failed');
  }
});

// Test backend build
console.log('📦 Testing backend build...');
const backendBuild = spawn('npm', ['run', 'build'], { 
  cwd: './backend',
  stdio: 'pipe'
});

let backendSuccess = false;
backendBuild.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Backend build successful');
    backendSuccess = true;
  } else {
    console.log('❌ Backend build failed');
  }
});

// Wait for builds to complete
await setTimeout(10000);

if (frontendSuccess && backendSuccess) {
  console.log('\n🎉 Project setup verification complete!');
  console.log('\nNext steps:');
  console.log('1. cd frontend && npm run dev (starts frontend on port 5173)');
  console.log('2. cd backend && npm run dev (starts backend on port 3001)');
} else {
  console.log('\n❌ Setup verification failed. Please check the errors above.');
}

process.exit(0);