#!/usr/bin/env node
/**
 * Performance Regression Detection
 * Tracks build times, test durations, bundle sizes over time
 * 
 * Usage: node tools/automation/performance-tracker.js [--baseline] [--compare]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = path.join(__dirname, '../..');
const PERF_HISTORY_FILE = path.join(PROJECT_DIR, 'project/performance-history.json');

class PerformanceTracker {
  constructor() {
    this.history = this.loadHistory();
    this.mode = this.detectMode();
    this.thresholds = this.getThresholds();
  }

  detectMode() {
    const modeFile = path.join(PROJECT_DIR, 'project/mode-assessment.json');
    if (fs.existsSync(modeFile)) {
      const assessment = JSON.parse(fs.readFileSync(modeFile, 'utf-8'));
      return assessment.mode || 'M';
    }
    return 'M';
  }

  getThresholds() {
    // Mode-specific thresholds for regression detection
    const thresholds = {
      S: {
        buildTime: { warning: 1.5, critical: 2.0 }, // 1.5x = warning, 2x = critical
        testTime: { warning: 1.5, critical: 2.0 },
        bundleSize: { warning: 1.2, critical: 1.5 }
      },
      M: {
        buildTime: { warning: 1.3, critical: 1.8 },
        testTime: { warning: 1.3, critical: 1.8 },
        bundleSize: { warning: 1.15, critical: 1.3 }
      },
      L: {
        buildTime: { warning: 1.2, critical: 1.5 },
        testTime: { warning: 1.2, critical: 1.5 },
        bundleSize: { warning: 1.1, critical: 1.2 }
      }
    };
    return thresholds[this.mode] || thresholds.M;
  }

  loadHistory() {
    if (fs.existsSync(PERF_HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(PERF_HISTORY_FILE, 'utf-8'));
    }
    return { measurements: [], baselines: {} };
  }

  async measure() {
    console.log('⏱️  Performance Measurement\n');
    console.log(`Mode: ${this.mode}\n`);

    const measurement = {
      timestamp: new Date().toISOString(),
      mode: this.mode,
      metrics: {}
    };

    // Measure build time
    await this.measureBuildTime(measurement);

    // Measure test time
    await this.measureTestTime(measurement);

    // Measure bundle size
    await this.measureBundleSize(measurement);

    // Check for regressions
    const regressions = this.detectRegressions(measurement);

    // Save measurement
    this.history.measurements.push(measurement);
    this.saveHistory();

    // Report
    this.reportMeasurement(measurement, regressions);

    return { measurement, regressions };
  }

  async measureBuildTime(measurement) {
    try {
      const packageJson = path.join(PROJECT_DIR, 'package.json');
      if (!fs.existsSync(packageJson)) {
        return;
      }

      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      if (!pkg.scripts || !pkg.scripts.build) {
        return;
      }

      const startTime = Date.now();
      try {
        execSync('npm run build', {
          cwd: PROJECT_DIR,
          stdio: 'pipe',
          timeout: 300000 // 5 minutes max
        });
        const buildTime = Date.now() - startTime;
        measurement.metrics.buildTime = buildTime;
      } catch (e) {
        // Build failed, don't record time
      }
    } catch (error) {
      // Not a Node.js project or build not configured
    }
  }

  async measureTestTime(measurement) {
    try {
      const packageJson = path.join(PROJECT_DIR, 'package.json');
      if (!fs.existsSync(packageJson)) {
        return;
      }

      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      if (!pkg.scripts || !pkg.scripts.test) {
        return;
      }

      const startTime = Date.now();
      try {
        execSync('npm test -- --passWithNoTests', {
          cwd: PROJECT_DIR,
          stdio: 'pipe',
          timeout: 300000
        });
        const testTime = Date.now() - startTime;
        measurement.metrics.testTime = testTime;
      } catch (e) {
        // Tests failed, don't record time
      }
    } catch (error) {
      // Tests not configured
    }
  }

  async measureBundleSize(measurement) {
    try {
      // Check for common build output directories
      const distDirs = ['dist', 'build', 'out', '.next'];
      
      for (const dir of distDirs) {
        const distPath = path.join(PROJECT_DIR, dir);
        if (fs.existsSync(distPath)) {
          const size = this.getDirectorySize(distPath);
          measurement.metrics.bundleSize = size;
          break;
        }
      }
    } catch (error) {
      // Could not measure bundle size
    }
  }

  getDirectorySize(dirPath) {
    let totalSize = 0;
    
    const files = fs.readdirSync(dirPath, { recursive: true });
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      } catch (e) {
        // Skip files we can't access
      }
    });

    return totalSize;
  }

  detectRegressions(measurement) {
    const regressions = [];
    const baseline = this.getBaseline();

    if (!baseline || Object.keys(baseline).length === 0) {
      // No baseline, set this as baseline
      this.setBaseline(measurement.metrics);
      return regressions;
    }

    // Check each metric
    Object.entries(measurement.metrics).forEach(([metric, value]) => {
      if (!baseline[metric]) {
        return;
      }

      const ratio = value / baseline[metric];
      const threshold = this.thresholds[metric] || this.thresholds.buildTime;

      if (ratio >= threshold.critical) {
        regressions.push({
          metric,
          severity: 'critical',
          current: value,
          baseline: baseline[metric],
          ratio: ratio.toFixed(2),
          message: `${metric} increased by ${((ratio - 1) * 100).toFixed(1)}% (critical threshold: ${((threshold.critical - 1) * 100).toFixed(0)}%)`
        });
      } else if (ratio >= threshold.warning) {
        regressions.push({
          metric,
          severity: 'warning',
          current: value,
          baseline: baseline[metric],
          ratio: ratio.toFixed(2),
          message: `${metric} increased by ${((ratio - 1) * 100).toFixed(1)}% (warning threshold: ${((threshold.warning - 1) * 100).toFixed(0)}%)`
        });
      }
    });

    return regressions;
  }

  getBaseline() {
    if (this.history.baselines[this.mode]) {
      return this.history.baselines[this.mode];
    }

    // Use median of last 5 measurements as baseline
    const recent = this.history.measurements
      .filter(m => m.mode === this.mode)
      .slice(-5);

    if (recent.length === 0) {
      return null;
    }

    const baseline = {};
    Object.keys(recent[0].metrics || {}).forEach(metric => {
      const values = recent.map(m => m.metrics[metric]).filter(v => v !== undefined);
      if (values.length > 0) {
        values.sort((a, b) => a - b);
        baseline[metric] = values[Math.floor(values.length / 2)]; // Median
      }
    });

    return baseline;
  }

  setBaseline(metrics) {
    this.history.baselines[this.mode] = metrics;
    this.saveHistory();
  }

  reportMeasurement(measurement, regressions) {
    console.log('📊 Performance Metrics:\n');

    Object.entries(measurement.metrics).forEach(([metric, value]) => {
      if (metric === 'buildTime' || metric === 'testTime') {
        console.log(`  ${metric}: ${(value / 1000).toFixed(2)}s`);
      } else if (metric === 'bundleSize') {
        console.log(`  ${metric}: ${(value / 1024 / 1024).toFixed(2)} MB`);
      } else {
        console.log(`  ${metric}: ${value}`);
      }
    });

    if (regressions.length > 0) {
      console.log('\n⚠️  Performance Regressions Detected:\n');
      regressions.forEach(reg => {
        const icon = reg.severity === 'critical' ? '🔴' : '🟡';
        console.log(`  ${icon} ${reg.message}`);
      });

      // Log to errors.md
      this.logRegressions(regressions);
    } else {
      console.log('\n✅ No performance regressions detected');
    }
  }

  logRegressions(regressions) {
    const errorsFile = path.join(PROJECT_DIR, 'project/errors.md');
    let content = '';

    if (fs.existsSync(errorsFile)) {
      content = fs.readFileSync(errorsFile, 'utf-8');
    } else {
      content = '# Error Log\n\n';
    }

    const timestamp = new Date().toISOString();
    content += `\n### Performance Regressions - ${timestamp}\n\n`;

    regressions.forEach(reg => {
      content += `**${reg.metric}** (${reg.severity})\n`;
      content += `- Current: ${reg.current}\n`;
      content += `- Baseline: ${reg.baseline}\n`;
      content += `- Increase: ${reg.message}\n\n`;
    });

    fs.writeFileSync(errorsFile, content);
  }

  saveHistory() {
    fs.writeFileSync(PERF_HISTORY_FILE, JSON.stringify(this.history, null, 2));
  }

  generateReport() {
    console.log('📈 Performance Trend Report\n');
    console.log('='.repeat(60));

    const recent = this.history.measurements.slice(-10);
    if (recent.length === 0) {
      console.log('No performance data available.');
      return;
    }

    console.log('\nRecent Measurements:\n');
    recent.forEach(m => {
      const date = new Date(m.timestamp).toLocaleDateString();
      const buildTime = m.metrics.buildTime ? `${(m.metrics.buildTime / 1000).toFixed(1)}s` : 'N/A';
      const testTime = m.metrics.testTime ? `${(m.metrics.testTime / 1000).toFixed(1)}s` : 'N/A';
      console.log(`  ${date}: Build=${buildTime}, Test=${testTime}`);
    });

    // Generate markdown report
    this.generateMarkdownReport();
  }

  generateMarkdownReport() {
    const reportFile = path.join(PROJECT_DIR, 'project/performance-report.md');
    let content = '# Performance Report\n\n';
    content += `**Generated:** ${new Date().toISOString()}\n`;
    content += `**Mode:** ${this.mode}\n\n`;

    const recent = this.history.measurements.slice(-10);
    if (recent.length > 0) {
      content += '## Recent Measurements\n\n';
      content += '| Date | Build Time | Test Time | Bundle Size |\n';
      content += '|------|------------|-----------|-------------|\n';

      recent.forEach(m => {
        const date = new Date(m.timestamp).toLocaleDateString();
        const buildTime = m.metrics.buildTime ? `${(m.metrics.buildTime / 1000).toFixed(1)}s` : 'N/A';
        const testTime = m.metrics.testTime ? `${(m.metrics.testTime / 1000).toFixed(1)}s` : 'N/A';
        const bundleSize = m.metrics.bundleSize ? `${(m.metrics.bundleSize / 1024 / 1024).toFixed(2)} MB` : 'N/A';
        content += `| ${date} | ${buildTime} | ${testTime} | ${bundleSize} |\n`;
      });
    }

    fs.writeFileSync(reportFile, content);
    console.log(`\n✅ Report saved to: project/performance-report.md`);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const baseline = args.includes('--baseline');
  const compare = args.includes('--compare');
  const report = args.includes('--report');

  const tracker = new PerformanceTracker();

  if (baseline) {
    // Set current metrics as baseline
    tracker.measure().then(({ measurement }) => {
      tracker.setBaseline(measurement.metrics);
      console.log('\n✅ Baseline set');
    });
  } else if (report) {
    tracker.generateReport();
  } else {
    tracker.measure().then(({ regressions }) => {
      if (regressions.length > 0) {
        process.exit(1);
      }
    });
  }
}

module.exports = PerformanceTracker;
