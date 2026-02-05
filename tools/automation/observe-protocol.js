#!/usr/bin/env node
/**
 * WHEEE Evolution Agent (v1.6.0)
 * Analyzes developer patterns and project signals to suggest protocol optimizations.
 */

const core = require('./lib/core');
const reporter = require('./lib/reporter');

function run() {
  reporter.header('Evolution Agent: Observing Protocol Patterns...');
  
  const journalPath = 'project/process-journal.md';
  const evolutionPath = 'project/protocol-evolution.json';
  
  if (!core.exists(journalPath)) {
    reporter.fail('Process journal not found. Cannot observe patterns.');
    return;
  }

  const journal = core.read(journalPath);
  const history = core.exists(evolutionPath) ? JSON.parse(core.read(evolutionPath)) : { sessions: [] };
  
  const insights = analyzePatterns(journal, history);
  
  if (insights.length === 0) {
    reporter.info('No new optimization patterns detected. You are in a healthy flow!');
  } else {
    reporter.section('Protocol Optimization Proposals');
    insights.forEach(insight => {
      console.log(`\n💡 ${insight.title}`);
      console.log(`   Muster: ${insight.observation}`);
      console.log(`   Vorschlag: ${insight.proposal}`);
    });
  }
}

/**
 * Heuristic pattern analysis
 */
function analyzePatterns(journal, history) {
  const proposals = [];
  
  // 1. Analyze "Fix-Loop" (Many small decisions after a plan)
  const recentEntries = journal.split('---').pop();
  const decisionCount = (recentEntries.match(/LOG \| DECISION/g) || []).length;
  if (decisionCount > 5) {
    proposals.push({
      title: 'Planning Precision Upgrade',
      observation: 'Viele "Fixes zwischendurch" nach dem letzten Planning festgestellt.',
      proposal: 'Nutze den "UAT Fast-Track" (v1.5.3) früher oder erhöhe die Research-Tiefe im Blueprint-Level.'
    });
  }

  // 2. Analyze Robustness Signals (from Doctor history)
  const robustnessSignals = history.sessions.flatMap(s => s.signals).filter(sig => sig.name.includes('Robustness'));
  if (robustnessSignals.length > 3) {
    proposals.push({
      title: 'Backend-First Enforcement',
      observation: 'Wiederholte Warnungen vor Hardcoded IDs oder Magic Strings.',
      proposal: 'Etabliere eine strikte "Backend-Souveränität": Neue Felder müssen erst im Server-SOP definiert werden, bevor das Frontend sie nutzt.'
    });
  }

  // 3. Analyze Component Similarity (Anti-Drift)
  const driftSignals = history.sessions.flatMap(s => s.signals).filter(sig => sig.name.includes('Anti-Drift'));
  if (driftSignals.length > 2) {
    proposals.push({
      title: 'Atomic Registry Optimization',
      observation: 'KI versucht oft, ähnliche Komponenten neu zu erstellen.',
      proposal: 'Erstelle ein "Component-Registry" SOP in architecture/, um der KI eine bessere Übersicht über vorhandene UI-Bausteine zu geben.'
    });
  }

  // 4. Analyze Context Health
  if (journal.length > 50000) {
    proposals.push({
      title: 'Context Cleanup Required',
      observation: 'Das Process Journal wird sehr groß (Context Bloat).',
      proposal: 'Führe "wheee cleanup" aus, um abgeschlossene Phasen zu archivieren und die KI-Präzision zu erhöhen.'
    });
  }

  return proposals;
}

run();
