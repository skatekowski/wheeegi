#!/usr/bin/env node
/**
 * FIP Assistant - Functionality Isolation Protocol Helper
 * Helps identify "Protected Areas" and detects component similarity to prevent duplicates.
 * Refactored v1.5.2 (Gatekeeper Module)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class FIPAssistant {
  constructor(options = {}) {
    this.options = {
      excludeDirs: options.excludeDirs || ['node_modules', '.git', '.planning', 'project', 'dist', 'build', '.tmp'],
      excludeFiles: options.excludeFiles || ['*.log'],
      ...options
    };
  }

  /**
   * Analyzes dependencies for a target file or symbol
   */
  async analyze(target) {
    let searchTerm = target;
    if (fs.existsSync(target)) {
      searchTerm = path.basename(target, path.extname(target));
    }

    const results = {
      target,
      searchTerm,
      dependencies: [],
      protectedAreas: []
    };

    try {
      const excludeDirStr = this.options.excludeDirs.map(d => `--exclude-dir=${d}`).join(' ');
      const excludeFileStr = this.options.excludeFiles.map(f => `--exclude="${f}"`).join(' ');
      
      const cmd = `grep -rIl "${searchTerm}" . ${excludeDirStr} ${excludeFileStr}`;
      const grepOutput = execSync(cmd, { encoding: 'utf-8' }).split('\n').filter(Boolean);

      results.dependencies = grepOutput.filter(file => file !== target && !file.includes(target));
      results.protectedAreas = [...results.dependencies];
      
      return results;
    } catch (error) {
      if (error.status === 1) {
        return results; // No matches
      }
      throw error;
    }
  }

  /**
   * Checks for component similarity in the codebase
   */
  async checkSimilarity(componentName) {
    const results = {
      query: componentName,
      matches: []
    };

    const componentsDir = path.join(process.cwd(), 'src/components');
    if (!fs.existsSync(componentsDir)) return results;

    const findFiles = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
          results = results.concat(findFiles(file));
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.js')) {
            results.push(file);
          }
        }
      });
      return results;
    };

    const allComponents = findFiles(componentsDir);
    const targetBase = componentName.toLowerCase().replace(/[^a-z0-9]/g, '');

    allComponents.forEach(file => {
      const baseName = path.basename(file, path.extname(file));
      const compBase = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Simple similarity logic: check if one contains the other or they share a common root
      if (compBase.includes(targetBase) || targetBase.includes(compBase)) {
        results.matches.push({
          name: baseName,
          path: path.relative(process.cwd(), file),
          similarity: 0.8 // Rough score
        });
      }
    });

    return results;
  }
}

// CLI Support
if (require.main === module) {
  const fip = new FIPAssistant();
  const target = process.argv[2];

  if (!target) {
    console.log('❌ Error: Please provide a file path or symbol name.');
    console.log('Usage: wheee fip <file-path-or-symbol>');
    process.exit(1);
  }

  (async () => {
    console.log(`🔍 FIP Assistant: Analyzing "${target}"...\n`);
    
    // Similarity Check
    const similarity = await fip.checkSimilarity(target);
    if (similarity.matches.length > 0) {
      console.log('⚠️  SIMILARITY ALERT: Existing components found:');
      similarity.matches.forEach(m => console.log(`  - ${m.name} (${m.path})`));
      console.log('');
    }

    // Dependency Check
    const results = await fip.analyze(target);
    console.log(`--- [ FIP Scope: ${target} ] ---`);
    
    if (results.protectedAreas.length === 0) {
      console.log('✅ No external dependencies found. This looks like an isolated component.');
    } else {
      console.log('⚠️  POTENTIAL PROTECTED AREAS:');
      results.protectedAreas.forEach(file => console.log(`  📍 ${file}`));
      
      console.log('\n--- [ FIP Recommendation ] ---');
      console.log('1. Mark the above files as "Protected" in your Phase Plan.');
      console.log('2. After your changes, perform Smoke Tests on these specific files.');
    }
    console.log('\n--------------------------------');
  })();
}

module.exports = FIPAssistant;
