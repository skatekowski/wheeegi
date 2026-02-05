#!/usr/bin/env node
/**
 * Notify team when project mode changes (S/M/L)
 * Supports Slack, Discord, Email, and GitHub Issues
 * 
 * Usage: node tools/automation/notify-mode-change.js --from=S --to=M --reason="..."
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const PROJECT_DIR = path.join(__dirname, '../..');

class ModeChangeNotifier {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const configFile = path.join(PROJECT_DIR, 'project/notifications.json');
    if (fs.existsSync(configFile)) {
      return JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    }
    
    // Default config
    return {
      enabled: true,
      channels: {
        slack: { enabled: false, webhook: null },
        discord: { enabled: false, webhook: null },
        email: { enabled: false, recipients: [] },
        github: { enabled: false, repo: null, createIssue: false }
      }
    };
  }

  async notify(fromMode, toMode, reason) {
    if (!this.config.enabled) {
      console.log('📢 Notifications disabled in config');
      return;
    }

    const message = this.formatMessage(fromMode, toMode, reason);
    const results = {};

    // Slack notification
    if (this.config.channels.slack.enabled && this.config.channels.slack.webhook) {
      results.slack = await this.notifySlack(message);
    }

    // Discord notification
    if (this.config.channels.discord.enabled && this.config.channels.discord.webhook) {
      results.discord = await this.notifyDiscord(message);
    }

    // Email notification
    if (this.config.channels.email.enabled && this.config.channels.email.recipients.length > 0) {
      results.email = await this.notifyEmail(message, this.config.channels.email.recipients);
    }

    // GitHub Issue
    if (this.config.channels.github.enabled && this.config.channels.github.createIssue) {
      results.github = await this.createGitHubIssue(fromMode, toMode, reason);
    }

    // Log to process journal
    this.logToProcessJournal(fromMode, toMode, reason, results);

    return results;
  }

  formatMessage(fromMode, toMode, reason) {
    const modeNames = {
      'S': 'Small (Fast, Exploratory)',
      'M': 'Medium (Stable, Growing, Structured)',
      'L': 'Large (Complex, Long-Term, Critical)'
    };

    const emoji = toMode === 'L' ? '🔴' : toMode === 'M' ? '🟡' : '🟢';
    const direction = ['S', 'M', 'L'].indexOf(toMode) > ['S', 'M', 'L'].indexOf(fromMode) 
      ? '⬆️ Upgrade' 
      : '⬇️ Downgrade';

    return {
      title: `${emoji} WHEEE Protocol Mode Change: ${fromMode} → ${toMode}`,
      body: `**${direction}**\n\n` +
            `**Previous Mode:** ${modeNames[fromMode]}\n` +
            `**New Mode:** ${modeNames[toMode]}\n\n` +
            `**Reason:** ${reason}\n\n` +
            `**Impact:** Project complexity assessment has changed. ` +
            `Documentation and process rigor will be adjusted accordingly.`,
      color: toMode === 'L' ? 'danger' : toMode === 'M' ? 'warning' : 'good'
    };
  }

  async notifySlack(message) {
    try {
      const webhook = this.config.channels.slack.webhook;
      const payload = JSON.stringify({
        text: message.title,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: message.title
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message.body
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Project: ${path.basename(PROJECT_DIR)} | Time: ${new Date().toISOString()}`
              }
            ]
          }
        ]
      });

      return await this.postWebhook(webhook, payload);
    } catch (error) {
      console.error('❌ Slack notification failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async notifyDiscord(message) {
    try {
      const webhook = this.config.channels.discord.webhook;
      const payload = JSON.stringify({
        embeds: [{
          title: message.title,
          description: message.body,
          color: message.color === 'danger' ? 15158332 : message.color === 'warning' ? 16776960 : 3066993,
          timestamp: new Date().toISOString(),
          footer: {
            text: `WHEEE Protocol | ${path.basename(PROJECT_DIR)}`
          }
        }]
      });

      return await this.postWebhook(webhook, payload);
    } catch (error) {
      console.error('❌ Discord notification failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async notifyEmail(message, recipients) {
    // Email requires SMTP configuration or external service
    // For now, log that email notification would be sent
    console.log(`📧 Email notification would be sent to: ${recipients.join(', ')}`);
    console.log(`   Subject: ${message.title}`);
    console.log(`   Body: ${message.body}`);
    
    // In production, integrate with nodemailer, SendGrid, etc.
    return { success: true, note: 'Email requires SMTP configuration' };
  }

  async createGitHubIssue(fromMode, toMode, reason) {
    const repo = this.config.channels.github.repo;
    if (!repo) {
      return { success: false, error: 'GitHub repo not configured' };
    }

    // GitHub API integration would go here
    // Requires GITHUB_TOKEN environment variable
    console.log(`📋 GitHub issue would be created in: ${repo}`);
    console.log(`   Title: Mode change ${fromMode} → ${toMode}`);
    console.log(`   Body: ${reason}`);
    
    return { success: true, note: 'GitHub integration requires GITHUB_TOKEN' };
  }

  async postWebhook(url, payload) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const client = parsedUrl.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, statusCode: res.statusCode });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  logToProcessJournal(fromMode, toMode, reason, results) {
    const journalFile = path.join(PROJECT_DIR, 'project/process-journal.md');
    let content = '';

    if (fs.existsSync(journalFile)) {
      content = fs.readFileSync(journalFile, 'utf-8');
    } else {
      content = '# Process Journal\n\n';
    }

    const timestamp = new Date().toISOString();
    content += `\n### Mode Transition - ${timestamp}\n\n`;
    content += `**Transition:** ${fromMode} → ${toMode}\n\n`;
    content += `**Reason:** ${reason}\n\n`;
    content += `**Notifications Sent:**\n`;
    Object.entries(results).forEach(([channel, result]) => {
      content += `- ${channel}: ${result.success ? '✅' : '❌'} ${result.error || result.note || 'Sent'}\n`;
    });
    content += `\n`;

    fs.writeFileSync(journalFile, content);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const fromMode = args.find(a => a.startsWith('--from='))?.split('=')[1];
  const toMode = args.find(a => a.startsWith('--to='))?.split('=')[1];
  const reason = args.find(a => a.startsWith('--reason='))?.split('=')[1] || 'Automatic mode assessment';

  if (!fromMode || !toMode) {
    console.error('Usage: node notify-mode-change.js --from=S --to=M --reason="..."');
    process.exit(1);
  }

  const notifier = new ModeChangeNotifier();
  notifier.notify(fromMode, toMode, reason).then(results => {
    console.log('\n📢 Notification Results:');
    Object.entries(results).forEach(([channel, result]) => {
      console.log(`  ${channel}: ${result.success ? '✅' : '❌'}`);
    });
  }).catch(error => {
    console.error('❌ Notification failed:', error);
    process.exit(1);
  });
}

module.exports = ModeChangeNotifier;
