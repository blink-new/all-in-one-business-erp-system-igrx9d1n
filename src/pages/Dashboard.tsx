import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Package, 
  Users, 
  Clock, 
  FolderKanban, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar
} from 'lucide-react'
import { blink } from '@/blink/client'

interface DashboardStats {
  totalInventoryItems: number
  lowStockItems: number
  totalEmployees: number
  activeProjects: number
  completedTasks: number
  pendingTasks: number
  totalTimeToday: number
  activeTimeEntries: number
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInventoryItems: 0,
    lowStockItems: 0,
    totalEmployees: 0,
    activeProjects: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalTimeToday: 0,
    activeTimeEntries: 0
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load inventory stats
      const inventory = await blink.db.inventory.list({
        where: { userId: user?.id },
        limit: 1000
      })
      
      const lowStock = inventory.filter(item => 
        Number(item.quantity) <= Number(item.minStockLevel || 10)
      )

      // Load employee stats
      const employees = await blink.db.users.list({
        where: { userId: user?.id },
        limit: 1000
      })

      // Load project stats
      const projects = await blink.db.projects.list({
        where: { userId: user?.id },
        limit: 1000
      })
      
      const activeProjects = projects.filter(p => p.status !== 'completed')

      // Load task stats
      const tasks = await blink.db.tasks.list({
        where: { userId: user?.id },
        limit: 1000
      })
      
      const completedTasks = tasks.filter(t => t.status === 'completed')
      const pendingTasks = tasks.filter(t => t.status !== 'completed')

      // Load time entries for today
      const today = new Date().toISOString().split('T')[0]
      const timeEntries = await blink.db.timeEntries.list({
        where: { userId: user?.id },
        limit: 1000
      })
      
      const todayEntries = timeEntries.filter(entry => 
        entry.startTime?.startsWith(today)
      )
      
      const activeEntries = timeEntries.filter(entry => !entry.endTime)

      setStats({
        totalInventoryItems: inventory.length,
        lowStockItems: lowStock.length,
        totalEmployees: employees.length,
        activeProjects: activeProjects.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        totalTimeToday: todayEntries.length,
        activeTimeEntries: activeEntries.length
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user && !state.isLoading) {
        loadDashboardData()
      }
    })
    return unsubscribe
  }, [loadDashboardData])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Welcome to ERP System</h2>
          <p className="text-muted-foreground">Please sign in to access your dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Inventory Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInventoryItems}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {stats.lowStockItems > 0 ? (
                <>
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">{stats.lowStockItems} low stock</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">All items in stock</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{stats.activeTimeEntries} currently clocked in</span>
            </div>
          </CardContent>
        </Card>

        {/* Project Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">On track</span>
            </div>
          </CardContent>
        </Card>

        {/* Task Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks + stats.pendingTasks}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{stats.completedTasks} completed</span>
              <span>•</span>
              <span>{stats.pendingTasks} pending</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Add New Inventory Item
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Add New Employee
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FolderKanban className="mr-2 h-4 w-4" />
              Create New Project
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Clock className="mr-2 h-4 w-4" />
              Clock In/Out
            </Button>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Inventory Management</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Time Tracking</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Project Management</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                Operational
              </Badge>
            </div>
            {stats.lowStockItems > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Stock Levels</span>
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {stats.lowStockItems} Alerts
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Progress */}
      {stats.pendingTasks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Task Progress</CardTitle>
            <CardDescription>Overall completion rate across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completed Tasks</span>
                <span>{stats.completedTasks} / {stats.completedTasks + stats.pendingTasks}</span>
              </div>
              <Progress 
                value={(stats.completedTasks / (stats.completedTasks + stats.pendingTasks)) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}