# Start backend: creates venv if missing, installs requirements and runs Django dev server
if (-Not (Test-Path -Path .venv)) {
    python -m venv .venv
}
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
