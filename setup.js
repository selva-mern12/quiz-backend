const fs = require('fs');
const path = require('path');

// Define the database directory path
const dataDir = path.join(__dirname, 'data');

// Check if the directory exists, if not, create it
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("✅ Created /data directory successfully.");
} else {
    console.log("⚡ /data directory already exists.");
}
