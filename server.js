const fs = require('fs');
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Ensure /data directory exists for Render
const dataDir = process.env.RENDER ? '/data' : path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`✅ Created ${dataDir} directory.`);
} else {
    console.log(`⚡ Using existing directory: ${dataDir}`);
}

const dbPath = path.join(dataDir, 'quizData.db');
let db;

// Initialize the database
const initializeDbToServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        console.log("✅ Database connection established.");

        await db.exec(`
            CREATE TABLE IF NOT EXISTS user (
                user_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                date DATETIME DEFAULT (datetime('now', 'localtime'))
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS scoreBoard (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                category TEXT,
                level TEXT,
                total_score INTEGER,
                date_time DATETIME,
                question_set TEXT,
                FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS quizQuestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT,
                difficulty TEXT,
                question TEXT,
                options TEXT,
                answer TEXT
            );
        `);

        console.log("✅ Tables verified/created.");

        // Start server only after DB is initialized
        app.listen(3000, '0.0.0.0', () => console.log("🚀 Server running on port 3000"));
    } catch (e) {
        console.error(`❌ DB Error: ${e.message}`);
        process.exit(1);
    }
};

initializeDbToServer();

// Middleware to ensure DB is ready before handling requests
app.use((req, res, next) => {
    if (!db) {
        return res.status(503).json({ error: "Database not initialized yet. Please try again later." });
    }
    next();
});

