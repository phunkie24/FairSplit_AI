# FairSplit AI 🤝💰

AI-powered group expense splitting and debt optimization platform.

## Features

- 🧾 **AI Receipt Scanning**: Automatic OCR with Vision AI (GPT-4o or Ollama)
- 🔄 **Debt Optimization**: Minimize transactions using graph algorithms
- 📊 **Fairness Analysis**: Emotional intelligence for group dynamics
- 🔒 **Enterprise Security**: PII detection, content moderation, rate limiting
- ⚡ **Real-time Updates**: Live debt tracking and notifications
- 💰 **Free AI Option**: Use local Ollama models - zero API costs!

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Cache**: Redis (Upstash) with in-memory fallback
- **AI**: Ollama (llama3.2-vision) or OpenAI GPT-4o - you choose!
- **Auth**: NextAuth.js
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (optional, falls back to in-memory)
- **Ollama** (recommended, free) OR OpenAI API key

### ⚡ NEW: Free AI with Ollama (Recommended)

**This app now uses FREE, open-source AI by default!**

See **[QUICKSTART.md](./QUICKSTART.md)** for 3-step setup with Ollama.

Quick setup:
```bash
# 1. Install Ollama: https://ollama.ai
# 2. Pull vision model
ollama pull llama3.2-vision
# 3. Start Ollama
ollama serve
# 4. Done! Start the app
npm run dev
```

**No API keys. No costs. Unlimited usage.** 🎉

### Installation

1. Clone and install dependencies:
\`\`\`bash
git clone <repository>
cd fairsplit-ai
npm install
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env with your credentials
\`\`\`

3. Set up database:
\`\`\`bash
npx prisma db push
npx prisma db seed
\`\`\`

4. Run development server:
\`\`\`bash
npm run dev
\`\`\`

Visit http://localhost:3000

### Test Credentials

- Email: alice@example.com
- Password: password123

## Architecture

### AI Agent System

- **ReceiptScannerAgent**: OCR with GPT-4 Vision
- **DebtOptimizerAgent**: Graph-based optimization
- **EmotionalIntelligenceAgent**: Fairness analysis

### Security Layers

- Input sanitization (XSS prevention)
- PII detection and redaction
- Prompt injection prevention
- Content moderation (OpenAI)
- Rate limiting
- Audit logging

### Design Patterns

Implements 33+ AI design patterns including:
- Chain-of-Thought
- Self-Consistency
- RAG (Retrieval-Augmented Generation)
- ReAct (Reasoning + Acting)
- Reflection
- Semantic Caching

## API Documentation

### Receipts

\`\`\`
POST /api/receipts/upload    # Upload receipt image
POST /api/receipts/parse     # Parse with AI
GET  /api/receipts           # List receipts
\`\`\`

### Debts

\`\`\`
POST /api/debts/calculate    # Calculate from receipt
POST /api/debts/optimize     # Optimize transactions
PATCH /api/debts/:id/settle  # Mark as settled
\`\`\`

### Groups

\`\`\`
POST /api/groups             # Create group
GET  /api/groups             # List groups
GET  /api/groups/:id         # Get details
\`\`\`

## Scripts

\`\`\`bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production
npm run lint         # Lint code
npm run type-check   # TypeScript check
npm test             # Run tests
npm run db:seed      # Seed database
\`\`\`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

### Docker

\`\`\`bash
docker-compose up -d
\`\`\`

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push and create PR

## License

MIT License - see LICENSE file

## Support

For issues and questions:
- GitHub Issues
- Email: support@fairsplit.ai

---

Built with ❤️ for CodeSpring Hackathon 2024
