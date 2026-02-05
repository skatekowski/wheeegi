import { readFile } from 'fs/promises';
import { existsSync, readdirSync, statSync, lstatSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..', '..', '..');

export { ROOT_DIR };

/**
 * Reads and parses mode-assessment.json
 */
export async function readModeAssessment() {
  const filePath = join(ROOT_DIR, 'project', 'mode-assessment.json');

  if (!existsSync(filePath)) {
    return {
      projectName: 'Unknown',
      currentMode: 'S',
      lastUpdate: new Date().toISOString(),
      assessment: null,
      reason: 'No mode-assessment.json found'
    };
  }

  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Reads and parses process-journal.md
 * Returns the last N entries
 */
export async function readJournalEntries(limit = 3) {
  const filePath = join(ROOT_DIR, 'project', 'process-journal.md');

  if (!existsSync(filePath)) {
    return [];
  }

  const content = await readFile(filePath, 'utf-8');
  const entries = parseJournalEntries(content);

  return entries.slice(0, limit);
}

/**
 * Parses markdown journal into structured entries
 */
function parseJournalEntries(content) {
  const entries = [];
  const sections = content.split(/^## /gm).filter(Boolean);

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const headerLine = lines[0];

    // Parse header: "2026-01-31 | BLUEPRINT | Description"
    const headerMatch = headerLine.match(/^(\d{4}-\d{2}-\d{2})\s*\|\s*(\w+)\s*\|\s*(.+)$/);

    if (headerMatch) {
      const [, date, type, title] = headerMatch;
      const contentLines = lines.slice(1).join('\n').trim();

      entries.push({
        date,
        type,
        title,
        content: contentLines
      });
    }
  }

  return entries;
}

/**
 * Reads STATE.md for health status
 */
export async function readHealthStatus() {
  const filePath = join(ROOT_DIR, '.planning', 'STATE.md');

  if (!existsSync(filePath)) {
    return {
      score: 100,
      status: 'healthy',
      lastAudit: null,
      message: 'No STATE.md found - assuming healthy'
    };
  }

  const content = await readFile(filePath, 'utf-8');
  return parseHealthStatus(content);
}

/**
 * Parses STATE.md for health indicators
 */
function parseHealthStatus(content) {
  // Look for explicit status in header
  const statusMatch = content.match(/\*\*Status:\*\*\s*(\w+)/i);
  const explicitStatus = statusMatch ? statusMatch[1].toLowerCase() : null;

  // Check for actual blockers (not just the section header)
  const blockersSection = content.match(/## Blockers\s*\n+([\s\S]*?)(?=\n##|$)/i);
  const hasRealBlockers = blockersSection &&
    !blockersSection[1].match(/^\s*(none\.?|no blockers?\.?|-)\s*$/im) &&
    blockersSection[1].trim().length > 10;

  // Check for unchecked items
  const uncheckedItems = (content.match(/- \[ \]/g) || []).length;
  const checkedItems = (content.match(/- \[x\]/gi) || []).length;

  let score = 100;
  let status = 'healthy';

  if (explicitStatus === 'healthy' || explicitStatus === 'complete') {
    score = 100;
    status = 'healthy';
  } else if (hasRealBlockers) {
    score = 50;
    status = 'critical';
  } else if (uncheckedItems > checkedItems) {
    score = 75;
    status = 'warning';
  }

  return {
    score,
    status,
    lastAudit: new Date().toISOString(),
    message: content.slice(0, 200) || 'Project state loaded'
  };
}

/**
 * Reads and parses ROADMAP.md for phase tracking
 */
export async function readRoadmap() {
  const filePath = join(ROOT_DIR, '.planning', 'ROADMAP.md');

  if (!existsSync(filePath)) {
    return {
      milestone: null,
      phases: [],
      currentPhase: null
    };
  }

  const content = await readFile(filePath, 'utf-8');
  return parseRoadmap(content);
}

/**
 * Parses ROADMAP.md into structured data
 */
function parseRoadmap(content) {
  const phases = [];
  let milestone = null;
  let currentPhase = null;

  // Extract milestone
  const milestoneMatch = content.match(/\*\*Milestone:\*\*\s*(.+)/);
  if (milestoneMatch) {
    milestone = milestoneMatch[1].trim();
  }

  // Extract phases - look for ### Phase patterns
  const phaseRegex = /### Phase (\d+): (.+?)(?:\s*[✅⏳])?[\r\n]+\*\*Goal:\*\*\s*(.+?)[\r\n]+\*\*Status:\*\*\s*(\w+)/g;
  let match;

  while ((match = phaseRegex.exec(content)) !== null) {
    const [, number, name, goal, status] = match;
    const phase = {
      number: parseInt(number),
      name: name.trim(),
      goal: goal.trim(),
      status: status.trim().toUpperCase(),
      blast: parseBlastStatus(content, parseInt(number))
    };
    phases.push(phase);

    if (status.toUpperCase() === 'IN_PROGRESS' ||
        (status.toUpperCase() === 'COMPLETED' && !currentPhase)) {
      currentPhase = phase;
    }
  }

  // If no phase is in progress, find the first non-completed
  if (!currentPhase) {
    currentPhase = phases.find(p => p.status !== 'COMPLETED') || phases[phases.length - 1];
  }

  return { milestone, phases, currentPhase };
}

/**
 * Extracts B.L.A.S.T. status for a phase
 */
function parseBlastStatus(content, phaseNumber) {
  const blastSteps = ['Blueprint', 'Link', 'Architect', 'Stabilize', 'Trigger'];
  const result = {};

  // Find the phase section - split creates array where index 0 is content before first phase
  // So Phase 0 is at index 1, Phase 1 is at index 2, etc.
  const sections = content.split(/### Phase \d+/);
  const phaseSection = sections[phaseNumber + 1] || '';

  for (const step of blastSteps) {
    if (phaseSection.includes(`${step} ✅`)) {
      result[step.toLowerCase()] = 'completed';
    } else if (phaseSection.includes(`${step} ⏳`)) {
      result[step.toLowerCase()] = 'in_progress';
    } else {
      result[step.toLowerCase()] = 'pending';
    }
  }

  return result;
}

/**
 * Gets recent git commits
 */
export async function getRecentCommits(limit = 10) {
  try {
    // Use a simpler format with delimiters
    const result = execSync(
      `git log -${limit} --format="%h||%s||%an||%ci"`,
      {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024
      }
    );

    const commits = result
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, subject, author, date] = line.split('||');
        if (!hash) return null;

        return {
          hash,
          subject,
          author,
          date,
          type: categorizeCommit(subject)
        };
      })
      .filter(Boolean);

    return commits;
  } catch (error) {
    return [];
  }
}

/**
 * Categorizes a commit based on conventional commit format
 */
function categorizeCommit(subject) {
  if (subject.startsWith('feat')) return 'feature';
  if (subject.startsWith('fix')) return 'fix';
  if (subject.startsWith('docs')) return 'docs';
  if (subject.startsWith('refactor')) return 'refactor';
  if (subject.startsWith('test')) return 'test';
  if (subject.startsWith('chore')) return 'chore';
  return 'other';
}

/**
 * Runs WHEEE audit and returns structured results
 */
export async function runAudit() {
  const checks = [];
  let pass = 0, warn = 0, fail = 0;

  function check(name, test, failureMsg, isWarning = false) {
    if (test) {
      checks.push({ name, status: 'pass', message: null });
      pass++;
    } else {
      checks.push({
        name,
        status: isWarning ? 'warn' : 'fail',
        message: failureMsg
      });
      isWarning ? warn++ : fail++;
    }
  }

  // 1. Core Directories
  const coreDirs = ['.planning', 'project', 'architecture', 'tools'];
  check(
    'Core Directories',
    coreDirs.every(d => existsSync(join(ROOT_DIR, d))),
    'Missing basic WHEEE directories'
  );

  // 2. GSD Phase Structure
  const phasesDir = join(ROOT_DIR, '.planning/phases');
  const hasGsdPhases = existsSync(phasesDir) &&
    readdirSync(phasesDir).some(d => lstatSync(join(phasesDir, d)).isDirectory());
  check(
    'GSD Phase Structure',
    hasGsdPhases,
    'No GSD phases found in .planning/phases/'
  );

  // 3. GSD State Tracking
  check(
    'GSD State Tracking',
    existsSync(join(ROOT_DIR, '.planning/STATE.md')),
    'Missing .planning/STATE.md'
  );

  // 4. Process Journal Activity
  const journalPath = join(ROOT_DIR, 'project/process-journal.md');
  if (existsSync(journalPath)) {
    const stats = statSync(journalPath);
    const daysSince = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    check(
      'Process Journal Activity',
      daysSince < 7,
      'No journal entries in the last 7 days',
      true
    );
  }

  // 5. .env protection
  const gitignorePath = join(ROOT_DIR, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignore = readFileSync(gitignorePath, 'utf8');
    check(
      '.env Protection',
      gitignore.includes('.env'),
      '.env is NOT in .gitignore!',
      false
    );
  }

  // Calculate overall status
  let overallStatus = 'healthy';
  if (fail > 0) overallStatus = 'critical';
  else if (warn > 0) overallStatus = 'warning';

  return {
    checks,
    summary: { pass, warn, fail },
    overallStatus,
    timestamp: new Date().toISOString()
  };
}
