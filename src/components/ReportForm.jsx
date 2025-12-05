// src/components/ReportForm.jsx
import React, { useState, useEffect } from 'react'
import api from '../lib/api'
import dayjs from 'dayjs'
import { useAuth } from '../lib/auth'

export default function ReportForm({ initial = null, onSuccess = null }) {
  // initial may be existing report for editing
  const [weekStart, setWeekStart] = useState(initial ? dayjs(initial.weekStart).format('YYYY-MM-DD') : dayjs().startOf('week').format('YYYY-MM-DD'))
  const [weekEnd, setWeekEnd] = useState(initial ? dayjs(initial.weekEnd).format('YYYY-MM-DD') : dayjs().endOf('week').format('YYYY-MM-DD'))
  const [summary, setSummary] = useState(initial?.summary || '')
  const [challenges, setChallenges] = useState(initial?.challenges || '')
  const [learnings, setLearnings] = useState(initial?.learnings || '')
  const [goals, setGoals] = useState(initial?.goals || '')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (initial) {
      setWeekStart(dayjs(initial.weekStart).format('YYYY-MM-DD'))
      setWeekEnd(dayjs(initial.weekEnd).format('YYYY-MM-DD'))
      setSummary(initial.summary || '')
      setChallenges(initial.challenges || '')
      setLearnings(initial.learnings || '')
      setGoals(initial.goals || '')
    }
  }, [initial])

  async function handleSubmit(e) {
    e.preventDefault()
    // Basic validation
    if (!summary.trim()) { alert('Please add a summary'); return }
    // Ensure weekStart <= weekEnd
    if (dayjs(weekEnd).isBefore(dayjs(weekStart))) { alert('Week end must be on or after week start'); return }

    setLoading(true)
    try {
      if (initial && initial._id) {
        // update
        const { data } = await api.put(`/reports/${initial._id}`, {
          weekStart, weekEnd, summary, challenges, learnings, goals
        })
        onSuccess?.(data)
        alert('Report updated')
      } else {
        // create
        const payload = { weekStart, weekEnd, summary, challenges, learnings, goals }
        const { data } = await api.post('/reports', payload)
        onSuccess?.(data)
        alert('Report submitted')
        // reset fields for new entry
        setSummary(''); setChallenges(''); setLearnings(''); setGoals('')
        // set week to next week automatically
        const nextWeekStart = dayjs(weekStart).add(7, 'day').format('YYYY-MM-DD')
        const nextWeekEnd = dayjs(weekEnd).add(7, 'day').format('YYYY-MM-DD')
        setWeekStart(nextWeekStart); setWeekEnd(nextWeekEnd)
      }
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.message || 'Failed to save report')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
      <div className="flex gap-3 items-center">
        <div>
          <label className="text-sm block">Week start</label>
          <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="text-sm block">Week end</label>
          <input type="date" value={weekEnd} onChange={e => setWeekEnd(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        {user?.role === 'admin' && initial && (
          <div className="ml-auto text-sm text-slate-600">Author: {initial.user?.name}</div>
        )}
      </div>

      <div>
        <label className="text-sm block">Summary of tasks completed</label>
        <textarea value={summary} onChange={e => setSummary(e.target.value)} required className="w-full border rounded p-2 h-28" />
      </div>

      <div>
        <label className="text-sm block">Challenges faced</label>
        <textarea value={challenges} onChange={e => setChallenges(e.target.value)} className="w-full border rounded p-2 h-20" />
      </div>

      <div>
        <label className="text-sm block">Learnings for the week</label>
        <textarea value={learnings} onChange={e => setLearnings(e.target.value)} className="w-full border rounded p-2 h-20" />
      </div>

      <div>
        <label className="text-sm block">Goals for next week</label>
        <textarea value={goals} onChange={e => setGoals(e.target.value)} className="w-full border rounded p-2 h-20" />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-sky-600 text-white">
          {loading ? 'Saving...' : (initial ? 'Update Report' : 'Submit Report')}
        </button>
      </div>
    </form>
  )
}
