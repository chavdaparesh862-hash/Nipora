const fs = require('fs');
const path = require('path');

function normalizeDir(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const lowerItem = item.toLowerCase();
    
    if (lowerItem === 'components' && item !== 'components') {
      const newPath = path.join(dir, 'components');
      console.log(`[Normalize] Renaming ${fullPath} -> ${newPath}`);
      fs.renameSync(fullPath, newPath);
      normalizeDir(newPath);
    } else if (lowerItem === 'main.tsx' && item !== 'main.tsx') {
      const newPath = path.join(dir, 'main.tsx');
      console.log(`[Normalize] Renaming ${fullPath} -> ${newPath}`);
      fs.renameSync(fullPath, newPath);
    } else {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        normalizeDir(fullPath);
      }
    }
  }
}

// Normalize 'src' folder casing at the root
const rootItems = fs.readdirSync(__dirname);
for (const item of rootItems) {
  if (item.toLowerCase() === 'src' && item !== 'src') {
    const oldPath = path.join(__dirname, item);
    const newPath = path.join(__dirname, 'src');
    console.log(`[Normalize] Renaming root folder ${oldPath} -> ${newPath}`);
    fs.renameSync(oldPath, newPath);
  }
}

const finalSrcPath = path.join(__dirname, 'src');
if (fs.existsSync(finalSrcPath)) {
  normalizeDir(finalSrcPath);
}

console.log('[Normalize] Folder and file casing normalization complete!');
