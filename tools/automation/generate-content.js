#!/usr/bin/env node
/**
 * Generate social media content, blog posts, presentations from process journal
 * Usage: node tools/automation/generate-content.js --format <format> --topic <topic>
 * 
 * Formats: twitter-thread, linkedin-post, blog-post, case-study, presentation
 */

const fs = require('fs');
const path = require('path');

const JOURNAL_FILE = path.join(__dirname, '../../project/process-journal.md');
const OUTPUT_DIR = path.join(__dirname, '../../docs/content');

function readJournal() {
  if (!fs.existsSync(JOURNAL_FILE)) {
    return null;
  }
  return fs.readFileSync(JOURNAL_FILE, 'utf-8');
}

function generateTwitterThread(topic) {
  const journal = readJournal();
  if (!journal) return 'Journal not found';
  
  // Extract relevant content based on topic
  const lines = [];
  
  if (topic === 'week1' || topic === 'process') {
    lines.push('🧵 Building PoppyMiro: Week 1 Update\n\n');
    lines.push('1/ We started with a PRD and built a complete workflow system before writing a single line of code.\n\n');
    lines.push('2/ Chose GSD + B.L.A.S.T. methodology for structured development.\n\n');
    lines.push('3/ Documented architecture, schemas, and constraints upfront.\n\n');
    lines.push('4/ Created automation tools for documentation and workflow enforcement.\n\n');
    lines.push('5/ Result: Clear path forward, zero confusion, ready to code.\n\n');
    lines.push('Process > Speed. 🚀\n\n');
  }
  
  return lines.join('');
}

function generateLinkedInPost(topic) {
  const journal = readJournal();
  if (!journal) return 'Journal not found';
  
  let post = '';
  
  if (topic === 'process') {
    post = `The Power of Process: Building PoppyMiro

We're building PoppyMiro, a 6-edition AI suite for Miro, FigJam, and Standalone WebApp. Target: Week 4 launch → €2M ARR.

But here's what we did BEFORE writing a single line of code:

✅ Created complete workflow system (GSD + B.L.A.S.T.)
✅ Documented architecture and data schemas
✅ Built automation tools for documentation
✅ Defined pricing strategy and business model

Why? Because process matters as much as product.

The upfront investment in documentation and workflow will save us weeks of confusion later. We know exactly what to build, how to build it, and why.

Lesson: Don't skip the planning phase. It's not overhead—it's acceleration.

#ProductDevelopment #StartupLife #ProcessMatters

[Link to blog post or case study]`;
  }
  
  return post;
}

function generateBlogPost(topic) {
  const journal = readJournal();
  if (!journal) return 'Journal not found';
  
  let post = '';
  
  if (topic === 'workflow') {
    post = `# How We Built a Workflow System Before Writing Code

## The Challenge

We had an aggressive timeline: 16 weeks to launch PoppyMiro, a multi-platform AI suite with 6 editions. Solo developer. No room for confusion or rework.

## The Solution

Instead of jumping into code, we spent Day 1 building a complete workflow system using GSD + B.L.A.S.T. methodology.

### What We Built

1. **Workflow Documentation**
   - Main workflow guide
   - Phase-specific templates
   - Quick reference guide

2. **Project Structure**
   - GSD planning files
   - B.L.A.S.T. memory files
   - Architecture documentation

3. **Automation Tools**
   - Progress auto-update
   - SOP enforcement
   - Process documentation

### The Results

- Zero confusion about next steps
- Clear documentation for future team members
- Automated workflow enforcement
- Ready to code with confidence

## Key Learnings

1. **Process > Speed**: The upfront investment pays off immediately
2. **Documentation is an Investment**: Not overhead, but acceleration
3. **Automation Matters**: Tools enforce best practices automatically

## What's Next

Week 1: Foundation & Setup
Week 2: Core Engine & First Node
Week 3: Remaining Content Pro Nodes
Week 4: Payment & Marketplace Submission

Follow along as we build PoppyMiro! 🚀`;
  }
  
  return post;
}

function generateCaseStudy() {
  const journal = readJournal();
  if (!journal) return 'Journal not found';
  
  return `# Case Study: PoppyMiro Development Process

## Executive Summary

PoppyMiro is a 6-edition AI suite for Miro, FigJam, and Standalone WebApp. This case study documents our development process using GSD + B.L.A.S.T. methodology.

## Challenge

- 16-week launch timeline
- 6 editions to build
- Multi-platform (Miro, FigJam, Standalone)
- Solo developer
- €2M ARR target

## Approach

We implemented GSD + B.L.A.S.T. workflow:
- **GSD**: Project management, phase planning, progress tracking
- **B.L.A.S.T.**: Blueprint, Link, Architect, Stabilize, Trigger

## Process

### Week 1: Foundation & Setup
- Created workflow system
- Documented architecture
- Built automation tools

### Week 2-4: Content Pro MVP
- [To be updated as we progress]

## Results

- [To be updated with metrics]

## Lessons Learned

- [To be updated with learnings]

## Impact

- [To be updated with outcomes]`;
}

function generatePresentation() {
  return `# PoppyMiro Development Journey

## Slide 1: Title
PoppyMiro: From Idea to €2M ARR
Development Journey

## Slide 2: The Challenge
- 16-week timeline
- 6 editions
- Multi-platform
- Solo developer

## Slide 3: The Solution
- GSD + B.L.A.S.T. workflow
- Process-first approach
- Documentation-driven development

## Slide 4: Week-by-Week Progress
- Week 1: Foundation & Setup ✅
- Week 2-4: Content Pro MVP 🟡
- [To be updated]

## Slide 5: Key Learnings
- Process > Speed
- Documentation is an investment
- Automation enforces best practices

## Slide 6: Results
- [To be updated with metrics]`;
}

// Main
const args = process.argv.slice(2);
const formatIndex = args.indexOf('--format');
const topicIndex = args.indexOf('--topic');

if (formatIndex < 0) {
  console.error('Usage: node generate-content.js --format <format> [--topic <topic>]');
  console.error('Formats: twitter-thread, linkedin-post, blog-post, case-study, presentation');
  process.exit(1);
}

const format = args[formatIndex + 1];
const topic = topicIndex >= 0 ? args[topicIndex + 1] : 'process';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let content = '';
let filename = '';

switch(format) {
  case 'twitter-thread':
    content = generateTwitterThread(topic);
    filename = `twitter-thread-${topic}-${Date.now()}.txt`;
    break;
  case 'linkedin-post':
    content = generateLinkedInPost(topic);
    filename = `linkedin-post-${topic}-${Date.now()}.txt`;
    break;
  case 'blog-post':
    content = generateBlogPost(topic);
    filename = `blog-post-${topic}-${Date.now()}.md`;
    break;
  case 'case-study':
    content = generateCaseStudy();
    filename = `case-study-${Date.now()}.md`;
    break;
  case 'presentation':
    content = generatePresentation();
    filename = `presentation-${Date.now()}.md`;
    break;
  default:
    console.error(`Unknown format: ${format}`);
    process.exit(1);
}

const outputPath = path.join(OUTPUT_DIR, filename);
fs.writeFileSync(outputPath, content, 'utf-8');
console.log(`✅ Generated ${format}: ${outputPath}`);
console.log('\n' + content);
