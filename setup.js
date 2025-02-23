const fs = require('fs');

// Render uses `/data` for persistent storage
const dataDir = process.env.RENDER ? '/data' : './data';
const dbFile = `${dataDir}/quizData.db`;

// Ensure the /data directory exists (only if running locally)
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`✅ Created ${dataDir} directory successfully.`);
} else {
    console.log(`⚡ ${dataDir} directory already exists.`);
}

// Ensure the database file exists
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, ''); // Creates an empty SQLite DB file
    console.log("✅ Created quizData.db file.");
} else {
    console.log("⚡ quizData.db already exists.");
}
