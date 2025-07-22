import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Filter
} from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  description: string
  quantity: number
  minStockLevel: number
  unitPrice: number
  supplier: string
  location: string
  status: string
  createdAt: string
  updatedAt: string
}

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    quantity: 0,
    minStockLevel: 10,
    unitPrice: 0,
    supplier: '',
    location: '',
    status: 'active'
  })
  const { toast } = useToast()

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      description: '',
      quantity: 0,
      minStockLevel: 10,
      unitPrice: 0,
      supplier: '',
      location: '',
      status: 'active'
    })
  }

  const loadInventory = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const inventory = await blink.db.inventory.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 1000
      })
      setItems(inventory)
    } catch (error) {
      console.error('Error loading inventory:', error)
      toast({
        title: 'Error',
        description: 'Failed to load inventory items',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, toast])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user && !state.isLoading) {
        loadInventory()
      }
    })
    return unsubscribe
  }, [loadInventory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      const itemData = {
        ...formData,
        userId: user.id,
        id: editingItem?.id || `inv_${Date.now()}`
      }

      if (editingItem) {
        await blink.db.inventory.update(editingItem.id, itemData)
        toast({
          title: 'Success',
          description: 'Inventory item updated successfully'
        })
      } else {
        await blink.db.inventory.create(itemData)
        toast({
          title: 'Success',
          description: 'Inventory item added successfully'
        })
      }

      setIsAddDialogOpen(false)
      setEditingItem(null)
      resetForm()
      loadInventory()
    } catch (error) {
      console.error('Error saving inventory item:', error)
      toast({
        title: 'Error',
        description: 'Failed to save inventory item',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      description: item.description,
      quantity: Number(item.quantity),
      minStockLevel: Number(item.minStockLevel),
      unitPrice: Number(item.unitPrice),
      supplier: item.supplier,
      location: item.location,
      status: item.status
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await blink.db.inventory.delete(id)
      toast({
        title: 'Success',
        description: 'Inventory item deleted successfully'
      })
      loadInventory()
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete inventory item',
        variant: 'destructive'
      })
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const categories = [...new Set(items.map(item => item.category))].filter(Boolean)
  const lowStockItems = items.filter(item => Number(item.quantity) <= Number(item.minStockLevel))

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Access Required</h2>
          <p className="text-muted-foreground">Please sign in to manage inventory</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track and manage your inventory items and stock levels
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingItem(null) }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update the inventory item details below.' : 'Enter the details for the new inventory item.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minStockLevel">Min Stock Level</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unitPrice">Unit Price ($)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Manage your inventory items and track stock levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading inventory...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {items.length === 0 ? 'No inventory items found. Add your first item to get started.' : 'No items match your current filters.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{item.sku}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{item.quantity}</span>
                        {Number(item.quantity) <= Number(item.minStockLevel) && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>${Number(item.unitPrice).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}