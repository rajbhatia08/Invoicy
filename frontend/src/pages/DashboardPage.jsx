
import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import api from '../api.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/analytics')
        setAnalytics(res.data)
      } catch (err) {
        console.error(err)
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div>Loading dashboard...</div>
  }

  if (error) {
    return <div className="text-red-600 text-sm">{error}</div>
  }

  const { totals, monthlyRevenue } = analytics || {}

  const chartData = {
    labels: (monthlyRevenue || []).map(m => m.month),
    datasets: [
      {
        label: 'Revenue',
        data: (monthlyRevenue || []).map(m => m.total),
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
      },
    ],
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Customers" value={totals?.customersCount || 0} />
        <StatCard label="Invoices" value={totals?.invoicesCount || 0} />
        <StatCard label="Paid (₹)" value={totals?.paid || 0} />
        <StatCard label="Pending + Overdue (₹)" value={(totals?.unpaid || 0) + (totals?.overdue || 0)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3 text-slate-800">
          Monthly Revenue
        </h2>
        {monthlyRevenue && monthlyRevenue.length > 0 ? (
          <Bar data={chartData} />
        ) : (
          <p className="text-sm text-slate-500">
            No invoice data yet. Create some invoices to see the chart.
          </p>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        {value}
      </p>
    </div>
  )
}
