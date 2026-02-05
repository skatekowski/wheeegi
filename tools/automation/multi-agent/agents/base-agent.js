#!/usr/bin/env node
/**
 * WHEEE Base Agent
 * Base class for specialized agents.
 */

const fs = require('fs');
const path = require('path');

class BaseAgent {
  constructor(name) {
    this.name = name;
    this.projectDir = process.cwd();
  }

  log(message) {
    console.log(`[🤖 ${this.name}] ${message}`);
  }

  async run(phase) {
    this.log(`Running for phase: ${phase}`);
    // Override in subclasses
  }

  readFile(filePath) {
    const fullPath = path.join(this.projectDir, filePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
    return null;
  }

  writeFile(filePath, content) {
    const fullPath = path.join(this.projectDir, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
    this.log(`Wrote: ${filePath}`);
  }
}

module.exports = BaseAgent;
