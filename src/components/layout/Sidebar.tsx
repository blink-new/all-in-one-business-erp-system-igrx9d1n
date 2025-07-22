import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Package,
  Users,
  Clock,
  FolderKanban,
  CheckSquare,
  BarChart3,
  Settings,
  Menu,
  X
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Employees', href: '/employees', icon: Users },
  { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn('flex h-full flex-col border-r bg-card', className)}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-semibold">ERP System</h1>
              <p className="text-xs text-muted-foreground">Business Management</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'sidebar-nav-item',
                  isActive && 'active',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator />
      
      {/* User Info */}
      <div className="p-4">
        <div className={cn(
          'flex items-center gap-3',
          isCollapsed && 'justify-center'
        )}>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <Users className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@company.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}