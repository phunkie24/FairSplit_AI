@echo off
echo ========================================
echo FairSplit AI - Ollama Setup (Windows)
echo ========================================
echo.

echo Step 1: Checking if Ollama is installed...
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Ollama is NOT installed!
    echo.
    echo Please install Ollama first:
    echo 1. Visit: https://ollama.ai/download/windows
    echo 2. Download and install Ollama
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo [✓] Ollama is installed!
echo.

echo Step 2: Pulling latest vision model (llama3.2-vision)...
echo This will download ~7.9GB - may take a few minutes...
echo.
ollama pull llama3.2-vision

if %errorlevel% neq 0 (
    echo [X] Failed to pull model!
    pause
    exit /b 1
)

echo.
echo [✓] Model downloaded successfully!
echo.

echo Step 3: Starting Ollama server...
start "Ollama Server" cmd /k ollama serve

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Ollama is now running with llama3.2-vision
echo.
echo Next steps:
echo 1. Start your app: npm run dev
echo 2. Upload a receipt at: http://localhost:3000/receipts
echo 3. Receipts will be scanned for FREE using Ollama!
echo.
echo Note: Keep the Ollama server window open
echo.
pause
