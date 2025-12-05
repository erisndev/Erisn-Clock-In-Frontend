
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import dayjs from 'dayjs'
import ReportForm from '../components/ReportForm'
import { useAuth } from '../lib/auth'

export default function ReportDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/reports/${id}`)
        setReport(data)
      } catch (e) {
        alert('Failed to load report')
        nav('/reports')
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div>Loading...</div>
  if (!report) return null

  // If user is owner or admin they can edit
  const canEdit = user?.role === 'admin' || report.user?._id === user?._id

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Report</h2>
        <div>
          <button onClick={() => nav('/reports')} className="px-3 py-1 bg-slate-100 rounded mr-2">Back</button>
          {canEdit && <button onClick={() => setEditing(!editing)} className="px-3 py-1 bg-sky-600 text-white rounded">{editing ? 'Cancel' : 'Edit'}</button>}
        </div>
      </div>

      {editing ? (
        <div className="bg-white rounded shadow p-4">
          <ReportForm initial={report} onSuccess={(updated) => { setReport(updated); setEditing(false) }} />
        </div>
      ) : (
        <div className="bg-white rounded shadow p-6 space-y-4">
          <div className="flex justify-between">
            <div>
              <div className="text-sm text-slate-600">Author</div>
              <div className="font-medium">{report.user?.name}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Week</div>
              <div className="font-medium">{dayjs(report.weekStart).format('MMM D, YYYY')} — {dayjs(report.weekEnd).format('MMM D, YYYY')}</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-600">Summary</div>
            <div className="mt-1">{report.summary}</div>
          </div>

          <div>
            <div className="text-sm text-slate-600">Challenges</div>
            <div className="mt-1">{report.challenges || '-'}</div>
          </div>

          <div>
            <div className="text-sm text-slate-600">Learnings</div>
            <div className="mt-1">{report.learnings || '-'}</div>
          </div>

          <div>
            <div className="text-sm text-slate-600">Goals</div>
            <div className="mt-1">{report.goals || '-'}</div>
          </div>

          <div className="flex gap-3 mt-4">
            <div className={`px-2 py-1 rounded ${report.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {report.approved ? 'Approved' : 'Pending'}
            </div>
            {user?.role === 'admin' && (
              <>
                <button onClick={async () => {
                  try {
                    await api.post(`/reports/${id}/approve`, { approved: !report.approved })
                    const { data } = await api.get(`/reports/${id}`)
                    setReport(data)
                  } catch (e) { alert('Failed to update') }
                }} className="px-3 py-1 bg-slate-100 rounded">
                  {report.approved ? 'Unapprove' : 'Approve'}
                </button>
                <button onClick={async () => {
                  if (!confirm('Delete this report?')) return
                  try {
                    await api.delete(`/reports/${id}`)
                    nav('/reports')
                  } catch (e) { alert('Delete failed') }
                }} className="px-3 py-1 bg-red-100 text-red-700 rounded">Delete</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
