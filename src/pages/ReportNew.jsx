// src/pages/ReportNew.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import ReportForm from '../components/ReportForm'

export default function ReportNew() {
  const nav = useNavigate()
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">New Weekly Report</h2>
      </div>
      <div className="bg-white rounded shadow p-4">
        <ReportForm onSuccess={() => nav('/reports')} />
      </div>
    </div>
  )
}
