/**
 * Automatic CSV Export Script
 * Downloads nomination data as CSV every 5 minutes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
}

// Configuration
const EXPORT_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const DOWNLOAD_FOLDER = path.join(__dirname, 'csv-downloads');

// Get API URL from environment variable or use default
// For Devvit apps, you'll need to get the actual app URL from Reddit
// Example: https://developers.reddit.com/r/yoursubreddit/apps/yourapp
const API_URL = process.env.EXPORT_API_URL || 'http://localhost:3000/api/export-csv';

// Ensure download folder exists
if (!fs.existsSync(DOWNLOAD_FOLDER)) {
  fs.mkdirSync(DOWNLOAD_FOLDER, { recursive: true });
}

/**
 * Download CSV and save to file
 */
async function downloadCSV() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `nominations-${timestamp}.csv`;
    const filepath = path.join(DOWNLOAD_FOLDER, filename);

    console.log(`[${new Date().toISOString()}] Downloading CSV...`);

    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvData = await response.text();
    
    fs.writeFileSync(filepath, csvData, 'utf8');
    
    console.log(`[${new Date().toISOString()}] ✅ CSV saved: ${filename}`);
    console.log(`   File size: ${(csvData.length / 1024).toFixed(2)} KB`);
    
    // Optional: Clean up old files (keep last 100)
    cleanupOldFiles();
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error downloading CSV:`, error.message);
  }
}

/**
 * Remove old CSV files, keeping only the most recent 100
 */
function cleanupOldFiles() {
  try {
    const files = fs.readdirSync(DOWNLOAD_FOLDER)
      .filter(f => f.endsWith('.csv'))
      .map(f => ({
        name: f,
        path: path.join(DOWNLOAD_FOLDER, f),
        time: fs.statSync(path.join(DOWNLOAD_FOLDER, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // newest first

    if (files.length > 100) {
      const toDelete = files.slice(100);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`   🗑️  Deleted old file: ${file.name}`);
      });
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error.message);
  }
}

/**
 * Start the automatic export process
 */
function start() {
  console.log('🚀 Starting automatic CSV export service...');
  console.log(`📁 Download folder: ${DOWNLOAD_FOLDER}`);
  console.log(`⏱️  Export interval: ${EXPORT_INTERVAL / 1000 / 60} minutes`);
  console.log(`🌐 API endpoint: ${API_URL}`);
  console.log('');
  
  // Download immediately on start
  downloadCSV();
  
  // Then download every 5 minutes
  setInterval(downloadCSV, EXPORT_INTERVAL);
  
  console.log('✅ Service running. Press Ctrl+C to stop.\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down CSV export service...');
  process.exit(0);
});

// Start the service
start();
