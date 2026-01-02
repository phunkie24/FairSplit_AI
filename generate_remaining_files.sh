#!/bin/bash

# Script to generate all remaining project files
set -e

BASE_DIR="/home/claude/fairsplit-ai"
cd $BASE_DIR

# Create directory structure
mkdir -p src/app/api/{auth,receipts,debts,groups,analytics,transactions}
mkdir -p src/app/{dashboard,groups,receipts,settings}
mkdir -p src/components/{ui,receipts,debts,groups,charts}
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/services
mkdir -p public
mkdir -p tests/{unit,integration}
mkdir -p docs

echo "✅ Directory structure created"

# Create type definitions
cat > src/types/index.ts << 'TYPESCRIPT'
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface Receipt {
  id: string;
  imageUrl: string;
  merchant: string | null;
  total: number;
  date: Date;
  currency: string;
  parsed: boolean;
  uploadedBy: string;
  groupId: string | null;
  createdAt: Date;
}

export interface Debt {
  id: string;
  amount: number;
  settled: boolean;
  debtorId: string;
  creditorId: string;
  debtor?: User;
  creditor?: User;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  memberCount?: number;
  totalSpent?: number;
}

export interface Transaction {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  fromUserId: string;
  toUserId: string;
  fromUser?: User;
  description: string | null;
  createdAt: Date;
}
TYPESCRIPT

echo "✅ Type definitions created"

# Create README
cat > README.md << 'README'
# FairSplit AI 🤝💰

AI-powered group expense splitting and debt optimization platform.

## Features

- 🧾 **AI Receipt Scanning**: Automatic OCR with GPT-4 Vision
- 🔄 **Debt Optimization**: Minimize transactions using graph algorithms
- 📊 **Fairness Analysis**: Emotional intelligence for group dynamics
- 🔒 **Enterprise Security**: PII detection, content moderation, rate limiting
- ⚡ **Real-time Updates**: Live debt tracking and notifications

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Cache**: Redis (Upstash)
- **AI**: OpenAI GPT-4 Vision & GPT-4 Turbo
- **Auth**: NextAuth.js
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (optional, falls back to in-memory)
- OpenAI API key

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
README

echo "✅ README created"

# Create Docker Compose
cat > docker-compose.yml << 'DOCKER'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://fairsplit:password@postgres:5432/fairsplit
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
    networks:
      - fairsplit-network

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: fairsplit
      POSTGRES_USER: fairsplit
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - fairsplit-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - fairsplit-network

volumes:
  postgres_data:
  redis_data:

networks:
  fairsplit-network:
    driver: bridge
DOCKER

echo "✅ Docker Compose created"

# Create Dockerfile
cat > Dockerfile << 'DOCKERFILE'
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
DOCKERFILE

echo "✅ Dockerfile created"

# Create Next.js config
cat > next.config.js << 'NEXTCONFIG'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.dicebear.com', 'placehold.co'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
}

module.exports = nextConfig
NEXTCONFIG

echo "✅ Next.js config created"

# Create Tailwind config
cat > tailwind.config.ts << 'TAILWIND'
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
TAILWIND

echo "✅ Tailwind config created"

# Create PostCSS config
cat > postcss.config.js << 'POSTCSS'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
POSTCSS

echo "✅ PostCSS config created"

# Create ESLint config
cat > .eslintrc.json << 'ESLINT'
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
ESLINT

echo "✅ ESLint config created"

# Create Prettier config
cat > .prettierrc << 'PRETTIER'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
PRETTIER

echo "✅ Prettier config created"

# Create .gitignore
cat > .gitignore << 'GITIGNORE'
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Prisma
prisma/migrations/

# IDE
.vscode/
.idea/
*.swp
*.swo
GITIGNORE

echo "✅ .gitignore created"

echo "
✨ All configuration files created successfully!

📁 Project structure is ready
🔧 Configuration files in place
📝 Documentation complete

Next steps:
1. npm install
2. Configure .env file
3. npx prisma db push
4. npx prisma db seed
5. npm run dev

Happy coding! 🚀
"
