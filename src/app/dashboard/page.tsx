'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardData {
  totalReceipts: number
  activeGroups: number
  pendingDebts: number
  totalSpent: number
  recentActivity: Array<{
    id: string
    merchant: string
    group: string | null
    total: number
    date: string
  }>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="p-8">Error loading dashboard</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your overview</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            setLoading(true)
            await fetchDashboard()
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Link href="/receipts" className="group">
          <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg text-white hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-100 text-sm">Total Receipts</h3>
                <p className="text-4xl font-bold mt-2">{data.totalReceipts}</p>
              </div>
              <div className="text-5xl opacity-50 group-hover:opacity-100 transition-opacity">🧾</div>
            </div>
          </div>
        </Link>

        <Link href="/groups" className="group">
          <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg text-white hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-purple-100 text-sm">Active Groups</h3>
                <p className="text-4xl font-bold mt-2">{data.activeGroups}</p>
              </div>
              <div className="text-5xl opacity-50 group-hover:opacity-100 transition-opacity">👥</div>
            </div>
          </div>
        </Link>

        <div className="p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-red-100 text-sm">Pending Debts</h3>
              <p className="text-4xl font-bold mt-2">${data.pendingDebts.toFixed(2)}</p>
            </div>
            <div className="text-5xl opacity-50">⚠️</div>
          </div>
        </div>

        <Link href="/analytics" className="group">
          <div className="p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg text-white hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-100 text-sm">Total Spent</h3>
                <p className="text-4xl font-bold mt-2">${data.totalSpent.toFixed(2)}</p>
              </div>
              <div className="text-5xl opacity-50 group-hover:opacity-100 transition-opacity">💰</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 border rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          <Link href="/receipts" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All →
          </Link>
        </div>
        {data.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🧾</span>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {activity.merchant || 'Unknown Merchant'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {activity.group && (
                          <>
                            <span>{activity.group}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-xl font-bold text-green-600">
                  ${activity.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 mb-4">No recent activity</p>
            <Link href="/receipts" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block">
              Upload Your First Receipt
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link href="/receipts">
          <div className="bg-white p-6 border rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <div className="text-4xl mb-3">📤</div>
            <h3 className="text-lg font-bold mb-2">Upload Receipt</h3>
            <p className="text-sm text-gray-600">Scan and parse a new receipt with AI</p>
          </div>
        </Link>

        <Link href="/groups">
          <div className="bg-white p-6 border rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <div className="text-4xl mb-3">➕</div>
            <h3 className="text-lg font-bold mb-2">Create Group</h3>
            <p className="text-sm text-gray-600">Start a new expense sharing group</p>
          </div>
        </Link>

        <Link href="/analytics">
          <div className="bg-white p-6 border rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-bold mb-2">View Analytics</h3>
            <p className="text-sm text-gray-600">See detailed spending insights</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
