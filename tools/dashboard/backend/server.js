import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { readModeAssessment, readJournalEntries, readHealthStatus, runAudit, readRoadmap, getRecentCommits } from './lib/file-reader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (IS_PROD) {
  const distPath = join(__dirname, '..', 'frontend', 'dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
  }
}

// API Routes

/**
 * GET /api/status
 * Returns project metadata including current mode
 */
app.get('/api/status', async (req, res) => {
  try {
    const modeData = await readModeAssessment();
    res.json({
      success: true,
      data: {
        projectName: modeData.projectName,
        currentMode: modeData.currentMode,
        lastUpdate: modeData.lastUpdate,
        assessment: modeData.assessment,
        reason: modeData.reason
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/journal
 * Returns the last N journal entries
 */
app.get('/api/journal', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const entries = await readJournalEntries(limit);
    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/health
 * Returns project health status
 */
app.get('/api/health', async (req, res) => {
  try {
    const health = await readHealthStatus();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/commits
 * Returns recent git commits
 */
app.get('/api/commits', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const commits = await getRecentCommits(limit);
    res.json({
      success: true,
      data: commits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/roadmap
 * Returns phase tracking data from ROADMAP.md
 */
app.get('/api/roadmap', async (req, res) => {
  try {
    const roadmap = await readRoadmap();
    res.json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/audit
 * Runs WHEEE audit and returns results
 */
app.get('/api/audit', async (req, res) => {
  try {
    const audit = await runAudit();
    res.json({
      success: true,
      data: audit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/dashboard
 * Returns all dashboard data in one request
 */
app.get('/api/dashboard', async (req, res) => {
  try {
    const [status, journal, health, audit, roadmap, commits] = await Promise.all([
      readModeAssessment(),
      readJournalEntries(5),
      readHealthStatus(),
      runAudit(),
      readRoadmap(),
      getRecentCommits(10)
    ]);

    res.json({
      success: true,
      data: {
        status,
        journal,
        health,
        audit,
        roadmap,
        commits
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// SPA fallback in production
if (IS_PROD) {
  const distPath = join(__dirname, '..', 'frontend', 'dist');
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🎢 WHEEE Dashboard running on http://localhost:${PORT}`);
  console.log(`   Mode: ${IS_PROD ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  if (!IS_PROD) {
    console.log('   API endpoints:');
    console.log('     GET /api/status, /api/journal, /api/health, /api/dashboard');
  }
});
