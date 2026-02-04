"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Users } from "lucide-react"
import type { SchemeWithStats, SchemeStatus } from "@/lib/types/schemes"
import { useRouter } from "next/navigation"

interface SchemeManagementProps {
    schemes: SchemeWithStats[]
}

export function SchemeManagement({ schemes: initialSchemes }: SchemeManagementProps) {
    const router = useRouter()
    const [schemes, setSchemes] = useState(initialSchemes)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingScheme, setEditingScheme] = useState<SchemeWithStats | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        ministry: "",
        description: "",
        benefits: "",
        eligibility_criteria: "{}",
        benefit_amount: "",
        status: "draft" as SchemeStatus
    })

    const resetForm = () => {
        setFormData({
            name: "",
            ministry: "",
            description: "",
            benefits: "",
            eligibility_criteria: "{}",
            benefit_amount: "",
            status: "draft"
        })
        setEditingScheme(null)
    }

    const handleEdit = (scheme: SchemeWithStats) => {
        setEditingScheme(scheme)
        setFormData({
            name: scheme.name,
            ministry: scheme.ministry,
            description: scheme.description,
            benefits: scheme.benefits.join("\n"),
            eligibility_criteria: JSON.stringify(scheme.eligibility_criteria, null, 2),
            benefit_amount: scheme.benefit_amount?.toString() || "",
            status: scheme.status
        })
        setIsCreateOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Parse benefits (one per line)
            const benefitsArray = formData.benefits.split("\n").filter(b => b.trim())

            // Parse eligibility criteria JSON
            let criteria
            try {
                criteria = JSON.parse(formData.eligibility_criteria)
            } catch {
                alert("Invalid JSON in eligibility criteria")
                setIsLoading(false)
                return
            }

            const payload = {
                name: formData.name,
                ministry: formData.ministry,
                description: formData.description,
                benefits: benefitsArray,
                eligibility_criteria: criteria,
                benefit_amount: formData.benefit_amount ? parseFloat(formData.benefit_amount) : null,
                status: formData.status
            }

            const url = editingScheme
                ? `/api/schemes/${editingScheme.id}`
                : '/api/schemes'

            const method = editingScheme ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to save scheme')
            }

            setIsCreateOpen(false)
            resetForm()
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleStatus = async (id: string, currentStatus: SchemeStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

        try {
            const response = await fetch(`/api/schemes/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) {
                throw new Error('Failed to toggle status')
            }

            router.refresh()
        } catch (error: any) {
            alert(error.message || 'An error occurred')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this scheme? This action cannot be undone.')) {
            return
        }

        try {
            const response = await fetch(`/api/schemes/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete scheme')
            }

            router.refresh()
        } catch (error: any) {
            alert(error.message || 'An error occurred')
        }
    }

    const getStatusBadge = (status: SchemeStatus) => {
        const variants: Record<SchemeStatus, "default" | "success" | "secondary"> = {
            active: "success",
            inactive: "secondary",
            draft: "default"
        }

        return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Scheme Management</h2>
                    <p className="text-muted-foreground">Create and manage government schemes</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                    setIsCreateOpen(open)
                    if (!open) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Scheme
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingScheme ? 'Edit Scheme' : 'Create New Scheme'}</DialogTitle>
                            <DialogDescription>
                                {editingScheme ? 'Update scheme details' : 'Add a new government scheme or subsidy'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Scheme Name *</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ministry">Ministry *</Label>
                                    <Input
                                        id="ministry"
                                        required
                                        value={formData.ministry}
                                        onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    required
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="benefits">Benefits (one per line) *</Label>
                                <Textarea
                                    id="benefits"
                                    required
                                    rows={3}
                                    placeholder="₹6000 per year&#10;Direct Bank Transfer"
                                    value={formData.benefits}
                                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="eligibility">Eligibility Criteria (JSON) *</Label>
                                <Textarea
                                    id="eligibility"
                                    required
                                    rows={5}
                                    placeholder='{"min_age": 18, "max_income": 500000}'
                                    value={formData.eligibility_criteria}
                                    onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                                    className="font-mono text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Benefit Amount (₹)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={formData.benefit_amount}
                                        onChange={(e) => setFormData({ ...formData, benefit_amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(v) => setFormData({ ...formData, status: v as SchemeStatus })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Saving...' : editingScheme ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Schemes</CardTitle>
                    <CardDescription>Manage all government schemes and subsidies</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Ministry</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Applications</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schemes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No schemes found. Create your first scheme to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                schemes.map((scheme) => (
                                    <TableRow key={scheme.id}>
                                        <TableCell className="font-medium">{scheme.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{scheme.ministry}</TableCell>
                                        <TableCell>{getStatusBadge(scheme.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{scheme.application_count || 0}</span>
                                                {scheme.pending_count ? (
                                                    <Badge variant="default" className="ml-2">
                                                        {scheme.pending_count} pending
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(scheme.id, scheme.status)}
                                                    title={scheme.status === 'active' ? 'Deactivate' : 'Activate'}
                                                >
                                                    {scheme.status === 'active' ? (
                                                        <ToggleRight className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(scheme)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(scheme.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
