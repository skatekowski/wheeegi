#!/usr/bin/env node
/**
 * WHEEE Context Cleaner - Automated Archiving (Refactored v1.5.1)
 */

const core = require('./lib/core');
const reporter = require('./lib/reporter');

function run() {
  reporter.header('Context Cleaner: Sweeping old plans...');
  
  const phasesDir = '.planning/phases';
  const archiveDir = '.planning/archive/phases';

  if (!core.exists(phasesDir)) {
    reporter.warn('No phases found to clean.');
    return;
  }

  const phases = core.list(phasesDir).filter(d => core.stats(`${phasesDir}/${d}`).isDirectory());
  let count = 0;

  phases.forEach(phase => {
    const phasePath = `${phasesDir}/${phase}`;
    const isCompleted = core.list(phasePath).some(f => f.includes('SUMMARY'));

    if (isCompleted) {
      reporter.info(`Archiving completed phase: ${phase}`);
      const destPath = `${archiveDir}/${phase}`;
      
      if (core.exists(destPath)) {
        const timestamp = Date.now();
        core.write(`${destPath}_${timestamp}/.keep`, ''); // Ensure dir exists via write hack or core.mkdir
        // Using native fs for the actual move as core doesn't have move yet
        const fs = require('fs');
        fs.renameSync(path.join(process.cwd(), phasePath), path.join(process.cwd(), `${destPath}_${timestamp}`));
      } else {
        const fs = require('fs');
        const path = require('path');
        if (!core.exists(archiveDir)) fs.mkdirSync(path.join(process.cwd(), archiveDir), { recursive: true });
        fs.renameSync(path.join(process.cwd(), phasePath), path.join(process.cwd(), destPath));
      }
      count++;
    }
  });

  if (count > 0) {
    reporter.pass(`Successfully archived ${count} phase(s).`);
  } else {
    reporter.info('No completed phases found.');
  }
}

run();
