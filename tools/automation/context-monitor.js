#!/usr/bin/env node
/**
 * WHEEE Context Monitor - Dynamic Context Management (Refactored v1.5.0)
 */

const core = require('./lib/core');
const reporter = require('./lib/reporter');
const path = require('path');

const CONFIG = {
  MAX_FILE_SIZE_CHARS: 15000,
  MAX_PLANS_PER_PHASE: 10,
  MAX_PHASE_SIZE_TOTAL: 50000
};

function getDirectorySize(dir) {
  let size = 0;
  core.list(dir).forEach(file => {
    const p = path.join(dir, file);
    const stats = core.stats(p);
    if (stats.isDirectory()) size += getDirectorySize(p);
    else if (file.endsWith('.md') || file.endsWith('.json')) size += stats.size;
  });
  return size;
}

function run() {
  reporter.header('Context Monitor: Assessing Context Health...');
  
  const phasesDir = '.planning/phases';
  if (!core.exists(phasesDir)) {
    reporter.fail('Phases directory not found.');
    process.exit(1);
  }

  const issues = [];
  const phases = core.list(phasesDir).filter(d => core.stats(`${phasesDir}/${d}`).isDirectory());

  phases.forEach(phase => {
    const phasePath = `${phasesDir}/${phase}`;
    const plans = core.list(phasePath).filter(f => f.includes('PLAN'));
    const totalSize = getDirectorySize(phasePath);

    reporter.section(`Phase: ${phase} (${(totalSize / 1024).toFixed(2)} KB)`);

    if (plans.length > CONFIG.MAX_PLANS_PER_PHASE) {
      issues.push(`⚠️  [${phase}]: Too many plans (${plans.length}). Split it!`);
    }

    plans.forEach(plan => {
      const content = core.read(`${phasePath}/${plan}`);
      if (content && content.length > CONFIG.MAX_FILE_SIZE_CHARS) {
        issues.push(`🛑 [${plan}]: Too large (${content.length} chars).`);
      }
    });
  });

  console.log('');
  if (issues.length === 0) reporter.pass('Context is lean and healthy.');
  else issues.forEach(i => console.log(i));
}

run();
