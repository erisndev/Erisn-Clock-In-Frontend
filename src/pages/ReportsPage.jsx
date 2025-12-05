// src/pages/ReportsPage.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import api from '../lib/api'
import dayjs from 'dayjs'
import ReportForm from '../components/ReportForm'
import { useAuth } from '../lib/auth'

const fetcher = (url) => api.get(url).then(r => r.data)

export default function ReportsPage() {
  const { user } = useAuth()
  // If admin, fetch all reports. If graduate, fetch only own reports.
  const url = user?.role === 'admin' ? '/reports' : '/reports?mine=true'
  const { data, error, mutate } = useSWR(user ? url : null, fetcher, { revalidateOnFocus: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Weekly Reports</h2>
        <div className="flex gap-2 items-center">
          {user?.role === 'admin' && (
            <button
              onClick={() => window.open(api.defaults.baseURL + '/reports/export', '_blank')}
              className="px-3 py-1 rounded bg-slate-200 text-sm"
            >
              Export CSV
            </button>
          )}
          <Link to="/reports/new" className="px-3 py-1 rounded bg-sky-600 text-white text-sm">New Report</Link>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        {error && <div className="p-4 text-red-600">Failed to load reports</div>}
        {!data ? (
          <div className="p-4">Loading...</div>
        ) : data.length === 0 ? (
          <div className="p-4">No reports yet. Click "New Report" to create one.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Week</th>
                <th className="px-3 py-2">Summary</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r._id} className="border-t">
                  <td className="px-3 py-2">{r.user?.name ?? '—'}</td>
                  <td className="px-3 py-2">
                    {dayjs(r.weekStart).format('MMM D, YYYY')} — {dayjs(r.weekEnd).format('MMM D, YYYY')}
                  </td>
                  <td className="px-3 py-2">{(r.summary || '').slice(0, 140)}</td>
                  <td className="px-3 py-2">{r.approved ? 'Approved' : 'Pending'}</td>
                  <td className="px-3 py-2">
                    <Link to={`/reports/${r._id}`} className="text-sky-600 hover:underline mr-3">View</Link>
                    {user?.role === 'admin' && (
                      <button onClick={async () => {
                        // quick approve toggle (admin)
                        try {
                          await api.post(`/reports/${r._id}/approve`, { approved: !r.approved })
                          mutate()
                        } catch (e) { alert('Failed') }
                      }} className="text-sm px-2 py-1 bg-slate-100 rounded">
                        {r.approved ? 'Unapprove' : 'Approve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
