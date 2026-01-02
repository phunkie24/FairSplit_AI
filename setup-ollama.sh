#!/bin/bash

echo "========================================"
echo "FairSplit AI - Ollama Setup (Mac/Linux)"
echo "========================================"
echo ""

echo "Step 1: Checking if Ollama is installed..."
if ! command -v ollama &> /dev/null; then
    echo "[X] Ollama is NOT installed!"
    echo ""
    echo "Please install Ollama first:"
    echo "  macOS:   brew install ollama"
    echo "           or visit: https://ollama.ai/download/mac"
    echo "  Linux:   curl -fsSL https://ollama.ai/install.sh | sh"
    echo ""
    exit 1
fi

echo "[✓] Ollama is installed!"
echo ""

echo "Step 2: Pulling latest vision model (llama3.2-vision)..."
echo "This will download ~7.9GB - may take a few minutes..."
echo ""
ollama pull llama3.2-vision

if [ $? -ne 0 ]; then
    echo "[X] Failed to pull model!"
    exit 1
fi

echo ""
echo "[✓] Model downloaded successfully!"
echo ""

echo "Step 3: Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Ollama is now running with llama3.2-vision (PID: $OLLAMA_PID)"
echo ""
echo "Next steps:"
echo "1. Start your app: npm run dev"
echo "2. Upload a receipt at: http://localhost:3000/receipts"
echo "3. Receipts will be scanned for FREE using Ollama!"
echo ""
echo "To stop Ollama later: kill $OLLAMA_PID"
echo ""
