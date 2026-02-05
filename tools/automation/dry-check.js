#!/usr/bin/env node
/**
 * DRY Check + Refactor (Kombi) – DRY compliance and refactoring recommendations
 * Scans for duplicates/similarity and robustness issues, then outputs manual refactoring steps.
 * One command: check + refactor hints. No auto-fix.
 */

const path = require('path');
const fs = require('fs');
const FIPAssistant = require('./fip-assistant');

const PROJECT_DIR = process.cwd();
const DEFAULT_DIRS = ['src/components', 'src', 'tools/automation', 'tools/dashboard', 'experience/src', 'dashboard/frontend/src'];

function findJsFiles(dir) {
  const full = path.join(PROJECT_DIR, dir);
  if (!fs.existsSync(full)) return [];
  const out = [];
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next'].includes(e.name)) {
        walk(p);
      } else if (e.isFile() && /\.(tsx?|jsx?)$/.test(e.name)) {
        out.push(path.relative(PROJECT_DIR, p));
      }
    }
  }
  walk(full);
  return out;
}

function checkRobustness(filePath, content) {
  const errors = [];
  if (/(id|providerId|key)\s*===\s*['"][^'"]+['"]/i.test(content)) {
    errors.push('Hardcoded ID – use dynamic IDs from store/backend.');
  }
  if (filePath.match(/\.(tsx|jsx)$/) && /\.(name|title)\s*===\s*['"][^'"]+['"]/i.test(content)) {
    errors.push('Magic string for UI – use Enums or Types.');
  }
  if (filePath.match(/\.(tsx|jsx)$/)) {
    const n = (content.match(/\?.+:|filter\(|sort\(/g) || []).length;
    if (n > 5) errors.push('High logic density – move logic to Hook or Store.');
  }
  if (content.includes('any') || content.includes('@ts-ignore')) {
    errors.push('Type hack (any/ts-ignore) – use strict typing.');
  }
  return errors;
}

async function run() {
  const args = process.argv.slice(2);
  const dirs = args.length ? args : DEFAULT_DIRS;

  console.log('🔍 WHEEE DRY + Refactor (Kombi)\n');
  console.log('Scanning:', dirs.join(', '));
  console.log('');

  const fip = new FIPAssistant();
  const allFiles = [];
  for (const dir of dirs) {
    allFiles.push(...findJsFiles(dir));
  }
  const unique = [...new Set(allFiles)];

  // 1. Duplicates by base name (same name in different dirs)
  const byBase = new Map();
  for (const file of unique) {
    const base = path.basename(file, path.extname(file));
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(file);
  }
  const duplicateNames = [];
  byBase.forEach((files, base) => {
    if (files.length > 1) duplicateNames.push({ base, files });
  });

  // 2. FIP similarity (component similarity in src/components)
  const similarityReports = [];
  const seen = new Set();
  for (const file of unique) {
    const base = path.basename(file, path.extname(file));
    const key = base.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    const sim = await fip.checkSimilarity(base);
    if (sim.matches.length > 0) {
      similarityReports.push({ query: base, file, matches: sim.matches });
    }
  }

  // 3. Robustness
  const robustnessReports = [];
  for (const file of unique) {
    const full = path.join(PROJECT_DIR, file);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, 'utf-8');
    const errors = checkRobustness(file, content);
    if (errors.length) robustnessReports.push({ file, errors });
  }

  let hasIssues = false;

  if (duplicateNames.length > 0) {
    hasIssues = true;
    console.log('⚠️  DUPLICATES (same base name in different paths)');
    console.log('   Consolidate or rename to avoid confusion.\n');
    duplicateNames.forEach(({ base, files }) => {
      console.log(`   "${base}"`);
      files.forEach(f => console.log(`     - ${f}`));
      console.log('');
    });
  }

  if (similarityReports.length > 0) {
    hasIssues = true;
    console.log('⚠️  SIMILARITY (DRY)');
    console.log('   Components with similar names – consider merging or renaming.\n');
    similarityReports.forEach(({ query, file, matches }) => {
      console.log(`   "${query}" (${file})`);
      matches.forEach(m => console.log(`     similar to: ${m.name} (${m.path})`));
      console.log('');
    });
  }

  if (robustnessReports.length > 0) {
    hasIssues = true;
    console.log('⚠️  ROBUSTNESS / REFACTORING HINTS');
    console.log('   Address these for cleaner, maintainable code.\n');
    robustnessReports.forEach(({ file, errors }) => {
      console.log(`   ${file}`);
      errors.forEach(e => console.log(`     - ${e}`));
      console.log('');
    });
  }

  if (!hasIssues) {
    console.log('✅ No DRY or robustness issues reported.');
    console.log('   (Scan limited to: ' + dirs.join(', ') + ')\n');
    return;
  }

  console.log('--- [ Manual refactoring ] ---');
  console.log('1. Duplicates: Merge or rename files with same base name (see above).');
  console.log('2. Similarity: Consolidate similar components or rename for clarity.');
  console.log('3. Robustness: Replace hardcoded IDs, magic strings; extract logic to hooks; fix types.');
  console.log('4. Re-run: wheee dry-refactor  (or wheee audit for full WHEEE compliance).');
  console.log('');
  process.exit(1);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
