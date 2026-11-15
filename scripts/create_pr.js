const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const prNumber = process.argv[2];
const headBranch = process.argv[3];
const baseBranch = process.argv[4] || 'develop';

if (!prNumber || !headBranch) {
  console.error('Usage: node scripts/create_pr.js <PR_NUMBER_PADDED> <HEAD_BRANCH> [BASE_BRANCH]');
  process.exit(1);
}

const prFile = path.resolve(__dirname, `../docs/pull_requests/PR-${prNumber}.md`);
if (!fs.existsSync(prFile)) {
  console.error(`PR document not found: ${prFile}`);
  process.exit(1);
}

const content = fs.readFileSync(prFile, 'utf8');
const lines = content.split('\n');
const titleLine = lines.find(l => l.startsWith('## PR-'));
const title = titleLine ? titleLine.replace(/^##\s*/, '') : `PR-${prNumber}: Update`;

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }
  try {
    const creds = execSync('printf "protocol=https\\nhost=github.com\\n\\n" | git credential fill', {
      encoding: 'utf8'
    });
    const match = creds.match(/password=(.+)/);
    return match ? match[1].trim() : null;
  } catch (err) {
    return null;
  }
}

const token = getGitHubToken();
if (!token) {
  console.error('Could not obtain GitHub credentials.');
  process.exit(1);
}

const payload = JSON.stringify({
  title,
  head: headBranch,
  base: baseBranch,
  body: content
});

const req = https.request({
  hostname: 'api.github.com',
  path: '/repos/SadeeshaJayaweera/Receipt_App/pulls',
  method: 'POST',
  headers: {
    'User-Agent': 'Receipt-App-Agent',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (res.statusCode === 201) {
        console.log(`✅ Created PR #${parsed.number}: ${parsed.html_url}`);
      } else {
        console.error(`❌ Failed (${res.statusCode}):`, parsed.message, parsed.errors || '');
      }
    } catch (e) {
      console.error('Error parsing response:', data);
    }
  });
});

req.on('error', err => {
  console.error('Request error:', err);
});

req.write(payload);
req.end();
