const fs = require('fs');

const dataDir = process.env.RENDER ? '/data' : './data';
const dbFile = `${dataDir}/quizData.db`;

// Ensure the database file exists
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, ''); // Creates an empty SQLite DB file
    console.log("✅ Created quizData.db file.");
} else {
    console.log("⚡ quizData.db already exists.");
}
