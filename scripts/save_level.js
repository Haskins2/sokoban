const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Get clipboard content
let clipboardContent;
try {
    clipboardContent = execSync('pbpaste').toString();
} catch (e) {
    console.error('Error reading clipboard. Are you on macOS?');
    process.exit(1);
}

// Validate JSON
let levelData;
try {
    levelData = JSON.parse(clipboardContent);
    if (!levelData.width || !levelData.height || !levelData.walls) {
        throw new Error('Invalid level format');
    }
} catch (e) {
    console.error('Clipboard does not contain valid level JSON.');
    console.error('Please go to the Level Editor and click "Save Level" first.');
    process.exit(1);
}

rl.question('Enter level number to save as: ', (levelNum) => {
    if (!levelNum) {
        console.error('Level number is required.');
        process.exit(1);
    }

    const fileName = `level_${levelNum}.json`;
    const filePath = path.join(__dirname, '../assets/levels', fileName);

    if (fs.existsSync(filePath)) {
        rl.question(`Warning: ${fileName} already exists. Overwrite? (y/N) `, (answer) => {
            if (answer.toLowerCase() !== 'y') {
                console.log('Aborted.');
                process.exit(0);
            }
            saveFile(filePath, clipboardContent, levelNum);
        });
    } else {
        saveFile(filePath, clipboardContent, levelNum);
    }
});

function saveFile(filePath, content, levelNum) {
    fs.writeFileSync(filePath, content);
    console.log(`Saved ${filePath}`);
    updateIndex(levelNum);
    rl.close();
}

function updateIndex(levelNum) {
    const indexPath = path.join(__dirname, '../assets/levels/index.ts');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    const importLine = `import level${levelNum} from './level_${levelNum}.json';`;
    
    if (indexContent.includes(importLine)) {
        console.log('index.ts already up to date.');
        return;
    }

    // Add import
    const lines = indexContent.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
            lastImportIdx = i;
        }
    }
    
    // Insert import after the last import
    lines.splice(lastImportIdx + 1, 0, importLine);
    
    // Add to array
    const arrayEndIdx = lines.findIndex(line => line.trim() === '];');
    if (arrayEndIdx !== -1) {
        lines.splice(arrayEndIdx, 0, `  level${levelNum} as LevelConfig,`);
    }

    fs.writeFileSync(indexPath, lines.join('\n'));
    console.log('Updated assets/levels/index.ts');
}
