import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Calendar, Clock, User, Mail, Phone, MapPin, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import { blink } from '@/blink/client'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  salary: number
  hireDate: string
  status: 'active' | 'inactive' | 'on_leave'
  address: string
  emergencyContact: string
  emergencyPhone: string
  avatar?: string
  userId: string
  createdAt: string
  updatedAt: string
}

interface Schedule {
  id: string
  employeeId: string
  shiftDate: string
  startTime: string
  endTime: string
  breakDuration?: number
  status: 'scheduled' | 'completed' | 'missed'
  notes?: string
  userId: string
  createdAt: string
  updatedAt: string
}

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support']
const POSITIONS = ['Manager', 'Senior Developer', 'Developer', 'Designer', 'Analyst', 'Coordinator', 'Specialist', 'Intern']

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [activeTab, setActiveTab] = useState('employees')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    hireDate: '',
    status: 'active' as const,
    address: '',
    emergencyContact: '',
    emergencyPhone: ''
  })

  const [scheduleFormData, setScheduleFormData] = useState({
    employeeId: '',
    shiftDate: '',
    startTime: '',
    endTime: '',
    breakDuration: 30,
    notes: ''
  })

  const loadEmployees = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.employees.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setEmployees(data)
    } catch (error) {
      console.error('Error loading employees:', error)
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive'
      })
    }
  }, [])

  const loadSchedules = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.schedules.list({
        where: { userId: user.id },
        orderBy: { shiftDate: 'desc' }
      })
      setSchedules(data)
    } catch (error) {
      console.error('Error loading schedules:', error)
      toast({
        title: 'Error',
        description: 'Failed to load schedules',
        variant: 'destructive'
      })
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadEmployees(), loadSchedules()])
      setLoading(false)
    }
    loadData()
  }, [loadEmployees, loadSchedules])

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      salary: '',
      hireDate: '',
      status: 'active',
      address: '',
      emergencyContact: '',
      emergencyPhone: ''
    })
  }

  const resetScheduleForm = () => {
    setScheduleFormData({
      employeeId: '',
      shiftDate: '',
      startTime: '',
      endTime: '',
      breakDuration: 30,
      notes: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'on_leave': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScheduleStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'missed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee'
  }

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      salary: employee.salary.toString(),
      hireDate: employee.hireDate,
      status: employee.status,
      address: employee.address,
      emergencyContact: employee.emergencyContact,
      emergencyPhone: employee.emergencyPhone
    })
    setIsEditDialogOpen(true)
  }

  const handleAddEmployee = async () => {
    try {
      const user = await blink.auth.me()
      const newEmployee = {
        id: `emp_${Date.now()}`,
        ...formData,
        salary: parseFloat(formData.salary),
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await blink.db.employees.create(newEmployee)
      await loadEmployees()
      setIsAddDialogOpen(false)
      resetForm()
      toast({
        title: 'Success',
        description: 'Employee added successfully'
      })
    } catch (error) {
      console.error('Error adding employee:', error)
      toast({
        title: 'Error',
        description: 'Failed to add employee',
        variant: 'destructive'
      })
    }
  }

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return

    try {
      const updatedEmployee = {
        ...formData,
        salary: parseFloat(formData.salary),
        updatedAt: new Date().toISOString()
      }

      await blink.db.employees.update(selectedEmployee.id, updatedEmployee)
      await loadEmployees()
      setIsEditDialogOpen(false)
      setSelectedEmployee(null)
      resetForm()
      toast({
        title: 'Success',
        description: 'Employee updated successfully'
      })
    } catch (error) {
      console.error('Error updating employee:', error)
      toast({
        title: 'Error',
        description: 'Failed to update employee',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`)) return

    try {
      await blink.db.employees.delete(employee.id)
      await loadEmployees()
      toast({
        title: 'Success',
        description: 'Employee deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete employee',
        variant: 'destructive'
      })
    }
  }

  const handleAddSchedule = async () => {
    try {
      const user = await blink.auth.me()
      const newSchedule = {
        id: `sch_${Date.now()}`,
        ...scheduleFormData,
        status: 'scheduled' as const,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await blink.db.schedules.create(newSchedule)
      await loadSchedules()
      setIsScheduleDialogOpen(false)
      resetScheduleForm()
      toast({
        title: 'Success',
        description: 'Schedule added successfully'
      })
    } catch (error) {
      console.error('Error adding schedule:', error)
      toast({
        title: 'Error',
        description: 'Failed to add schedule',
        variant: 'destructive'
      })
    }
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus
    
    return matchesSearch && matchesDepartment && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading employees...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
          <p className="text-muted-foreground">Manage staff profiles, scheduling, and workforce operations</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Employees ({employees.length})
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedules ({schedules.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          {/* Employee Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employees.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employees.filter(emp => emp.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                <Badge className="bg-yellow-100 text-yellow-800">Leave</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employees.filter(emp => emp.status === 'on_leave').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(employees.map(emp => emp.department)).size}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                      Enter the employee details below
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="john.doe@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Select value={formData.position} onValueChange={(value) => setFormData({...formData, position: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            {POSITIONS.map(pos => (
                              <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPARTMENTS.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary">Salary</Label>
                        <Input
                          id="salary"
                          type="number"
                          value={formData.salary}
                          onChange={(e) => setFormData({...formData, salary: e.target.value})}
                          placeholder="50000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hireDate">Hire Date</Label>
                        <Input
                          id="hireDate"
                          type="date"
                          value={formData.hireDate}
                          onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'on_leave') => setFormData({...formData, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="123 Main St, City, State 12345"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Emergency Contact</Label>
                        <Input
                          id="emergencyContact"
                          value={formData.emergencyContact}
                          onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                        <Input
                          id="emergencyPhone"
                          value={formData.emergencyPhone}
                          onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                          placeholder="+1 (555) 987-6543"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddEmployee}>Add Employee</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Employee Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={employee.avatar} />
                      <AvatarFallback>
                        {employee.firstName[0]}{employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {employee.firstName} {employee.lastName}
                      </CardTitle>
                      <CardDescription>{employee.position}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(employee.status)}>
                      {employee.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{employee.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{employee.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{employee.address}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(employee)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEmployee(employee)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No employees found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterDepartment !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first employee'
                }
              </p>
              {!searchTerm && filterDepartment === 'all' && filterStatus === 'all' && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          {/* Schedule Controls */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Employee Schedules</h2>
              <p className="text-muted-foreground">Manage work schedules and shifts</p>
            </div>
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Schedule</DialogTitle>
                  <DialogDescription>
                    Create a new work schedule for an employee
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee</Label>
                    <Select value={scheduleFormData.employeeId} onValueChange={(value) => setScheduleFormData({...scheduleFormData, employeeId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.filter(emp => emp.status === 'active').map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName} - {emp.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shiftDate">Date</Label>
                    <Input
                      id="shiftDate"
                      type="date"
                      value={scheduleFormData.shiftDate}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, shiftDate: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={scheduleFormData.startTime}
                        onChange={(e) => setScheduleFormData({...scheduleFormData, startTime: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={scheduleFormData.endTime}
                        onChange={(e) => setScheduleFormData({...scheduleFormData, endTime: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
                    <Input
                      id="breakDuration"
                      type="number"
                      value={scheduleFormData.breakDuration}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, breakDuration: parseInt(e.target.value) || 30})}
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={scheduleFormData.notes}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, notes: e.target.value})}
                      placeholder="Additional notes or instructions"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSchedule}>Add Schedule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Schedule Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Schedules</CardTitle>
              <CardDescription>
                View and manage employee work schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Break Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(schedule.employeeId)}
                      </TableCell>
                      <TableCell>
                        {new Date(schedule.shiftDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {schedule.startTime} - {schedule.endTime}
                      </TableCell>
                      <TableCell>{schedule.breakDuration || 30} min</TableCell>
                      <TableCell>
                        <Badge className={getScheduleStatusColor(schedule.status)}>
                          {schedule.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {schedule.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {schedules.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No schedules found</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by creating work schedules for your employees
                  </p>
                  <Button onClick={() => setIsScheduleDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Schedule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData({...formData, position: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-salary">Salary</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hireDate">Hire Date</Label>
                <Input
                  id="edit-hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'on_leave') => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-emergencyContact">Emergency Contact</Label>
                <Input
                  id="edit-emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-emergencyPhone">Emergency Phone</Label>
                <Input
                  id="edit-emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEmployee}>Update Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}