#!/usr/bin/env node
/**
 * WHEEE Design System Builder
 * Synchronizes design tokens across project.
 */

const fs = require('fs');
const path = require('path');

function buildDesignSystem(tokens) {
  console.log("💎 Building Design System...");
  const designSystemDir = path.join(process.cwd(), 'docs/design-system');
  if (!fs.existsSync(designSystemDir)) fs.mkdirSync(designSystemDir, { recursive: true });
  
  const designSystemMd = `
# Design System (Generated)

## Principles
1. Dark Mode Native
2. Content Forward
3. Mobile-First

## Color Palette
### Backgrounds
- Primary: ${tokens.colors.bgPrimary || "#000000"}
- Elevated: ${tokens.colors.bgElevated || "#1a1a1a"}

### Semantic
- Accent: ${tokens.colors.accent || "#0a84ff"}
- Error: ${tokens.colors.error || "#ef4444"}

## Typography
- Font Primary: Inter, Oswald
- Base Scale: 4px unit

## Spacing
- Base Unit: ${tokens.spacing.base || 4}px
  `;
  
  fs.writeFileSync(path.join(designSystemDir, 'tokens.md'), designSystemMd);
  console.log(`✅ Design System updated in: \${designSystemDir}/tokens.md`);
}

if (require.main === module) {
  const mockTokens = {
    colors: { primary: "#000", accent: "#0a84ff" },
    spacing: { base: 4 }
  };
  buildDesignSystem(mockTokens);
}
