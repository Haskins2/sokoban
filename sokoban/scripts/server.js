const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const LEVELS_DIR = path.join(__dirname, '../assets/levels');
const INDEX_FILE = path.join(LEVELS_DIR, 'index.ts');

// Ensure directory exists
if (!fs.existsSync(LEVELS_DIR)) {
  fs.mkdirSync(LEVELS_DIR, { recursive: true });
}

app.post('/save-level', (req, res) => {
  const { levelNumber, levelData, overwrite } = req.body;

  if (!levelNumber || !levelData) {
    return res.status(400).json({ error: 'Missing levelNumber or levelData' });
  }

  const fileName = `level_${levelNumber}.json`;
  const filePath = path.join(LEVELS_DIR, fileName);

  // Check if file exists
  if (fs.existsSync(filePath) && !overwrite) {
    return res.status(409).json({ error: 'EXISTS', message: 'Level already exists' });
  }

  try {
    // Write level file
    fs.writeFileSync(filePath, JSON.stringify(levelData, null, 2));
    console.log(`Saved ${fileName}`);

    // Update index.ts
    updateIndex(levelNumber);

    return res.json({ success: true, message: 'Level saved successfully' });
  } catch (error) {
    console.error('Error saving level:', error);
    return res.status(500).json({ error: 'FAILED', message: error.message });
  }
});

function updateIndex(levelNum) {
  if (!fs.existsSync(INDEX_FILE)) {
    // Create initial index file if it doesn't exist
    const initialContent = `import { LevelConfig } from '@/components/game/types';\n\nexport const LEVELS: LevelConfig[] = [];\n`;
    fs.writeFileSync(INDEX_FILE, initialContent);
  }

  let indexContent = fs.readFileSync(INDEX_FILE, 'utf8');
  const importLine = `import level${levelNum} from './level_${levelNum}.json';`;

  // Check if import already exists
  if (indexContent.includes(importLine)) {
    return;
  }

  const lines = indexContent.split('\n');
  
  // 1. Add Import
  // Find the last import line
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIdx = i;
    }
  }
  
  // Insert after last import, or at the top if no imports
  if (lastImportIdx !== -1) {
    lines.splice(lastImportIdx + 1, 0, importLine);
  } else {
    lines.unshift(importLine);
  }

  // 2. Add to Array
  // Find the array definition
  const arrayStartIdx = lines.findIndex(line => line.includes('export const LEVELS: LevelConfig[] = ['));
  const arrayEndIdx = lines.findIndex((line, idx) => idx > arrayStartIdx && line.trim().startsWith('];'));

  if (arrayStartIdx !== -1 && arrayEndIdx !== -1) {
    // Check if it's already in the array (simple check)
    const arrayContent = lines.slice(arrayStartIdx, arrayEndIdx).join('\n');
    if (!arrayContent.includes(`level${levelNum} as LevelConfig`)) {
      // Insert before the closing bracket
      lines.splice(arrayEndIdx, 0, `  level${levelNum} as LevelConfig,`);
    }
  }

  fs.writeFileSync(INDEX_FILE, lines.join('\n'));
  console.log('Updated index.ts');
}

app.listen(PORT, () => {
  console.log(`Level Saver Server running at http://localhost:${PORT}`);
});
