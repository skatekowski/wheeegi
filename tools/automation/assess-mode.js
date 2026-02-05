#!/usr/bin/env node
/**
 * Assess project mode (S/M/L/D) based on real artifacts (Refactored v1.5.1)
 */

const core = require('./lib/core');
const reporter = require('./lib/reporter');
const path = require('path');

function assessMode() {
  const signals = {
    features: core.list('architecture').filter(f => f.endsWith('.md')).length,
    dependencies: (core.read('project/findings.md') || '').match(/API|service|integration/gi)?.length || 0,
    archLines: (core.read('project/architecture.md') || '').split('\n').length,
    docLines: (core.read('project/gemini.md') || '').split('\n').length,
    errors: (core.read('project/errors.md') || '').match(/###/g)?.length || 0
  };

  const hasChangeRequest = core.exists('project/CHANGE-REQUEST.md');
  const hasDesignArtifacts = core.exists('project/design-history.json') || core.exists('prototypes') || hasChangeRequest;

  let mode = 'S';
  let reason = 'Initial assessment';

  if (hasDesignArtifacts) {
    mode = 'D';
    reason = hasChangeRequest ? 'Active Change Request detected' : 'Design artifacts detected';
  }

  if (signals.features > 2 || signals.dependencies > 1 || signals.archLines > 200) {
    mode = 'M';
    reason = 'Structured architecture or multiple dependencies detected';
  }

  if (signals.features > 5 || signals.dependencies > 3 || signals.archLines > 500 || signals.errors > 10) {
    mode = 'L';
    reason = 'Complex architecture or high risk detected';
  }

  return { mode, signals, reason };
}

function run() {
  reporter.header('Mode Assessor: Analyzing project state...');
  
  const assessment = assessMode();
  const assessmentFile = 'project/mode-assessment.json';
  const previous = core.readJson(assessmentFile);
  
  console.log(`  Features: ${assessment.signals.features}`);
  console.log(`  Dependencies: ${assessment.signals.dependencies}`);
  console.log(`  Errors: ${assessment.signals.errors}\n`);
  
  reporter.info(`Current Mode: ${assessment.mode}`);
  reporter.info(`Reason: ${assessment.reason}`);

  core.write(assessmentFile, JSON.stringify(assessment, null, 2));
  reporter.pass('Assessment saved to project/mode-assessment.json');

  if (previous && previous.mode !== assessment.mode) {
    reporter.warn(`Mode changed: ${previous.mode} → ${assessment.mode}`);
    console.log(`📢 Mode changed: ${previous.mode} → ${assessment.mode}`);
  }
}

run();
