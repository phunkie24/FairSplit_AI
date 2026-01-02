# FairSplit AI - Complete Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 20.0.0 or higher
- ✅ PostgreSQL 15 or higher
- ✅ Redis (optional, will use in-memory fallback)
- ✅ OpenAI API key
- ✅ Git

## 🚀 Quick Start (5 minutes)

### 1. Clone or Extract Project

```bash
# If from zip:
unzip fairsplit-ai.zip
cd fairsplit-ai

# If from git:
git clone <repository-url>
cd fairsplit-ai
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages (~500MB).

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure:

**Required:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/fairsplit?schema=public"
OPENAI_API_KEY="sk-your-key-here"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

**Optional (for production):**
```env
REDIS_URL="redis://localhost:6379"
REDIS_TOKEN="your-redis-token"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
```

### 4. Set Up Database

```bash
# Create database schema
npx prisma db push

# Seed with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

### 6. Test Login

Use sample credentials:
- **Email:** alice@example.com
- **Password:** password123

## 🗄️ Database Setup Options

### Option A: Local PostgreSQL

1. Install PostgreSQL 15+
2. Create database:
```sql
CREATE DATABASE fairsplit;
CREATE USER fairsplit_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fairsplit TO fairsplit_user;
```

3. Update `.env`:
```env
DATABASE_URL="postgresql://fairsplit_user:your_password@localhost:5432/fairsplit?schema=public"
```

### Option B: Docker PostgreSQL

```bash
docker run --name fairsplit-postgres \
  -e POSTGRES_DB=fairsplit \
  -e POSTGRES_USER=fairsplit \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15-alpine
```

Update `.env`:
```env
DATABASE_URL="postgresql://fairsplit:password@localhost:5432/fairsplit?schema=public"
```

### Option C: Cloud Database (Recommended for Production)

**Neon (Free tier available):**
1. Sign up at https://neon.tech
2. Create database
3. Copy connection string to `.env`

**Supabase (Free tier available):**
1. Sign up at https://supabase.com
2. Create project
3. Copy connection string to `.env`

## 🔑 API Keys Setup

### OpenAI API Key (Required)

1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Add to `.env`:
```env
OPENAI_API_KEY="sk-..."
```

**Cost Estimate:**
- Receipt scanning: ~$0.01-0.03 per receipt
- Fairness analysis: ~$0.005-0.01 per analysis
- Free tier: $5 credit for new accounts

### Redis (Optional)

**Option A: Local Redis**
```bash
docker run --name fairsplit-redis -p 6379:6379 -d redis:7-alpine
```

**Option B: Upstash (Free tier)**
1. Sign up at https://upstash.com
2. Create Redis database
3. Add to `.env`:
```env
REDIS_URL="https://your-instance.upstash.io"
REDIS_TOKEN="your-token"
```

**Note:** If no Redis, app uses in-memory cache (works fine for development).

### AWS S3 (Optional - for receipt storage)

1. Create S3 bucket
2. Create IAM user with S3 permissions
3. Add to `.env`:
```env
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="fairsplit-receipts"
```

**Alternative:** Use local file storage (default in development).

## 🧪 Testing & Development

### Run Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

### Database Management

```bash
# Open Prisma Studio (DB GUI)
npm run db:studio

# Create migration
npm run db:migrate

# Reset database
npx prisma db push --force-reset
npm run db:seed
```

### Code Quality

```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Format code
npm run format
```

## 📦 Production Deployment

### Option A: Vercel (Recommended - 1-Click)

1. Push code to GitHub
2. Visit https://vercel.com
3. Import repository
4. Add environment variables
5. Deploy!

**Auto-deploys on git push.**

### Option B: Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Option C: Traditional Server

```bash
# Build
npm run build

# Start
npm start
```

**Environment:** Set `NODE_ENV=production`

## 🔧 Configuration

### Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection | `postgresql://...` |
| `OPENAI_API_KEY` | Yes | OpenAI API key | `sk-...` |
| `NEXTAUTH_SECRET` | Yes | Auth secret | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | App URL | `https://your-domain.com` |
| `REDIS_URL` | No | Redis URL | `redis://localhost:6379` |
| `AWS_ACCESS_KEY_ID` | No | AWS key | For S3 uploads |
| `GOOGLE_CLIENT_ID` | No | Google OAuth | For Google login |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth | For GitHub login |

### Feature Flags

Customize in `.env`:

```env
# Enable email verification
ENABLE_EMAIL_VERIFICATION=false

# Enable payment integration
ENABLE_PAYMENT_INTEGRATION=false

# Rate limits
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=30
```

## 🐛 Troubleshooting

### Database Connection Issues

**Error:** "Can't reach database server"

**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify connection string in `.env`
3. Check firewall/network settings

### OpenAI API Errors

**Error:** "Incorrect API key"

**Solution:**
1. Verify API key in `.env`
2. Check account has credits: https://platform.openai.com/account/billing

**Error:** "Rate limit exceeded"

**Solution:**
1. Wait a few seconds and retry
2. Upgrade OpenAI plan
3. Implement request queuing

### Build Errors

**Error:** "Module not found"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Error:** Prisma client out of sync

**Solution:**
```bash
npx prisma generate
```

### Port Already in Use

**Error:** "Port 3000 already in use"

**Solution:**
```bash
# Find process
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev
```

## 📊 Sample Data

The seed script creates:

- **4 Users:** alice, bob, charlie, diana
- **2 Groups:** Roommates, Weekend Trip
- **3 Receipts:** Restaurant, Groceries, Hotel
- **6 Debts:** Various amounts, some settled
- **2 Transactions:** One completed, one pending

Test workflows:
1. Upload receipt → Parse with AI
2. Calculate debts → Optimize transactions
3. View fairness report
4. Settle debts

## 🎓 Architecture Overview

```
fairsplit-ai/
├── src/
│   ├── agents/          # AI Agent system
│   │   ├── base/
│   │   ├── ReceiptScannerAgent.ts
│   │   ├── DebtOptimizerAgent.ts
│   │   └── EmotionalIntelligenceAgent.ts
│   ├── app/             # Next.js app router
│   │   ├── api/         # API routes
│   │   └── (pages)/     # Page components
│   ├── components/      # React components
│   ├── lib/             # Utilities & config
│   ├── security/        # Security layer
│   ├── guardrails/      # AI guardrails
│   └── patterns/        # AI patterns
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Sample data
└── tests/               # Test files
```

## 🔐 Security Features

✅ Input sanitization (XSS prevention)
✅ PII detection & redaction
✅ Prompt injection prevention
✅ Content moderation (OpenAI)
✅ Rate limiting
✅ Audit logging
✅ CSRF protection (NextAuth)
✅ SQL injection prevention (Prisma)

## 📚 Resources

- **Documentation:** See `/docs` folder
- **API Docs:** Visit `/api-docs` when running
- **Component Storybook:** `npm run storybook`
- **Database Schema:** Open `prisma/schema.prisma`

## 🤝 Support

**Issues?**
- Check troubleshooting section
- Review logs: `docker-compose logs` or console
- Search GitHub issues
- Create new issue with logs

**Questions?**
- Read documentation
- Check API examples in `/docs/api-examples.md`
- Review code comments

## 📄 License

MIT License - Free to use and modify

---

**Ready to build?** 🚀

```bash
npm run dev
```

Then visit: http://localhost:3000
