#!/usr/bin/env node
/**
 * Self-Healing Build Automation
 * Automatically detects and fixes common build issues
 * 
 * Usage: node tools/automation/self-heal-build.js [--check-only] [--fix-all]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = path.join(__dirname, '../..');
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

class SelfHealingBuild {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.mode = this.detectMode();
  }

  detectMode() {
    // Check for mode assessment file
    const modeFile = path.join(PROJECT_DIR, 'project/mode-assessment.json');
    if (fs.existsSync(modeFile)) {
      const assessment = JSON.parse(fs.readFileSync(modeFile, 'utf-8'));
      return assessment.mode || 'M';
    }
    return 'M'; // Default to Medium
  }

  /**
   * Main healing process
   */
  async heal() {
    console.log('🔧 WHEEE Protocol Self-Healing Build System\n');
    console.log(`Mode: ${this.mode}\n`);

    // Detect issues
    await this.detectIssues();

    if (this.issues.length === 0) {
      console.log('✅ No issues detected. Build system is healthy!\n');
      return { healed: true, issues: 0, fixes: 0 };
    }

    console.log(`\n⚠️  Detected ${this.issues.length} issue(s):\n`);
    this.issues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.severity}] ${issue.type}: ${issue.message}`);
    });

    // Apply fixes
    const results = await this.applyFixes();

    // Report results
    this.reportResults(results);

    return results;
  }

  /**
   * Detect common build issues
   */
  async detectIssues() {
    // 1. Dependency issues
    await this.checkDependencies();

    // 2. Build configuration issues
    await this.checkBuildConfig();

    // 3. Environment issues
    await this.checkEnvironment();

    // 4. Test failures
    await this.checkTests();

    // 5. Linting/formatting issues
    await this.checkLinting();

    // 6. Security vulnerabilities
    if (this.mode === 'L') {
      await this.checkSecurity();
    }
  }

  /**
   * Detect project language/framework
   */
  detectProjectType() {
    const checks = {
      nodejs: fs.existsSync(path.join(PROJECT_DIR, 'package.json')),
      python: fs.existsSync(path.join(PROJECT_DIR, 'requirements.txt')) || 
              fs.existsSync(path.join(PROJECT_DIR, 'pyproject.toml')) ||
              fs.existsSync(path.join(PROJECT_DIR, 'setup.py')),
      go: fs.existsSync(path.join(PROJECT_DIR, 'go.mod')),
      rust: fs.existsSync(path.join(PROJECT_DIR, 'Cargo.toml')),
    };
    
    return Object.entries(checks)
      .filter(([_, exists]) => exists)
      .map(([lang, _]) => lang);
  }

  /**
   * Check for dependency issues
   */
  async checkDependencies() {
    const projectTypes = this.detectProjectType();
    
    // Node.js dependencies
    if (projectTypes.includes('nodejs')) {
      await this.checkNodeDependencies();
    }
    
    // Python dependencies
    if (projectTypes.includes('python')) {
      await this.checkPythonDependencies();
    }
    
    // Go dependencies
    if (projectTypes.includes('go')) {
      await this.checkGoDependencies();
    }
    
    // Rust dependencies
    if (projectTypes.includes('rust')) {
      await this.checkRustDependencies();
    }
  }

  /**
   * Check Node.js dependencies
   */
  async checkNodeDependencies() {
    try {
      const packageJson = path.join(PROJECT_DIR, 'package.json');
      if (!fs.existsSync(packageJson)) {
        return;
      }

      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));

      // Check for outdated dependencies
      try {
        const outdated = execSync('npm outdated --json', { 
          cwd: PROJECT_DIR, 
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        const outdatedPkgs = JSON.parse(outdated);
        if (Object.keys(outdatedPkgs).length > 0) {
          this.issues.push({
            type: 'dependencies',
            severity: 'medium',
            message: `Node.js: ${Object.keys(outdatedPkgs).length} outdated dependencies`,
            data: outdatedPkgs,
            fix: 'update-dependencies',
            language: 'nodejs'
          });
        }
      } catch (e) {
        // npm outdated returns non-zero if packages are outdated
      }

      // Check for missing node_modules
      const nodeModules = path.join(PROJECT_DIR, 'node_modules');
      if (!fs.existsSync(nodeModules)) {
        this.issues.push({
          type: 'dependencies',
          severity: 'high',
          message: 'Node.js: node_modules directory missing',
          fix: 'install-dependencies',
          language: 'nodejs'
        });
      }

      // Check for lock file inconsistencies
      const lockFile = fs.existsSync(path.join(PROJECT_DIR, 'package-lock.json')) 
        ? 'package-lock.json' 
        : fs.existsSync(path.join(PROJECT_DIR, 'yarn.lock'))
        ? 'yarn.lock'
        : null;

      if (!lockFile && (pkg.dependencies || pkg.devDependencies)) {
        this.issues.push({
          type: 'dependencies',
          severity: 'medium',
          message: 'Node.js: Missing lock file (package-lock.json or yarn.lock)',
          fix: 'generate-lock-file',
          language: 'nodejs'
        });
      }
    } catch (error) {
      // Error handling
    }
  }

  /**
   * Check Python dependencies
   */
  async checkPythonDependencies() {
    try {
      const requirementsTxt = path.join(PROJECT_DIR, 'requirements.txt');
      const pyprojectToml = path.join(PROJECT_DIR, 'pyproject.toml');
      
      if (!fs.existsSync(requirementsTxt) && !fs.existsSync(pyprojectToml)) {
        return;
      }

      // Check for virtual environment
      const venvPaths = [
        path.join(PROJECT_DIR, 'venv'),
        path.join(PROJECT_DIR, '.venv'),
        path.join(PROJECT_DIR, 'env'),
      ];
      
      const hasVenv = venvPaths.some(p => fs.existsSync(p));
      
      if (!hasVenv && (fs.existsSync(requirementsTxt) || fs.existsSync(pyprojectToml))) {
        this.issues.push({
          type: 'dependencies',
          severity: 'medium',
          message: 'Python: Virtual environment not detected',
          fix: 'create-venv',
          language: 'python'
        });
      }

      // Check if pip packages are installed
      try {
        execSync('pip list --format=json', {
          cwd: PROJECT_DIR,
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (e) {
        if (fs.existsSync(requirementsTxt)) {
          this.issues.push({
            type: 'dependencies',
            severity: 'high',
            message: 'Python: Dependencies may not be installed',
            fix: 'install-python-dependencies',
            language: 'python'
          });
        }
      }

      // Check for outdated packages
      try {
        const outdated = execSync('pip list --outdated --format=json', {
          cwd: PROJECT_DIR,
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 10000
        });
        const outdatedPkgs = JSON.parse(outdated);
        if (outdatedPkgs.length > 0) {
          this.issues.push({
            type: 'dependencies',
            severity: 'low',
            message: `Python: ${outdatedPkgs.length} outdated packages`,
            data: outdatedPkgs,
            fix: 'update-python-dependencies',
            language: 'python'
          });
        }
      } catch (e) {
        // pip list --outdated may fail, that's okay
      }
    } catch (error) {
      // Error handling
    }
  }

  /**
   * Check Go dependencies
   */
  async checkGoDependencies() {
    try {
      const goMod = path.join(PROJECT_DIR, 'go.mod');
      if (!fs.existsSync(goMod)) {
        return;
      }

      // Check if go.mod is tidy
      try {
        execSync('go mod tidy -check', {
          cwd: PROJECT_DIR,
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 10000
        });
      } catch (e) {
        this.issues.push({
          type: 'dependencies',
          severity: 'medium',
          message: 'Go: go.mod needs tidying',
          fix: 'tidy-go-mod',
          language: 'go'
        });
      }

      // Check for vulnerabilities
      try {
        execSync('go list -json -m all | grep -q "vulnerable"', {
          cwd: PROJECT_DIR,
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 15000
        });
      } catch (e) {
        // Check exit code - if non-zero, might have vulnerabilities
        try {
          const audit = execSync('go list -json -m all', {
            cwd: PROJECT_DIR,
            encoding: 'utf-8',
            stdio: 'pipe',
            timeout: 15000
          });
          // Could parse JSON and check for vulnerabilities
        } catch (err) {
          // Error checking vulnerabilities
        }
      }
    } catch (error) {
      // Error handling
    }
  }

  /**
   * Check Rust dependencies
   */
  async checkRustDependencies() {
    try {
      const cargoToml = path.join(PROJECT_DIR, 'Cargo.toml');
      if (!fs.existsSync(cargoToml)) {
        return;
      }

      // Check if Cargo.lock is up to date
      const cargoLock = path.join(PROJECT_DIR, 'Cargo.lock');
      if (!fs.existsSync(cargoLock)) {
        this.issues.push({
          type: 'dependencies',
          severity: 'medium',
          message: 'Rust: Cargo.lock missing (run cargo build)',
          fix: 'generate-cargo-lock',
          language: 'rust'
        });
      }

      // Check for outdated dependencies
      try {
        execSync('cargo outdated --exit-code 1', {
          cwd: PROJECT_DIR,
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 30000
        });
      } catch (e) {
        // cargo outdated returns non-zero if outdated
        this.issues.push({
          type: 'dependencies',
          severity: 'low',
          message: 'Rust: Some dependencies are outdated',
          fix: 'update-rust-dependencies',
          language: 'rust'
        });
      }
    } catch (error) {
      // Error handling
    }
  }

  /**
   * Check build configuration
   */
  async checkBuildConfig() {
    // Check for common build config files
    const configFiles = [
      'tsconfig.json',
      'webpack.config.js',
      'next.config.js',
      'vite.config.js',
      '.eslintrc',
      '.eslintrc.js',
      '.eslintrc.json'
    ];

    const missingConfigs = [];
    configFiles.forEach(file => {
      const filePath = path.join(PROJECT_DIR, file);
      if (fs.existsSync(filePath)) {
        // Check if config is valid JSON/JS
        try {
          if (file.endsWith('.json')) {
            JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          }
        } catch (e) {
          this.issues.push({
            type: 'build-config',
            severity: 'high',
            message: `Invalid ${file} configuration`,
            fix: 'fix-config',
            data: { file, error: e.message }
          });
        }
      }
    });
  }

  /**
   * Check environment setup
   */
  async checkEnvironment() {
    // Check for .env.example but missing .env
    const envExample = path.join(PROJECT_DIR, '.env.example');
    const env = path.join(PROJECT_DIR, '.env');

    if (fs.existsSync(envExample) && !fs.existsSync(env)) {
      this.issues.push({
        type: 'environment',
        severity: 'medium',
        message: '.env file missing (copy from .env.example)',
        fix: 'create-env'
      });
    }

    // Check .env is in .gitignore
    const gitignore = path.join(PROJECT_DIR, '.gitignore');
    if (fs.existsSync(gitignore)) {
      const gitignoreContent = fs.readFileSync(gitignore, 'utf-8');
      if (!gitignoreContent.includes('.env')) {
        this.issues.push({
          type: 'environment',
          severity: 'high',
          message: '.env not in .gitignore (security risk)',
          fix: 'update-gitignore'
        });
      }
    }
  }

  /**
   * Check for test failures
   */
  async checkTests() {
    try {
      const packageJson = path.join(PROJECT_DIR, 'package.json');
      if (!fs.existsSync(packageJson)) return;

      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      if (!pkg.scripts || !pkg.scripts.test) return;

      // Try running tests (with timeout)
      try {
        execSync('npm test -- --passWithNoTests', {
          cwd: PROJECT_DIR,
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 30000 // 30 second timeout
        });
      } catch (e) {
        // Check if it's a test failure or just no tests
        if (e.stdout && e.stdout.includes('FAIL')) {
          this.issues.push({
            type: 'tests',
            severity: 'high',
            message: 'Test failures detected',
            fix: 'fix-tests',
            data: { output: e.stdout }
          });
        }
      }
    } catch (error) {
      // Tests not configured or other error
    }
  }

  /**
   * Check linting issues
   */
  async checkLinting() {
    try {
      const packageJson = path.join(PROJECT_DIR, 'package.json');
      if (!fs.existsSync(packageJson)) return;

      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      if (!pkg.scripts || !pkg.scripts.lint) return;

      try {
        execSync('npm run lint', {
          cwd: PROJECT_DIR,
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 30000
        });
      } catch (e) {
        // Check if auto-fixable
        if (e.stdout && (e.stdout.includes('--fix') || e.stdout.includes('fixable'))) {
          this.issues.push({
            type: 'linting',
            severity: 'low',
            message: 'Linting issues detected (auto-fixable)',
            fix: 'fix-linting'
          });
        } else {
          this.issues.push({
            type: 'linting',
            severity: 'medium',
            message: 'Linting issues detected',
            fix: 'fix-linting'
          });
        }
      }
    } catch (error) {
      // Linting not configured
    }
  }

  /**
   * Check security vulnerabilities (L mode only)
   */
  async checkSecurity() {
    try {
      const packageJson = path.join(PROJECT_DIR, 'package.json');
      if (!fs.existsSync(packageJson)) return;

      try {
        const audit = execSync('npm audit --json', {
          cwd: PROJECT_DIR,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        const auditData = JSON.parse(audit);
        
        if (auditData.vulnerabilities && Object.keys(auditData.vulnerabilities).length > 0) {
          const critical = Object.values(auditData.vulnerabilities).filter(v => v.severity === 'critical').length;
          const high = Object.values(auditData.vulnerabilities).filter(v => v.severity === 'high').length;

          if (critical > 0 || high > 0) {
            this.issues.push({
              type: 'security',
              severity: 'critical',
              message: `${critical} critical, ${high} high severity vulnerabilities`,
              fix: 'fix-security',
              data: auditData
            });
          }
        }
      } catch (e) {
        // npm audit may fail, but that's okay
      }
    } catch (error) {
      // Not applicable
    }
  }

  /**
   * Apply fixes for detected issues
   */
  async applyFixes() {
    const results = {
      healed: true,
      issues: this.issues.length,
      fixes: 0,
      failed: []
    };

    for (const issue of this.issues) {
      try {
        const fixed = await this.applyFix(issue);
        if (fixed) {
          results.fixes++;
          this.fixes.push({
            issue: issue.type,
            message: issue.message,
            fixed: true
          });
        } else {
          results.failed.push(issue);
        }
      } catch (error) {
        results.failed.push({ ...issue, error: error.message });
      }
    }

    return results;
  }

  /**
   * Apply a specific fix
   */
  async applyFix(issue) {
    console.log(`\n🔧 Attempting to fix: ${issue.message}`);

    switch (issue.fix) {
      case 'install-dependencies':
        return this.fixInstallDependencies();

      case 'update-dependencies':
        return this.fixUpdateDependencies(issue.data);

      case 'generate-lock-file':
        return this.fixGenerateLockFile();

      case 'fix-config':
        return this.fixConfig(issue.data);

      case 'create-env':
        return this.fixCreateEnv();

      case 'update-gitignore':
        return this.fixUpdateGitignore();

      case 'fix-tests':
        return this.fixTests(issue.data);

      case 'fix-linting':
        return this.fixLinting();

      case 'fix-security':
        return this.fixSecurity(issue.data);

      case 'create-venv':
        return this.fixCreateVenv();

      case 'install-python-dependencies':
        return this.fixInstallPythonDependencies();

      case 'update-python-dependencies':
        return this.fixUpdatePythonDependencies(issue.data);

      case 'tidy-go-mod':
        return this.fixTidyGoMod();

      case 'generate-cargo-lock':
        return this.fixGenerateCargoLock();

      case 'update-rust-dependencies':
        return this.fixUpdateRustDependencies();

      default:
        console.log(`   ⚠️  No auto-fix available for: ${issue.type}`);
        return false;
    }
  }

  async fixInstallDependencies() {
    try {
      execSync('npm install', { cwd: PROJECT_DIR, stdio: 'inherit' });
      console.log('   ✅ Dependencies installed');
      return true;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }
  }

  async fixUpdateDependencies(outdated) {
    // Only update patch and minor versions (safe updates)
    try {
      execSync('npm update', { cwd: PROJECT_DIR, stdio: 'inherit' });
      console.log('   ✅ Dependencies updated');
      return true;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }
  }

  async fixGenerateLockFile() {
    try {
      execSync('npm install --package-lock-only', { cwd: PROJECT_DIR, stdio: 'inherit' });
      console.log('   ✅ Lock file generated');
      return true;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }
  }

  async fixConfig(data) {
    console.log(`   ⚠️  Manual fix required for ${data.file}`);
    // Could implement auto-fix for common config issues
    return false;
  }

  async fixCreateEnv() {
    try {
      const envExample = path.join(PROJECT_DIR, '.env.example');
      const env = path.join(PROJECT_DIR, '.env');
      
      if (fs.existsSync(envExample)) {
        fs.copyFileSync(envExample, env);
        console.log('   ✅ .env file created from .env.example');
        console.log('   ⚠️  Remember to fill in actual values!');
        return true;
      }
      return false;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }
  }

  async fixUpdateGitignore() {
    try {
      const gitignore = path.join(PROJECT_DIR, '.gitignore');
      let content = '';
      
      if (fs.existsSync(gitignore)) {
        content = fs.readFileSync(gitignore, 'utf-8');
      }
      
      if (!content.includes('.env')) {
        content += '\n# Environment variables\n.env\n.env.local\n.env.*.local\n';
        fs.writeFileSync(gitignore, content);
        console.log('   ✅ .gitignore updated');
        return true;
      }
      return false;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }
  }

  async fixTests(data) {
    console.log('   ⚠️  Test failures require manual investigation');
    console.log(`   Check test output for details`);
    // Could implement auto-fix for common test issues
    return false;
  }

  async fixLinting() {
    try {
      // Try auto-fix first
      try {
        execSync('npm run lint -- --fix', { 
          cwd: PROJECT_DIR, 
          stdio: 'inherit',
          timeout: 30000
        });
        console.log('   ✅ Linting issues auto-fixed');
        return true;
      } catch (e) {
        // If --fix doesn't exist, try eslint directly
        execSync('npx eslint . --fix', { 
          cwd: PROJECT_DIR, 
          stdio: 'inherit',
          timeout: 30000
        });
        console.log('   ✅ Linting issues auto-fixed');
        return true;
      }
    } catch (error) {
      console.log(`   ⚠️  Some linting issues may require manual fixes`);
      return false;
    }
  }

  async fixSecurity(data) {
    try {
      // Try npm audit fix (only fixes vulnerabilities that don't require major updates)
      execSync('npm audit fix', { cwd: PROJECT_DIR, stdio: 'inherit' });
      console.log('   ✅ Security vulnerabilities fixed (if possible)');
      console.log('   ⚠️  Review remaining vulnerabilities manually');
      return true;
    } catch (error) {
      console.log(`   ⚠️  Some vulnerabilities may require manual updates`);
      return false;
    }
  }

  async fixCreateVenv() {
    try {
      const venvPath = path.join(PROJECT_DIR, 'venv');
      execSync('python3 -m venv venv', { cwd: PROJECT_DIR, stdio: 'inherit' });
      console.log('   ✅ Python virtual environment created');
      console.log('   💡 Activate with: source venv/bin/activate (Linux/Mac) or venv\\Scripts\\activate (Windows)');
      return true;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }
  }

  async fixInstallPythonDependencies() {
    try {
      const requirementsTxt = path.join(PROJECT_DIR, 'requirements.txt');
      if (fs.existsSync(requirementsTxt)) {
        execSync('pip install -r requirements.txt', { cwd: PROJECT_DIR, stdio: 'inherit' });
        console.log('   ✅ Python dependencies installed');
        return true;
      } else {
        console.log('   ⚠️  No requirements.txt found');
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }
  }

  async fixUpdatePythonDependencies(data) {
    try {
      // Update packages safely (only patch/minor updates)
      execSync('pip list --outdated --format=json', { 
        cwd: PROJECT_DIR, 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      console.log('   ⚠️  Python dependency updates require manual review');
      console.log('   💡 Run: pip install --upgrade <package> for specific packages');
      return false; // Don't auto-update Python packages
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }
  }

  async fixTidyGoMod() {
    try {
      execSync('go mod tidy', { cwd: PROJECT_DIR, stdio: 'inherit' });
      console.log('   ✅ go.mod tidied');
      return true;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }
  }

  async fixGenerateCargoLock() {
    try {
      execSync('cargo build', { cwd: PROJECT_DIR, stdio: 'inherit' });
      console.log('   ✅ Cargo.lock generated');
      return true;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }
  }

  async fixUpdateRustDependencies() {
    try {
      execSync('cargo update', { cwd: PROJECT_DIR, stdio: 'inherit' });
      console.log('   ✅ Rust dependencies updated');
      return true;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Report healing results
   */
  reportResults(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Self-Healing Results\n');
    console.log(`Issues Detected: ${results.issues}`);
    console.log(`Fixes Applied: ${results.fixes}`);
    console.log(`Failed Fixes: ${results.failed.length}`);

    if (results.failed.length > 0) {
      console.log('\n⚠️  Issues requiring manual attention:');
      results.failed.forEach((issue, i) => {
        console.log(`   ${i + 1}. [${issue.severity}] ${issue.type}: ${issue.message}`);
      });
    }

    // Log to project/errors.md
    this.logToErrors(results);

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Log results to project/errors.md
   */
  logToErrors(results) {
    const errorsFile = path.join(PROJECT_DIR, 'project/errors.md');
    let content = '';

    if (fs.existsSync(errorsFile)) {
      content = fs.readFileSync(errorsFile, 'utf-8');
    } else {
      content = '# Error Log\n\n';
    }

    const timestamp = new Date().toISOString();
    content += `\n### Self-Healing Build Run - ${timestamp}\n\n`;
    content += `- Issues Detected: ${results.issues}\n`;
    content += `- Fixes Applied: ${results.fixes}\n`;
    content += `- Failed Fixes: ${results.failed.length}\n\n`;

    if (results.failed.length > 0) {
      content += `**Issues Requiring Manual Attention:**\n\n`;
      results.failed.forEach(issue => {
        content += `- [${issue.severity}] ${issue.type}: ${issue.message}\n`;
      });
    }

    fs.writeFileSync(errorsFile, content);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check-only');
  const fixAll = args.includes('--fix-all');

  const healer = new SelfHealingBuild();
  
  if (checkOnly) {
    healer.detectIssues().then(() => {
      console.log(`\n✅ Check complete. Found ${healer.issues.length} issue(s).`);
      process.exit(healer.issues.length > 0 ? 1 : 0);
    });
  } else {
    healer.heal().then(results => {
      process.exit(results.failed.length > 0 ? 1 : 0);
    });
  }
}

module.exports = SelfHealingBuild;
