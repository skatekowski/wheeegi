/**
 * WHEEE Core Utility Library
 */
const fs = require('fs');
const path = require('path');

const core = {
  getProjectRoot: () => process.cwd(),
  
  exists: (p) => fs.existsSync(path.join(process.cwd(), p)),
  
  read: (p) => {
    try {
      return fs.readFileSync(path.join(process.cwd(), p), 'utf8');
    } catch (e) {
      return null;
    }
  },
  
  readJson: (p) => {
    const content = core.read(p);
    try {
      return content ? JSON.parse(content) : null;
    } catch (e) {
      return null;
    }
  },
  
  write: (p, content) => {
    const fullPath = path.join(process.cwd(), p);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
  },
  
  list: (p, options = {}) => {
    try {
      return fs.readdirSync(path.join(process.cwd(), p), options);
    } catch (e) {
      return [];
    }
  },
  
  stats: (p) => {
    try {
      return fs.statSync(path.join(process.cwd(), p));
    } catch (e) {
      return null;
    }
  }
};

module.exports = core;
