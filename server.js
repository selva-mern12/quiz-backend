const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');
const {v4 : uuidv4} = require('uuid')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());
app.use(cors())

const secret_key = 'SELVA_QUIZ'

const dbPath = path.join(__dirname, 'quizData.db');  
let db;

const initializeDbToServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        app.listen(3000, '0.0.0.0', () => console.log("Server running on port 3000"));
    } catch (e) {
        console.error(`DB Error: ${e.message}`);
        process.exit(1);
    }
};

initializeDbToServer();

const Authorization = (request, response, next) => {
    const authHeader = request.headers.authorization
    if (!authHeader) {
        return response.status(401).json({ error_msg: "Token not provided" });
    }

    const tokenParts = authHeader.split(" ");
    const jwtToken = tokenParts[1]

    if (!jwtToken){
        return response.status(401).json({ error_msg: "Token not Valid" });
    }
    
    else {
        jwt.verify(jwtToken, secret_key, function (err, payload) {
            if (err) {
                return response.status(401).json({ "error_msg": "Invalid Token" });
            }            
            else{
                request.username = payload.username
                next()
            }
        })
    }
}

app.post('/quiz/register', async (request, response) => {
    const {userDetails} = request.body
    const {name, username, password} = userDetails
    const hashedPassword = await bcrypt.hash(password, 5)
    try {
        const checkUsernameQuery = `SELECT username FROM user WHERE username = ? ;`;
        const checkUsername = await db.get(checkUsernameQuery,[username]);

        if (!checkUsername){
        const addNewUserQuery = `
        INSERT INTO user (user_id, name, username, password)
        VALUES (?, ?, ?, ? );`;
        await db.run(addNewUserQuery,[uuidv4(), name, username, hashedPassword]);
        response.status(201).json({ message: "Successfully Registered" });
        } else {
            response.status(400).json({error: "Username already exists"});
        }
    } catch (error) {
        console.error("Error in registration:", error);
        response.status(500).json({ error: "Internal server error" });
    }
})

app.post('/quiz/login', async (request, response) => {
    const {userDetails} = request.body
    const { username, password } = userDetails;
    try {
        const checkUsernameQuery = `SELECT * FROM user WHERE username = ?;`;
        const checkUsername = await db.get(checkUsernameQuery, [username]);

        if (checkUsername) {
            const isPasswordValid = await bcrypt.compare(password, checkUsername.password);
            if (isPasswordValid) {
                const payLoad = { username: checkUsername.username };
                const jwtToken = jwt.sign(payLoad, secret_key);
                response.status(201).json({ message: "Login Successfully",
                                            jwt_token: jwtToken,
                                            userId: checkUsername.user_id,
                                            name: checkUsername.name});
            } else {
                response.status(401).json({ error_msg: "Password is not valid" });
            }
        } else {
            response.status(404).json({ error_msg: "Username not found" });
        }
    } catch (error) {
        response.status(500).json({ error_msg: error.message });
    }
});

app.get('/quiz/data',Authorization, async (request, response) => {
    const {category, difficulty, language} = request.query
    let getQuizDataQuery;
    try {
        if(language === 'tamil'){
            getQuizDataQuery = `SELECT * FROM quizQuestionsTamil WHERE category = ? AND difficulty = ?;`;
        }
        else{
            getQuizDataQuery = `SELECT * FROM quizQuestions WHERE category = ? AND difficulty = ?;`;
        }
        const getQuizData = await db.all(getQuizDataQuery, [category, difficulty]);
        
        const formattedQuizData = getQuizData.map(question => ({
            ...question,
            options: JSON.parse(question.options)
        }));

        response.json(formattedQuizData);
        
    } catch (error) {
        response.status(400).json({ error: 'Internal Server Error' });
    }
});

app.post('/quiz/add',Authorization, async (request, response) => {
    const { quizQuestions } = request.body;
    // console.log(quizQuestions);
    try {
        for (let question of quizQuestions) {
            const addNewQuestionQuery = `
            INSERT INTO quizQuestionsTamil (id, category, difficulty, question, options, answer)
            VALUES (${question.id}, "${question.category}", "${question.difficulty}", "${question.question}", '${JSON.stringify(question.options)}', "${question.answer}");`;
            await db.run(addNewQuestionQuery);
        }
        response.json('Question Added Successfully');
    } catch (error) {
        console.error(`Error adding question: ${error.message}`);
        response.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/quiz/scoreboard', Authorization, async (request, response) => {
    const {userId, category, level, totalScore, dateTime, questionSet } = request.body;
    try {
        const addScoreBoardQuery = `
        INSERT INTO scoreBoard (user_id, category, level, total_score, date_time, question_set)
         VALUES (?, ?, ?, ?, ?, ?);
        `;

        await db.run(addScoreBoardQuery, [
            userId,
            category,
            level,
            totalScore,
            dateTime,
            JSON.stringify(questionSet)
        ]);
        response.send('Scoreboard Successfully Added');
    } catch (error) {
        response.status(500).json({ error: `Error adding scoreboard: ${error.message}` });
        console.error({Error: `adding scoreboard: ${error.message}`});
    }
});

app.get('/quiz/scoreboard', Authorization, async (req, res) => {
    const {userId} = req.query;
    try {
        const getScoreBoardQuery = `SELECT * FROM scoreBoard WHERE user_id= ?`;
        const getScoreBoard = await db.all(getScoreBoardQuery,[userId]);

        const formattedData = getScoreBoard.map(item => ({
            ...item,
            question_set: item.question_set ? JSON.parse(item.question_set) : []
        }));

        res.json(formattedData);
    } catch (error) {
        console.error({Error: `fetching scoreboard: ${error.message}`});
        res.status(500).json({ error_msg: `Error fetching scoreboard: ${error.message}` });
    }
});


app.delete('/quiz/scoreboard', Authorization, async (request, response) => {
    const {id} = request.query
    try {
        const deleteScoreBoardQuery = `DELETE FROM scoreBoard WHERE id= ?`
        await db.run(deleteScoreBoardQuery,[id])
        response.json('Successfully Delete')
    } catch (error) {
        response.json({error_msg: `Error deleting scoreboard: ${error.message}`})
        console.error({error_msg: `Error deleting scoreboard: ${error.message}`});
    }
});

module.exports = app;
