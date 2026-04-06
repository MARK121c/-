const { execSync } = require('child_process');

// Try known git paths
const gitPaths = [
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files\\Git\\bin\\git.exe',
  'C:\\Program Files (x86)\\Git\\bin\\git.exe',
  'C:\\Users\\KING1\\AppData\\Local\\Programs\\Git\\bin\\git.exe',
];

let gitExe = null;
const fs = require('fs');
for (const p of gitPaths) {
  if (fs.existsSync(p)) {
    gitExe = p;
    break;
  }
}

if (!gitExe) {
  console.log('Git not found. Trying PATH...');
  gitExe = 'git';
}

console.log('Using:', gitExe);

const cwd = 'E:\\DOWNLOADS\\اشياء شخصية\\موقع الادارة المالية والاهتمام بالنفس';

try {
  execSync(`"${gitExe}" add .`, { cwd, stdio: 'inherit' });
  execSync(`"${gitExe}" commit -m "feat: Add delete buttons for all financial records"`, { cwd, stdio: 'inherit' });
  execSync(`"${gitExe}" push origin main`, { cwd, stdio: 'inherit' });
  console.log('Push successful!');
} catch (e) {
  console.error('Error:', e.message);
}
