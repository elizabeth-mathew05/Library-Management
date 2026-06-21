# Library Management System

A full-stack library management application for browsing books, managing reservations, and handling admin workflows.

## Overview

The project is split into a frontend and backend workspace. The frontend is a Vite + React app, and the root package scripts are wired to run the frontend and backend separately.

The frontend also ships a redirect rule that forwards `/api/*` requests to the deployed backend at `https://library-management-15.onrender.com`.

## Project Structure

- `library-managemnet-frontend` - React frontend built with Vite.
- `library-managemnet-backend` - Backend service started from the root workspace scripts.
- `public/_redirects` - Redirect rule used by the frontend deployment.

## Available Scripts

From the repository root:

- `npm run start` - Start the backend workspace.
- `npm run start:backend` - Start the backend workspace.
- `npm run start:frontend` - Start the frontend workspace.
- `npm run dev:backend` - Start the backend in development mode.
- `npm run dev:frontend` - Start the frontend in development mode.

## Frontend

The frontend uses:

- React 18
- React Router DOM 6
- Axios for API calls
- Vite for development and production builds

## Backend

The backend is responsible for the API used by the frontend. The deployed API base currently points to `https://library-management-15.onrender.com/api`.

## Demo Credentials

# User Credentials

## Admin
- Email: admin@gmail.com
- Password: admin123

## Standalone User
- Email: user1@gamil.com
- Password: user1@123

## Librarian
- Email: librarian2@gmail.com
- Password: librarian2@123

## Notes

- The frontend redirect file routes `/api/*` to the deployed backend.
- If you add or change seeded accounts, update this README so demo access stays in sync with the application.