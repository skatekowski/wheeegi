#!/usr/bin/env node
/**
 * WHEEE Prototype Generator
 * Generates interactive prototypes from design specs.
 */

const fs = require('fs');
const path = require('path');

function generatePrototype(specs) {
  console.log("🛠️ Generating interactive prototype...");
  const prototypeDir = path.join(process.cwd(), 'prototypes');
  if (!fs.existsSync(prototypeDir)) fs.mkdirSync(prototypeDir, { recursive: true });
  
  const indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>WHEEE Prototype</title>
  <style>
    body { background: #000; color: #fff; font-family: sans-serif; }
    .canvas { width: 375px; height: 812px; border: 1px solid #333; margin: 20px auto; overflow: hidden; }
  </style>
</head>
<body>
  <div class="canvas">
    <h1>Prototype: ${specs.name}</h1>
    <p>Interactions loaded...</p>
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(prototypeDir, 'index.html'), indexHtml);
  console.log(`✅ Prototype created in: ${prototypeDir}/index.html`);
}

if (require.main === module) {
  generatePrototype({ name: process.argv[2] || 'New Flow' });
}
