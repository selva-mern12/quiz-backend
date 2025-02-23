const fs = require('fs');

const dataDir = '/data';
const dbFile = `${dataDir}/quizData.db`;

// Ensure the /data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("✅ Created /data directory successfully.");
} else {
    console.log("⚡ /data directory already exists.");
}

// Ensure the database file exists
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, ''); // Creates an empty SQLite DB file
    console.log("✅ Created quizData.db file.");
} else {
    console.log("⚡ quizData.db already exists.");
}
