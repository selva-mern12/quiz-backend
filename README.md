# Quiz Backend

## Overview

The Quiz Backend is a RESTful API built using Node.js, Express, and MongoDB. It provides functionality for user authentication, quiz management, and scoreboard tracking. This backend supports multiple quiz categories and languages, with authentication and authorization mechanisms to ensure secure access.

## Features

- User registration and authentication (JWT-based)
- Secure password hashing with bcrypt
- Quiz management (add, retrieve questions in English and Tamil)
- Scoreboard tracking for users
- Middleware for authentication and authorization
- MongoDB integration with Mongoose

## Technologies Used

- Node.js
- Express.js
- MongoDB & Mongoose
- JWT (JSON Web Token) Authentication
- bcrypt.js for password hashing
- moment-timezone for timestamp handling
- dotenv for environment variable management

## Installation

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)

### Steps

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/quiz-backend.git
   cd quiz-backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and configure the following variables:
   ```env
   PORT=4000
   MONGO_URI=your_mongodb_connection_string
   ```
4. Start the server:
   ```sh
   npm start
   ```

## API Endpoints

### Authentication

- **Register**: `POST /quiz/register`
- **Login**: `POST /quiz/login`

### Quiz Management

- **Get Quiz Questions**: `GET /quiz/data` (Requires authorization)
- **Add Quiz Questions**: `POST /quiz/add` (Requires authorization)

### Scoreboard

- **Add Scoreboard Entry**: `POST /quiz/scoreboard` (Requires authorization)
- **Get Scoreboard Data**: `GET /quiz/scoreboard` (Requires authorization)
- **Delete Scoreboard Entry**: `DELETE /quiz/scoreboard` (Requires authorization)

## Authentication

The backend uses JWT for authentication. After logging in, users receive a `jwt_token`, which must be included in the `Authorization` header for protected routes.

### Example Authorization Header

```sh
Authorization: Bearer your_jwt_token
```

## Error Handling

- Standardized JSON responses for errors
- Returns appropriate HTTP status codes (400, 401, 404, 500)

## License

This project is licensed under the MIT License.

