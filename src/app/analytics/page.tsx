'use client'
import { useState, useEffect } from 'react'

interface AnalyticsData {
  totalReceipts: number
  totalSpent: number
  totalGroups: number
  pendingDebts: number
  recentReceipts: Array<{
    merchant: string
    total: number
    date: string
  }>
  topSpenders: Array<{
    name: string
    total: number
  }>
  categoryBreakdown: Array<{
    category: string
    total: number
    count: number
  }>
  monthlySpending: Array<{
    month: string
    amount: number
  }>
  groupActivity: Array<{
    group: string
    receipts: number
    total: number
  }>
  debtStatus: {
    settled: number
    pending: number
  }
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/full')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">No data available. Start by uploading some receipts!</p>
        </div>
      </div>
    )
  }

  const maxSpending = Math.max(...data.recentReceipts.map(r => r.total), 1)
  const maxCategory = Math.max(...data.categoryBreakdown.map(c => c.total), 1)
  const maxMonthly = Math.max(...data.monthlySpending.map(m => m.amount), 1)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your spending</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            setLoading(true)
            await fetchAnalytics()
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* GRAPH 1: Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Receipts</p>
              <p className="text-4xl font-bold mt-2">{data.totalReceipts}</p>
            </div>
            <div className="text-5xl opacity-50">🧾</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Spent</p>
              <p className="text-4xl font-bold mt-2">${data.totalSpent.toFixed(0)}</p>
            </div>
            <div className="text-5xl opacity-50">💰</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Active Groups</p>
              <p className="text-4xl font-bold mt-2">{data.totalGroups}</p>
            </div>
            <div className="text-5xl opacity-50">👥</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Pending Debts</p>
              <p className="text-4xl font-bold mt-2">${data.pendingDebts.toFixed(0)}</p>
            </div>
            <div className="text-5xl opacity-50">⚠️</div>
          </div>
        </div>
      </div>

      {/* GRAPH 2: Recent Spending Bar Chart */}
      <div className="bg-white p-6 border rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>📊</span> Recent Spending Breakdown
        </h2>
        {data.recentReceipts.length > 0 ? (
          <div className="space-y-4">
            {data.recentReceipts.map((receipt, index) => (
              <div key={index} className="group">
                <div className="flex items-center gap-4 mb-1">
                  <div className="w-36 text-sm font-semibold truncate">
                    {receipt.merchant}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full transition-all duration-500 group-hover:from-blue-600 group-hover:to-purple-600"
                        style={{
                          width: `${(receipt.total / maxSpending) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-lg font-bold text-gray-800">${receipt.total.toFixed(2)}</span>
                  </div>
                  <div className="w-28 text-sm text-gray-500 text-right">
                    {new Date(receipt.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-400">Upload receipts to see spending analysis</p>
          </div>
        )}
      </div>

      {/* GRAPH 3 & 4: Category Breakdown and Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Category Breakdown Pie Chart (Styled as bars) */}
        <div className="bg-white p-6 border rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>🏷️</span> Category Breakdown
          </h2>
          {data.categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {data.categoryBreakdown.map((category, index) => {
                const colors = [
                  'from-pink-500 to-rose-500',
                  'from-orange-500 to-amber-500',
                  'from-cyan-500 to-blue-500',
                  'from-violet-500 to-purple-500',
                  'from-emerald-500 to-green-500'
                ];
                return (
                  <div key={index}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="font-medium capitalize">{category.category}</span>
                      <span className="text-gray-600">{category.count} items</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${colors[index % colors.length]} h-6 rounded-full flex items-center justify-end px-3`}
                        style={{ width: `${(category.total / maxCategory) * 100}%` }}
                      >
                        <span className="text-white text-xs font-bold">
                          ${category.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-400">No category data yet</p>
            </div>
          )}
        </div>

        {/* Monthly Spending Trend */}
        <div className="bg-white p-6 border rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>📈</span> Monthly Trend
          </h2>
          {data.monthlySpending.length > 0 ? (
            <div className="space-y-3">
              {data.monthlySpending.map((month, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="font-medium">{month.month}</span>
                    <span className="text-green-600 font-bold">${month.amount.toFixed(2)}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-6 rounded-full transition-all"
                      style={{ width: `${(month.amount / maxMonthly) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-400">No monthly data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* GRAPH 5 & 6: Top Spenders and Debt Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Spenders Leaderboard */}
        <div className="bg-white p-6 border rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>🏆</span> Top Spenders
          </h2>
          {data.topSpenders.length > 0 ? (
            <div className="space-y-3">
              {data.topSpenders.map((spender, index) => (
                <div key={index} className={`flex items-center gap-4 p-3 rounded-lg ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300' : 'bg-gray-50'}`}>
                  <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-gray-300'}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{spender.name}</div>
                    <div className="text-xs text-gray-500">Total Contributions</div>
                  </div>
                  <div className={`text-lg font-bold ${index === 0 ? 'text-yellow-600' : 'text-gray-700'}`}>
                    ${spender.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-400">No spender data yet</p>
            </div>
          )}
        </div>

        {/* Debt Status Donut */}
        <div className="bg-white p-6 border rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>💳</span> Debt Status
          </h2>
          <div className="flex items-center justify-center h-64">
            <div className="relative w-48 h-48">
              {data.debtStatus.settled + data.debtStatus.pending > 0 ? (
                <>
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="20"
                      strokeDasharray={`${(data.debtStatus.settled / (data.debtStatus.settled + data.debtStatus.pending)) * 251.2} 251.2`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-gray-800">
                      {Math.round((data.debtStatus.settled / (data.debtStatus.settled + data.debtStatus.pending)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">Settled</div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No debt data</p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">${data.debtStatus.settled.toFixed(2)}</div>
              <div className="text-xs text-green-700">Settled</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">${data.debtStatus.pending.toFixed(2)}</div>
              <div className="text-xs text-red-700">Pending</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
