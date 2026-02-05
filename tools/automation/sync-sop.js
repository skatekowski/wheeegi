#!/usr/bin/env node
/**
 * WHEEE Living SOP - Auto-Sync Tool (Refactored v1.5.1)
 */

const core = require('./lib/core');
const reporter = require('./lib/reporter');

function run() {
  reporter.header('Living SOP: Synchronizing Implementation with Architecture...');
  
  if (!core.exists('architecture') || !core.exists('src')) {
    reporter.fail('Project structure not recognized (architecture/ or src/ missing).');
    return;
  }

  function getRecentFiles(dir, limit = 5) {
    let results = [];
    core.list(dir, { recursive: true }).forEach(f => {
      const fullPath = `${dir}/${f}`;
      const stats = core.stats(fullPath);
      if (stats.isFile() && !f.includes('node_modules')) {
        results.push({ path: f, mtime: stats.mtimeMs });
      }
    });
    return results.sort((a, b) => b.mtime - a.mtime).slice(0, limit);
  }

  const recentCode = getRecentFiles('src');
  reporter.info('Recent Code Changes:');
  recentCode.forEach(f => console.log(`   - ${f.path}`));

  console.log('\n🛠 Suggested SOP Update Draft:');
  console.log('--------------------------------------------------');
  console.log('### Refined Interaction Patterns');
  recentCode.forEach(f => {
    console.log(`- **${f.path}**: Verified pattern implementation.`);
  });
  console.log('--------------------------------------------------');
  
  reporter.pass('Sync draft generated.');
}

run();