// Get quiz data
app.get('/quiz/data', async (request, response) => {
    const { category, difficulty } = request.query;
    try {
        const getQuizDataQuery = `
            SELECT * FROM quizQuestions WHERE category=? AND difficulty=?;
        `;
        const getQuizData = await db.all(getQuizDataQuery, [category, difficulty]);

        const formattedQuizData = getQuizData.map(question => ({
            ...question,
            options: JSON.parse(question.options)
        }));

        response.json(formattedQuizData);
    } catch (error) {
        response.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add quiz question
app.post('/quiz/add', async (request, response) => {
    const { quizQuestions } = request.body;
    try {
        for (let question of quizQuestions) {
            const addNewQuestionQuery = `
                INSERT INTO quizQuestions (category, difficulty, question, options, answer)
                VALUES (?, ?, ?, ?, ?);
            `;
            await db.run(addNewQuestionQuery, [
                question.category, question.difficulty, question.question, JSON.stringify(question.options), question.answer
            ]);
        }
        response.json('Question Added Successfully');
    } catch (error) {
        console.error(`Error adding question: ${error.message}`);
        response.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add scoreboard entry
app.post('/quiz/scoreboard', async (request, response) => {
    const { user_id, category, level, total_score, date_time, question_set } = request.body;
    try {
        const addScoreBoardQuery = `
            INSERT INTO scoreBoard (user_id, category, level, total_score, date_time, question_set)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        await db.run(addScoreBoardQuery, [
            user_id, category, level, total_score, date_time, JSON.stringify(question_set)
        ]);
        response.send('Scoreboard Successfully Added');
    } catch (error) {
        response.status(500).json({ error: `Error adding scoreboard: ${error.message}` });
        console.error(`Error adding scoreboard: ${error.message}`);
    }
});

// Get scoreboard
app.get('/quiz/scoreboard', async (req, res) => {
    try {
        const getScoreBoardQuery = `SELECT * FROM scoreBoard;`;
        const getScoreBoard = await db.all(getScoreBoardQuery);

        const formattedData = getScoreBoard.map(item => ({
            ...item,
            question_set: item.question_set ? JSON.parse(item.question_set) : []
        }));

        res.json(formattedData);
    } catch (error) {
        console.error(`Error fetching scoreboard: ${error.message}`);
        res.status(500).json({ error_msg: `Error fetching scoreboard: ${error.message}` });
    }
});

// Delete scoreboard entry
app.delete('/quiz/scoreboard', async (request, response) => {
    const { id } = request.query;
    try {
        const deleteScoreBoardQuery = `DELETE FROM scoreBoard WHERE id=?;`;
        await db.run(deleteScoreBoardQuery, [id]);
        response.send('Successfully Deleted');
    } catch (error) {
        response.status(500).json({ error_msg: `Error deleting scoreboard entry: ${error.message}` });
        console.error(`Error deleting scoreboard entry: ${error.message}`);
    }
});

module.exports = app;



// const fs = require('fs');
// const path = require('path');
// const express = require('express');
// const sqlite3 = require('sqlite3');
// const { open } = require('sqlite');
// const cors = require('cors');

// const app = express();
// app.use(express.json());
// app.use(cors());

// // Render uses `/data/`, local uses `./data/`
// const dataDir = process.env.RENDER ? '/data' : path.join(__dirname, 'data');
// const dbPath = path.join(dataDir, 'quizData.db');

// // ✅ FIX: Ensure the database file exists before connecting
// if (!fs.existsSync(dbPath)) {
//     console.log("⚠️ Database file missing. Creating a new one...");
//     fs.writeFileSync(dbPath, ''); // Creates an empty SQLite file
// } else {
//     console.log("✅ Database file found.");
// }

// let db;

// const initializeDbToServer = async () => {
//     try {
//         db = await open({
//             filename: dbPath,
//             driver: sqlite3.Database
//         });

//         await db.exec(`
//             CREATE TABLE IF NOT EXISTS user (
//                 user_id TEXT PRIMARY KEY,
//                 name TEXT NOT NULL,
//                 username TEXT NOT NULL UNIQUE,
//                 password TEXT NOT NULL,
//                 date DATETIME DEFAULT (datetime('now', 'localtime'))
//             );
//         `);

//         await db.exec(`
//             CREATE TABLE IF NOT EXISTS scoreBoard (
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 user_id TEXT NOT NULL,
//                 category TEXT,
//                 level TEXT,
//                 total_score INTEGER,
//                 date_time DATETIME,
//                 question_set TEXT,
//                 FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE
//             );
//         `);

//         app.listen(3000, '0.0.0.0', () => console.log("🚀 Server running on port 3000"));
//     } catch (e) {
//         console.error(`❌ DB Error: ${e.message}`);
//         process.exit(1);
//     }
// };

// initializeDbToServer();

// app.get('/quiz/data', async (request, response) => {
//     const {category, difficulty} = request.query
//     try {
//         const getQuizDataQuery = `SELECT * FROM quizQuestions
//             WHERE category='${category}' AND difficulty = '${difficulty}';`;
//         const getQuizData = await db.all(getQuizDataQuery);
//         const formattedQuizData = getQuizData.map(question => ({
//             ...question,
//             options: JSON.parse(question.options)
//         }));

//         response.json(formattedQuizData);
        
//     } catch (error) {
//         response.status(400).json({ error: 'Internal Server Error' });
//     }
// });

// app.post('/quiz/add', async (request, response) => {
//     const { quizQuestions } = request.body;
//     // console.log(quizQuestions);
//     try {
//         for (let question of quizQuestions) {
//             const addNewQuestionQuery = `
//             INSERT INTO quizQuestions (id, category, difficulty, question, options, answer)
//             VALUES (${question.id}, "${question.category}", "${question.difficulty}", "${question.question}", '${JSON.stringify(question.options)}', "${question.answer}");`;
//             const addNewQuestion = await db.run(addNewQuestionQuery);
//         }
//         response.json('Question Added Successfully');
//     } catch (error) {
//         console.error(`Error adding question: ${error.message}`);
//         response.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// app.post('/quiz/scoreboard', async (request, response) => {
//     const { category, level, totalScore, dateTime, questionSet } = request.body;
//     console.log({category, level, totalScore, dateTime})
//     try {
//         const addScoreBoardQuery = `
//             INSERT INTO scoreBoard (category, level, totalScore, dateTime, questionSet)
//             VALUES ("${category}", "${level}", ${totalScore}, "${dateTime}", '${JSON.stringify(questionSet)}');`;
//         await db.run(addScoreBoardQuery);
//         response.send('Scoreboard Successfully Added');
//     } catch (error) {
//         response.status(500).json({ error: `Error adding scoreboard: ${error.message}` });
//         console.error(`Error adding scoreboard: ${error.message}`);
//     }
// });

// app.get('/quiz/scoreboard', async (req, res) => {
//     try {
//         const getScoreBoardQuery = `SELECT * FROM scoreBoard`;
//         const getScoreBoard = await db.all(getScoreBoardQuery);

//         const formattedData = getScoreBoard.map(item => ({
//             ...item,
//             questionSet: item.questionSet ? JSON.parse(item.questionSet) : []
//         }));

//         res.json(formattedData);
//     } catch (error) {
//         console.error(`Error fetching scoreboard: ${error.message}`);
//         res.status(500).json({ error_msg: `Error fetching scoreboard: ${error.message}` });
//     }
// });


// app.delete('/quiz/scoreboard', async (request, response) => {
//     const {id} = request.query
//     try {
//         const deleteScoreBoardQuery = `DELETE FROM scoreBoard WHERE id='${id}'`
//         await db.run(deleteScoreBoardQuery)
//         response.send('Successfully Delete')
//     } catch (error) {
//         response.send({error_msg: `Error adding question: ${error.message}`})
//         console.error({error_msg: `Error adding question: ${error.message}`});
//     }
// });

// module.exports = app;
