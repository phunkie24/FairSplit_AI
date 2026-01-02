# Quick Start - FairSplit AI with Ollama

This app is now configured to use **Ollama** - a free, open-source AI that runs locally on your machine!

## 🚀 3-Step Setup

### Step 1: Install Ollama

**Windows:**
1. Download from: https://ollama.ai/download/windows
2. Run the installer
3. Done!

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Download the Vision Model

Open a terminal and run:

```bash
ollama pull llama3.2-vision
```

This downloads the latest vision model (~7.9GB). It may take 5-15 minutes depending on your internet speed.

### Step 3: Start Ollama

**Windows:**
```bash
ollama serve
```

**macOS/Linux:**
```bash
ollama serve
```

Or just run our setup script:
- **Windows:** Double-click `setup-ollama.bat`
- **Mac/Linux:** Run `./setup-ollama.sh`

## ✅ Verify Setup

Check if Ollama is running:

```bash
curl http://localhost:11434/api/version
```

You should see: `{"version":"..."}`

List installed models:

```bash
ollama list
```

You should see `llama3.2-vision` in the list.

## 🎯 Start Using FairSplit AI

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the app:**
   ```
   http://localhost:3000
   ```

3. **Upload a receipt:**
   - Go to: http://localhost:3000/receipts
   - Click "Upload Receipt"
   - Select an image
   - Watch it scan for FREE! 🎉

## 🔍 Verify It's Working

When you upload a receipt, check the terminal logs. You should see:

```
[ReceiptScanner] Using model: llama3.2-vision
```

This confirms Ollama is being used (not OpenAI).

## 💰 Cost Comparison

| Provider | Cost |
|----------|------|
| OpenAI GPT-4 Vision | ~$0.01 per receipt |
| **Ollama (Local)** | **FREE** ✅ |

**Unlimited receipts, zero costs!**

## ⚡ Performance

**Without GPU:**
- Receipt scan: ~30-60 seconds
- Still works, just slower

**With GPU (Recommended):**
- Receipt scan: ~5-10 seconds
- Much faster!

**GPU Support:**
- NVIDIA GPUs: Automatically detected
- AMD GPUs: Supported via ROCm
- Apple Silicon (M1/M2/M3): Native support

## 🔧 Troubleshooting

### "Cannot connect to Ollama"

Make sure Ollama is running:
```bash
ollama serve
```

### "Model not found"

Pull the model again:
```bash
ollama pull llama3.2-vision
```

### "Out of memory"

Your system needs at least 8GB RAM. Try:
1. Close other applications
2. Use a smaller model:
   ```bash
   ollama pull llava
   ```
   Then update `.env`:
   ```env
   OLLAMA_VISION_MODEL="llava"
   ```

### Slow performance

1. **Get a GPU** - Ollama is much faster with GPU
2. **Use smaller model** - Try `llava` instead of `llama3.2-vision`
3. **Reduce image size** - Crop/resize images before upload

## 🎨 Alternative Models

You can use different models by changing `.env`:

**Fastest (4.5GB):**
```bash
ollama pull llava
```
```env
OLLAMA_VISION_MODEL="llava"
```

**Best Accuracy (7.9GB - Current):**
```bash
ollama pull llama3.2-vision
```
```env
OLLAMA_VISION_MODEL="llama3.2-vision"
```

**Alternative (4.4GB):**
```bash
ollama pull bakllava
```
```env
OLLAMA_VISION_MODEL="bakllava"
```

## 🔄 Switching Back to OpenAI

If you want to use OpenAI instead:

1. Get API key from: https://platform.openai.com/api-keys
2. Update `.env`:
   ```env
   AI_PROVIDER="openai"
   OPENAI_API_KEY="sk-..."
   ```
3. Restart the dev server

## 📚 Next Steps

- ✅ Upload receipts and test AI scanning
- ✅ Create groups for expense splitting
- ✅ View analytics and fairness reports
- ✅ Optimize debts with graph algorithms

## 🆘 Need Help?

1. Check [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) for detailed setup
2. Check [AI_CONFIGURATION.md](./AI_CONFIGURATION.md) for configuration options
3. Open browser console (F12) for detailed error messages
4. Check Ollama logs for AI-related issues

## 🎉 That's It!

You now have a completely free, private, AI-powered receipt scanner running locally on your machine!

**No API costs. No data leaving your computer. Unlimited usage.** 🚀
