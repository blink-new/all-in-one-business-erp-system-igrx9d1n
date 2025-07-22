import React, { useState, useEffect, useCallback } from 'react'
import { Play, Pause, Square, Clock, Calendar, User, TrendingUp, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { blink } from '@/blink/client'

interface TimeEntry {
  id: string
  employeeId: string
  projectId?: string
  taskId?: string
  startTime: string
  endTime?: string
  duration?: number // in minutes
  description: string
  status: 'active' | 'completed' | 'paused'
  date: string
  userId: string
  createdAt: string
  updatedAt: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  position: string
  department: string
  status: string
}

interface Project {
  id: string
  name: string
  status: string
}

export default function TimeTracking() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isClockInDialogOpen, setIsClockInDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('clock')

  const [clockInData, setClockInData] = useState({
    employeeId: '',
    projectId: 'none',
    taskId: '',
    description: ''
  })

  // Update current time every second for active timer display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const loadTimeEntries = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.timeEntries.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setTimeEntries(data)
      
      // Find active timer
      const active = data.find(entry => entry.status === 'active')
      setActiveTimer(active || null)
    } catch (error) {
      console.error('Error loading time entries:', error)
      toast({
        title: 'Error',
        description: 'Failed to load time entries',
        variant: 'destructive'
      })
    }
  }, [])

  const loadEmployees = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.employees.list({
        where: { userId: user.id, status: 'active' },
        orderBy: { firstName: 'asc' }
      })
      setEmployees(data)
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }, [])

  const loadProjects = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.projects.list({
        where: { userId: user.id, status: 'active' },
        orderBy: { name: 'asc' }
      })
      setProjects(data)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadTimeEntries(), loadEmployees(), loadProjects()])
      setLoading(false)
    }
    loadData()
  }, [loadTimeEntries, loadEmployees, loadProjects])

  const resetClockInForm = () => {
    setClockInData({
      employeeId: '',
      projectId: 'none',
      taskId: '',
      description: ''
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee'
  }

  const getProjectName = (projectId?: string) => {
    if (!projectId) return '-'
    const project = projects.find(proj => proj.id === projectId)
    return project ? project.name : 'Unknown Project'
  }

  const getCurrentTimerDuration = () => {
    if (!activeTimer || activeTimer.status !== 'active') return 0
    const startTime = new Date(activeTimer.startTime)
    return Math.floor((currentTime.getTime() - startTime.getTime()) / (1000 * 60))
  }

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayEntries = timeEntries.filter(entry => entry.date === today)
    
    const totalMinutes = todayEntries.reduce((sum, entry) => {
      if (entry.status === 'completed' && entry.duration) {
        return sum + entry.duration
      } else if (entry.status === 'active') {
        return sum + getCurrentTimerDuration()
      }
      return sum
    }, 0)

    return {
      totalTime: formatDuration(totalMinutes),
      activeEmployees: new Set(todayEntries.map(entry => entry.employeeId)).size,
      completedSessions: todayEntries.filter(entry => entry.status === 'completed').length
    }
  }

  const getWeekStats = () => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoString = weekAgo.toISOString().split('T')[0]
    
    const weekEntries = timeEntries.filter(entry => entry.date >= weekAgoString)
    
    const totalMinutes = weekEntries.reduce((sum, entry) => {
      return sum + (entry.duration || 0)
    }, 0)

    return {
      totalTime: formatDuration(totalMinutes),
      totalSessions: weekEntries.filter(entry => entry.status === 'completed').length,
      averagePerDay: formatDuration(Math.floor(totalMinutes / 7))
    }
  }

  const handleClockIn = async () => {
    try {
      const user = await blink.auth.me()
      const now = new Date()
      
      const newTimeEntry = {
        id: `time_${Date.now()}`,
        ...clockInData,
        projectId: clockInData.projectId === 'none' ? '' : clockInData.projectId,
        startTime: now.toISOString(),
        status: 'active' as const,
        date: now.toISOString().split('T')[0],
        userId: user.id,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }

      await blink.db.timeEntries.create(newTimeEntry)
      await loadTimeEntries()
      setIsClockInDialogOpen(false)
      resetClockInForm()
      toast({
        title: 'Success',
        description: 'Clocked in successfully'
      })
    } catch (error) {
      console.error('Error clocking in:', error)
      toast({
        title: 'Error',
        description: 'Failed to clock in',
        variant: 'destructive'
      })
    }
  }

  const handleClockOut = async () => {
    if (!activeTimer) return

    try {
      const now = new Date()
      const startTime = new Date(activeTimer.startTime)
      const duration = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)) // minutes

      await blink.db.timeEntries.update(activeTimer.id, {
        endTime: now.toISOString(),
        duration,
        status: 'completed',
        updatedAt: now.toISOString()
      })

      await loadTimeEntries()
      toast({
        title: 'Success',
        description: `Clocked out successfully. Total time: ${formatDuration(duration)}`
      })
    } catch (error) {
      console.error('Error clocking out:', error)
      toast({
        title: 'Error',
        description: 'Failed to clock out',
        variant: 'destructive'
      })
    }
  }

  const handlePauseResume = async () => {
    if (!activeTimer) return

    try {
      const newStatus = activeTimer.status === 'active' ? 'paused' : 'active'
      
      await blink.db.timeEntries.update(activeTimer.id, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })

      await loadTimeEntries()
      toast({
        title: 'Success',
        description: newStatus === 'paused' ? 'Timer paused' : 'Timer resumed'
      })
    } catch (error) {
      console.error('Error updating timer:', error)
      toast({
        title: 'Error',
        description: 'Failed to update timer',
        variant: 'destructive'
      })
    }
  }

  const todayStats = getTodayStats()
  const weekStats = getWeekStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading time tracking...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">Track work hours, manage timesheets, and monitor productivity</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clock" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Clock
          </TabsTrigger>
          <TabsTrigger value="timesheets" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timesheets ({timeEntries.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clock" className="space-y-6">
          {/* Active Timer Display */}
          {activeTimer && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Clock className="h-5 w-5" />
                  Active Timer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{getEmployeeName(activeTimer.employeeId)}</p>
                      <p className="text-sm text-muted-foreground">{activeTimer.description}</p>
                      {activeTimer.projectId && (
                        <p className="text-sm text-muted-foreground">
                          Project: {getProjectName(activeTimer.projectId)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-900">
                        {formatDuration(getCurrentTimerDuration())}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Started at {formatTime(activeTimer.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePauseResume}
                      variant="outline"
                      className="flex-1"
                    >
                      {activeTimer.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleClockOut}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Clock Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clock In Button */}
          {!activeTimer && (
            <Card>
              <CardHeader>
                <CardTitle>Clock In</CardTitle>
                <CardDescription>Start tracking time for work activities</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isClockInDialogOpen} onOpenChange={setIsClockInDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full">
                      <Play className="h-5 w-5 mr-2" />
                      Clock In
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Clock In</DialogTitle>
                      <DialogDescription>
                        Start a new time tracking session
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="employee">Employee</Label>
                        <Select value={clockInData.employeeId} onValueChange={(value) => setClockInData({...clockInData, employeeId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.firstName} {emp.lastName} - {emp.position}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="project">Project (Optional)</Label>
                        <Select value={clockInData.projectId} onValueChange={(value) => setClockInData({...clockInData, projectId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Project</SelectItem>
                            {projects.map(proj => (
                              <SelectItem key={proj.id} value={proj.id}>
                                {proj.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={clockInData.description}
                          onChange={(e) => setClockInData({...clockInData, description: e.target.value})}
                          placeholder="What are you working on?"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsClockInDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleClockIn}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Timer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {/* Today's Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Total</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayStats.totalTime}</div>
                <p className="text-xs text-muted-foreground">
                  {todayStats.completedSessions} completed sessions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayStats.activeEmployees}</div>
                <p className="text-xs text-muted-foreground">
                  Working today
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Time</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentTime.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Time Entries</CardTitle>
              <CardDescription>
                View and manage time tracking records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(entry.employeeId)}
                      </TableCell>
                      <TableCell>
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{formatTime(entry.startTime)}</TableCell>
                      <TableCell>
                        {entry.endTime ? formatTime(entry.endTime) : '-'}
                      </TableCell>
                      <TableCell>
                        {entry.status === 'active' 
                          ? formatDuration(getCurrentTimerDuration())
                          : entry.duration 
                            ? formatDuration(entry.duration)
                            : '-'
                        }
                      </TableCell>
                      <TableCell>{getProjectName(entry.projectId)}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            entry.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : entry.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {timeEntries.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No time entries found</h3>
                  <p className="text-muted-foreground mb-4">
                    Start tracking time to see entries here
                  </p>
                  <Button onClick={() => setActiveTab('clock')}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Tracking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Summary</CardTitle>
                <CardDescription>Last 7 days performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Hours</span>
                  <span className="text-2xl font-bold">{weekStats.totalTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Sessions</span>
                  <span className="text-lg font-semibold">{weekStats.totalSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Daily Average</span>
                  <span className="text-lg font-semibold">{weekStats.averagePerDay}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productivity Insights</CardTitle>
                <CardDescription>Performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Employees</span>
                  <span className="text-lg font-semibold">{employees.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Projects Tracked</span>
                  <span className="text-lg font-semibold">{projects.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-lg font-semibold">
                    {timeEntries.length > 0 
                      ? Math.round((timeEntries.filter(e => e.status === 'completed').length / timeEntries.length) * 100)
                      : 0
                    }%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>Download time tracking reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}