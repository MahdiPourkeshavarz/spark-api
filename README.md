# ✨ Spark API

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

This is the backend for the Spark application. It is a robust, modular API built with NestJS that provides user authentication, manages a database of social media posts, and includes an intelligent scraping service to import new content on demand.

**Live API URL:** `https://spark-api-b3jp.onrender.com`

**GitHub Repository:** [https://github.com/MahdiPourkeshavarz/spark-api](https://github.com/MahdiPourkeshavarz/spark-api)

---

## Features

- **Secure Authentication:** Full-featured user sign-up and login system using Passport.js and JSON Web Tokens (JWT). Passwords are securely hashed with `bcrypt`.
- **User Profile Management:** Allows users to update their username and upload a profile picture, which is hosted on Cloudinary.
- **Automated Content Collection:** A Telegram bot (`Telegraf`) actively listens to a specified channel, intelligently parses new posts (including those with images), and saves them to the database.
- **"Magic Link" Post Importer:** A powerful scraping service that can take a URL from **Twitter/X**, **Telegram**, or **LinkedIn** and automatically extract the post's text, author, and image URL.
  - Uses a hybrid approach: fast Cheerio parsing for Telegram and LinkedIn meta tags, and a more robust scraping method for Twitter.
- **Database Management:** Uses Mongoose to interact with a MongoDB database for storing user and post data.
- **Scalable Architecture:** Built with a modular structure (e.g., `AuthModule`, `PostsModule`, `ScraperModule`), making the codebase clean, maintainable, and easy to extend.
- **Ready for Deployment:** Configured for production deployment using Docker on platforms like Railway or Render.

## Tech Stack

- **Framework:** [NestJS](https://nestjs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication:** [Passport.js](http://www.passportjs.org/) with JWT strategy
- **Telegram Bot:** [Telegraf](https://telegraf.js.org/)
- **Web Scraping:** [Axios](https://axios-http.com/) & [Cheerio](https://cheerio.js.org/)
- **Image Hosting:** [Cloudinary](https://cloudinary.com/)
- **Deployment:** [Docker](https://www.docker.com/) & [Render](https://render.com/)

---

## Getting Started

To run this project locally, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or a local MongoDB instance)
- A [Cloudinary](https://cloudinary.com/) account for image uploads
- A [Telegram Bot Token](https://core.telegram.org/bots#6-botfather)

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/MahdiPourkeshavarz/spark-api.git](https://github.com/MahdiPourkeshavarz/spark-api.git)
    cd spark-api
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env` in the root of the project and add the following variables with your own credentials:

    ```env
    # Database
    MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/<db-name>

    # JWT Authentication
    JWT_SECRET=your_super_long_and_random_jwt_secret_string

    # Telegram Bot
    TELEGRAM_API_KEY=your_telegram_bot_token_from_botfather

    # Cloudinary Credentials (for profile picture uploads)
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret

    # The full URL of your front-end application for CORS
    FRONTEND_URL=http://localhost:3001
    ```

4.  **Run the development server:**
    ```bash
    npm run start:dev
    ```

The API will be running at [http://localhost:3000](http://localhost:3000).

## API Endpoints

A brief overview of the main API routes:

- `POST /auth/signup`: Create a new user account.
- `POST /auth/login`: Log in a user and receive a JWT.
- `PATCH /users/profile`: (Protected) Update the authenticated user's profile (username/image).
- `GET /posts/batch`: (Protected) Get a random batch of 100 posts from the database.
- `POST /posts/import`: (Protected) Scrape a post from a provided URL (Twitter, Telegram, LinkedIn).

## Project Structure

The API is organized into feature-based modules for a clean separation of concerns.

- `src/auth`: Handles user registration, login, and JWT strategy.
- `src/users`: Manages user data, schemas, and profile updates.
- `src/posts`: Provides API endpoints for fetching and importing posts.
- `src/scraper`: Contains the intelligent scraping logic for external platforms.
- `src/telegram`: Manages the real-time Telegram bot for content collection.
- `src/uploads`: Contains services for handling file uploads to Cloudinary.
