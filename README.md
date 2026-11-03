# Shohojogi Server

Backend REST API for Shohojogi, a community-driven social service events platform.

## Features

- User registration and login
- JWT authentication
- User profile management
- Password changing
- Event creation and management
- Event discovery and participation
- Featured events
- Dashboard statistics
- MongoDB integration
- Automated API tests

## Tech Stack

- Node.js 20+
- Express.js 5
- MongoDB
- JWT
- bcryptjs
- dotenv
- CORS

## Installation

1. Clone the repository.
2. Run `npm install`.
3. Create a `.env` file using `.env.example`.
4. Configure your MongoDB URL and JWT secret.
5. Run `npm run dev`.

## Environment Variables

Required:
- `MONGODB_URL`
- `JWT_SECRET`

Optional:
- `MONGODB_DB_NAME`
- `PORT`
- `NODE_ENV`
- `CLIENT_URL`
- `CLIENT_URLS`
- `MONGODB_MAX_POOL_SIZE`

Never commit your `.env` file.

## Available Scripts

- `npm run dev` - Start development server.
- `npm start` - Start production server.
- `npm test` - Run automated tests.
- `npm run check` - Check JavaScript syntax.
- `npm run lint` - Run syntax checks.
- `npm run build` - Run project checks.

## API Endpoints

Base URL: `http://localhost:8000`

### General
- GET `/`
- GET `/health`

### Users — `/api/users`
- POST `/register`
- POST `/login`
- GET `/profile` (Authentication required)
- PUT `/profile` (Authentication required)
- PUT `/change-password` (Authentication required)

### Events — `/api/events`
- GET `/`
- GET `/featured`
- GET `/my-events` (Authentication required)
- GET `/my-joined-events` (Authentication required)
- GET `/:id`
- POST `/` (Authentication required)
- PUT `/:id` (Authentication required)
- DELETE `/:id` (Authentication required)
- POST `/:id/join` (Authentication required)
- DELETE `/:id/join` (Authentication required)

### Dashboard — `/api/dashboard`
- GET `/stats` (Authentication required)

Protected endpoints require a valid JWT access token.

## Deployment

This project includes a `render.yaml` configuration for Render deployment.

Configure `MONGODB_URL`, `JWT_SECRET`, and `CLIENT_URL` in Render environment settings.

Health check endpoint: `/health`.

## License

This project is private.
