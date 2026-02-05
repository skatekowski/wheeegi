#!/usr/bin/env node
/**
 * WHEEE Multi-Agent Orchestrator
 * Coordinates parallel execution of 11 specialized agents:
 * 7 B.L.A.S.T. (blueprint, link, architect, navigator, tools, tester, stylize)
 * + 4 execution roles (frontend, backend, test, docs).
 * Updated v1.5.2 (Gatekeeper Integration)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const FIPAssistant = require('../fip-assistant');

class Orchestrator {
  constructor(config = {}) {
    this.config = config;
    this.fip = new FIPAssistant();
    this.agents = {
      // 7 B.L.A.S.T. agents
      blueprint: { priority: 1, dependsOn: [] },
      link: { priority: 2, dependsOn: ['blueprint'] },
      architect: { priority: 3, dependsOn: ['blueprint'] },
      navigator: { priority: 4, dependsOn: ['architect'] },
      tools: { priority: 5, dependsOn: ['navigator'] },
      tester: { priority: 6, dependsOn: ['tools'] },
      stylize: { priority: 7, dependsOn: ['tester'] },
      // 4 execution agents (aligned with Phase 12 / walkthrough AGENTS)
      frontend: { priority: 8, dependsOn: ['stylize'] },
      backend: { priority: 8, dependsOn: ['stylize'] },
      test: { priority: 8, dependsOn: ['stylize'] },
      docs: { priority: 8, dependsOn: ['stylize'] }
    };
  }

  async run(phase, mode = 'parallel') {
    console.log(`🚀 Orchestrating Phase: ${phase} (${mode} mode)`);
    
    // Level 0: Discovery (Gatekeeper)
    await this.runDiscovery(phase);

    if (mode === 'parallel') {
      await this.runParallel(phase);
    } else {
      await this.runSequential(phase);
    }
  }

  /**
   * Level 0: Discovery (FIP Gatekeeper)
   * Scans for similarity and potential regressions before spawning agents.
   */
  async runDiscovery(phase) {
    console.log('\n🔍 Level 0: Discovery (Gatekeeper)...');
    
    const phaseDir = path.join(process.cwd(), '.planning/phases');
    const planPath = this.findPlanFile(phaseDir, phase);

    if (!planPath) {
      console.log('⚠️  No PLAN.md found for this phase. Skipping discovery...');
      return;
    }

    const planContent = fs.readFileSync(planPath, 'utf8');
    const proposedFiles = this.extractProposedFiles(planContent);

    if (proposedFiles.length === 0) {
      console.log('✅ No new components/files proposed in plan.');
      return;
    }

    let discoveryBlocked = false;

    for (const file of proposedFiles) {
      const baseName = path.basename(file, path.extname(file));
      console.log(`   Analyzing "${baseName}"...`);
      
      const similarity = await this.fip.checkSimilarity(baseName);
      if (similarity.matches.length > 0) {
        console.error(`\n❌ Discovery Block: Component "${baseName}" already exists!`);
        similarity.matches.forEach(m => console.error(`   - Found: ${m.name} (${m.path})`));
        discoveryBlocked = true;
      }
    }

    if (discoveryBlocked) {
      console.error('\n🛑 Orchestration Aborted. Fix component duplicates before continuing.');
      process.exit(1);
    }

    console.log('✅ Discovery complete. No duplicates found.');
  }

  findPlanFile(dir, phase) {
    if (!fs.existsSync(dir)) return null;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory() && item.name.includes(phase)) {
        const subDir = path.join(dir, item.name);
        const files = fs.readdirSync(subDir);
        const plan = files.find(f => f.includes('PLAN.md'));
        if (plan) return path.join(subDir, plan);
      }
    }
    return null;
  }

  extractProposedFiles(content) {
    // Simple regex to find file paths in markdown code blocks or bullet points
    const paths = [];
    const regex = /`([^`]+\.(?:tsx|jsx|ts|js))`|src\/components\/[^\s)]+/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const p = match[1] || match[0];
      if (!paths.includes(p)) paths.push(p);
    }
    return paths.filter(p => p.includes('src/components'));
  }

  async runParallel(phase) {
    const levels = this.calculateExecutionLevels();
    for (const level of levels) {
      console.log(`\n📦 Executing level: ${level.join(', ')}`);
      const tasks = level.map(agent => this.runAgent(agent, phase));
      await Promise.all(tasks);
    }
  }

  async runSequential(phase) {
    const agents = Object.keys(this.agents).sort((a, b) => this.agents[a].priority - this.agents[b].priority);
    for (const agent of agents) {
      await this.runAgent(agent, phase);
    }
  }

  calculateExecutionLevels() {
    return [
      ['blueprint'],
      ['link', 'architect'],
      ['navigator'],
      ['tools'],
      ['tester', 'stylize'],
      ['frontend', 'backend', 'test', 'docs']
    ];
  }

  async runAgent(agentName, phase) {
    console.log(`🤖 Agent [${agentName}] starting for ${phase}...`);
    
    const scriptPath = path.join(__dirname, 'agents', `${agentName}-agent.js`);
    if (fs.existsSync(scriptPath)) {
      try {
        execSync(`node "${scriptPath}" "${phase}"`, { stdio: 'inherit' });
        console.log(`✅ Agent [${agentName}] completed successfully.`);
      } catch (error) {
        console.error(`❌ Agent [${agentName}] failed with exit code: ${error.status}`);
        throw error;
      }
    } else {
      console.log(`⚠️  Agent [${agentName}] script not found at ${scriptPath}. Skipping...`);
      return new Promise(resolve => setTimeout(resolve, 500)); // Mock delay
    }
  }
}

if (require.main === module) {
  const orchestrator = new Orchestrator();
  // Support "wheee orchestrate 07" and "wheee orchestrate phase 07"
  let phase = process.argv[2] || '01-foundation';
  let mode = process.argv[3] || 'parallel';
  if (phase === 'phase' && process.argv[3]) {
    phase = process.argv[3];
    mode = process.argv[4] || 'parallel';
  }
  orchestrator.run(phase, mode);
}
