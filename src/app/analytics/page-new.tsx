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
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading analytics...</div>
  }

  if (!data) {
    return <div className="p-8">No data available</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <button
          type="button"
          onClick={async () => {
            setLoading(true)
            await fetchAnalytics()
          }}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 border rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Receipts</h3>
          <p className="text-3xl font-bold">{data.totalReceipts}</p>
        </div>
        <div className="bg-white p-6 border rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Spent</h3>
          <p className="text-3xl font-bold text-green-600">${data.totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 border rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Active Groups</h3>
          <p className="text-3xl font-bold">{data.totalGroups}</p>
        </div>
        <div className="bg-white p-6 border rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Pending Debts</h3>
          <p className="text-3xl font-bold text-red-600">${data.pendingDebts.toFixed(2)}</p>
        </div>
      </div>

      {/* Spending Chart (Simple Bar Chart) */}
      <div className="bg-white p-6 border rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Recent Spending</h2>
        {data.recentReceipts.length > 0 ? (
          <div className="space-y-3">
            {data.recentReceipts.map((receipt, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium truncate">
                  {receipt.merchant || 'Unknown'}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end px-2"
                    style={{
                      width: `${Math.min((receipt.total / Math.max(...data.recentReceipts.map(r => r.total))) * 100, 100)}%`
                    }}
                  >
                    <span className="text-white text-xs font-semibold">
                      ${receipt.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="w-24 text-sm text-gray-500 text-right">
                  {new Date(receipt.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-400">No receipts yet. Upload some to see spending analysis!</p>
          </div>
        )}
      </div>

      {/* Top Spenders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 border rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Top Spenders</h3>
          {data.topSpenders.length > 0 ? (
            <div className="space-y-3">
              {data.topSpenders.map((spender, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{spender.name}</span>
                  <span className="text-green-600 font-bold">${spender.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No spending data yet</p>
          )}
        </div>

        <div className="bg-white p-6 border rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Average per Receipt:</span>
              <span className="font-semibold">
                ${data.totalReceipts > 0 ? (data.totalSpent / data.totalReceipts).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Groups with Debts:</span>
              <span className="font-semibold">{data.totalGroups}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Settlement Rate:</span>
              <span className="font-semibold">
                {data.pendingDebts > 0 ? '0%' : '100%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
