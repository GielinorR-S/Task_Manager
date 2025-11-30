# Django + React Task Manager

This workspace contains a Django REST API backend and a React frontend (Vite) for a simple Task Manager.

Quick start (Windows + PowerShell):

1. Backend

```powershell
cd "C:/Users/Cini9/Desktop/Portfolio/Django x React"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py createsuperuser  # create your login for /api/token/
python manage.py runserver 8000
```

2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Database: The default `.env` expects a local MySQL or MariaDB instance (DB name/user/password in `.env`). If you prefer SQLite, change `DB_ENGINE=sqlite` in `.env` and comment out the MySQL values.

MariaDB/MySQL quick start (local host):

1. Ensure MariaDB/MySQL is running on `127.0.0.1:3306` and that the credentials in `.env` exist (`taskmanager_user` / `taskmanager` by default). Pure-Python `pymysql` is already included in `backend/requirements.txt`, so no extra driver install is required.
2. Apply migrations into that database from the `backend` folder:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser  # make the login for /api/token/
   ```
3. Start the server with the same `.env` loaded:
   ```bash
   python manage.py runserver 8000
   ```

SQLite fallback (optional): set `DB_ENGINE=sqlite` in your local `.env`, then rerun `python manage.py migrate` to create a `db.sqlite3` for quick testing without MariaDB/MySQL.

Repository: https://github.com/GielinorR-S/Task_Manager.git
