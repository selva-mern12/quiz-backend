const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const  mongoose = require('mongoose');
const moment = require('moment-timezone')
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors())

const secret_key = 'SELVA_QUIZ'

// connect to mongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {console.log('DB Connected')}
)
.catch((error) => {console.log(error)}
)

//Create Schema 
const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxLength: 50 },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, minlength: 4, maxLength: 20, match: [/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores allowed'] },
    password: { type: String, required: true, minlength: 8},
    date_time: { type: String,  default: () => moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")}
});

const quizEnglishQuestionSchema = new mongoose.Schema({
    category: { type: String, required: true },
    difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    answer: { type: String, required: true },
    date_time: { type: String,  default: () => moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")}
});

const quizTamilQuestionSchema = new mongoose.Schema({
    category: { type: String, required: true },
    difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    answer: { type: String, required: true },
    date_time: { type: String,  default: () => moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")}
});

const scoreBoardSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    level: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
    total_score: { type: Number, required: true, min: 0 },
    question_set: { type: [String], required: true },
    date_time: { type: String,  default: () => moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")}
});

// Create Models
const UserModel = mongoose.model("User", userSchema);
const QuizEnglishModel = mongoose.model("QuizEnglishQuestion", quizEnglishQuestionSchema);
const QuizTamilModel = mongoose.model("QuizTamilQuestion", quizTamilQuestionSchema);
const ScoreBoardModel = mongoose.model("ScoreBoard", scoreBoardSchema);




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
    try {
        const hashedPassword = await bcrypt.hash(password, 5);
        const checkUser = await UserModel.findOne({username});
        if (!checkUser){
        const newUser = new UserModel({name, username, password: hashedPassword});
        await newUser.save();
        response.status(201).json({ message: "Successfully Registered" });
        } else {
            response.status(400).json({error: "Username already exists"});
        }
    } catch (error) {
        console.error("Error in registration:", error);
        response.status(500).json({ error: "Internal server error" });
    }
});

app.post('/quiz/login', async (request, response) => {
    const {userDetails} = request.body
    const { username, password } = userDetails;
    try {
        if (!username || !password) {
            return response.status(400).json({ error_msg: "Username or Password is missing" });
        }
        const checkUser = await UserModel.findOne({username});
        if (checkUser) {
            const isPasswordValid = await bcrypt.compare(password, checkUser.password);
            if (isPasswordValid) {
                const payLoad = { username: checkUser.username, userId: checkUser._id };
                const jwtToken = jwt.sign(payLoad, secret_key);
                response.status(200).json({
                    message: "Login Successfully",
                    jwt_token: jwtToken,
                    userId: checkUser._id,
                    name: checkUser.name
                });
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

app.get('/quiz/data', Authorization, async (request, response) => {
    const { category, difficulty, language } = request.query;
    
    try {
        const filter = {};
        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;
        const QuizModel = language === 'tamil' ? QuizTamilModel : QuizEnglishModel;
        const quizData = await QuizModel.find(filter).lean();
        if (!quizData.length) {
            return response.status(404).json({ error: "No questions found" });
        }
        const formattedQuizData = quizData.map(question => ({
            ...question,
            options: Array.isArray(question.options) ? question.options : JSON.parse(question.options)
        }));
        response.json(formattedQuizData);
    } catch (error) {
        console.error(`Error fetching quiz data: ${error.message}`);
        response.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/quiz/add', Authorization, async (request, response) => {
    const { quizQuestions } = request.body;
    const { language } = request.query;
    
    try {
        const QuizModel = language === 'tamil' ? QuizTamilModel : QuizEnglishModel;
        let duplicateQuestions = [];

        await Promise.all(
            quizQuestions.map(async (question) => {
                const checkQuiz = await QuizModel.findOne({ question: question.question });
                
                if (checkQuiz) {
                    duplicateQuestions.push(question.question); // Store duplicate questions
                } else {
                    await QuizModel.create({
                        category: question.category,
                        difficulty: question.difficulty,
                        question: question.question,
                        options: Array.isArray(question.options) ? question.options : JSON.stringify(question.options),
                        answer: question.answer
                    });
                }
            })
        );

        if (duplicateQuestions.length > 0) {
            return response.status(409).json({ error: "Some quizzes already exist", duplicateQuestions });
        }
        response.json({ message: "Questions Added Successfully" });

    } catch (error) {
        console.error(`Error adding question: ${error.message}`);
        response.status(500).json({ error: "Internal Server Error" });
    }
});


app.post('/quiz/scoreboard', Authorization, async (request, response) => {
    const {userId, category, level, totalScore, questionSet } = request.body;
    try {
        const addScore = new ScoreBoardModel({user_id: userId, category, level, total_score: totalScore, question_set: JSON.stringify(questionSet)})
        await addScore.save()
        response.send('Scoreboard Successfully Added');
    } catch (error) {
        response.status(500).json({ error: `Error adding scoreboard: ${error.message}` });
        console.error({Error: `adding scoreboard: ${error.message}`});
    }
});

app.get('/quiz/scoreboard', Authorization, async (req, res) => {
    const {userId, id} = req.query;
    try {
        let filter = {};
        if (userId) filter.user_id = userId;
        if (id) filter._id = id;
        const getScoreBoard = await ScoreBoardModel.find(filter).lean()

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
    const { id } = request.query;

    if (!id) {
        return response.status(400).json({ error_msg: "ID is required" });
    }
    try {
        const deletedScore = await ScoreBoardModel.findByIdAndDelete(id); 

        if (!deletedScore) {
            return response.status(404).json({ error_msg: "Scoreboard not found" });
        }

        response.json({ message: "Successfully Deleted" });
    } catch (error) {
        response.status(500).json({ error_msg: `Error deleting scoreboard: ${error.message}` });
        console.error(`Error deleting scoreboard: ${error.message}`);
    }
});



app.listen(process.env.PORT || 4000, () => console.log(`Server Running at http://localhost:${process.env.PORT}`));