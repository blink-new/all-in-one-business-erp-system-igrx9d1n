import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Calendar, DollarSign, User, MoreHorizontal, Edit, Trash2, Eye, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { blink } from '@/blink/client'

interface Project {
  id: string
  name: string
  description: string
  status: string
  priority: string
  startDate: string
  endDate: string
  budget: number
  clientName: string
  projectManagerId: string
  createdAt: string
  updatedAt: string
  userId: string
}

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  projectId: string
  assignedTo: string
  dueDate: string
  estimatedHours: number
  actualHours: number
  createdAt: string
  updatedAt: string
  userId: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  position: string
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'on-hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
]

const TASK_STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'review', label: 'Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' }
]

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const { toast } = useToast()

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'active',
    priority: 'medium',
    startDate: '',
    endDate: '',
    budget: '',
    clientName: '',
    projectManagerId: 'none'
  })

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    projectId: 'none',
    assignedTo: 'none',
    dueDate: '',
    estimatedHours: ''
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [projectsData, tasksData, employeesData] = await Promise.all([
        blink.db.projects.list({
          where: { userId: (await blink.auth.me()).id },
          orderBy: { createdAt: 'desc' }
        }),
        blink.db.tasks.list({
          where: { userId: (await blink.auth.me()).id },
          orderBy: { createdAt: 'desc' }
        }),
        blink.db.employees.list({
          where: { userId: (await blink.auth.me()).id },
          orderBy: { firstName: 'asc' }
        })
      ])
      
      setProjects(projectsData)
      setTasks(tasksData)
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load projects and tasks',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const resetProjectForm = () => {
    setProjectForm({
      name: '',
      description: '',
      status: 'active',
      priority: 'medium',
      startDate: '',
      endDate: '',
      budget: '',
      clientName: '',
      projectManagerId: 'none'
    })
    setEditingProject(null)
  }

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      projectId: 'none',
      assignedTo: 'none',
      dueDate: '',
      estimatedHours: ''
    })
    setEditingTask(null)
  }

  const handleAddProject = async () => {
    try {
      const user = await blink.auth.me()
      const projectData = {
        id: `proj_${Date.now()}`,
        name: projectForm.name,
        description: projectForm.description,
        status: projectForm.status,
        priority: projectForm.priority,
        startDate: projectForm.startDate,
        endDate: projectForm.endDate,
        budget: projectForm.budget ? parseFloat(projectForm.budget) : 0,
        clientName: projectForm.clientName,
        projectManagerId: projectForm.projectManagerId === 'none' ? '' : projectForm.projectManagerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.id
      }

      if (editingProject) {
        await blink.db.projects.update(editingProject.id, {
          ...projectData,
          id: editingProject.id,
          updatedAt: new Date().toISOString()
        })
        toast({
          title: 'Success',
          description: 'Project updated successfully'
        })
      } else {
        await blink.db.projects.create(projectData)
        toast({
          title: 'Success',
          description: 'Project created successfully'
        })
      }

      await loadData()
      setIsProjectDialogOpen(false)
      resetProjectForm()
    } catch (error) {
      console.error('Error saving project:', error)
      toast({
        title: 'Error',
        description: 'Failed to save project',
        variant: 'destructive'
      })
    }
  }

  const handleAddTask = async () => {
    try {
      const user = await blink.auth.me()
      const taskData = {
        id: `task_${Date.now()}`,
        title: taskForm.title,
        description: taskForm.description,
        status: taskForm.status,
        priority: taskForm.priority,
        projectId: taskForm.projectId,
        assignedTo: taskForm.assignedTo === 'none' ? '' : taskForm.assignedTo,
        dueDate: taskForm.dueDate,
        estimatedHours: taskForm.estimatedHours ? parseFloat(taskForm.estimatedHours) : 0,
        actualHours: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.id
      }

      if (editingTask) {
        await blink.db.tasks.update(editingTask.id, {
          ...taskData,
          id: editingTask.id,
          updatedAt: new Date().toISOString()
        })
        toast({
          title: 'Success',
          description: 'Task updated successfully'
        })
      } else {
        await blink.db.tasks.create(taskData)
        toast({
          title: 'Success',
          description: 'Task created successfully'
        })
      }

      await loadData()
      setIsTaskDialogOpen(false)
      resetTaskForm()
    } catch (error) {
      console.error('Error saving task:', error)
      toast({
        title: 'Error',
        description: 'Failed to save task',
        variant: 'destructive'
      })
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setProjectForm({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget.toString(),
      clientName: project.clientName,
      projectManagerId: project.projectManagerId || 'none'
    })
    setIsProjectDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      projectId: task.projectId,
      assignedTo: task.assignedTo || 'none',
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours.toString()
    })
    setIsTaskDialogOpen(true)
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await blink.db.projects.delete(projectId)
      // Also delete associated tasks
      const projectTasks = tasks.filter(task => task.projectId === projectId)
      for (const task of projectTasks) {
        await blink.db.tasks.delete(task.id)
      }
      
      await loadData()
      toast({
        title: 'Success',
        description: 'Project and associated tasks deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await blink.db.tasks.delete(taskId)
      await loadData()
      toast({
        title: 'Success',
        description: 'Task deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string, options: typeof STATUS_OPTIONS) => {
    const statusOption = options.find(opt => opt.value === status)
    return (
      <Badge className={statusOption?.color || 'bg-gray-100 text-gray-800'}>
        {statusOption?.label || status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityOption = PRIORITY_OPTIONS.find(opt => opt.value === priority)
    return (
      <Badge className={priorityOption?.color || 'bg-gray-100 text-gray-800'}>
        {priorityOption?.label || priority}
      </Badge>
    )
  }

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(task => task.projectId === projectId)
    if (projectTasks.length === 0) return 0
    const completedTasks = projectTasks.filter(task => task.status === 'done')
    return Math.round((completedTasks.length / projectTasks.length) * 100)
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unassigned'
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading projects and tasks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600">Manage projects and tasks with Kanban boards</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetTaskForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetProjectForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.filter(p => p.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter(t => t.status === 'done').length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'in-progress').length}</div>
            <p className="text-xs text-muted-foreground">
              Tasks being worked on
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tasks past due date
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {PRIORITY_OPTIONS.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const progress = getProjectProgress(project.id)
              const projectTasks = tasks.filter(task => task.projectId === project.id)
              
              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <div className="flex gap-2">
                          {getStatusBadge(project.status, STATUS_OPTIONS)}
                          {getPriorityBadge(project.priority)}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setSelectedProject(project)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditProject(project)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No deadline'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>${project.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{project.clientName || 'No client'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{projectTasks.length} tasks</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first project.</p>
              <Button onClick={() => setIsProjectDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="kanban" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {TASK_STATUS_OPTIONS.map((status) => {
              const statusTasks = getTasksByStatus(status.value)
              
              return (
                <div key={status.value} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{status.label}</h3>
                    <Badge variant="secondary">{statusTasks.length}</Badge>
                  </div>
                  
                  <div className="space-y-3 min-h-[400px] bg-gray-50 p-4 rounded-lg">
                    {statusTasks.map((task) => {
                      const project = projects.find(p => p.id === task.projectId)
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
                      
                      return (
                        <Card key={task.id} className={`cursor-pointer hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              
                              {task.description && (
                                <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                              )}
                              
                              <div className="flex gap-2">
                                {getPriorityBadge(task.priority)}
                                {isOverdue && <Badge className="bg-red-100 text-red-800">Overdue</Badge>}
                              </div>
                              
                              <div className="space-y-2 text-xs text-gray-500">
                                {project && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span className="truncate">{project.name}</span>
                                  </div>
                                )}
                                {task.assignedTo && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">{getEmployeeName(task.assignedTo)}</span>
                                  </div>
                                )}
                                {task.dueDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {task.estimatedHours > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{task.estimatedHours}h estimated</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Project Dialog */}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
              placeholder="Enter project name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Client Name</Label>
            <Input
              id="client"
              value={projectForm.clientName}
              onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
              placeholder="Enter client name"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={projectForm.status} onValueChange={(value) => setProjectForm({ ...projectForm, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={projectForm.priority} onValueChange={(value) => setProjectForm({ ...projectForm, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={projectForm.startDate}
              onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={projectForm.endDate}
              onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget ($)</Label>
            <Input
              id="budget"
              type="number"
              value={projectForm.budget}
              onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager">Project Manager</Label>
            <Select value={projectForm.projectManagerId} onValueChange={(value) => setProjectForm({ ...projectForm, projectManagerId: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Manager</SelectItem>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddProject}>
            {editingProject ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </DialogContent>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="taskTitle">Task Title</Label>
              <Input
                id="taskTitle"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="taskDescription">Description</Label>
              <Textarea
                id="taskDescription"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskProject">Project</Label>
              <Select value={taskForm.projectId} onValueChange={(value) => setTaskForm({ ...taskForm, projectId: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskAssignee">Assigned To</Label>
              <Select value={taskForm.assignedTo} onValueChange={(value) => setTaskForm({ ...taskForm, assignedTo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskStatus">Status</Label>
              <Select value={taskForm.status} onValueChange={(value) => setTaskForm({ ...taskForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskPriority">Priority</Label>
              <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskDueDate">Due Date</Label>
              <Input
                id="taskDueDate"
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskHours">Estimated Hours</Label>
              <Input
                id="taskHours"
                type="number"
                value={taskForm.estimatedHours}
                onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask}>
              {editingTask ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}