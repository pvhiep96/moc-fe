#!/usr/bin/env node

/**
 * This script checks and displays the current environment settings
 * Run with: node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment files in priority order
const envFiles = [
  '.env.local', // Highest priority (local overrides)
  '.env.development',
  '.env.production',
  '.env', // Lowest priority (defaults)
];

// Determine NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
// console.log(`\n📊 Current NODE_ENV: ${nodeEnv}\n`);

// Track loaded variables
const loadedVars = {};
const loadedFrom = {};

// Process each env file in order
envFiles.forEach(filename => {
  const filePath = path.resolve(process.cwd(), filename);
  
  if (fs.existsSync(filePath)) {
    // console.log(`🔍 Found ${filename}`);
    
    // Parse the env file
    const envConfig = dotenv.parse(fs.readFileSync(filePath));
    
    // Update loadedVars with values from this file
    // (only if they haven't been set by a higher priority file)
    Object.keys(envConfig).forEach(key => {
      if (!loadedVars[key]) {
        loadedVars[key] = envConfig[key];
        loadedFrom[key] = filename;
      }
    });
  } else {
    console.log(`❌ Missing ${filename}`);
  }
});

console.log('\n📋 Environment Variables:');
console.log('-------------------------');

// Display all loaded variables and their source files
Object.keys(loadedVars).forEach(key => {
  if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD')) {
    console.log(`${key}: [HIDDEN] (from ${loadedFrom[key]})`);
  } else {
    console.log(`${key}: ${loadedVars[key]} (from ${loadedFrom[key]})`);
  }
});

// Display API connection info
// console.log('\n🔌 API Information:');
// console.log('------------------');
const apiUrl = loadedVars.NEXT_PUBLIC_API_URL || 'Not configured';
// console.log(`API URL: ${apiUrl}`);

// Final instructions
// console.log('\n✅ Environment check complete');
// console.log('📝 To override any setting, create or edit .env.local');
// console.log('🚀 For production builds, environment variables should be set on your hosting platform\n'); 