# Start frontend (Vite)
cd frontend
if (-Not (Test-Path -Path node_modules)) {
    npm install
}
npm run dev
