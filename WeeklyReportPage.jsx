import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  CalendarIcon,
  FileTextIcon,
  PlusCircleIcon,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function WeeklyReportPage() {
  // ---------- auth & state ----------
  const { user, token } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  // ---------- fetch reports ----------
  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Failed to fetch reports")
        const data = await res.json()
        setReports(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchReports()
  }, [token])

  // ---------- create report ----------
  const onSubmit = async (data) => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create report")
      const newReport = await res.json()
      setReports((prev) => [newReport, ...prev])
      reset()
      setShowCreateDialog(false)
    } catch (e) {
      setError(e.message)
    }
  }

  // ---------- progress bar logic ----------
  const now = new Date()
  const thisMonthReports = reports.filter(
    (r) => new Date(r.weekStart).getMonth() === now.getMonth()
  )
  const progressPercent = (thisMonthReports.length / 4) * 100 // max 4 weeks/month

  if (loading) return <div className="p-6 text-center">Loading…</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Weekly Reports</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <PlusCircleIcon className="mr-2 h-4 w-4" /> New Report
        </Button>
      </div>

      {/* Monthly progress bar */}
      <Card className="bg-white border-l-4 border-primary">
        <CardContent className="p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Monthly Progress</span>
            <span className="text-sm font-medium">
              {thisMonthReports.length}/4
            </span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports list */}
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <FileTextIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-lg">No reports submitted yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {format(new Date(report.weekStart), "MMM dd")} –{" "}
                  {format(new Date(report.weekEnd), "MMM dd, yyyy")}
                </CardTitle>
                <CardDescription>
                  Submitted {format(new Date(report.createdAt), "PP")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-sm">Tasks</h3>
                  <p className="text-sm text-muted-foreground">
                    {report.tasks || "—"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Challenges</h3>
                  <p className="text-sm text-muted-foreground">
                    {report.challenges || "—"}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/reports/${report._id}`}>View Details</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Report Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Submit Weekly Report</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Week Start</label>
              <Input type="date" {...register("weekStart", { required: true })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Week End</label>
              <Input type="date" {...register("weekEnd", { required: true })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tasks Completed</label>
              <Textarea {...register("tasks", { required: true })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Challenges Faced</label>
              <Textarea {...register("challenges")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Learnings</label>
              <Textarea {...register("learnings")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Goals for Next Week</label>
              <Textarea {...register("goals")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}