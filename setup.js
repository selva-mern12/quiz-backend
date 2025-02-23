const fs = require('fs');
const path = require('path');

const dataDir = process.env.RENDER ? '/data' : './data';
const dbFile = path.join(dataDir, 'quizData.db');

// Only check database file (Do NOT create /data manually)
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, ''); // Creates an empty SQLite DB file
    console.log("✅ Created quizData.db file.");
} else {
    console.log("⚡ quizData.db already exists.");
}
