#!/usr/bin/env node
/**
 * Project Doctor - WHEEE Protocol Auditor (Refactored v1.6.0)
 * Now with Robustness heuristics and Evolution signal tracking.
 */

const core = require('./lib/core');
const reporter = require('./lib/reporter');
const FIPAssistant = require('./fip-assistant');

async function run() {
  reporter.header('Project Doctor: Auditing project health...');
  
  const results = { pass: 0, warn: 0, fail: 0 };
  const signals = []; // Signals for the Evolution Agent
  const fip = new FIPAssistant();

  function check(name, test, failureMsg, warning = false) {
    if (test) {
      reporter.pass(name);
      results.pass++;
    } else {
      if (warning) {
        reporter.warn(`${name} - ${failureMsg}`);
        results.warn++;
        signals.push({ type: 'warning', name, message: failureMsg });
      } else {
        reporter.fail(`${name} - ${failureMsg}`);
        results.fail++;
        signals.push({ type: 'failure', name, message: failureMsg });
      }
    }
  }

  // 1. Core Structure
  check(
    'Core Directories',
    ['.planning', 'project', 'architecture', 'tools'].every(d => core.exists(d)),
    'Missing basic WHEEE directories. Run "wheee init".'
  );

  // 2. GSD Checks
  const stateContent = core.read('.planning/STATE.md') || '';
  const isCrPhase = stateContent.includes('UX Restructuring') || stateContent.includes('Change Request');

  const phaseDir = '.planning/phases';
  if (core.exists(phaseDir)) {
    const hasGsdPhases = core.list(phaseDir).some(d => core.stats(`${phaseDir}/${d}`).isDirectory());
    check(
      'GSD Phase Structure',
      hasGsdPhases,
      'No GSD phases found. Every project must follow GSD lifecycle.'
    );

    // 2.1 Anti-Drift & Robustness
    if (hasGsdPhases) {
      const activePhaseMatch = stateContent.match(/\*\*Current Phase:\*\* (.+)/);
      const activePhase = activePhaseMatch ? activePhaseMatch[1] : '';
      
      if (activePhase) {
        const planPath = findActivePlan(phaseDir, activePhase);
        if (planPath) {
          const planContent = core.read(planPath);
          const proposedFiles = extractProposedFiles(planContent);
          
          for (const file of proposedFiles) {
            const baseName = file.split('/').pop().split('.')[0];
            
            // Similarity Check
            const similarity = await fip.checkSimilarity(baseName);
            if (similarity.matches.length > 0) {
              check(
                `Anti-Drift (${baseName})`,
                false,
                `Duplicate detected: "${baseName}" is too similar to ${similarity.matches.map(m => m.name).join(', ')}.`,
                true
              );
            }

            // v1.5.4 Robustness Heuristics
            if (core.exists(file)) {
              const fileContent = core.read(file);
              const robustness = checkRobustness(file, fileContent);
              robustness.errors.forEach(err => {
                check(`Robustness (${baseName})`, false, err, true);
              });
            }
          }
        }
      }
    }
  }

  // 3. Golden Rule
  try {
    const sops = core.list('architecture').filter(f => f.endsWith('.md'));
    const tools = core.list('tools').filter(f => !core.stats(`tools/${f}`).isDirectory());
    
    if (sops.length > 0 && tools.length > 0) {
      const latestSopMtime = Math.max(...sops.map(f => core.stats(`architecture/${f}`).mtimeMs));
      const latestToolMtime = Math.max(...tools.map(f => core.stats(`tools/${f}`).mtimeMs));
      
      check(
        'Golden Rule (SOP-to-Code Sync)',
        latestSopMtime >= latestToolMtime,
        isCrPhase ? 'CR phase active: SOP MUST be updated before code!' : 'Code changes newer than SOPs.',
        !isCrPhase
      );
    }
  } catch (e) {}

  // 4. Source of Truth
  check('Source of Truth Index', core.exists('project/source-of-truth.json'), 'Missing index.');
  
  if (isCrPhase) {
    check('CR Literal Documentation', core.exists('project/CHANGE-REQUEST.md'), 'Missing CR doc.');
  }

  // 5. Track Signals for Evolution Agent
  if (signals.length > 0) {
    trackEvolutionSignals(signals);
  }

  reporter.summary(results);
  if (results.fail > 0) process.exit(1);
}

/**
 * Heuristic scan for "hacky" solutions (v1.5.4)
 */
function checkRobustness(filePath, content) {
  const results = { errors: [] };
  
  // Pattern 1: Hardcoded IDs (e.g. id === '123')
  if (/(id|providerId|key)\s*===\s*['"][^'"]+['"]/i.test(content)) {
    results.errors.push('Possible hardcoded ID detected. Use dynamic IDs from store/backend.');
  }

  // Pattern 2: Magic Strings for UI Logic (e.g. if (name === 'Netflix'))
  if (filePath.endsWith('.tsx') && /\.(name|title)\s*===\s*['"][^'"]+['"]/i.test(content)) {
    results.errors.push('Magic string comparison for UI logic. Use Enums or Types.');
  }

  // Pattern 3: JSX-Spaghetti (Too much logic in render)
  if (filePath.endsWith('.tsx')) {
    const logicDensity = (content.match(/\?.+:|filter\(|sort\(/g) || []).length;
    if (logicDensity > 5) {
      results.errors.push('High logic density in component. Move complex logic to a custom Hook or Store.');
    }
  }

  // Pattern 4: Type Hacks
  if (content.includes('any') || content.includes('@ts-ignore')) {
    results.errors.push('Type hack detected (any/ts-ignore). Robust applications require strict typing.');
  }

  return results;
}

function findActivePlan(dir, phaseName) {
  const items = core.list(dir);
  for (const item of items) {
    if (core.stats(`${dir}/${item}`).isDirectory() && phaseName.includes(item)) {
      const subFiles = core.list(`${dir}/${item}`);
      const plan = subFiles.find(f => f.includes('PLAN.md'));
      if (plan) return `${dir}/${item}/${plan}`;
    }
  }
  return null;
}

function extractProposedFiles(content) {
  const paths = [];
  const regex = /`([^`]+\.(?:tsx|jsx|ts|js))`|src\/components\/[^\s)]+/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const p = match[1] || match[0];
    if (p.includes('src/components') && !paths.includes(p)) paths.push(p);
  }
  return paths;
}

/**
 * Stores signals for the Evolution Agent (v1.6.0)
 */
function trackEvolutionSignals(newSignals) {
  const logPath = 'project/protocol-evolution.json';
  let history = { sessions: [] };
  
  if (core.exists(logPath)) {
    try { history = JSON.parse(core.read(logPath)); } catch (e) {}
  }

  history.sessions.push({
    timestamp: new Date().toISOString(),
    signals: newSignals
  });

  // Keep only last 20 sessions to prevent bloat
  if (history.sessions.length > 20) history.sessions.shift();

  core.write(logPath, JSON.stringify(history, null, 2));
}

run();
