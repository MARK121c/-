const fs = require('fs');
const TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'MARK121c';
const REPO = '-';
const BRANCH = 'main';
const BASE = 'e:/DOWNLOADS/اشياء شخصية/موقع الادارة المالية والاهتمام بالنفس';

async function updateFile(filePath, msg) {
  const content = fs.readFileSync(require('path').join(BASE, filePath), 'utf8');
  const b64 = Buffer.from(content).toString('base64');
  const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`, {
    headers: { 'Authorization': `token ${TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  const sha = getRes.ok ? (await getRes.json()).sha : undefined;
  const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg, content: b64, sha, branch: BRANCH })
  });
  console.log(putRes.ok ? `✓ ${filePath}` : `✗ ${filePath}: ${(await putRes.json()).message}`);
}

async function main() {
  await updateFile('src/backend/db/schema.ts', 'Fix: Remove Arabic defaults to fix Drizzle ORM queries');
  console.log('Done push schema!');
}
main().catch(console.error);
