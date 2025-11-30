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

Database: The default `.env` uses SQLite so you can run locally without MySQL. To use MySQL/MariaDB instead, set `DB_ENGINE=mysql` in `.env` and provide your credentials.

Repository: https://github.com/GielinorR-S/Task_Manager.git
