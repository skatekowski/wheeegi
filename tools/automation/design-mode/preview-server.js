#!/usr/bin/env node
/**
 * WHEEE Prototype Preview Server
 * Simple local server to preview design prototypes.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

const server = http.createServer((req, res) => {
  let filePath = path.join(process.cwd(), 'prototypes', req.url === '/' ? 'index.html' : req.url);
  
  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  } else {
    res.writeHead(404);
    res.end('Prototype file not found. Run "wheee prototype" first.');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Prototype Preview active at http://localhost:${PORT}`);
  console.log('   Press Ctrl+C to stop.');
});
