#!/usr/bin/env node
/**
 * File watcher that auto-documents changes
 * Runs in background and watches for:
 * - SOP file changes (document as learning)
 * - Architecture file changes (document as decision)
 * - Error log entries (document as challenge)
 * 
 * Usage: node tools/automation/auto-doc-watcher.js
 * Run in background: nohup node tools/automation/auto-doc-watcher.js &
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WATCH_DIRS = [
  path.join(__dirname, '../../architecture'),
  path.join(__dirname, '../../project'),
  path.join(__dirname, '../../tools'),
];

const LAST_CHECK_FILE = path.join(__dirname, '.last-check.json');

function getLastCheck() {
  if (fs.existsSync(LAST_CHECK_FILE)) {
    return JSON.parse(fs.readFileSync(LAST_CHECK_FILE, 'utf-8'));
  }
  return {};
}

function saveLastCheck(timestamps) {
  fs.writeFileSync(LAST_CHECK_FILE, JSON.stringify(timestamps, null, 2));
}

function documentChange(filePath, changeType) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  if (relativePath.includes('architecture/')) {
    // Architecture change = decision or learning
    const fileName = path.basename(filePath, '.md');
    execSync(`node tools/automation/doc-process.js --type learning --title "Architecture Update: ${fileName}" --content "Updated architecture file: ${relativePath}"`, 
      { stdio: 'ignore' });
  } else if (relativePath.includes('project/errors.md')) {
    // Error log entry = challenge
    execSync(`node tools/automation/doc-process.js --type challenge --title "Error Logged" --content "New error entry in errors.md"`, 
      { stdio: 'ignore' });
  } else if (relativePath.includes('project/gemini.md')) {
    // Schema change = decision
    execSync(`node tools/automation/doc-process.js --type decision --title "Schema Update" --content "Updated data schemas in gemini.md"`, 
      { stdio: 'ignore' });
  }
}

function checkFiles() {
  const lastCheck = getLastCheck();
  const currentCheck = {};
  
  function walkDir(dir, baseDir = dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath, baseDir);
      } else if (file.endsWith('.md') || file.endsWith('.py') || file.endsWith('.js')) {
        const relativePath = path.relative(process.cwd(), filePath);
        const mtime = stat.mtime.getTime();
        
        currentCheck[relativePath] = mtime;
        
        if (!lastCheck[relativePath] || lastCheck[relativePath] < mtime) {
          // File changed or new file
          if (lastCheck[relativePath]) {
            // File was modified
            documentChange(filePath, 'modified');
          }
        }
      }
    }
  }
  
  for (const dir of WATCH_DIRS) {
    walkDir(dir);
  }
  
  saveLastCheck(currentCheck);
}

// Run check every 5 minutes
setInterval(() => {
  try {
    checkFiles();
  } catch (error) {
    // Silent fail - don't spam console
  }
}, 5 * 60 * 1000);

// Initial check
checkFiles();

console.log('🔍 Auto-documentation watcher started');
console.log('   Watching:', WATCH_DIRS.join(', '));
console.log('   Check interval: 5 minutes');
console.log('   Press Ctrl+C to stop');
