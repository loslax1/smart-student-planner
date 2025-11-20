Smart Student Planner

A full stack planning application that helps students manage assignments, quizzes, exams, schedules, and class times in a clean and organized dashboard.
The platform includes event management, weekly statistics, a class schedule system, and an automatically updating daily view of upcoming deadlines and classes.

This project uses a modern React frontend and a Node.js/Express backend with PostgreSQL as the main database.

Features
Event Management

Create, edit, and delete events

Supports assignments, quizzes, exams, and custom time blocks

Colors and categories automatically adjust based on event timing (today, ongoing, coming up, overdue)

Events are grouped into clear dashboard sections

Class Scheduling

Add classes with start/end dates, meeting days, times, and location

Dashboard automatically displays today's classes

Helps students anticipate weekly workload

Dashboard

Displays all relevant academic information in one place

Weekly statistics for assignments, quizzes, and exams

Clean card based layout that adapts to screen size

Responsive and mobile friendly

Tech Stack
Frontend

React

Vite

Axios

Modern CSS grid and flexible responsive UI

Backend

Node.js

Express

PostgreSQL

JWT authentication

Development Tools

Git

Docker (optional)

pgAdmin or any SQL client

Project Structure
smart-student-planner/
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
│
├── server/                 # Node + Express backend
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── index.js
│   └── package.json
│
└── README.md

Environment Variables
Frontend (.env)
VITE_API_BASE=http://localhost:5000

Backend (.env)
DATABASE_URL=postgres://user:password@localhost:5432/studentplanner
JWT_SECRET=your_secret_key
PORT=5000

Installation and Setup
1. Clone the repository
git clone https://github.com/loslax1/smart-student-planner
cd smart-student-planner

Running Locally (Recommended for development)
Install server dependencies
cd server
npm install

Start backend
npm run dev

Install client dependencies

Open a second terminal:

cd client
npm install
npm run dev


Your app will be available at:

http://localhost:5173

Running Using Docker (Optional)

The project can be containerized for easier deployment.

Build and start containers
docker compose up --build

Stop containers
docker compose down

Database Setup

Create a PostgreSQL database

Run schema migrations located in server/models or your SQL migration file

Ensure your .env matches your database credentials

Start backend and verify connection

API Overview
Events

GET /api/events

POST /api/events

PUT /api/events/:id

DELETE /api/events/:id

Classes

GET /api/classes

POST /api/classes

PUT /api/classes/:id

DELETE /api/classes/:id

Authentication

POST /api/auth/register

POST /api/auth/login

Contributing

Create a new branch for your feature

git checkout -b feature-branch-name


Commit changes

git commit -m "Description of update"


Push your branch

git push origin feature-branch-name


Open a pull request on GitHub
