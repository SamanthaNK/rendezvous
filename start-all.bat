@echo off
start cmd /k "cd ai-service && venv\Scripts\activate && python embedding_service.py"
timeout /t 5
start cmd /k "cd server && npm run dev"
timeout /t 5
start cmd /k "cd client && npm run dev"