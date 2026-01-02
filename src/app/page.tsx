import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            FairSplit AI 🤝💰
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            AI-powered group expense splitting and debt optimization
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
            <Link
              href="/receipts"
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition"
            >
              Upload Receipt
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-lg shadow-lg border">
            <div className="text-4xl mb-4">🧾</div>
            <h3 className="text-2xl font-bold mb-3">AI Receipt Scanning</h3>
            <p className="text-gray-600 mb-4">
              Automatic OCR with GPT-4 Vision extracts merchant, items, and totals from receipts
            </p>
            <Link href="/receipts" className="text-blue-600 hover:underline font-medium">
              Try it now →
            </Link>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg border">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-2xl font-bold mb-3">Debt Optimization</h3>
            <p className="text-gray-600 mb-4">
              Minimize transactions by up to 70% using graph-based algorithms
            </p>
            <Link href="/groups" className="text-blue-600 hover:underline font-medium">
              Optimize debts →
            </Link>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg border">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-bold mb-3">Fairness Analysis</h3>
            <p className="text-gray-600 mb-4">
              Emotional intelligence for group dynamics and spending patterns
            </p>
            <Link href="/analytics" className="text-blue-600 hover:underline font-medium">
              View analytics →
            </Link>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg border">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-2xl font-bold mb-3">Enterprise Security</h3>
            <p className="text-gray-600 mb-4">
              PII detection, content moderation, rate limiting, and audit logging
            </p>
            <Link href="/dashboard" className="text-blue-600 hover:underline font-medium">
              Learn more →
            </Link>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-gray-900 text-white p-8 rounded-lg">
          <h2 className="text-3xl font-bold mb-6">🚀 Quick Start</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-blue-400 font-mono text-sm mb-2">Step 1</div>
              <h4 className="font-semibold mb-2">Create a Group</h4>
              <p className="text-gray-300 text-sm">Add members and start tracking expenses together</p>
            </div>
            <div>
              <div className="text-blue-400 font-mono text-sm mb-2">Step 2</div>
              <h4 className="font-semibold mb-2">Upload Receipts</h4>
              <p className="text-gray-300 text-sm">AI automatically extracts all the details</p>
            </div>
            <div>
              <div className="text-blue-400 font-mono text-sm mb-2">Step 3</div>
              <h4 className="font-semibold mb-2">Optimize & Settle</h4>
              <p className="text-gray-300 text-sm">Let AI minimize transactions and settle up</p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Built with Next.js 14 • TypeScript • Prisma • OpenAI GPT-4 • Tailwind CSS
          </p>
        </div>
      </div>
    </main>
  )
}
