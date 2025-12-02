# Django + React Task Manager

A full-stack task manager with a Django REST API backend and a React (Vite) frontend. It supports authentication, CRUD for tasks, and optional scheduling with due date/time fields surfaced in the UI.

> **GitHub note:** Outbound pushes are blocked from this cloud environment. To publish the current `work` branch to your GitHub `Task-Manager-V2` branch, run the push steps locally with your own credentials. See `PUSHING.md` for the exact commands and safety checks.

## Features
- JWT-secured REST API for creating, updating, and deleting tasks.
- Optional due date/time on tasks with ordering by completion state and schedule.
- Modern React dashboard showing stats, filters, and timeline details for each task.
- Token-aware API client with automatic refresh handling on 401 responses.
- **AI-powered task assistant** (Aurora) with natural language understanding via OpenAI integration.

## Quick start

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser  # create your login for /api/token/
python manage.py runserver 8000
DB_ENGINE=sqlite python manage.py runserver 8000
```

> If you prefer MySQL, set `DB_ENGINE=mysql` in `.env` and update the connection fields before running migrations.

**Local dependencies**

- SQLite requires no extra packages; it works out of the box with the provided defaults.
- For MySQL/MariaDB you may need a client library on your machine (for example `libmysqlclient-dev` on Debian/Ubuntu or the MariaDB client tools) before running `pip install -r requirements.txt` so that `mysqlclient` can compile.

**MariaDB quickstart (optional)**

If you want to validate against MariaDB locally, a lightweight Docker Compose file is included:

```bash
docker compose -f docker-compose.mariadb.yml up -d

# then run migrations against it from the backend directory
DB_ENGINE=mysql DB_NAME=taskmanager DB_USER=taskuser DB_PASSWORD=taskpass DB_HOST=127.0.0.1 DB_PORT=3306 \
  python manage.py migrate
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment
- `.env.example` in `backend/` contains defaults for local development (SQLite by default) and CORS origins for the Vite dev server.
- Update `CORS_ALLOWED_ORIGINS` if you serve the frontend from a different host/port.

## AI Assistant Setup (Optional)

The task assistant (Aurora) can use OpenAI for natural language understanding. Without an API key, it falls back to regex-based pattern matching.

### Setup OpenAI Integration

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your `.env` file in the `backend/` directory:
   ```bash
   OPENAI_API_KEY=your-api-key-here
   OPENAI_MODEL=gpt-4o-mini  # Optional: defaults to gpt-4o-mini
   ```
3. Restart your Django server

The assistant will automatically use AI when the API key is configured, providing:
- Natural language task creation with date/time parsing
- Context-aware responses about your tasks
- Intelligent task updates and management
- Conversational help and suggestions

Without the API key, the assistant still works using pattern matching for basic commands.

Repository: https://github.com/GielinorR-S/Task_Manager.git

### Using the provided Task-Manager-V2 branch

If you want the changes from this environment to live on `https://github.com/GielinorR-S/Task_Manager` under the `Task-Manager-V2` branch, add that repo as a remote and push with your GitHub credentials:

```bash
# add the remote if you haven't already
git remote add upstream https://github.com/GielinorR-S/Task_Manager.git

# push the current branch (named "work" here) to Task-Manager-V2 on GitHub
git push upstream work:Task-Manager-V2
```

You can run those commands from this repository once you provide valid GitHub access. This keeps the original `main` untouched while letting you fetch or clone the updated branch on any machine. Because SQLite remains the default database, you do not need any extra client libraries when you pull it down; just follow the quick-start steps above. See `PUSHING.md` for more safety checks so you do not overwrite the original branch when you push.

## Forking/pushing your own backup

The repository in this environment is not connected to GitHub for pushes. To keep the original upstream untouched while testing locally, fork the repo on GitHub and add your fork as a remote:

```bash
# create your fork on GitHub first, then in this repo:
git remote add fork git@github.com:<your-username>/Task_Manager.git
git push fork work

# or push a dedicated backup branch if you prefer
git push fork work:backup
```

After cloning your fork on another machine, install dependencies and run the same setup commands from the quick start sections above. If you stick with the default SQLite settings you do not need any extra database client libraries. Only switch to MySQL/MariaDB if you want to test against them, and install the relevant client libraries before installing Python dependencies.
