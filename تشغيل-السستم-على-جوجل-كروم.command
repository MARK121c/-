#!/bin/bash

# ========================================================
# MARK PERSONAL OS — GOOGLE CHROME LAUNCHER (macOS)
# ========================================================

# Navigate to script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# If in root workspace, cd into Personal-OS-Export if present
if [ -d "Personal-OS-Export" ]; then
  cd "Personal-OS-Export"
fi

# Load Node environment
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$HOME/.bun/bin:$PATH"

echo "=========================================="
echo "  🚀 تشغيل نظام مارك الذكي (MARK OS)...  "
echo "=========================================="

# Check if node is available
if ! command -v node &> /dev/null; then
  echo "⚠️ تنبيه: لم يتم العثور على Node.js في المسار المباشر."
  echo "جاري محاولة البحث في المسارات البديلة..."
  for node_path in /opt/homebrew/bin/node /usr/local/bin/node $HOME/.nvm/versions/node/*/bin/node; do
    if [ -x "$node_path" ]; then
      export PATH="$(dirname "$node_path"):$PATH"
      break
    fi
  done
fi

# Open Google Chrome or Default Browser
PORT=2000
URL="http://localhost:$PORT"

echo "🌐 جاري فتح السستم على جوجل كروم: $URL"
(sleep 2 && open -a "Google Chrome" "$URL" 2>/dev/null || open "$URL") &

# Start the Next.js server (or fallback to node server.js)
if [ -f "package.json" ]; then
  echo "⚡ بدء تشغيل خادم Next.js..."
  npm run dev
elif [ -f "server.js" ]; then
  echo "⚡ بدء تشغيل خادم Node.js..."
  node server.js
else
  echo "❌ لم يتم العثور على ملفات الخادم."
fi
