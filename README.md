# Project Structure

    project-root
    │
    ├── frontend/        # React frontend application
    ├── backend/         # API server and database logic
    │
    ├── package.json     # Root scripts for running the entire project
    └── README.md

------------------------------------------------------------------------

# Quick Start

Run these commands in order:

``` bash
npm run install:all
npm run setup
npm run data
npm run dev
```
------------------------------------------------------------------------

# Installation

Clone the repository and move into the project directory.

``` bash
git clone <repo-url>
cd <repo-folder>
```

Install dependencies for both frontend and backend:

``` bash
npm run install:all
```

------------------------------------------------------------------------

# Project Setup

Run the setup script to initialize configuration and environment
requirements.

``` bash
npm run setup
```

------------------------------------------------------------------------

# Load Initial Data

Populate the database or seed the application with required starting
data.

``` bash
npm run data
```

------------------------------------------------------------------------

# Running the Application

Start the frontend and backend development servers simultaneously:

``` bash
npm run dev
```

After starting the development servers, the application should be
available at:

    http://localhost:3000

------------------------------------------------------------------------

# Available Scripts

  -----------------------------------------------------------------------
  Script                 Description
  ---------------------- ------------------------------------------------
  npm run install:all    Installs dependencies for both frontend and
                         backend

  npm run setup          Runs project initialization scripts

  npm run data           Loads initial application data

  npm run dev            Starts frontend and backend development servers
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# Troubleshooting

## Node Version Issues

Ensure Node.js version **18 or higher** is installed.

Check version:

``` bash
node -v
```

------------------------------------------------------------------------

## Dependencies Not Installing

Delete node_modules and reinstall:

``` bash
rm -rf node_modules
npm run install:all
```

------------------------------------------------------------------------

## Port Already In Use

If the server fails to start due to a port conflict:

1.  Stop the process using the port
2.  Or modify the port in the backend/frontend configuration

------------------------------------------------------------------------

## Database/Data Not Loading

Re-run the data script:

``` bash
npm run data
```

------------------------------------------------------------------------

# Development Notes

-   Frontend and backend are designed to run **concurrently**
-   Root scripts simplify development by avoiding separate setup steps
    for each service
-   Database/data initialization must be completed before running the
    application

------------------------------------------------------------------------

# License

This project is intended for **educational use** as part of **CS478
coursework**.
