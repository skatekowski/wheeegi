#!/usr/bin/env node
/**
 * Dashboard Validation Script
 * Tests all dashboard API endpoints and validates data structure
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Dashboard is in tools/dashboard/, so go up 2 levels to project root
// validate.js -> dashboard/ -> tools/ -> bingeeo/ (project root)
const ROOT_DIR = join(__dirname, '..', '..');

const BASE_URL = process.env.DASHBOARD_URL || 'http://localhost:3001';
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('🧪 Dashboard Validation Tests\n');
  console.log(`Testing: ${BASE_URL}\n`);

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\n--- Results ---`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${tests.length}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Test 1: API Status endpoint
test('API Status endpoint', async () => {
  const response = await fetch(`${BASE_URL}/api/status`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  if (!data.success) throw new Error('Response not successful');
  if (!data.data.projectName) throw new Error('Missing projectName');
  if (!data.data.currentMode) throw new Error('Missing currentMode');
});

// Test 2: API Health endpoint
test('API Health endpoint', async () => {
  const response = await fetch(`${BASE_URL}/api/health`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  if (!data.success) throw new Error('Response not successful');
  if (!data.data.score) throw new Error('Missing health score');
});

// Test 3: API Journal endpoint
test('API Journal endpoint', async () => {
  const response = await fetch(`${BASE_URL}/api/journal`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  if (!data.success) throw new Error('Response not successful');
  if (!Array.isArray(data.data)) throw new Error('Journal should be an array');
});

// Test 4: API Roadmap endpoint
test('API Roadmap endpoint', async () => {
  const response = await fetch(`${BASE_URL}/api/roadmap`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  if (!data.success) throw new Error('Response not successful');
  if (!data.data.phases) throw new Error('Missing phases');
  if (!Array.isArray(data.data.phases)) throw new Error('Phases should be an array');
});

// Test 5: API Dashboard endpoint (combined)
test('API Dashboard endpoint (combined)', async () => {
  const response = await fetch(`${BASE_URL}/api/dashboard`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  if (!data.success) throw new Error('Response not successful');
  if (!data.data.status) throw new Error('Missing status');
  if (!data.data.health) throw new Error('Missing health');
  if (!data.data.roadmap) throw new Error('Missing roadmap');
});

// Test 6: Roadmap B.L.A.S.T. parsing
test('Roadmap B.L.A.S.T. status parsing', async () => {
  const response = await fetch(`${BASE_URL}/api/roadmap`);
  const data = await response.json();
  
  if (data.data.currentPhase) {
    const blast = data.data.currentPhase.blast || {};
    const expectedKeys = ['blueprint', 'link', 'architect', 'stabilize', 'trigger'];
    
    for (const key of expectedKeys) {
      if (!(key in blast)) {
        throw new Error(`Missing B.L.A.S.T. key: ${key}`);
      }
      const value = blast[key];
      if (!['completed', 'in_progress', 'pending'].includes(value)) {
        throw new Error(`Invalid B.L.A.S.T. status for ${key}: ${value}`);
      }
    }
  }
});

// Test 7: Required project files exist
test('Required project files exist', async () => {
  const requiredFiles = [
    '.planning/ROADMAP.md',
    '.planning/STATE.md',
    'project/mode-assessment.json',
    'project/process-journal.md'
  ];

  for (const file of requiredFiles) {
    const filePath = join(ROOT_DIR, file);
    // Debug: log the path being checked
    if (!existsSync(filePath)) {
      throw new Error(`Missing required file: ${file} (checked: ${filePath})`);
    }
  }
});

// Test 8: ROADMAP.md format validation
test('ROADMAP.md format validation', async () => {
  const roadmapPath = join(ROOT_DIR, '.planning', 'ROADMAP.md');
  const content = await readFile(roadmapPath, 'utf-8');
  
  // Check for required format elements
  if (!content.includes('### Phase')) {
    throw new Error('ROADMAP.md missing phase headers (### Phase)');
  }
  if (!content.includes('**Goal:**')) {
    throw new Error('ROADMAP.md missing Goal fields');
  }
  if (!content.includes('**Status:**')) {
    throw new Error('ROADMAP.md missing Status fields');
  }
});

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
