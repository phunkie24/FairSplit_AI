# AI Configuration Guide - FairSplit AI

This document explains how to configure AI providers for receipt scanning and analysis in FairSplit AI.

## Quick Start

### Option 1: OpenAI (Easiest, Paid)
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="your-openai-api-key"
```

### Option 2: Ollama (Free, Local)
```env
AI_PROVIDER="ollama"
OLLAMA_BASE_URL="http://localhost:11434/v1"
OLLAMA_VISION_MODEL="llava"
```

### Option 3: Mock Data (Development)
```env
USE_MOCK_AI="true"
```

## Supported AI Providers

### 1. OpenAI (Default)

**Pros:**
- Best accuracy
- Fast response times
- No local setup required
- Always available

**Cons:**
- Costs money (~$0.01 per receipt)
- Requires API key
- Requires internet connection
- Data sent to OpenAI servers

**Setup:**
1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env`:
   ```env
   AI_PROVIDER="openai"
   OPENAI_API_KEY="sk-proj-..."
   ```

**Models Used:**
- Vision: `gpt-4o` (updated from deprecated gpt-4-vision-preview)
- Text: `gpt-4-turbo`
- Moderation: `text-moderation-latest`

### 2. Ollama (Open Source)

**Pros:**
- Completely free
- Privacy-focused (runs locally)
- No API keys needed
- Works offline
- Unlimited usage

**Cons:**
- Requires local installation
- Needs good hardware (8GB+ RAM, GPU recommended)
- Slower than OpenAI (without GPU)
- Initial model download (~4-8GB)

**Setup:**
1. Install Ollama: https://ollama.ai
2. Pull a vision model:
   ```bash
   ollama pull llava
   # or
   ollama pull llama3.2-vision
   # or
   ollama pull bakllava
   ```
3. Start Ollama server:
   ```bash
   ollama serve
   ```
4. Configure `.env`:
   ```env
   AI_PROVIDER="ollama"
   OLLAMA_BASE_URL="http://localhost:11434/v1"
   OLLAMA_VISION_MODEL="llava"
   ```

See [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) for detailed instructions.

**Recommended Models:**
- **llava** - Fast, good accuracy, 4.5GB
- **llama3.2-vision** - Best accuracy, slower, 7.9GB
- **bakllava** - Fast, good for testing, 4.4GB

### 3. Mock Data (Development Only)

**Use Case:** Quick testing without AI calls

**Setup:**
```env
USE_MOCK_AI="true"
```

This will return sample data:
```json
{
  "merchant": "Mock Restaurant",
  "total": 50.00,
  "items": [
    {"name": "Sample Item 1", "price": 25.00},
    {"name": "Sample Item 2", "price": 20.00},
    {"name": "Tax", "price": 5.00}
  ]
}
```

## Configuration Reference

### Environment Variables

```env
# AI Provider (required)
# Options: 'openai' | 'ollama'
AI_PROVIDER="openai"

# OpenAI Settings (when AI_PROVIDER=openai)
OPENAI_API_KEY="sk-..."

# Ollama Settings (when AI_PROVIDER=ollama)
OLLAMA_BASE_URL="http://localhost:11434/v1"
OLLAMA_VISION_MODEL="llava"

# Development Mode
USE_MOCK_AI="false"  # Set to "true" to skip AI calls
```

## Switching Between Providers

### Development → Production

**Development (Free, Local):**
```env
AI_PROVIDER="ollama"
OLLAMA_VISION_MODEL="llava"
```

**Production (Paid, Cloud):**
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
```

### Testing Without AI

For rapid testing without any AI calls:
```env
USE_MOCK_AI="true"
```

## Model Comparison

| Provider | Model | Cost | Speed | Accuracy | Privacy |
|----------|-------|------|-------|----------|---------|
| OpenAI | gpt-4o | $0.01/receipt | Fast | Excellent | Cloud |
| Ollama | llama3.2-vision | Free | Medium | Excellent | Local |
| Ollama | llava | Free | Fast | Good | Local |
| Mock | N/A | Free | Instant | N/A | Local |

## Advanced Configuration

### Using Custom Ollama Models

Any Ollama vision model can be used:

```bash
# Pull a custom model
ollama pull cogvlm
```

```env
OLLAMA_VISION_MODEL="cogvlm"
```

### Using OpenAI-Compatible APIs

Ollama uses OpenAI-compatible API, so you can use other providers:

**Azure OpenAI:**
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="your-azure-key"
# In code, update baseURL to Azure endpoint
```

**Local LLM Servers:**
```env
AI_PROVIDER="ollama"
OLLAMA_BASE_URL="http://your-server:port/v1"
```

## Troubleshooting

### OpenAI Errors

**"404 The model gpt-4-vision-preview has been deprecated"**
- ✅ Fixed! We now use `gpt-4o` instead

**"Unauthorized" / Invalid API key**
- Check your API key at https://platform.openai.com/api-keys
- Ensure no extra spaces in `.env`
- Make sure you have credits in your OpenAI account

**"Rate limit exceeded"**
- You've hit OpenAI's rate limit
- Wait a few minutes or upgrade your plan
- Or switch to Ollama: `AI_PROVIDER="ollama"`

### Ollama Errors

**"Cannot connect to Ollama"**
```bash
# Start Ollama server
ollama serve

# Check if running
curl http://localhost:11434/api/version
```

**"Model not found"**
```bash
# List installed models
ollama list

# Pull the model
ollama pull llava
```

**"Out of memory"**
- Close other applications
- Use a smaller model (llava instead of llama3.2-vision)
- Add more RAM or use cloud GPU

**Slow inference**
- Install GPU drivers (NVIDIA/AMD)
- Use a smaller model
- Reduce image size

### Mock Data Not Working

If mock data isn't being used:
```env
# Make sure this is set
USE_MOCK_AI="true"

# Restart the dev server
npm run dev
```

## Best Practices

### Development
```env
# Use Ollama for free local testing
AI_PROVIDER="ollama"
OLLAMA_VISION_MODEL="llava"

# Or mock data for rapid iteration
USE_MOCK_AI="true"
```

### Production
```env
# Use OpenAI for best results
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."

# Never use mock data
USE_MOCK_AI="false"
```

### Cost Optimization

**OpenAI:**
- Cache results (automatically done)
- Batch process receipts
- Use lower resolution images
- Expected: ~1000 receipts = $10

**Ollama:**
- Free unlimited usage
- One-time hardware cost (GPU recommended)
- Host on a single server for team use

## Security Considerations

### OpenAI
- Receipt images sent to OpenAI servers
- Data may be retained per OpenAI policy
- Use data processing agreement for compliance

### Ollama
- All processing happens locally
- No data leaves your machine
- Full GDPR/HIPAA compliance
- Recommended for sensitive receipts

## Future AI Providers

Support planned for:
- ✅ OpenAI (done)
- ✅ Ollama (done)
- 🔄 Azure OpenAI
- 🔄 Google Gemini
- 🔄 Anthropic Claude
- 🔄 AWS Bedrock
- 🔄 Hugging Face Inference

## Getting Help

**OpenAI Issues:**
- Documentation: https://platform.openai.com/docs
- Status: https://status.openai.com

**Ollama Issues:**
- Documentation: https://ollama.ai/docs
- GitHub: https://github.com/ollama/ollama
- See: [OLLAMA_SETUP.md](./OLLAMA_SETUP.md)

**FairSplit Issues:**
- Check browser console for detailed errors
- Check server logs for API errors
- Enable development mode for detailed logging
