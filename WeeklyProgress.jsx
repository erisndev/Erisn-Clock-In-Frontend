
export default function WeeklyProgress() {
  const { token } = useAuth()               // get the JWT for protected calls
  const [reports, setReports] = useState([]) // all reports for the user
  const [loading, setLoading] = useState(true)

  // ---------- fetch all reports ----------
  useEffect(() => {
    async function fetchReports() {
      const res = await fetch("/api/reports", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setReports(data)
      setLoading(false)
    }
    if (token) fetchReports()
  }, [token])

  if (loading) return null

  // ---------- calculate progress ----------
  const now = new Date()
  // count reports whose weekStart falls in the current month
  const monthReports = reports.filter(
    (r) => new Date(r.weekStart).getMonth() === now.getMonth()
  )
  // assume a maximum of 4 reports per month (one per week)
  const percent = (monthReports.length / 4) * 100

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">Monthly Progress</span>
        <span className="text-sm font-medium">
          {monthReports.length}/4
        </span>
      </div>
      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}