#!/usr/bin/env node
/**
 * WHEEE Process Journal Tool (Refactored v1.5.1)
 */

const core = require('./lib/core');
const reporter = require('./lib/reporter');

function run() {
  const args = process.argv.slice(2);
  const type = args[0] || 'decision';
  const journalPath = 'project/process-journal.md';

  if (!core.exists(journalPath)) {
    reporter.fail('Process journal not found.');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const entry = `\n## ${timestamp} | LOG | ${type.toUpperCase()}\n- New entry created via CLI.\n`;

  const content = core.read(journalPath);
  core.write(journalPath, content + entry);
  
  reporter.pass(`Added ${type} entry to process journal.`);
}

run();
