# Using Ollama (Open-Source AI) with FairSplit AI

This guide explains how to use **Ollama** with local open-source vision models instead of OpenAI's paid API.

## Why Use Ollama?

- ✅ **Free & Open Source** - No API costs
- ✅ **Privacy** - All processing happens locally on your machine
- ✅ **No API Keys** - No need for OpenAI account
- ✅ **Offline** - Works without internet connection
- ✅ **Fast** - With a good GPU, can be faster than API calls

## Prerequisites

- **RAM**: 8GB minimum (16GB recommended)
- **GPU**: Optional but highly recommended (NVIDIA, AMD, or Apple Silicon)
- **Disk Space**: ~4-8GB per model

## Step 1: Install Ollama

### Windows
```bash
# Download and install from:
https://ollama.ai/download/windows
```

### macOS
```bash
# Download and install from:
https://ollama.ai/download/mac

# Or using Homebrew:
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## Step 2: Pull a Vision Model

Ollama supports several vision-capable models for receipt scanning:

### Option 1: LLaVA (Recommended for beginners)
```bash
ollama pull llava
```
- **Size**: ~4.5GB
- **Speed**: Fast
- **Accuracy**: Good for receipts

### Option 2: Llama 3.2 Vision (Best accuracy)
```bash
ollama pull llama3.2-vision
```
- **Size**: ~7.9GB
- **Speed**: Medium
- **Accuracy**: Excellent

### Option 3: BakLLaVA
```bash
ollama pull bakllava
```
- **Size**: ~4.4GB
- **Speed**: Fast
- **Accuracy**: Good

## Step 3: Start Ollama Server

```bash
# Start the Ollama server (runs in background)
ollama serve
```

The server will run on `http://localhost:11434` by default.

## Step 4: Configure FairSplit AI

Edit your `.env` file:

```env
# Change AI provider to ollama
AI_PROVIDER="ollama"

# Specify which model to use
OLLAMA_VISION_MODEL="llava"

# Ollama server URL (default is localhost:11434)
OLLAMA_BASE_URL="http://localhost:11434/v1"

# You can now remove or comment out OPENAI_API_KEY
# OPENAI_API_KEY=""
```

## Step 5: Restart Your App

```bash
npm run dev
```

That's it! Your app will now use Ollama for receipt scanning.

## Testing the Setup

1. Go to http://localhost:3000/receipts
2. Upload a receipt image
3. Check the console logs - you should see:
   ```
   [ReceiptScanner] Using model: llava
   ```

## Switching Between Models

You can easily switch between different models:

```env
# Use LLaVA (fast, good accuracy)
OLLAMA_VISION_MODEL="llava"

# Use Llama 3.2 Vision (slower, best accuracy)
OLLAMA_VISION_MODEL="llama3.2-vision"

# Use BakLLaVA
OLLAMA_VISION_MODEL="bakllava"
```

## Switching Back to OpenAI

To switch back to OpenAI:

```env
AI_PROVIDER="openai"
OPENAI_API_KEY="your-api-key-here"
```

## Performance Tips

### Speed Up Inference

1. **Use GPU**: Ollama automatically uses GPU if available
2. **Increase Context**: For better accuracy on complex receipts
   ```bash
   ollama run llava --ctx-size 4096
   ```

### Monitor Performance

```bash
# Check running models
ollama list

# View model info
ollama show llava

# Stop a model to free memory
ollama stop llava
```

## Troubleshooting

### "Cannot connect to Ollama"
```bash
# Make sure Ollama is running
ollama serve

# Check if it's running
curl http://localhost:11434/api/version
```

### "Model not found"
```bash
# List installed models
ollama list

# Pull the model again
ollama pull llava
```

### "Out of memory"
- Use a smaller model (llava instead of llama3.2-vision)
- Close other applications
- Reduce image size before upload

### Poor accuracy
- Try a different model (llama3.2-vision is most accurate)
- Ensure receipt image is clear and well-lit
- Try cropping the image to show just the receipt

## Comparing Models

| Model | Size | Speed | Accuracy | Best For |
|-------|------|-------|----------|----------|
| llava | 4.5GB | Fast | Good | General use, testing |
| llama3.2-vision | 7.9GB | Medium | Excellent | Production, best results |
| bakllava | 4.4GB | Fast | Good | Quick testing |

## Using Other Models

Ollama supports many other vision models. Check https://ollama.ai/library for more options:

```bash
# Search for vision models
ollama list | grep vision

# Try other models
ollama pull moondream
ollama pull cogvlm
```

Then update your `.env`:
```env
OLLAMA_VISION_MODEL="moondream"
```

## Cost Comparison

### OpenAI GPT-4o Vision
- ~$0.01 per receipt (at $10/1M tokens)
- 1000 receipts = ~$10

### Ollama (Local)
- **FREE** - No per-use costs
- One-time cost: GPU hardware (if needed)
- Unlimited receipts

## Next Steps

- Try different models to find the best balance of speed/accuracy
- Fine-tune prompts for better extraction
- Consider using OpenAI for production and Ollama for development
