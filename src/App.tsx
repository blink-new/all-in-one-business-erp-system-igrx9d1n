import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import Employees from './pages/Employees'
import TimeTracking from './pages/TimeTracking'
import Projects from './pages/Projects'
import { Toaster } from './components/ui/toaster'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/time-tracking" element={<TimeTracking />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<div className="p-8 text-center text-muted-foreground">Task Management - Coming Soon</div>} />
          <Route path="/reports" element={<div className="p-8 text-center text-muted-foreground">Reports & Analytics - Coming Soon</div>} />
          <Route path="/settings" element={<div className="p-8 text-center text-muted-foreground">Settings - Coming Soon</div>} />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  )
}

export default App