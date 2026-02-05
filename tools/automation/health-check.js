#!/usr/bin/env node
/**
 * Health Check Automation
 * Monitors API endpoints, databases, and external services
 * 
 * Usage: node tools/automation/health-check.js [--endpoint=url] [--all]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const PROJECT_DIR = path.join(__dirname, '../..');
const TIMEOUT = 10000; // 10 seconds

class HealthChecker {
  constructor() {
    this.checks = [];
    this.results = [];
    this.mode = this.detectMode();
  }

  detectMode() {
    const modeFile = path.join(PROJECT_DIR, 'project/mode-assessment.json');
    if (fs.existsSync(modeFile)) {
      const assessment = JSON.parse(fs.readFileSync(modeFile, 'utf-8'));
      return assessment.mode || 'M';
    }
    return 'M';
  }

  async checkAll() {
    console.log('🏥 WHEEE Protocol Health Check System\n');
    console.log(`Mode: ${this.mode}\n`);

    // Load health check configuration
    await this.loadConfig();

    // Run all checks
    for (const check of this.checks) {
      const result = await this.runCheck(check);
      this.results.push(result);
    }

    // Report results
    this.reportResults();

    // Auto-restart if needed (L mode only)
    if (this.mode === 'L') {
      await this.handleFailures();
    }

    return this.results;
  }

  async loadConfig() {
    const configFile = path.join(PROJECT_DIR, 'project/health-checks.json');
    
    if (fs.existsSync(configFile)) {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      this.checks = config.checks || [];
    } else {
      // Default checks from environment or project files
      this.checks = await this.discoverChecks();
    }
  }

  async discoverChecks() {
    const checks = [];

    // Check for API endpoints in environment
    const envFile = path.join(PROJECT_DIR, '.env');
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf-8');
      const apiUrlMatch = envContent.match(/API_URL=(.+)/);
      const baseUrlMatch = envContent.match(/BASE_URL=(.+)/);
      
      if (apiUrlMatch) {
        checks.push({
          name: 'API Endpoint',
          type: 'http',
          url: apiUrlMatch[1].trim(),
          expectedStatus: 200
        });
      }
      
      if (baseUrlMatch) {
        checks.push({
          name: 'Base URL',
          type: 'http',
          url: baseUrlMatch[1].trim(),
          expectedStatus: 200
        });
      }
    }

    // Check for database connections
    const envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf-8') : '';
    if (envContent.includes('DATABASE_URL') || envContent.includes('DB_HOST')) {
      checks.push({
        name: 'Database Connection',
        type: 'database',
        provider: envContent.match(/DB_PROVIDER=(.+)/)?.[1] || 'postgres',
        // Database check would require specific drivers
      });
    }

    return checks;
  }

  async runCheck(check) {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (check.type) {
        case 'http':
        case 'https':
          result = await this.checkHttp(check);
          break;
        case 'database':
          result = await this.checkDatabase(check);
          break;
        default:
          result = { success: false, error: `Unknown check type: ${check.type}` };
      }

      result.duration = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      result.check = check.name;

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        check: check.name
      };
    }
  }

  async checkHttp(check) {
    return new Promise((resolve) => {
      const url = new URL(check.url);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        timeout: TIMEOUT,
        headers: {
          'User-Agent': 'WHEEE-Protocol-Health-Check/1.0'
        }
      };

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          const success = res.statusCode === (check.expectedStatus || 200);
          resolve({
            success,
            statusCode: res.statusCode,
            expectedStatus: check.expectedStatus || 200,
            responseTime: Date.now() - Date.now() // Will be set by caller
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout'
        });
      });

      req.setTimeout(TIMEOUT);
      req.end();
    });
  }

  async checkDatabase(check) {
    // Database checks require specific drivers
    // This is a placeholder for actual implementation
    return {
      success: false,
      note: 'Database health checks require database-specific drivers',
      provider: check.provider
    };
  }

  reportResults() {
    console.log('📊 Health Check Results:\n');
    
    const healthy = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    this.results.forEach((result, i) => {
      const icon = result.success ? '✅' : '❌';
      const status = result.success ? 'HEALTHY' : 'UNHEALTHY';
      console.log(`${i + 1}. ${icon} ${result.check}: ${status}`);
      
      if (!result.success) {
        console.log(`   Error: ${result.error || result.note || 'Unknown error'}`);
      } else if (result.statusCode) {
        console.log(`   Status: ${result.statusCode} (${result.duration}ms)`);
      }
    });

    console.log(`\n📈 Summary: ${healthy}/${total} checks passed\n`);

    // Log to errors.md if any failures
    if (healthy < total) {
      this.logFailures();
    }
  }

  logFailures() {
    const errorsFile = path.join(PROJECT_DIR, 'project/errors.md');
    let content = '';

    if (fs.existsSync(errorsFile)) {
      content = fs.readFileSync(errorsFile, 'utf-8');
    } else {
      content = '# Error Log\n\n';
    }

    const timestamp = new Date().toISOString();
    content += `\n### Health Check Failures - ${timestamp}\n\n`;
    
    this.results.filter(r => !r.success).forEach(result => {
      content += `**${result.check}**\n`;
      content += `- Status: UNHEALTHY\n`;
      content += `- Error: ${result.error || result.note || 'Unknown'}\n`;
      content += `- Duration: ${result.duration}ms\n\n`;
    });

    fs.writeFileSync(errorsFile, content);
  }

  async handleFailures() {
    const failures = this.results.filter(r => !r.success);
    
    if (failures.length > 0) {
      console.log('⚠️  Failures detected. L mode: Auto-restart capabilities available.');
      console.log('   Configure auto-restart in project/health-checks.json');
      
      // Auto-restart logic would go here
      // Requires process management (PM2, systemd, etc.)
    }
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const checkAll = args.includes('--all');
  const endpoint = args.find(a => a.startsWith('--endpoint='))?.split('=')[1];

  const checker = new HealthChecker();
  
  if (endpoint) {
    // Single endpoint check
    checker.checks = [{
      name: 'Custom Endpoint',
      type: 'http',
      url: endpoint,
      expectedStatus: 200
    }];
  }

  checker.checkAll().then(results => {
    const failures = results.filter(r => !r.success).length;
    process.exit(failures > 0 ? 1 : 0);
  }).catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}

module.exports = HealthChecker;
