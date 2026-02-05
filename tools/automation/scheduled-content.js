#!/usr/bin/env node
/**
 * Scheduled content generation
 * Runs weekly to generate social media content
 * 
 * Usage: 
 * - Manual: node tools/automation/scheduled-content.js
 * - Cron: 0 17 * * 5 node /path/to/scheduled-content.js
 *   (Every Friday at 5 PM)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../docs/content');
const LOG_FILE = path.join(__dirname, '../../docs/content/generation-log.txt');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(message);
}

function generateWeeklyContent() {
  const week = getCurrentWeek();
  
  log(`Generating weekly content for Week ${week}...`);
  
  try {
    // Generate Twitter thread
    log('Generating Twitter thread...');
    execSync(`node tools/automation/generate-content.js --format twitter-thread --topic week${week}`, 
      { stdio: 'inherit' });
    
    // Generate LinkedIn post
    log('Generating LinkedIn post...');
    execSync(`node tools/automation/generate-content.js --format linkedin-post --topic week${week}`, 
      { stdio: 'inherit' });
    
    log('✅ Weekly content generation complete');
  } catch (error) {
    log(`❌ Error generating content: ${error.message}`);
  }
}

function getCurrentWeek() {
  const startDate = new Date('2026-01-29');
  const today = new Date();
  const diffTime = Math.abs(today - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
}

// Main
if (require.main === module) {
  generateWeeklyContent();
}

module.exports = { generateWeeklyContent };
