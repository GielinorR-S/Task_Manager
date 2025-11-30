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

Database: The default `.env` expects a local MySQL instance (DB name/user/password in `.env`). If you prefer SQLite, change `DB_ENGINE=sqlite` in `.env` and comment out the MySQL values.

Repository: https://github.com/GielinorR-S/Task_Manager.git
