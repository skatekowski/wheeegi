#!/usr/bin/env node
/**
 * WHEEE Project Converter
 * Converts Design Mode (Mode D) artifacts into a starting Project structure (Mode S/M/L).
 */

const fs = require('fs');
const path = require('path');

class ProjectConverter {
  async convert(targetMode = 'M') {
    console.log(`🚀 Converting Design Mode artifacts to Mode ${targetMode}...`);
    
    const projectDir = process.cwd();
    const configPath = path.join(projectDir, 'project/wheee-config.json');
    
    // 1. Update Config
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config.mode = targetMode;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`✅ Mode updated to ${targetMode} in wheee-config.json`);
    }

    // 2. Scaffold GSD Phase 1 if not exists
    const phase1Dir = path.join(projectDir, '.planning/phases/01-foundation');
    if (!fs.existsSync(phase1Dir)) {
      fs.mkdirSync(phase1Dir, { recursive: true });
      fs.writeFileSync(path.join(phase1Dir, 'PLAN.md'), `# Phase 1: Foundation (Converted from Design)\n\n## Goal\nImplement validated design and micro-interactions.\n\n## Steps\n1. [ ] Scaffold project structure.\n2. [ ] Implement design system tokens.\n`);
      console.log('✅ Phase 1: Foundation scaffolded.');
    }

    // 3. Move Prototyping notes to Findings
    const designHistoryFile = path.join(projectDir, 'project/design-history.json');
    if (fs.existsSync(designHistoryFile)) {
      const history = JSON.parse(fs.readFileSync(designHistoryFile, 'utf8'));
      const findingsPath = path.join(projectDir, 'project/findings.md');
      let findings = fs.readFileSync(findingsPath, 'utf8');
      
      findings += `\n\n## Design Mode Learnings\n`;
      history.forEach(item => {
        findings += `- Iterated on ${item.topic} during ${item.phase} phase.\n`;
      });
      
      fs.writeFileSync(findingsPath, findings);
      console.log('✅ Design learnings merged into findings.md.');
    }

    console.log(`\n🎉 Conversion complete! Run "wheee audit" to verify.`);
  }
}

if (require.main === module) {
  const converter = new ProjectConverter();
  converter.convert(process.argv[2] || 'M');
}
