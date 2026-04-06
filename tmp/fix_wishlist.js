const fs = require('fs');
const filePath = 'src/frontend/components/DashboardClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix Wishlist - replace the span-only header with span+trash button combo
const lines = content.split('\n');
let newLines = [];
let i = 0;
while (i < lines.length) {
  // Detect the wishlist card div
  if (lines[i].includes("grand-card p-10 flex flex-col justify-between group ${w.isPurchased")) {
    // Replace with relative overflow-hidden added
    newLines.push(lines[i].replace(
      "group ${w.isPurchased",
      "group relative overflow-hidden ${w.isPurchased"
    ));
    i++;
    continue;
  }
  // Detect the closing </span> for the priority badge in wishlist context
  // We look for the pattern: a span with priority check, then closing </span> followed by </div>
  if (
    lines[i].includes("ترفيه غير ملزِم") &&
    lines[i+1] && lines[i+1].trim() === "</span>" &&
    lines[i+2] && lines[i+2].trim() === "</div>"
  ) {
    newLines.push(lines[i]); // keep priority text line
    newLines.push(lines[i+1]); // keep </span>
    // Insert trash button before </div>
    const indent = lines[i+2].match(/^\s*/)[0];
    newLines.push(`${indent}   <button onClick={() => remove('wishlist', w.id)} className="p-2 text-gray-600 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100" title="حذف الأمنية"><Trash2 size={24}/></button>`);
    newLines.push(`${indent}</div>`);
    i += 3;
    continue;
  }
  newLines.push(lines[i]);
  i++;
}

content = newLines.join('\n');
fs.writeFileSync(filePath, content);
console.log('Wishlist fix done');
